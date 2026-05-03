import { useState } from "react";
const PadiLabelPublic = () => {
    const [loading, setLoading] = useState(true);

    return(
        <>
        {loading && <div>Loading Padi Label...</div>}
        <iframe 
        title="Padi Label"
        onLoad={() => setLoading(false)}
        src="https://lvolabeller.padimedical.com/" 
        allow="fullscreen"
        style={{width: '100vw', height: '100vh', border:'1px solid #ccc'}}
        ></iframe>
        </>
    )
}
export default PadiLabelPublic;