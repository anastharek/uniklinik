"use strict";
module.exports = (sequelize, DataTypes) => {
  const InventoryActivity = sequelize.define(
    "InventoryActivityLog",
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
      used_by:DataTypes.STRING,
      total_cost: DataTypes.INTEGER,
      cost_per_unit: DataTypes.INTEGER,
      unit_quantity: DataTypes.INTEGER,
      min_qty: DataTypes.INTEGER,
      activity_type: DataTypes.STRING,
      user:DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      freezeTableName: true,
    }
  );
    InventoryActivity.associate = function (models) {
    InventoryActivity.belongsTo(models.Manufacture, { foreignKey: 'manufacture' });
    InventoryActivity.belongsTo(models.InventoryCategory, { foreignKey: 'category' });
    InventoryActivity.belongsTo(models.Vendor, { foreignKey: 'vendor' });
    InventoryActivity.belongsTo(models.StoreLocation, { foreignKey: 'store_location' });
    InventoryActivity.belongsTo(models.User, { foreignKey: 'user' });
  };

  return InventoryActivity;
};
