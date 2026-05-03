const Inventory = require("../repository/Inventory");

class InventoryModal{
    static async create_inventory_activity(data){
        return Inventory.create_inventory_activity(
            data.item_code,
            data.item_name,
            data.expiry_date,
            data.item_description,
            data.manufacture,
            data.category,
            data.vendor,
            data.store_location,
            data.type,
            data.total_cost,
            data.cost_per_unit,
            data.unit_quantity,
            data.stock_id,
            data.user,
            data.activity_type,
            data.min_qty
        )
    }


    static async create_inventory(data){
       return await Inventory.create_item(
        data.item_code,
        data.item_name,
        data.expiry_date,
        data.item_description,
        data.manufacture,
        data.category,
        data.vendor,
        data.store_location,
        data.type,
        data.total_cost,
        data.cost_per_unit,
        data.unit_quantity
       )
    }


    static async create_inventory_bulk(data){
     return await Inventory.create_item_bulk(data);   
    }
    static async create_store_location(data){
        return await Inventory.create_store_location(
            data.location,
            data.description,
            data.section
        )
    }

    static async use_inventory(id,user){
        return await Inventory.use_inventory(id,user)
    }
    static async create_vendor(data){
        return await Inventory.create_vendor(
            data.name,
            data.address,
            data.phone,
            data.ssm
        )
    }

    static async create_manufacture(data){
        return await Inventory.create_manufacture(
            data.name,
            data.address,
            data.phone,
            data.ssm
        )
    }

    static async create_category(data){
        return Inventory.create_category(data.name)
    }

    static async get_item_releted_data(){
        return Inventory.get_item_releted_data()
    }

    static async get_inventory_activity(query){
        return Inventory.get_inventory_activity(query)
    }
    static async get_inventory(query){
        return Inventory.get_inventory(query)
    }

    static async get_inventory_distinct(query){
        return Inventory.get_inventory_distinct(query)
    }
    static async get_used_inventory(query){
        return Inventory.get_used_inventory(query)
    }

    static async get_category(query){
        return Inventory.get_category(query)
    }

    static async get_manufacture(query){
        return Inventory.get_manufacture(query)
    }

    static async get_vendor(query){
        return Inventory.get_vendor(query);
    }
    
    static async get_location(query){
        return Inventory.get_location(query);
    }

    static async update_inventory(data){
        return await Inventory.update_inventory(data)
    }

    static async update_location(data){
        return await Inventory.update_location(data)
    }

    static async update_vendor(data){
        return await Inventory.update_vendor(data)
    }

    static async update_manufacture(data){
        return await Inventory.update_manufacture(data)
    }

    static async update_category(data){
        return await Inventory.update_category(data)
    }

    // delete section
    static async delete_inventory(id){
        return await Inventory.delete_inventory(id)
    }

    static async delete_category(id){
        return await Inventory.delete_category(id)
    }

    static async delete_manufacture(id){
        return await Inventory.delete_manufacture(id)
    }
    
    static async delete_vendor(id){
        return await Inventory.delete_vendor(id)
    }

    static async delete_location(id){
        return await Inventory.delete_location(id)
    }

    static async delete_inventory_activity(id){
        return await Inventory.delete_inventory_activity(id)
    }
    // delete section

    static async inventory_summary(range){
        return await Inventory.inventory_summary(range)
    }
}


module.exports=InventoryModal;