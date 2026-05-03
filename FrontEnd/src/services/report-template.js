const reportTemplate = {

    create(payload) {
        const Options = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        }
        return fetch('/api/report-template',Options).then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        })
    },
    getAll() {
        return fetch('/api/report-template').then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        })
    },
    update(id, payload) {
        const Options = {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        }
        return fetch(`/api/report-template/${id}`,Options).then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        })
    },
    get(id) {
        return fetch(`/api/report-template/${id}`).then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        })
    },
    delete(id) {
        const Options = {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            }
        }
        return fetch(`/api/report-template/${id}`,Options).then((answer) => {
            if (!answer.ok) { throw answer }
            return answer.json()
        })
    }

}

export default reportTemplate;