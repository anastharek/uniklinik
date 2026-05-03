const db = require("../database/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { fn, col, literal } = Sequelize;
const { OTJSBadRequestException } = require("../Exceptions/OTJSErrors");
const { assign_dataset_to_user, send_free_dataset_subscription, dataset_request_owner, dataset_request_user, send_free_dataset_subscription_owner_admin, send_email_dataset_request_accepted_owner, send_email_dataset_request_accepted_user, send_email_dataset_request_rejected_owner, send_email_dataset_request_rejected_user } = require("../utils/mailer");

const GetDatasetById = async (id,user) => {
  try {
    if(user?.id){
      let data=await db.UserDataset.findOne({
        where: { user: user.id, dataset: id },
        raw: true
      });
      let isCoOwner=await db.DatasetCoowner.findOne({
        where: { user: user.id, dataset: id },
        raw: true
      });
      let dataset=await db.Dataset.scope('withAllData').findOne({
        where: { id: id },
        include: {model: db.User,attributes: ["firstname","lastname"]},
        raw: true});
        if(data && user.role!=="admin" && dataset.owner!==user.id && !isCoOwner){
          return await db.Dataset.scope('withAllData').findOne({where: { id: id },exclude: ["owner"] ,raw: true});
        }
      
      let coOwner=await db.DatasetCoowner.findAll({
        where: {dataset: id },
        include: {model: db.User,attributes: ["firstname","lastname","username"]},
        raw: true
      });
      dataset.coOwner=coOwner;
      if(dataset.owner===user.id || isCoOwner){
        return dataset;
      }
      if(user.role==="admin"){
        return dataset;
      }
    }
    db.Dataset.increment('view_count', { where: { id: id } });
    return await db.Dataset.findOne(
      {
      include: {
        model: db.User,
        attributes: ["firstname","lastname"]
      },
       where: { id: id },
       raw: true
      });
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
};

const GetDataSet = async (page=1, study_field, file_type,itemsPerPage=100,query,modality,sampleCount) => {
  try {
    let filter={};
    if(study_field){
      filter["study_field"]=study_field;
    }
    if(file_type){
      filter["type"]={
        [Op.or]: file_type.split(',').map(keyword => ({
          [Op.like]: `%${keyword}%`
        }))
      }
    }
    if(query){
      filter[Op.or]={
        name:{[Op.iLike]:`%${query}%`},
        researcher_name:{[Op.iLike]:`%${query}%`},
      }
    }
    if(modality){
      filter["modality"]={
        [Op.or]: modality.split(',').map(keyword => ({
          [Op.like]: `%${keyword}%`
        }))
      }
    }
    if(sampleCount){
      filter["sample_count"]={
       [Op.and]:{
          [Op.gte]:sampleCount-100,
          [Op.lte]:sampleCount
       }
      }

    }

    let {rows,count}= await db.Dataset.findAndCountAll({
      where: filter,
      limit: itemsPerPage,
      offset: (page-1) * itemsPerPage,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["preview_data"] },
    });
    let allStudyFields = await db.Dataset.findAll({
      attributes: ["study_field"],
      group: ["study_field"],
      limit: 10,
    });
    let allModality = await db.Dataset.findAll({
      attributes: ["modality"],
      group: ["modality"],
      limit: 20,
      where:{modality:{[Op.not]:null}},
      raw: true
    });
    return {rows:rows,count:count,
      study_field:allStudyFields.map((d)=>d.study_field),
      modality:allModality.map((d)=>d.modality)
    };
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
};

const GetDatasetByOwner = async (owner_id) => {
  try {
    let ownedDataset= await db.Dataset.findAll({
      where: { owner: owner_id },
      attributes: { exclude: ["preview_data"] },
      order: [["createdAt", "DESC"]],
    });
    let coownedDataset= await db.DatasetCoowner.findAll({
      where: { user: owner_id },
      raw: true,
    });
    let datasetIds=coownedDataset.map((d)=>d.dataset);
    let coownedDatasetData=await db.Dataset.findAll({
      where: { id: datasetIds },
      attributes: { exclude: ["preview_data"] },
      order: [["createdAt", "DESC"]],
    });
    return [...coownedDatasetData,...ownedDataset];
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
};

const GetSubscribedDatasets = async (user_id) => {
  try {
    let data=await db.UserDataset.findAll({
      attributes: { exclude: ["dataset"] },
      include: [{ model: db.Dataset}],
      where: { user: user_id },
      order: [["createdAt", "DESC"]]
    });
    return data.map((d)=>d.Dataset);
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
};

const GetSubscribedDatasetsByDatasetId = async (user_id, dataset_id) => {
    try {
        return await db.UserDataset.findOne({
            where: { user: user_id, dataset: dataset_id },
        });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const CreateDataset = async (dataset) => {
  try {
    return await db.Dataset.create(dataset);
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
};

const UpdateDataset = async (dataset) => {
    try {
        return await db.Dataset.update(dataset, {
        where: { id: dataset.id },
        });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
};

const SubscriptToDataset = async (dataset_id, user_id) => {
  try {
    let result=await db.UserDataset.create({ dataset: dataset_id, user: user_id });
    let dataset=await db.Dataset.scope('withAllData').findOne({
      where: { id: dataset_id },
      raw: true,
      include: {
          model: db.User,
          attributes: ["username", "email", "phone","firstname","lastname"]
      }
    });
    dataset.subscribe_count=dataset.subscribe_count+1;
    await db.Dataset.update({ subscribe_count: dataset.subscribe_count }, {
      where: { id: dataset_id },
    });
    let user=await db.User.findOne({where: { id: user_id },raw: true});
    if(user.email){
        send_free_dataset_subscription(
          user.email,
          dataset.name,
          dataset.researcher_name,
          dataset.sample_count
        )
    }
    send_free_dataset_subscription_owner_admin(
      dataset["User.email"],
      dataset.name,
      user.firstname +" "+user.lastname,
      user.email,
      user.phone
    )

    return result;
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
}

const UnsubscribeFromDataset = async (dataset_id, user_id) => {
    try {
        return await db.UserDataset.destroy({ where: { dataset: dataset_id, user: user_id } });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const RequestForDataset = async (dataset_id, user_id,name,email,phone) => {
    try {
        let result=await db.DatasetRequest.create({ dataset: dataset_id, user: user_id,
            name: name, email: email, phone: phone
         });
         let dataset=await db.Dataset.scope('withAllData').findOne({
            where: { id: dataset_id },
            raw: true,
            include: {
                model: db.User,
                attributes: ["username", "email", "phone"]
            }
          });
         dataset_request_owner(
            dataset['User.email'],
            dataset.name,
            name,
            email,
            phone
         )
         dataset_request_user(
            email,
            dataset.name,
            dataset.researcher_name,
            dataset.sample_count
         )
        return result;
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const GetDatasetRequestsUser = async (user_id) => {
    try {
        let data=await db.DatasetRequest.findAll({
            include: [{ model: db.Dataset,raw:true,attributes: { exclude: ["preview_data","all_data","owner"] }}],
            where: { user: user_id },
        });
        return data.map((d)=>({...d.Dataset.dataValues,status:d.status,createdAt:d.createdAt}));
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}
const GetDatasetRequestsUserByDatasetId = async (user_id,dataset_id) => {
    try {
        return await db.DatasetRequest.findOne({
            where: { user: user_id, dataset: dataset_id },
        });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const GetDatasetRequestAdmin = async () => {
    try {
        let pendingRequests = await db.DatasetRequest.findAndCountAll({
         include: [
             {
                 model: db.Dataset,
                 attributes: { exclude: ["preview_data", "all_data", "owner"] },
                 include: {
                     model: db.User,
                     attributes: ["username","role", "email", "phone", "department", "practicing_no"]
                 }
             },
             {
                 model: db.User,
                 attributes: ["username","role", "email", "phone", "department", "practicing_no"]
             }
         ],
         where: { status: "pending" },
         order: [["createdAt", "DESC"]]
        });
        let acceptedRequests = await db.DatasetRequest.findAndCountAll({
          include: [
            {
                model: db.Dataset,
                attributes: { exclude: ["preview_data", "all_data", "owner"] },
                include: {
                    model: db.User,
                    attributes: ["username","role", "email", "phone", "department", "practicing_no"]
                }
            },
            {
                model: db.User,
                attributes: ["username","role", "email", "phone", "department", "practicing_no"]
            }
          ],  
          where: { status: "accepted" },
          order: [["createdAt", "DESC"]]
        });
        let rejectedRequests = await db.DatasetRequest.findAndCountAll({
          include: [
            {
                model: db.Dataset,
                attributes: { exclude: ["preview_data", "all_data", "owner"] },
                include: {
                    model: db.User,
                    attributes: ["username","role", "email", "phone", "department", "practicing_no"]
                }
            },
            {
                model: db.User,
                attributes: ["username","role", "email", "phone", "department", "practicing_no"]
            }
            ],
            where: { status: "rejected" },
            order: [["createdAt", "DESC"]]
        });
        return { pending: pendingRequests, accepted: acceptedRequests, rejected: rejectedRequests };
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const AcceptDatasetRequest = async (request_id) => {
    try {
        let data=await db.DatasetRequest.findOne({
            where: { id: request_id },
        });
        if(!data){
            throw new OTJSBadRequestException("Request not found");
        }
        let dataset_id=data.dataset;
        let user_id=data.user;
        await db.UserDataset.create({ dataset: dataset_id, user: user_id });
        let user=await db.User.findOne({
          where: { id: data.user },
          raw: true
        });
        let dataset=await db.Dataset.scope('withAllData').findOne({
            where: { id: dataset_id },
            raw: true,
            include: {
                model: db.User,
                attributes: ["username", "email", "phone"]
            }
          });
        send_email_dataset_request_accepted_owner(
            dataset['User.email'],
            dataset.name,
            user.firstname +" "+user.lastname,
            user.email,
            user.phone
         )
         send_email_dataset_request_accepted_user(
            user.email,
            dataset.name
         )
        return await db.DatasetRequest.update({ status: "accepted" }, {
            where: { id: request_id },
        });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const RejectDatasetRequest = async (request_id) => {
    try {
        let data=await db.DatasetRequest.findOne({
            where: { id: request_id },
        });
        if(!data){
            throw new OTJSBadRequestException("Request not found");
        }
        let dataset_id=data.dataset;
        let user_id=data.user;
        let user=await db.User.findOne({where: { id: user_id },raw: true});
        let dataset=await db.Dataset.scope('withAllData').findOne({
            where: { id: dataset_id },
            raw: true,
            include: {
                model: db.User,
                attributes: ["username", "email", "phone"]
            }
          });
        send_email_dataset_request_rejected_owner(
            dataset['User.email'],
            dataset.name,
            user.firstname +" "+user.lastname,
            user.email,
            user.phone
        )
        send_email_dataset_request_rejected_user(
            user.email,
            dataset.name
        )
        await db.UserDataset.destroy({ where: { dataset: dataset_id, user: user_id } });
        return await db.DatasetRequest.update({ status: "rejected" }, {
            where: { id: request_id },
        });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const getDatasetAnalytics = async (dataset_id) => {
  try {
      // Grouping purchased records by date
      let purchasedRecords = await db.UserDataset.findAll({
          where: { dataset: dataset_id },
          attributes: [
              [literal(`DATE("createdAt")`), 'purchaseDate'], // Use literal for date extraction
              [fn('COUNT', col('createdAt')), 'count'],
          ],
          group: [literal(`DATE("createdAt")`)],
          order: [[literal(`DATE("createdAt")`), 'ASC']],
      });

      // Grouping request records by date
      let requestRecords = await db.DatasetRequest.findAll({
          where: { dataset: dataset_id },
          attributes: [
              [literal(`DATE("createdAt")`), 'requestDate'], // Use literal for date extraction
              [fn('COUNT', col('createdAt')), 'count'],
          ],
          group: [literal(`DATE("createdAt")`)],
          order: [[literal(`DATE("createdAt")`), 'ASC']],
      });

      return { purchasedRecords, requestRecords };
  } catch (e) {
      throw new OTJSBadRequestException(e.message);
  }
}

const getDatasetUsers = async (dataset_id) => {
    try {
        return await db.UserDataset.findAll({
            where: { dataset: dataset_id },
        });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const deleteDataset = async (dataset_id) => {
    try {
        await db.UserDataset.destroy({ where: { dataset: dataset_id } });
        await db.DatasetCoowner.destroy({ where: { dataset: dataset_id } });
        return await db.Dataset.destroy({ where: { id: dataset_id } });
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
    }
}

const assignDataset=async (dataset_id,user_id)=>{
  try {
    let dataset=await db.Dataset.findOne({where: { id: dataset_id },raw: true});
    if(dataset.owner===user_id){
      throw new OTJSBadRequestException("You are already owner of this dataset");
    }
    return await db.DatasetCoowner.create({ dataset: dataset_id, user: user_id });
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
}

const unassignDataset=async (dataset_id,user_id)=>{
  try {
    return await db.DatasetCoowner.destroy({ where: { dataset: dataset_id, user: user_id } });
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
}

const isCoowner=async (dataset_id,user_id)=>{
  try {
    return await db.DatasetCoowner.findOne({where: { dataset: dataset_id, user: user_id }});
  } catch (e) {
    throw new OTJSBadRequestException(e.message);
  }
}

const AssignCoowner = async (dataset_id, data) => {
    try {
        let prevCoowners=await db.DatasetCoowner.findAll({ where: { dataset: dataset_id } ,raw: true});
        let prevCoOwnerIds=prevCoowners.map((d)=>d.user);
        let newCoOwnerIds=[];
        let userEmailMapper={};
        let dataset=await db.Dataset.findOne({where: { id: dataset_id },raw: true});
        await db.DatasetCoowner.destroy({ where: { dataset: dataset_id } });
        for (let i = 0; i < data.length; i++) {
            let str=data[i]
            const match = str.match(/\((.*?)\)/); // Regex to match text within parentheses
            const username = match ? match[1] : null;
            let user = await db.User.findOne({ where: { username: username } });
            if(user){
              newCoOwnerIds.push(user.id);
              userEmailMapper[user.id]=user.email;
              await db.DatasetCoowner.create({ dataset: dataset_id, user: user.id });
            } 
        }
        newCoOwnerIds.forEach((d)=>{
          if(!prevCoOwnerIds.includes(d)){
            assign_dataset_to_user(
              userEmailMapper[d],
              dataset.name,
            )
          }
        });
        
    } catch (e) {
        throw new OTJSBadRequestException(e.message);
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
  GetDatasetRequestsUserByDatasetId,
  GetSubscribedDatasetsByDatasetId,
  AcceptDatasetRequest,
  RejectDatasetRequest,
  getDatasetAnalytics,
  getDatasetUsers,
  deleteDataset,
  assignDataset,
  unassignDataset,
  isCoowner,
  AssignCoowner
};
