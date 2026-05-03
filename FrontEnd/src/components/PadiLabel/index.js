import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";

const PadiLabel = ({data=[]}) => {
    const {pathname} = useLocation();
    const [loading, setLoading] = useState(true);
    const [currentData, setCurrentData] = useState(data[0]||{});
    useEffect(()=>{
        const lastPathSegment = pathname.split('/').filter(Boolean).slice(-1)[0];
        const matchedData = data.find(item => item.path === lastPathSegment);
        if(matchedData){
            setCurrentData(matchedData);
        }
        const container = document.getElementById('main');
        if(container){
            container.style.padding = '20px';
        }
        return () => {
            if(container && !pathname.includes('padi-label')){
                container.style.padding = '3rem';
            }
        };
    },[pathname,data])
    return(
        <>
        {loading && <div>Loading {currentData.label||"Padi Label"}...</div>}
        <iframe 
        title={currentData.label||"Padi Label"}
        onLoad={() => setLoading(false)}
        src={currentData.url||"https://padilabeller.padimedical.com/"}
        allow="fullscreen"
        style={{width: '100%', height: 'calc(100vh - 50px)', border:'1px solid #ccc'}}
        ></iframe>
        </>
    )
}
export default PadiLabel;