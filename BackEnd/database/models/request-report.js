'use strict'
module.exports = (sequelize, DataTypes) => {
    const RequestReport = sequelize.define('RequestReport', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        patient_name: DataTypes.STRING,
        patient_id: DataTypes.STRING,
        study_id: DataTypes.STRING,
        study_type: DataTypes.STRING,
        text: DataTypes.TEXT,
        request_type: DataTypes.STRING,
        status: DataTypes.STRING,
        reporter: DataTypes.STRING,
        accessor: DataTypes.STRING,
        StudyInstanceUID: DataTypes.STRING,
        req_by: DataTypes.STRING,
        department: DataTypes.STRING,
        radiologist_email: DataTypes.STRING,
        study_date: DataTypes.STRING,
        createdAt: DataTypes.DATE,
    }, {
        freezeTableName: true,
    })
    RequestReport.associate = function (models) {

    }
    return RequestReport
}
