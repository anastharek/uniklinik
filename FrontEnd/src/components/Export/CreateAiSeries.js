import React, { useEffect, useMemo } from "react";
import axios from "axios"
import { Spinner, ButtonGroup,Dropdown } from "react-bootstrap"
import { toast } from "react-toastify";

const CreateAiSeries = ({urls=[],series=[],SeriesDescription,studyID,modality,refresh}) => {
    const [loading, setLoading] = React.useState(false);
    const ref=React.useRef(null);

    useEffect(() => {
      if(localStorage.getItem(`${series}-${studyID}`)){
        setLoading(true);
        fetchStatus();
      }
      return ()=>{
        if(ref.current){
          clearTimeout(ref.current);
        }
      }
    },[]);


    const makeCall = async (url,name) => { 
      await axios.post('/api/report/ai-series',{
        url,series,studyID,name,SeriesDescription,modality
      })
      localStorage.setItem(`${series}-${studyID}`,true);
      setLoading(true);
      fetchStatus();
    }

    const fetchStatus = async () => {
      try {
        let res = await axios.get(
          `/api/report/ai-series/done/${series}/${studyID}`
        );
        if (res.data) {
          if(localStorage.getItem(`${series}-${studyID}`)){
            toast.success("AI Series Generated Successfully");
            localStorage.removeItem(`${series}-${studyID}`);
          }
          
          ref.current = null;
          refresh();
          return;
        }else{
         ref.current=setTimeout(fetchStatus, 5000);
        }
      } catch (e) {}
    };

    const menu=useMemo(()=>{
        return urls.map((item,index)=><Dropdown.Item key={index} onClick={()=>makeCall(item.url,item.name)}>{item.name}</Dropdown.Item>)
    },[urls])
    return (
      <>
        <Dropdown  as={ButtonGroup}>
          <Dropdown.Toggle
            variant="button-dropdown-orange"
            className="button-dropdown button-dropdown-orange w-10"
            id="dropdown-basic"
            disabled={loading}
          >
            {loading ? (
              <div className="d-flex align-items-center justify-content-center">
                <Spinner size="sm" style={{ borderWidth: 1.5 }} />
                <span className="ms-1 text-sm">Generating...</span>
              </div>
            ) : (
              " Create AI Series"
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu className="mt-2 border border-dark border-2">
            {menu}
          </Dropdown.Menu>
        </Dropdown>
      </>
    );
}

export default CreateAiSeries;