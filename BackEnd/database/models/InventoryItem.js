"use strict";

module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    "Inventory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      item_code: DataTypes.STRING,
      item_name: DataTypes.STRING,
      expiry_date: DataTypes.DATE,
      item_description: DataTypes.TEXT,
      manufacture: DataTypes.INTEGER,
      category: DataTypes.INTEGER,
      vendor: DataTypes.INTEGER,
      store_location: DataTypes.INTEGER,
      stock_id: DataTypes.STRING,
      type: DataTypes.STRING,
      total_cost: DataTypes.INTEGER,
      cost_per_unit: DataTypes.INTEGER,
      unit_quantity: DataTypes.INTEGER,
      min_qty: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
 
  Inventory.associate = function (models) {
    Inventory.belongsTo(models.Manufacture, { foreignKey: 'manufacture' });
    Inventory.belongsTo(models.InventoryCategory, { foreignKey: 'category' });
    Inventory.belongsTo(models.Vendor, { foreignKey: 'vendor' });
    Inventory.belongsTo(models.StoreLocation, { foreignKey: 'store_location' });
  };
  return Inventory;
};
