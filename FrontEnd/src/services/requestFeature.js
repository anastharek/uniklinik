const requestFeature = {

    getByID(id) {
        const Options = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            }
        }
        return fetch('/api/request-feature/'+id, Options).then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        }).catch(error => {
            throw error
        })
    },

    getList() {
        const Options = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            }
        }
        return fetch('/api/request-feature' , Options).then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        })
    },

    createFeature(payload) {

        const Options = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        }
        return fetch('/api/request-feature',Options).then((answer) => {
            if (!answer.ok) { throw answer }
            return true
        })
    }

}

export default requestFeature;