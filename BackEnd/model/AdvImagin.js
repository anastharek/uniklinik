const AdvImagin = require('../repository/AdvImagin');

class AdvImagins {
    static create(hospital_email, patient_email, patient_name, patient_id, study_type, request_date,
        study_id, text, requested_by, patient_phone, is_consern) {
        return AdvImagin.create(
            hospital_email = hospital_email,
            patient_email = patient_email,
            patient_name = patient_name,
            patient_id = patient_id,
            study_type = study_type,
            request_date = request_date,
            study_id = study_id,
            text = text,
            requested_by = requested_by,
            patient_phone = patient_phone,
            is_consern);
    }

    static get(study_id) {
        return AdvImagin.get(study_id = study_id);
    }

    static getAll() {
        return AdvImagin.getAll();
    }

    static deleteImagin(study_id) {
        return AdvImagin.deleteImagin(study_id = study_id);
    }
}

module.exports = AdvImagins;