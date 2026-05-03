const DatasetRepository = require('../repository/Dataset');
const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");

const GetDatasetById = async (id,user) => {
    try {
        return await DatasetRepository.GetDatasetById(id,user);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
};

const GetDataSet = async (page, study_field, file_type,itemsPerPage,query,modality,sampleCount) => {
    try {
        return await DatasetRepository.GetDataSet(page, study_field, file_type,itemsPerPage,query,modality,sampleCount);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}


const GetDatasetByOwner = async (owner_id) => {
    try {
        return await DatasetRepository.GetDatasetByOwner(owner_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const GetSubscribedDatasets = async (user_id) => {
    try {
        return await DatasetRepository.GetSubscribedDatasets(user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const GetSubscribedDatasetsByDatasetId = async (user_id,dataset_id) => {
    try {
        return await DatasetRepository.GetSubscribedDatasetsByDatasetId(user_id,dataset_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const CreateDataset = async (dataset) => {
    try {
        return await DatasetRepository.CreateDataset(dataset);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const UpdateDataset = async (dataset) => {
    try {
        return await DatasetRepository.UpdateDataset(dataset);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const SubscriptToDataset = async (dataset_id, user_id) => {
    try {
        return await DatasetRepository.SubscriptToDataset(dataset_id, user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const UnsubscribeFromDataset = async (dataset_id, user_id) => {
    try {
        return await DatasetRepository.UnsubscribeFromDataset(dataset_id, user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const RequestForDataset = async (dataset_id, user_id,name,email,phone) => {
    try {
        return await DatasetRepository.RequestForDataset(dataset_id, user_id,name,email,phone);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const GetDatasetRequestsUser = async (user_id) => {
    try {
        return await DatasetRepository.GetDatasetRequestsUser(user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const GetDatasetRequestsUserByDatasetId = async (user_id,dataset_id) => {
    try {
        return await DatasetRepository.GetDatasetRequestsUserByDatasetId(user_id,dataset_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}
const GetDatasetRequestAdmin = async () => {
    try {
        return await DatasetRepository.GetDatasetRequestAdmin();
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const AcceptDatasetRequest = async (request_id) => {
    try {
        return await DatasetRepository.AcceptDatasetRequest(request_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const RejectDatasetRequest = async (request_id) => {
    try {
        return await DatasetRepository.RejectDatasetRequest(request_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const getDatasetAnalytics = async (dataset_id) => {
    try {
        return await DatasetRepository.getDatasetAnalytics(dataset_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const getDatasetUsers = async (dataset_id) => {
    try {
        return await DatasetRepository.getDatasetUsers(dataset_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const deleteDataset = async (dataset_id) => {
    try {
        return await DatasetRepository.deleteDataset(dataset_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const assignDataset = async (dataset_id, user_id) => {
    try {
        return await DatasetRepository.assignDataset(dataset_id, user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const unassignDataset = async (dataset_id, user_id) => {
    try {
        return await DatasetRepository.unassignDataset(dataset_id, user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const isCoowner = async (dataset_id, user_id) => {
    try {
        return await DatasetRepository.isCoowner(dataset_id, user_id);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const AssignCoowner = async (dataset_id, data) => {
    try {
        return await DatasetRepository.AssignCoowner(dataset_id, data);
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}
module.exports = {
    GetDatasetById,
    CreateDataset,
    UpdateDataset,
    SubscriptToDataset,
    UnsubscribeFromDataset,
    RequestForDataset,
    GetDatasetRequestsUser,
    GetDatasetRequestAdmin,
    GetDatasetRequestsUserByDatasetId,
    AcceptDatasetRequest,
    RejectDatasetRequest,
    getDatasetAnalytics,
    getDatasetUsers,
    GetDataSet,
    GetDatasetByOwner,
    GetSubscribedDatasets,
    GetSubscribedDatasetsByDatasetId,
    deleteDataset,
    assignDataset,
    unassignDataset,
    isCoowner,
    AssignCoowner
}