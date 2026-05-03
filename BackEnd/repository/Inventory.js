const db = require("../database/models");
const mailer = require("../utils/mailer");
const Sequelize = require("sequelize");
const moment=require('moment')
const Op = Sequelize.Op;
const { fn, col } = require('sequelize');
const e = require("cors");

class Inventory{
    static async create_inventory_activity(
        item_code,item_name,
        expiry,description,manufacture,
        category,vendor,store_location,
        type,total_cost,cost_per_unit,
        unit_quantity,
        stock_id,
        user,
        activity_type,
        min_qty,
    ){
        return await  db.InventoryActivityLog.create({
            item_code,
            item_name,
            expiry_date:expiry,
            item_description:description,
            manufacture:manufacture,
            category:category,
            vendor:vendor,
            store_location:store_location,
            type,
            total_cost,
            cost_per_unit,
            unit_quantity,
            stock_id,
            user,
            activity_type,
            min_qty
         })   
    }

    
    static async create_item(
        item_code,item_name,
        expiry,description,manufacture,
        category,vendor,store_location,
        type,total_cost,cost_per_unit,
        unit_quantity,
    ){
   return await  db.Inventory.create({
        item_code,
        item_name,
        expiry_date:expiry,
        item_description:description,
        manufacture:manufacture,
        category:category,
        vendor:vendor,
        store_location:store_location,
        type,
        total_cost,
        cost_per_unit,
        unit_quantity,
     })   
    }

    static async use_inventory(id,user){
        const inventory=await db.Inventory.findOne(
            {
                where:{id:id},
                include: [
                    {
                        model:db.InventoryCategory,
                        attributes:['name']
                    },
                    {
                        model:db.Manufacture,
                        attributes:['name']
                    },
                    {
                        model:db.Vendor,
                        attributes:['name']
                    },
                    {
                        model:db.StoreLocation,
                        attributes:['location']
                    },
                ]
            }
            )
        if(inventory){
           //await db.InventoryActivity.destroy({where:{}});
           if(!inventory.unit_quantity){
            return "qty is already 0."
           }
           inventory.unit_quantity=inventory.unit_quantity-1;
           if((!inventory.unit_quantity)||(inventory.unit_quantity <= inventory.min_qty)){
            mailer.send_inventory_notification(
                inventory.item_name,
                inventory.item_code,
                inventory.stock_id,
                inventory.unit_quantity,
                inventory.Vendor.name,
                inventory.Manufacture.name,
                inventory.InventoryCategory.name,
                inventory.StoreLocation.location,
                inventory.expiry_date
            )
           }
           await inventory.save();
           let temp={...inventory.dataValues}
           delete temp.id;
           delete temp.createdAt
           delete temp.updatedAt;
           return await db.InventoryActivity.create({...temp,used_by:user});
        }
        return;
    }

    static async create_item_bulk(data){
        try{
        // const fs=require('fs');
        // fs.writeFileSync('temp.json',JSON.stringify(data));
        return await db.Inventory.bulkCreate(data, { returning: true }); 
        }
        catch(err){
           console.log(err)
        }
    }

    static async create_store_location(
        location,
        description,
        section

    ){
        return await db.StoreLocation.create({
        location,
        description,
        section
        })
    }

    static async create_vendor(name,address,phone,ssm,){
        return await db.Vendor.create({ name,address,phone,ssm})
    }
   
    static async create_manufacture(name,address,phone,ssm,){
        return await db.Manufacture.create({ name,address,phone,ssm})
    }

    static async create_category(name){
        return await db.InventoryCategory.create({ name})
    }

    static async get_item_releted_data(){
        let manufacture=await db.Manufacture.findAll({
            attributes: ["id",'name'], 
        })
        let category=await db.InventoryCategory.findAll({
            attributes: ["id",'name'], 
        })
        let vendor=await db.Vendor.findAll({
            attributes: ["id",'name'], 
        })
        let location=await db.StoreLocation.findAll({
            attributes: ["id",'location'], 
        })

        return {manufacture,category,vendor,location}
    }

