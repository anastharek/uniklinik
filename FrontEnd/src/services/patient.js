import axios from "axios";

const patients ={
    create: async (data) => {
        return axios.post('/api/patient',data);
    },
    getAll: async () => {
        return axios.get('/api/patient');
    },
    getById: async (id) => {
        return axios.get(`/api/patient/${id}`);
    },
    update: async (id, data) => {
       return axios.put(`/api/patient/${id}`, data);
    },
    delete: async (id) => {
        return axios.delete(`/api/patient/${id}`);
    },
    getPatientById: async (id) => {
        return axios.get(`/api/patient/${id}`);
    },

    searchByName: async (name) => {
        return axios.get(`/api/patient/search?name=${name}`);
    },
}

export default patients;