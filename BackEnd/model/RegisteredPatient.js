const PatientRepository = require('../repository/RegisteredPatient');

class Patient {
    static async checkPatientExists(email, phone) {
        try {
            const patient = await PatientRepository.checkPatientExists(email, phone);
            return patient;
        } catch (error) {
            throw new Error("Error checking if patient exists: " + error.message);
        }
    }
    static validatePatient = async (email, patient_id) => {
        try {
            const patient = await PatientRepository.validatePatient(email, patient_id);
            return patient;
        } catch (error) {
            throw new Error("Error validating patient: " + error.message);
        }
    }
    
    static async generateOTP(patient_id) {
        try {
            return await PatientRepository.generateOTP(patient_id);
        } catch (error) {
            throw new Error("Error generating OTP: " + error.message);
        }
    }

    static async verifyOTP(patient_id, otp) {
        try {
            return await PatientRepository.verifyOTP(patient_id, otp);
        } catch (error) {
            throw new Error("Error verifying OTP: " + error.message);
        }
    }
    
    static async getPatientById(id) {
        try {
            const patient = await PatientRepository.getPatientById(id);
            return patient;
        } catch (error) {
            throw new Error("Error fetching patient by ID: " + error.message);
        }
    }

    static async getAllPatients() {
        try {
            const patients = await PatientRepository.getAllPatients();
            return patients;
        } catch (error) {
            throw new Error("Error fetching all patients: " + error.message);
        }
    }

    static async updatePatient(id, data) {
        try {
            const updatedPatient = await PatientRepository.updatePatient(id, data);
            return updatedPatient;
        } catch (error) {
            throw new Error("Error updating patient: " + error.message);
        }
    }

    static async deletePatient(id) {
        try {
            const deletedPatient = await PatientRepository.deletePatient(id);
            return deletedPatient;
        } catch (error) {
            throw new Error("Error deleting patient: " + error.message);
        }
    }

    static async createPatient(data) {
        try {
            const newPatient = await PatientRepository.createPatient(data);
            return newPatient;
        } catch (error) {
            throw new Error("Error creating patient: " + error.message);
        }
    }
}
module.exports = Patient;