    static async get_inventory(query={}){
        let dbQuery={}
        let keys=Object.keys(query);
        if(keys.length){
        let stringKeys=['item_code','item_name','item_description','type',]
        keys.map(key=>{
            if(query[key]==''){
                return;
            }
            if(stringKeys.includes(key)){
                dbQuery[key]= {[Op.like]: `%${query[key]}%`}
            }
            else if(key=='created_from' || key=='created_to'){
                if(!query.created_to && query.created_from ){
                    let created_from=new Date(query.created_from);
                    dbQuery.createdAt={[Op.gte]:created_from} ;
                }
                if(query.created_to && !query.created_from ){
                    let created_to=moment(query.created_to).endOf('day');
                    dbQuery.createdAt={[Op.lte]:created_to} ;
                }
                if(query.created_from && query.created_to){
                    dbQuery['createdAt']= {[Op.between]: [new Date(query.created_from),moment(query.created_to).endOf('day')]}
                }
            }
            else if(key=='expiry_from' || key=='expiry_to'){
                if(!query.expiry_to){
                   
                    let exp_to=new Date(query.expiry_from);
                    exp_to.setDate(expo_from.getDate()+1);
                    query.expiry_to=exp_to.toDateString();
                }
                if(query.expiry_from && query.expiry_to){
                    dbQuery['expiry_date']= {[Op.between]: [new Date(query.expiry_from),moment(query.expiry_to).endOf('day')]}
                }
            }else{
                dbQuery[key]=query[key]
            }
           
        })
        }
       
        return await db.Inventory.findAll({
            where:dbQuery,
            
            include: [
            {
                model:db.InventoryCategory,
                attributes:['name']
            },
            {
                model:db.Manufacture,
                attributes:['name']
            },
            {
                model:db.Vendor,
                attributes:['name']
            },
            {
                model:db.StoreLocation,
                attributes:['location']
            },
        
            ],
            order: [['createdAt', 'ASC']], 
        });
    }
    static async get_inventory_activity(query={}){
        let dbQuery={}
        let keys=Object.keys(query);
        if(keys.length){
        let stringKeys=['item_code','item_name','item_description','type','user']
        keys.map(key=>{
            if(!query[key] || query[key]==''){
                return;
            }
            if(stringKeys.includes(key)){
                dbQuery[key]= {[Op.like]: `%${query[key]}%`}
            }else if(key=='created_from' || key=='created_to'){
                if(!query.created_to && query.created_from ){
                    let created_from=new Date(query.created_from);
                    dbQuery.createdAt={[Op.gte]:created_from} ;
                }
                if(query.created_to && !query.created_from ){
                    let created_to=moment(query.created_to).endOf('day');
                    dbQuery.createdAt={[Op.lte]:created_to} ;
                }
                if(query.created_from && query.created_to){
                    dbQuery['createdAt']= {[Op.between]: [new Date(query.created_from),moment(query.created_to).endOf('day')]}
                }
            }else if(key=='expiry_from' || key=='expiry_to'){
                if(!query.expiry_to && query.expiry_from ){
                    let expiry_from=new Date(query.expiry_from);
                    dbQuery.createdAt={[Op.gte]:expiry_from} ;
                }
                if(query.expiry_to && !query.expiry_from ){
                    let expiry_to=moment(query.expiry_to).endOf('day');
                    dbQuery.createdAt={[Op.lte]:expiry_to} ;
                }
                if(query.expiry_from && query.expiry_to){
                    dbQuery['expiry_date']= {[Op.between]: [new Date(query.expiry_from),moment(query.expiry_to).endOf('day')]}
                }
            }else{
                dbQuery[key]=query[key]
            }
           
        })
        }
        return await db.InventoryActivityLog.findAll({
            where:dbQuery,
            
            include: [
            {
                model:db.InventoryCategory,
                attributes:['name']
            },
            {
                model:db.Manufacture,
                attributes:['name']
            },
            {
                model:db.Vendor,
                attributes:['name']
            },
            {
                model:db.StoreLocation,
                attributes:['location']
            },
            {
                model:db.User,
                attributes:['username']
            },
        
            ],
            order: [['createdAt', 'ASC']], 
        });
    }

