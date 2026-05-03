const aiautoRouter = {
    get(){
        const getAiConfOptions={
            method:"GET",
            headers:{
                Accept:"application/json",
                "Content-Type":"application/json; charset=utf-8",
            },
        };
        return fetch("/api/ai-autorouter",getAiConfOptions)
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
        };
        return fetch(`/api/ai-autorouter/${id}`,deleteAiConfOptions)
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

export default aiautoRouter;