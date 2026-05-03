const Patient = require('../model/RegisteredPatient');
const createPatient = async (req, res) => {
    const { name , email , phone , patient_id } = req.body;
    try {

        if (!name || !email || !phone || !patient_id) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingPatient = await Patient.checkPatientExists(email, phone);
        if (existingPatient) {
            return res.status(400).json({ message: 'Patient already exists' });
        }
        const newPatient = await Patient.createPatient({ name, email, phone, patient_id });
        res.status(201).json(newPatient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getAllPatients = async (req, res) => {

    try {
        const patients = await Patient.getAllPatients();
        res.status(200).json(patients);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getPatientById = async (req, res) => {
   
    const { id } = req.params;
    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const updatePatient = async (req, res) => {
    const { id } = req.params;
    const { name , email , phone , patient_id } = req.body;
    try {
        const updatedPatient = await Patient.updatePatient(id, { name, email, phone, patient_id });
        if (!updatedPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json(updatedPatient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const deletePatient = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedPatient = await Patient.deletePatient(id);
        if (!deletedPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


module.exports = {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
};