    static async get_inventory_distinct(query){
        let dbQuery={}
        dbQuery['item_name']={
            [Op.like]:`%${query.item_name}%`
        }
        return await db.Inventory.findAll({
            where:dbQuery,
            group: ['id','item_name'],  
        });  
    }
    static async get_used_inventory(query){
        let dbQuery={}
        let keys=Object.keys(query);
        if(keys.length){
        let stringKeys=['item_code','item_name','item_description','type','used_by']
        keys.map(key=>{
            if(query[key]==''){
                return;
            }
            if(stringKeys.includes(key)){
                dbQuery[key]= {[Op.like]: `%${query[key]}%`}
            }else if(key=='expiry_from' || key=='expiry_to'){
                if(!query.expiry_to){
                    let exp_to=new Date(query.expiry_from);
                    exp_to.setDate(expo_from.getDate()+1);
                    query.expiry_to=exp_to.toDateString();
                }
                if(query.expiry_from && query.expiry_to){
                    dbQuery['expiry_date']= {[Op.between]: [new Date(query.expiry_from),moment(query.expiry_to).endOf('day')]}
                }
            }else if(key=='created_from' || key=='created_to'){
                if(!query.created_to && query.created_from ){
                    let created_from=new Date(query.created_from);
                    dbQuery.createdAt={[Op.gte]:created_from} ;
                }
                if(query.created_to && !query.created_from ){
                    let created_to=moment(query.created_to).endOf('day');
                    dbQuery.createdAt={[Op.lte]:created_to} ;
                }
                if(query.created_from && query.created_to){
                    dbQuery['createdAt']= {[Op.between]: [new Date(query.created_from),moment(query.created_to).endOf('day')]}
                }
            }
            else{
                dbQuery[key]=query[key]
            }
           
        })
        }
        return await db.InventoryActivity.findAll({
            where:dbQuery,
            include: [
            {
                model:db.InventoryCategory,
                attributes:['name']
            },
            {
                model:db.Manufacture,
                attributes:['name']
            },
            {
                model:db.Vendor,
                attributes:['name']
            },
            {
                model:db.StoreLocation,
                attributes:['location']
            },
        
            ],
            order: [['createdAt', 'ASC']],  
        }); 
    }

    static async get_category(query={}){
        let dbQuery={}
        if(query.name){
            dbQuery['name']= {[Op.like]: `%${query.name}%`}
        }
        return await db.InventoryCategory.findAll({where:dbQuery});
    }

    static async get_manufacture(query={}){
        let dbQuery={}
        let keys=Object.keys(query);
        keys.map(key=>{
            dbQuery[key]= {[Op.like]: `%${query[key]}%`}
        })
        return await db.Manufacture.findAll({where:dbQuery});
    }

    static async get_vendor(query={}){
        let dbQuery={}
        let keys=Object.keys(query);
        keys.map(key=>{
            dbQuery[key]= {[Op.like]: `%${query[key]}%`}
        })
        return await db.Vendor.findAll({where:dbQuery});
    }

    static async get_location(query={}){
        let dbQuery={}
        let keys=Object.keys(query);
        keys.map(key=>{
            dbQuery[key]= {[Op.like]: `%${query[key]}%`}
        })
        return await db.StoreLocation.findAll({where:dbQuery});
    }

    static async update_inventory(data){
        let keys=[
        'item_code','item_name',
        'expiry_date','item_description',
        'type','total_cost','cost_per_unit',
        'unit_quantity','min_qty']
        let newData={};
        keys.map(key=>{
            newData[key]=data[key]
        })
        return db.Inventory.update(newData, {
            where: {id:data.id}
        })
    }

    static async update_location(data){
        let keys=['location','description','section',]
        let newData={};
        keys.map(key=>{
            newData[key]=data[key]
        })
        return db.StoreLocation.update(newData, {
            where: {id:data.id}
        })

    }

    static async update_vendor(data){
        let keys=['name','address','phone','ssm']
        let newData={};
        keys.map(key=>{
            newData[key]=data[key]
        })
        return db.Vendor.update(newData, {
            where: {id:data.id}
        })
    }

    static async update_manufacture(data){
        let keys=['name','address','phone','ssm']
        let newData={};
        keys.map(key=>{
            newData[key]=data[key]
        })
        return db.Manufacture.update(newData, {
            where: {id:data.id}
        })
    }

    static async update_category(data){
        let keys=['name']
        let newData={};
        keys.map(key=>{
            newData[key]=data[key]
        })
        return db.InventoryCategory.update(newData, {
            where: {id:data.id}
        })
    }

    static async delete_inventory(id){
        let inventory= await db.Inventory.findByPk(id);
        if(inventory){
            return await inventory.destroy();
        }
        return;
    }

    static async delete_category(id){
        let category=await db.InventoryCategory.findByPk(id);
        if(category){
            return await category.destroy()
        }
        return
    }

    static async delete_manufacture(id){
        let manufacture=await db.Manufacture.findByPk(id);
        if(manufacture){
            return await manufacture.destroy();
        }
        return
    }

    static async delete_vendor(id){
        let vendor=await db.Vendor.findByPk(id);
        if(vendor){
            return await vendor.destroy();
        }
        return

    }

    static async delete_location(id){
        let location= await db.StoreLocation.findByPk(id);
        if(location){
            return await location.destroy()
        }
        return
    }

