const aiConf={
    get(){
        const getAiConfOptions={
            method:"GET",
            headers:{
                Accept:"application/json",
                "Content-Type":"application/json; charset=utf-8",
            },
        };
        return fetch("/api/ai-series-conf",getAiConfOptions)
            .then((res)=>{
                if(!res.ok){
                    throw res;
                }
                return res.json();
            })
            .catch((err)=>{
                throw err;
            });
    },
    create(data){
        const createAiConfOptions={
            method:"POST",
            headers:{
                Accept:"application/json",
                "Content-Type":"application/json; charset=utf-8",
            },
            body:JSON.stringify(data),
        };
        return fetch("/api/ai-series-conf",createAiConfOptions)
            .then((res)=>{
                if(!res.ok){
                    throw res;
                }
                return res.json();
            })
            .catch((err)=>{
                throw err;
            });
    },
    delete(id){
        const deleteAiConfOptions={
            method:"DELETE",
            headers:{
                Accept:"application/json",
                "Content-Type":"application/json; charset=utf-8",
            },
            body:JSON.stringify({id:id}),
        };
        return fetch("/api/ai-series-conf",deleteAiConfOptions)
            .then((res)=>{
                if(!res.ok){
                    throw res;
                }
                return res.json();
            })
            .catch((err)=>{
                throw err;
            });
    },
    echo(url){
        const echoAiConfOptions={
            method:"POST",
            headers:{
                Accept:"application/json",
                "Content-Type":"application/json; charset=utf-8",
            },
        };
        return fetch(`${url}/api/uploads`,echoAiConfOptions)
            .then((res)=>{
                if(!res.ok){
                    throw res;
                }
                return res.json();
            })
            .catch((err)=>{
                throw err;
            });
    }
}

export default aiConf;