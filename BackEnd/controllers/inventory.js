const InventoryModal =require('../model/Inventory');
const ExcelJS = require('exceljs');
const User = require('../repository/User');
const ActivityType=require('../utils/ActivityType/index')
const create_inventory=async(req,res)=>{
    let required=[
        'item_code','item_name',
        'expiry_date','item_description','manufacture',
        'category','vendor','store_location',
        'type','total_cost','cost_per_unit',
        'unit_quantity']
    let keys=Object.keys(req.body);
    let error=keys.filter(text=>!required.includes(text));
    if(error.length){
        return res.json({error_key:error});
    }
    let user=await User.getUserbyUsername(req.username)
    let obj=await InventoryModal.create_inventory(req.body);
    req.body.user=user.id;
    req.body.stock_id=obj.dataValues.stock_id;
    req.body.activity_type=ActivityType.CREATE_INVENTORY_ITEM
    await InventoryModal.create_inventory_activity(
       req.body
    )
    return res.json({data:obj})
}
const create_inventory_bulk=async(req,res)=>{
   let {all_data}=req.body;
   let res_data=await InventoryModal.create_inventory_bulk(all_data) 
   let user=await User.getUserbyUsername(req.username)
   for(let i=0;i<res_data.length;i++){
    res_data[i].user=user.id;
    res_data[i].activity_type=ActivityType.CREATE_INVENTORY_ITEM_EXCEL
    await InventoryModal.create_inventory_activity(res_data[i])
   }  
   return res.json({data:res_data})
}
const create_location=async(req,res)=>{
    let required=['location','description','section',]
    let keys=Object.keys(req.body);
    let error=keys.filter(text=>!required.includes(text));
    if(error.length){
        return res.json({error_key:error});
    }
    let obj=await InventoryModal.create_store_location(req.body);
    return res.json({data:obj})

}

const create_vendor=async(req,res)=>{
    let required=['name','address','phone','ssm']
    let keys=Object.keys(req.body);
    let error=keys.filter(text=>!required.includes(text));
    if(error.length){
        return res.json({error_key:error});
    }
    let obj=await InventoryModal.create_vendor(req.body);
    return res.json({data:obj});
}


const create_manufacture=async(req,res)=>{
    let required=['name','address','phone','ssm']
    let keys=Object.keys(req.body);
    let error=keys.filter(text=>!required.includes(text));
    if(error.length){
        return res.json({error_key:error});
    }
    let obj=await InventoryModal.create_manufacture(req.body);
    return res.json({data:obj});
}

const create_category=async(req,res)=>{
    let required=['name']
    let keys=Object.keys(req.body);
    let error=keys.filter(text=>!required.includes(text));
    if(error.length){
        return res.json({error_key:error});
    }
    let obj=await InventoryModal.create_category(req.body);
    return res.json({data:obj});
}


const get_item_releted_data=async(req,res)=>{
    let data=await InventoryModal.get_item_releted_data();
    return res.json({data})
}

const get_inventory_activity=async(req,res)=>{
    let data=await InventoryModal.get_inventory_activity(req.query);
    return res.json({data})
}
const get_inventory=async(req,res)=>{
    let data=await InventoryModal.get_inventory(req.query);
    return res.json({data})
}

const get_inventory_distinct=async(req,res)=>{
    let data=await InventoryModal.get_inventory_distinct(req.query);
    return res.json({data})
}

const get_used_inventory=async(req,res)=>{
   let data=await InventoryModal.get_used_inventory(req.query);
    return res.json({data})
}

const get_category=async(req,res)=>{
   let data=await InventoryModal.get_category(req.query)
   return res.json({data})
}

const get_manufacture=async(req,res)=>{
   let data=await InventoryModal.get_manufacture(req.query)
   return res.json({data})
}

const get_vendor=async(req,res)=>{
    let data=await InventoryModal.get_vendor(req.query)
   return res.json({data})
}

const get_location=async(req,res)=>{
    let data=await InventoryModal.get_location(req.query)
   return res.json({data})
}




// *************** updates controller start***************
const update_inventory=async(req,res)=>{
    let data=await InventoryModal.update_inventory(req.body)
    let user=await User.getUserbyUsername(req.username)
    req.body.user=user.id;
    req.body.activity_type=ActivityType.UPDATE_INVENTORY_ITEM
    InventoryModal.create_inventory_activity(req.body)
    return res.json({data})
}
const update_location=async(req,res)=>{
    let data=await InventoryModal.update_location(req.body)
    return res.json({data})
}
const update_vendor=async(req,res)=>{
    let data=await InventoryModal.update_vendor(req.body)
    return res.json({data})
}
const update_manufacture=async(req,res)=>{
    let data=await InventoryModal.update_manufacture(req.body)
    return res.json({data})
}

const update_category=async(req,res)=>{
    let data=await InventoryModal.update_category(req.body)
    return res.json({data})
}
// *************** updates controller end***************


// *************** delete controller end***************
const delete_inventory=async(req,res)=>{
    const {id}=req.params;
    let obj=await InventoryModal.get_inventory({id});
    let user=await User.getUserbyUsername(req.username)
    req.body={...obj[0].dataValues}
    req.body.user=user.dataValues.id;
    req.body.activity_type=ActivityType.DELETE_INVENTORY_ITEM
    await InventoryModal.delete_inventory(id)
    InventoryModal.create_inventory_activity(req.body)
    return res.send(204)
}
const delete_category=async(req,res)=>{
    const {id}=req.params;
    let data=await InventoryModal.delete_category(id)
    return res.send(204)
}
const delete_manufacture=async(req,res)=>{
    const {id}=req.params;
    await InventoryModal.delete_manufacture(id)
    return res.send(204)
}

const delete_vendor=async(req,res)=>{
    const {id}=req.params;
    await InventoryModal.delete_vendor(id)
    return res.send(204)
}

const delete_location=async(req,res)=>{
    const {id}=req.params;
    await InventoryModal.delete_location(id)
    return res.send(204)
}
// *************** delete controller end***************

const use_inventory=async(req,res)=>{
    const {id}=req.body;
   let data=await InventoryModal.use_inventory(id,req.username);
   if(typeof data=='string'){
    return res.status(400).json({data})
   }
   return res.json({data})
}



const delete_inventory_activity=async(req,res)=>{
    const {id}=req.body;
   let data=await InventoryModal.delete_inventory_activity(id,req.username);
    return res.json({data})
}

const inventroy_summary=async(req,res)=>{
    let range=req.query.type;
    let data=await InventoryModal.inventory_summary(range);
    return res.json({data})
}
module.exports={
    create_inventory,
    create_location,
    create_vendor,
    create_manufacture,
    create_category,

    get_item_releted_data,
    get_inventory_activity,
    get_inventory,
    get_category,
    get_manufacture,
    get_vendor,
    get_location,
    create_inventory_bulk,
    
    update_inventory,
    update_location,
    update_vendor,
    update_manufacture,
    update_category,

    delete_category,
    delete_inventory,
    delete_manufacture,
    delete_vendor,
    delete_location,

    use_inventory,
    get_used_inventory,
    delete_inventory_activity,
    get_inventory_distinct,

    inventroy_summary
}