    static async delete_inventory_activity(id){
        let obj=await db.InventoryActivity.findByPk(id);
        if(obj){
            return await obj.destroy()
        }
        return;
    }

    static async inventory_summary(range='daily'){
        let start_date=moment().startOf('day').toDate();
        let end_date=moment().endOf('day').toDate();
        if(range=='monthly'){
            start_date=moment().add(-30,'days').toDate();
        }else if(range=='weekly'){
            start_date=moment().add(-7,'days').toDate();
        }
        let remaning_inventory=(await db.Inventory.findAll({
            where:{
                createdAt:{
                    [Op.between]: [start_date,end_date]
                }
            },
            attributes: [[fn('SUM', col('unit_quantity')), 'remaning_inventory']]
        }))[0].get('remaning_inventory');
        let used_inventory=(await db.InventoryActivity.count({
            where:{
                createdAt:{
                    [Op.between]: [start_date,end_date]
                }
            },
        }))

        let expired_inventory=(await db.Inventory.findAll({
            where:{
                expiry_date:{
                    [Op.between]: [start_date,end_date]
                }
            },
            attributes: [[fn('SUM', col('unit_quantity')), 'expired_inventory']]
        }))[0].get('expired_inventory');

        let top4UsedProduct=await db.InventoryActivity.findAll({
            attributes: [
                'item_code',
                'item_name',
                [fn('COUNT', col('item_code')), 'usageCount']
            ],
            group: ['item_code','item_name'],
            order: [[fn('COUNT', col('item_code')), 'DESC']],
            limit: 4
        });
        let prev_start_date=null;
        let prev_end_date=null;
        if(range=='monthly'){
            prev_start_date=moment().add(-60,'days').toDate();
            prev_end_date=moment().add(-30,'days').toDate();
        }else if(range=='weekly'){
            prev_start_date=moment().add(-14,'days').toDate();
            prev_end_date=moment().add(-7,'days').toDate();
        }else{
            prev_start_date=moment().add(-1,'days').startOf('day').toDate();
            prev_end_date=moment().add(-1,'days').endOf('day').toDate();
        }
        let graphData={
            item_name:[],
            prev_data:[],
            current_data:[],
            future_estimate:[]
        }
        for(let item of top4UsedProduct){
            item=item.get();
            let current_data=(await db.InventoryActivity.count({
                where:{
                    item_code:item.item_code,
                    createdAt:{
                        [Op.between]: [start_date,end_date]
                    }
                },
            }))

            let prev_data=(await db.InventoryActivity.count({
                where:{
                    item_code:item.item_code,
                    createdAt:{
                        [Op.between]: [prev_start_date,prev_end_date]
                    }
                },
            }))
            let prev_avg=0;
            let current_avg=0;
            let future_estimate=0;
            if(range=='monthly'){
                prev_avg=prev_data/30;
                current_avg=current_data/moment().date();
                future_estimate=parseInt((current_avg/prev_avg)*30);

            }else if(range=='weekly'){
                prev_avg=prev_data/7;
                current_avg=current_data/moment().day();
                future_estimate=parseInt((current_avg/prev_avg)*7);
            }else{
                future_estimate=parseInt((current_data/prev_data)*current_data);
            }
            graphData.item_name.push(`${item.item_name} (${item.item_code})`);
            graphData.prev_data.push(prev_data);
            graphData.current_data.push(current_data);
            graphData.future_estimate.push(future_estimate);
        }
        for(let i=graphData.item_name.length;i<4;i++){
            graphData.item_name.push("N/A");
            graphData.prev_data.push(null);
            graphData.current_data.push(null);
            graphData.future_estimate.push(null);
        }

        let top10InventoryActivity=await db.InventoryActivityLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10,
        });

        let lowStockInventory=await db.Inventory.findAll({
            where:{
                [Op.or]:[
                    {
                        unit_quantity:{
                            [Op.lte]: col('min_qty')
                        }
                    },
                    {
                        unit_quantity:{
                           [Op.lte]: 4
                        }
                    }
                ]
               
            },
            include: [
                {
                    model:db.Vendor,
                    attributes:['name']
                }
                ],
            limit: 10,
        });
        let data={
            stock_in:remaning_inventory||0,
            stock_used:used_inventory,
            stock_expired:expired_inventory||0,
            graphData,
            activitys:top10InventoryActivity,
            low_stocks:lowStockInventory
        }
        return data;
    }
}



module.exports=Inventory;