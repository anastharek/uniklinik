'use strict'
module.exports = (sequelize, DataTypes) => {
    const AdvImagin = sequelize.define('AdvImagin', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        hospital_email: DataTypes.STRING,
        patient_email: DataTypes.STRING,
        patient_name: DataTypes.STRING,
        patient_id: DataTypes.STRING,
        study_type: DataTypes.STRING,
        request_date: DataTypes.STRING,
        study_id: DataTypes.STRING,
        requested_by: DataTypes.STRING,
        patient_phone: DataTypes.STRING,
        is_consern: DataTypes.BOOLEAN,
        text: DataTypes.TEXT,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,

    }, {
        freezeTableName: true,
    })
    AdvImagin.associate = function (models) {

    }
    return AdvImagin
}
