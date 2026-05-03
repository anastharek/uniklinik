const DatasetModel = require('../model/Dataset');

const GetDatasetById = async (req,res) => {
    try {
        const { id } = req.params;
        let data = await DatasetModel.GetDatasetById(id,req.user);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const GetDataSet = async (req,res) => {
    try {
        const { page, study_field, file_type,sampleCount,query,modality } = req.query;
        let data = await DatasetModel.GetDataSet(page, study_field, file_type,100, query,modality,sampleCount);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const GetDatasetByOwner = async (req,res) => {
    try {
        const owner_id  = req.user.id;
        let data = await DatasetModel.GetDatasetByOwner(owner_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const GetSubscribedDatasets = async (req,res) => {
    try {
        const user_id  = req.user.id;
        let data = await DatasetModel.GetSubscribedDatasets(user_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const CreateDataset = async (req,res) => {
    try {
        let payload={
            type: req.body.dataset_type,
            detail: req.body.detail, 
            name: req.body.name,
            pricing_type: req.body.pricing_type,
            price_range: req.body.price_range,
            preview_data: req.body.preview_data,
            all_data: req.body.all_data,
            published: req.body.published,
            researcher_name: req.body.researcher_name,
            sample_count: req.body.sample_count,
            study_field: req.body.study_field,
            owner: req.user.id,
            modality: req.body.modality
        }
        if(req.body.sequence){
            payload.column_sequence = req.body.sequence;
        }
        let data = await DatasetModel.CreateDataset(payload);
        if(req.body.users){
            await DatasetModel.AssignCoowner(data.id,req.body.users);
        }
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const UpdateDataset = async (req,res) => {
    try {
        if(!req.roles.admin){
            let dataset= await DatasetModel.GetDatasetById(req.body.id);
            if(dataset.owner !== req.user.id){
                let isCoOwner=await DatasetModel.isCoowner(req.body.id,req.user.id);
                if(!isCoOwner){
                return res.status(400).json({message:"You are not the owner of this dataset"});
                }
            }
        }
        if(req.body.users){
            await DatasetModel.AssignCoowner(req.body.id,req.body.users);
            delete req.body.users;
        }
        if(req.body.sequence){
            req.body.column_sequence = req.body.sequence;
            delete req.body.sequence;
        }
        let data = await DatasetModel.UpdateDataset(req.body);
        return res.status(200).json(data);
    } catch (e) {
        console.log(e);
        return res.status(400).json({message:e.message});
    }
}

const SubscriptToDataset = async (req,res) => {
    try {
        const { dataset_id } = req.body;
        let dataset = await DatasetModel.GetDatasetById(dataset_id);
        if(!dataset){
            return res.status(400).json({message:"Dataset not found"});
        }
        if(dataset.pricing_type !== "free"){
            return res.status(400).json({message:"This dataset is not free"});
        }
        let exists=await DatasetModel.GetSubscribedDatasetsByDatasetId(req.user.id,dataset_id);
        if(exists){
            return res.status(400).json({message:"You have already subscribed to this dataset"});
        }
        let data = await DatasetModel.SubscriptToDataset(dataset_id, req.user.id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const UnsubscribeFromDataset = async (req,res) => {
    try {
        const { dataset_id } = req.body;
        let data = await DatasetModel.UnsubscribeFromDataset(dataset_id, req.user.id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const RequestForDataset = async (req,res) => {
    try {
        const { dataset_id, name, email, phone } = req.body;
        let exists=await DatasetModel.GetDatasetRequestsUserByDatasetId(req.user.id,dataset_id);
        if(exists){
            return res.status(400).json({message:"You have already requested for this dataset"});
        }
        let data = await DatasetModel.RequestForDataset(dataset_id, req.user.id, name, email, phone);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const GetDatasetRequestsUser = async (req,res) => {
    try {
        let data = await DatasetModel.GetDatasetRequestsUser(req.user.id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const GetDatasetRequestAdmin = async (req,res) => {
    try {
        let data = await DatasetModel.GetDatasetRequestAdmin();
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const AcceptDatasetRequest = async (req,res) => {
    try {
        const { request_id } = req.body;
        let data = await DatasetModel.AcceptDatasetRequest(request_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const RejectDatasetRequest = async (req,res) => {
    try {
        const { request_id } = req.body;
        let data = await DatasetModel.RejectDatasetRequest(request_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const getDatasetAnalytics = async (req,res) => {
    try {
        const { dataset_id } = req.body;
        if(!dataset_id){
            return res.status(400).json({message:"Dataset id is required"});
        }
        let dataset= await DatasetModel.GetDatasetById(dataset_id,req.user);
        if(!dataset){
            return res.status(400).json({message:"Dataset not found"});
        }
        if(dataset.owner != req.user.id){
            return res.status(400).json({message:"You are not the owner of this dataset"});
        }
        let data = await DatasetModel.getDatasetAnalytics(dataset_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}


const getDatasetUsers = async (req,res) => {
    try {
        const { dataset_id } = req.body;
        if(!dataset_id){
            return res.status(400).json({message:"Dataset id is required"});
        }
        let dataset= await DatasetModel.GetDatasetById(dataset_id);
        if(!dataset){
            return res.status(400).json({message:"Dataset not found"});
        }
        if(dataset.owner !== req.user.id){
            return res.status(400).json({message:"You are not the owner of this dataset"});
        }
        let data = await DatasetModel.getDatasetUsers(dataset_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const deleteDataset = async (req,res) => {
    try {
        const { dataset_id } = req.params;
        if(!dataset_id){
            return res.status(400).json({message:"Dataset id is required"});
        }
        let dataset= await DatasetModel.GetDatasetById(dataset_id);
        if(!dataset){
            return res.status(400).json({message:"Dataset not found"});
        }
        if(dataset.owner !== req.user.id && !req.roles.delete_dataset){
            return res.status(400).json({message:"You are not the owner of this dataset"});
        }
        let data = await DatasetModel.deleteDataset(dataset_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const assignDataset = async (req,res) => {
    try {
        const { dataset_id, user_id } = req.body;
        if(!dataset_id || !user_id){
            return res.status(400).json({message:"Dataset id and user id are required"});
        }
        let dataset= await DatasetModel.GetDatasetById(dataset_id);
        if(!dataset){
            return res.status(400).json({message:"Dataset not found"});
        }
        if(dataset.owner !== req.user.id){
            return res.status(400).json({message:"You are not the owner of this dataset"});
        }
        let data = await DatasetModel.assignDataset(dataset_id, user_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}

const unassignDataset = async (req,res) => {
    try {
        const { dataset_id, user_id } = req.body;
        if(!dataset_id || !user_id){
            return res.status(400).json({message:"Dataset id and user id are required"});
        }
        let dataset= await DatasetModel.GetDatasetById(dataset_id);
        if(!dataset){
            return res.status(400).json({message:"Dataset not found"});
        }
        if(dataset.owner !== req.user.id){
            return res.status(400).json({message:"You are not the owner of this dataset"});
        }
        let data = await DatasetModel.unassignDataset(dataset_id, user_id);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(400).json({message:e.message});
    }
}




module.exports = {
    GetDatasetById,
    GetDataSet,
    GetDatasetByOwner,
    GetSubscribedDatasets,
    CreateDataset,
    UpdateDataset,
    SubscriptToDataset,
    UnsubscribeFromDataset,
    RequestForDataset,
    GetDatasetRequestsUser,
    GetDatasetRequestAdmin,
    AcceptDatasetRequest,
    RejectDatasetRequest,
    getDatasetAnalytics,
    getDatasetUsers,
    deleteDataset,
    assignDataset,
    unassignDataset
}