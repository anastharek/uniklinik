import { useState } from "react";
import "react-bootstrap-typeahead/css/Typeahead.css";
import RequestFeatureModal from "./RequestFeatureModal";
const RequestFeature = ({
  username,
  className = "dropdown-item",
  study_id,
  btnText='Request Feature',
  canDownloadpdf=false,
}) => {
  const [show, setShow] = useState(false);
 
  const toggle = () => {
    setShow(prev=>!prev);
  };

  return (
    <>
    {show?<RequestFeatureModal
      username={username}
      study_id={study_id}
      setShow={setShow}
      canDownloadpdf={canDownloadpdf}
    />:null}
    <div style={{position:'static'}} className="d-flex flex-column ">
      <button onClick={toggle} className={className} type="button">
        {btnText}
      </button>
    </div>
    </>
  );
};

export default RequestFeature;
