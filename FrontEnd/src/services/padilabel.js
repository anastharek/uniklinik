import axios from "axios";

const padilabels = {
    create: async (data) => {
        return axios.post('/api/padilabel', data);
    },
    getAll: async () => {
        return axios.get('/api/padilabel');
    },
    getById: async (id) => {
        return axios.get(`/api/padilabel/${id}`);
    },
    update: async (id, data) => {
        return axios.put(`/api/padilabel/${id}`, data);
    },
    delete: async (id) => {
        return axios.delete(`/api/padilabel/${id}`);
    },
    getByRole: async () => {
        return axios.get(`/api/users/padi-label/role`);
    }
};

export default padilabels;
