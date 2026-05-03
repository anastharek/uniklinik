import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import "./app.css";

// function ScanPopup({scanResult,setScanning}) {
//   const [qrData, setQrData] = useState(null);
//   return (
//     <div className="App">
//       <header className="scan-area">
//         <div className="QRScanner">
//         <QrReader
//         onResult={(result, error) => {
//           if (!!result) {
//             if(!isNaN(parseInt(result))){
//               scanResult(parseInt(result))
//             }
//           }
//         }}
//         //videoContainerStyle={{ width: '300px',}}
//         //containerStyle={{width: '300px',margin:5,padding:10,border:'2px solid gold'}}
//         videoStyle={{ maxWidth: '500px',height:'500px',}}
//         ViewFinder={()=>(<div style={{width:500}}></div>)}
//       />

//          <button onClick={()=>setScanning(null)} className='d-block m-auto otjs-button otjs-button-red'> Close</button>
//         </div>
//       </header>
//     </div>
//   );
// }

// file = Html5QrcodePlugin.jsx
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

const qrcodeRegionId = "html5qr-code-full-region";

// Creates the configuration object for Html5QrcodeScanner.
const createConfig = (props) => {
  let config = {};
  if (props.fps) {
    config.fps = props.fps;
  }
  if (props.qrbox) {
    config.qrbox = props.qrbox;
  }
  if (props.aspectRatio) {
    config.aspectRatio = props.aspectRatio;
  }
  if (props.disableFlip !== undefined) {
    config.disableFlip = props.disableFlip;
  }
  return config;
};

const ScanPopup = (props) => {
  useEffect(() => {
    // when component mounts
    const config = createConfig(props);
    const verbose = props.verbose === true;
    // Suceess callback is required.
    if (!props.qrCodeSuccessCallback) {
      throw "qrCodeSuccessCallback is required callback.";
    }
    const html5QrcodeScanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      config,
      verbose
    );
    html5QrcodeScanner.render(
      props.qrCodeSuccessCallback,
      props.qrCodeErrorCallback
    );

    // cleanup function when component will unmount
    return () => {
      html5QrcodeScanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  const handleClose=()=>{
   props.setScanning(false);
  }
  return (
  
      <header className="scan-area">
        <div className="qr-area">
          <div id={qrcodeRegionId} />
        </div>
        <button onClick={handleClose} style={{width:'max-content',margin:'20px auto',display:'block'}} className="btn btn otjs-button  btn-danger">Close</button>
      </header>
  );
};

export default ScanPopup;
