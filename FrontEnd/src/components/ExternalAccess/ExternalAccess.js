import React, { useState } from "react";
import apis from "../../services/apis";
import Lock from "@material-ui/icons/Lock";
import padilogo from "../../assets/images/padi-logo-transparent.png";
import { useHistory } from "react-router-dom";
import cryptography from "../../services/cryptography";
export const ExternalAccess = ({ params }) => {
  let { viewer, StudyInstanceId } = params;
  const [password, setPassword] = useState("");
  const history=useHistory();
  const openWSI=()=>{
    let study_id=StudyInstanceId;
    if(study_id){
      fetch('/api/studies/'+study_id,{
        method:'GET'
    })
    .then(res=>res.json())
    .then(res=>{
      let url="https://strokesvr.padimedical.com/wsi/app/viewer.html?series="+res?.Series?.[0];
      window.location.href=url;
    })
    }
  
}
  async function submit() {
    apis.authentication
      .loginExternal(StudyInstanceId.split("---")[0], password) //change by rishabh 3.3.2023
      .then(async(req) => {
        if (req.ok) {
          if (['osimis','ohif','download','view','wsi','stone'].includes(viewer)){
            StudyInstanceId=await cryptography.decrypt(StudyInstanceId);
          }
          let redirect;
          switch (viewer) { 
            case "wsi": //For rishab to adds on - add SeriesOrthancID
              // redirect = `${window.location.protocol}//${window.location.host}/wsi/app/index.html?series=${StudyInstanceId}`;
              // break;
              return openWSI();
            case "stone":
              redirect = `https://fastpacsviewer.anzverse.com/stone-webviewer/index.html?study=${StudyInstanceId.split("---")[0]}`;
              break;
            case "ohif":
              redirect = `${window.location.protocol}//${window.location.host}/viewer-ohif/viewer/dicomweb?StudyInstanceUIDs=${StudyInstanceId.split("---")[0]}`;
              break;
            case "osimis": //tukar link - osimis viewer
              redirect = `https://fastpacsosimis.anzverse.com/osimis-viewer/app/index.html?study=${StudyInstanceId}`; //this is orthanc id
              break;
            case "download":
              redirect = `https://strokesvr.padimedical.com/studies/${StudyInstanceId}/archive`;
              break;
            case "download-light": //change by rishabh 3.3.2023
              redirect = `${
                window.location.protocol
              }//strokesvr.padimedical.com/studies/${
                StudyInstanceId.split("---")[1]
              }/archive`;
              break;
            case "view":
              redirect = `https://fastpacsosimis.anzverse.com/osimis-viewer/app/index.html?study=${StudyInstanceId}`;
              break;
            default:
              alert("Wrong viewer passed to URL");
              return;
          }
          //window.location.replace(redirect);
          if(viewer.includes('download')){
            let element=document.querySelector('#download');
            if(element){
              element.href=redirect;
              element.click();
            }
            return;
          }
          history.push('/external-page',{link:redirect});
        } else {
          alert("Wrong password");
        }
      }).catch((error) => {
        console.log(error);
      });
  }

  return (
    <div className="vertical-center authentification">
      <div className="text-center" id="login">
        {/* <div className='shadow block-title block block-400'>
          <div className='row'>
            <div className='col'>
              PadiMedicalv4.1
            </div>
          </div>
        </div> */}
        <img
          src={padilogo}
          id="logo-login"
          height="180"
          text-align="center"
        ></img>
        <div className="block-content block block-400">
          <h3 className="text-center">Enter your access code</h3>
          <br />
          <form id="login-form">
            <fieldset>
              <label>
                <Lock />
              </label>
              <input
                type="password"
                placeholder="enter your access code"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </fieldset>
            <br />
            <button
              name="connexion"
              type="button"
              className="login-btn"
              onClick={submit}
            >
              {/* {viewer === "download" ? "Click Here" : "Click Here"} */}
              {viewer.includes("download")? "Download" : "View"}
            </button>
          </form>
          <a style={{width:0,height:0,visibility:'hidden'}} id="download" download></a>
        </div>
      </div>
    </div>
  );
};
