const db = require("../database/models");

class RegisteredPatient {
    static checkPatientExists = async (email,phone) => {
        const patient = await db.RegisteredPatient.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { email: email },
                    { phone: phone }
                ]
            }
        });
        return patient;
    }

    static validatePatient = async (email, patient_id) => {
        const patient = await db.RegisteredPatient.findOne({
            where: {
                [db.Sequelize.Op.and]: [
                    { email: email },
                    { patient_id: patient_id }
                ]
            }
        });
        return patient;
    }

    static generateOTP = async (patient_id) => {
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otp_createdAt = new Date();
        await db.RegisteredPatient.update(
            { otp: otp, otp_createdAt: otp_createdAt },
            {
                where: {
                    patient_id: patient_id 
                }
            }
        );
        return otp;
    }

    static async verifyOTP(patient_id, otp) {
        const patient = await db.RegisteredPatient.findOne({
            where: {
                [db.Sequelize.Op.and]: [
                    { patient_id: patient_id },
                    { otp: otp }
                ]
            }
        });
        if (!patient) {
            return {
                status: false,
                message: "Invalid OTP",
            }
        }
        const currentTime = new Date();
        const otpCreatedAt = new Date(patient.otp_createdAt);
        const timeDiff = Math.abs(currentTime - otpCreatedAt);
        const diffMinutes = Math.floor((timeDiff / 1000) / 60);
        if (diffMinutes > 5) {
            return {
                status: false,
                message: "OTP expired",
            };
        }
        //reset OTP after successful verification
        await db.RegisteredPatient.update(
            { otp: null, otp_createdAt: null },
            {
                where: {
                    patient_id: patient_id
                }
            }
        );
        return {
            status: true,
            message: "OTP verified successfully",
        };
    }

    static async getPatientById(id) {
        try {
        const patient = await db.RegisteredPatient.findByPk(id);
        return patient;
        } catch (error) {
        throw new Error("Error fetching patient by ID: " + error.message);
        }
    }
    
    static async getAllPatients() {
        try {
        const patients = await db.RegisteredPatient.findAll();
        return patients;
        } catch (error) {
        throw new Error("Error fetching all patients: " + error.message);
        }
    }
    
    static async updatePatient(id, data) {
        try {
        const updatedPatient = await db.RegisteredPatient.update(data, {
            where: { id },
            returning: true,
        });
        return updatedPatient?.[1]?.[0];
        } catch (error) {
        throw new Error("Error updating patient: " + error.message);
        }
    }
    static async deletePatient(id) {
        try {
        const deletedPatient = await db.RegisteredPatient.destroy({
            where: { id },
        });
        return deletedPatient;
        } catch (error) {
        throw new Error("Error deleting patient: " + error.message);
        }
    }
    static async createPatient(data) {
        try {
        const newPatient = await db.RegisteredPatient.create(data);
        return newPatient;
        } catch (error) {
        throw new Error("Error creating patient: " + error.message);
        }
    }
}

module.exports = RegisteredPatient;