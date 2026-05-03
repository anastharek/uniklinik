import React, { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { useLocation, useParams } from "react-router-dom";
import Logo from "../../assets/images/Padimedical.png"; //tukar report template - logo customer
import { useSelector } from "react-redux";
import "./para.css";
import ActionBoutonView from "../CommonComponents/RessourcesDisplay/ActionButtonView";
import AssignDoctor from "../CommonComponents/AssignDoctor/AssignDoctor";
import GeneratePDF from "./PDFGenerator/ReportPDF";
import calculateAge from "../../utils/ageCalculator";
import moment from "moment";
import pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { upladToDicom } from "../../utils/uploadPdftoDicom";
import { toast } from "react-toastify";

const FormateDataForTable = (data) => {
  if (!data) return null;
  let parseData = JSON.parse(data);
  if (parseData?.data?.length > 1) {
    let temptableData = parseData.data.map((element) => {
      let rowData = parseData?.headers?.map((header) => {
        return element[header] || "";
      });
      return rowData;
    });
    return { headers: parseData.headers, data: temptableData };
  }
  return null;
};

const GetTableHTML = ({ data }) => {
  const tableData = useMemo(() => {
    return FormateDataForTable(data);
  }, [data]);

  if (!tableData) return null;
  return (
    <div className="d-flex justify-content-center">
      <table class="table table-bordered">
        <thead>
          <tr>
            {tableData.headers.map((text) => (
              <th scope="col">{text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.data.map((element) => {
            return (
              <tr>
                {element.map((text) => (
                  <td>{text}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const AddendumView = ({
  signature,
  text,
  addendum_at,
  addendumby,
  image,
  index,
  practicing_no,
  table,
}) => {
  const Text = useMemo(() => {
    let tempText = text;
    let splitBy;
    try {
      if (tempText.indexOf("IMPRESSION:") != -1) splitBy = "IMPRESSION:";
      else if (tempText.indexOf("Impression:") != -1) splitBy = "Impression:";
      else if (tempText.indexOf("impression:") != -1) splitBy = "impression:";
      tempText = tempText?.split(splitBy);
      return { text1: tempText[0], text2: splitBy + tempText[1] };
    } catch {
      return { text1: null, text2: null };
    }
  }, [text]);
  return (
    <div style={{maxWidth:'800px'}} className="container-fluid">
      <div style={{ marginTop: 20 }}>
        <p style={{ textAlign: "center", fontWeight: "bold" }}>
          ADDENDUM v{index}
        </p>
        <br />
        <br />
        <div style={{ maxWidth: "max-content", lineHeight: "16px" }}>
          {Text.text1 && Text.text2 && (image || table) ? (
            <>
              <p
                dangerouslySetInnerHTML={{
                  __html: Text?.text1?.replaceAll("\n", "<br/>"),
                }}
              ></p>
              
              <GetTableHTML data={table} />
              <p
                dangerouslySetInnerHTML={{
                  __html: Text?.text2
                    ?.replaceAll("\n", "<br/>")
                    .split("Reported by:")[0],
                }}
              ></p>
              
              <p>Reported by:</p>
              <br />
              {signature ? (
                <img style={{ width: "200px" }} src={signature} />
              ) : null}
              <br />
              <p
                dangerouslySetInnerHTML={{
                  __html: Text?.text2
                    ?.replaceAll("\n", "<br/>")
                    ?.split("Reported by:")[1]
                    ?.replace("<br/>", ""),
                }}
              ></p>
              
            </>
          ) : (
            <>
              <GetTableHTML data={table} />
              <p
                dangerouslySetInnerHTML={{
                  __html: text
                    ?.replaceAll("\n", "<br/>")
                    .split("Reported by:")[0],
                }}
              ></p>
              
              <p>Reported by:</p>
              <p
                dangerouslySetInnerHTML={{
                  __html: text
                    ?.replaceAll("\n", "<br/>")
                    ?.split("Reported by:")[1]
                    ?.replace("<br/>", ""),
                }}
              ></p>
              <br />
              {signature ? (
                <img style={{ width: "200px" }} src={signature} />
              ) : null}
              <br />
            </>
          )}
        </div>
      </div>
      <br />
      {/* <p>Computer generated, no signature required.</p> */}
      {addendumby ? (
        <p>
          Addendum of this report is done on {addendum_at} by {addendumby} (
          {practicing_no})
        </p>
      ) : null}
      {image && (
                <>
                  <img
                    style={{ width: "500px", margin: "auto", display: "block" }}
                    src={image}
                  />
                  <br />
                  <br />
                </>
              )}
    </div>
  );
};

const formatDate = (str) => {
  if (!str) return null;
  return str?.slice(6, 8) + "-" + str?.slice(4, 6) + "-" + str?.slice(0, 4);
};

const ViewReport = () => {
  const { id } = useParams();
  const { study_date, StudyInstanceUID, preview } = useLocation();
  const [data, setData] = useState({
    patient_name: null,
    patient_id: null,
    tag: null,
    study_type: null,
    text: null,
    createdAt: null,
    study_date: null,
    created_by: null,
    signature: null,
    image: null,
    addendumby: null,
    addendum_at: null,
    practicing_no: null,
    accesor: null,
    table: null,
    usg_no: null,
    PatientBirthDate: null,
    ReferringPhysicianName: null,
    
  });
  const [text, setText] = useState({ text1: null, text2: null });
  const [available, setAvailable] = useState(true);
  const [addendum, setAddendun] = useState([]);
  const [patient_data, setPatientData] = useState({});

  useEffect(() => {
    fetch(`/api/studies/${id}?expand`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res
        let PatientBirthDate = data?.PatientMainDicomTags?.PatientBirthDate;
        const year = PatientBirthDate?.slice(0, 4);
        const month = PatientBirthDate?.slice(4, 6) - 1;
        const day = PatientBirthDate?.slice(6, 8);
        setPatientData({
          Age: calculateAge(new Date(year, month, day)),
          PatientAge: data?.PatientMainDicomTags?.PatientAge,
          PatientSex: data?.PatientMainDicomTags?.PatientSex,
          OtherPatientIDs: data?.PatientMainDicomTags?.OtherPatientIDs,
          PatientBirthDate: data?.PatientMainDicomTags?.PatientBirthDate,
          ReferringPhysicianName:data?.MainDicomTags?.ReferringPhysicianName || data?.PatientMainDicomTags?.ReferringPhysicianName,
        });
        if(res.MainDicomTags.StudyDate){
          setData(prev=>({...prev,study_date:res.MainDicomTags.StudyDate}))
        }
      });
  }, [data.patient_id]);

  const roles = useSelector((state) => state.PadiMedical.roles);

  useEffect(() => {
    const setWindowSize = () => {
    window.scrollTo(0, 0);
    if (window.innerWidth > 500) {
    document.querySelector("#main").style.minWidth = "600px";
    document.querySelector("#main").style.maxWidth = "max-content";
    }

    }
    document.addEventListener("resize", setWindowSize);
    setWindowSize();
    fetchReport();
    return () => {
      let element = document.querySelector("#main");
      if (element) element.style.width = "none";
      document.removeEventListener("resize", setWindowSize);
    };
  }, []);

  const fetchReport = () => {
    fetch("/api/patient-report?preview=true", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        studyid: id,
        preview: preview,
      }),
    })
      .then((res) => {
        if (res.status == 200) return res.json();
        else throw "Bad req";
      })
      .then((res) => {
        setData({
          patient_name: res?.report_data?.patient_name || null,
          Logo: res?.report_data?.Logo || null,
          tag: res?.report_data?.tag || null,
          study_type: res?.report_data?.study_type || null,
          text: res?.report_data?.text || null,
          createdAt: res?.report_data?.createdAt
            ? moment(res?.report_data?.createdAt).format('DD/MM/YYYY hh:mm A')
            : "",
          patient_id: res?.report_data.patient_id,
          study_date: res?.report_data?.study_date,
          created_by: res?.report_data.created_by,
          signature: res?.report_data?.signature,
          image: res?.report_data?.image,
          addendum_at: res?.report_data?.addendum_at,
          addendumby: res?.report_data?.addendumby,
          practicing_no: res?.report_data?.practicing_no,
          accesor: res?.report_data?.accesor,
          table: res?.report_data?.table,
          usg_no:
            res.all_addendum.length === 0
              ? res?.report_data?.usg_no
              : res?.all_addendum?.[0]?.usg_no,
        });
        let tempText = res?.report_data?.text;
        let splitBy;
        try {
          if (tempText.indexOf("IMPRESSION:") != -1) {
            splitBy = "IMPRESSION:";
          } else if (tempText.indexOf("Impression:") != -1) {
            splitBy = "Impression:";
          } else if (tempText.indexOf("impression:") != -1) {
            splitBy = "impression:";
          }

          tempText = tempText?.split(splitBy);
          setText({ text1: tempText[0], text2: splitBy + tempText[1] });
        } catch {
          setText({ text1: null, text2: null });
        }
        setAddendun(res?.all_addendum || []);
      })
      .catch(() => {
        setAvailable(false);
      });
  };
  if (!available) {
    return (
      <div
        style={{
          minHeight: 400,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        className="mb-5"
      >
        <h2>Report not available yet !!</h2>
      </div>
    );
  }

  const GeneratePDFStart = (preview) => {
    let {
      text,
      image,
      table,
      signature,
      created_by,
      createdAt,
      practicing_no,
      addendumby,
      addendum_at,
    } = addendum[0] || data;

    let formateTable = FormateDataForTable(table);
    let tempTableData = [];
    if (formateTable) {
      tempTableData.push(
        formateTable.headers.map((element) => {
          return { bold: true, text: element };
        })
      );
      formateTable.data.forEach((arr) => {
        tempTableData.push(arr);
      });
    } else {
      tempTableData = [[]];
    }
    let splitBy;
    let tempText = text;
    let text1 = null;
    let text2 = null;
    try {
      if (tempText.indexOf("IMPRESSION:") !== -1) {
        splitBy = "IMPRESSION:";
      } else if (tempText.indexOf("Impression:") !== -1) {
        splitBy = "Impression:";
      } else if (tempText.indexOf("impression:") !== -1) {
        splitBy = "impression:";
      }

      tempText = tempText?.split(splitBy);
      text1 = tempText[0];
      text2 = splitBy + tempText[1];
    } catch {}
    // console.log({ st: data.study_date, createdAt });
    let result=GeneratePDF({
      logo:data.Logo||Logo,
      patient_name:data.patient_name,
      patient_id:data.patient_id,
      study_type:data.study_type,
      study_date:formatDate(data.study_date),
      text1:text1,
      text2:text2,
      image:image,
      table:tempTableData,
      text:text,
      signature:signature,
      addendumby:created_by || addendumby,
      addendum_at:addendum_at || createdAt,
      practicing_no:practicing_no,
      accesor:data.accesor, //tambah data.accessor
      is_addebdum:addendum_at,
      PatientSex:patient_data.PatientSex,
      OtherPatientIDs:patient_data.OtherPatientIDs,
      usg_no:data.usg_no,
      type:preview,
      age:patient_data.Age, 
      PatientBirthDate:formatDate(patient_data.PatientBirthDate), 
      ReferringPhysicianName:patient_data.ReferringPhysicianName,    
  });
  if(preview=='blob'){
    result.then((res)=>{ 
        upladToDicom(res,data.patient_name,id)
        .then((res)=>{
          toast.success('PDF added to Dicom')
        })
        .catch((err)=>{
          toast.error('Failed to add PDF to Dicom')
        })
    })
  }
  };


  return (
    <>
      <>
        <div style={{maxWidth:800,wordBreak:'break-word'}} className="d-flex justify-content-evenly align-items-center button-section-report">
          {roles.download_report && <Button
            className="button-dropdown button-dropdown-orange  btn btn-button-dropdown-orange"
            style={{
              width: "9rem",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              backgroundColor: "rgb(76, 188, 210)",
            }}
            onClick={GeneratePDFStart}
          >
            {" "}
            Download{" "}
          </Button>}
          {roles.send_report_dicom && 
          <Button
            className="button-dropdown button-dropdown-orange  btn btn-button-dropdown-orange"
            style={{
              width: "9rem",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              backgroundColor: "rgb(76, 188, 210)",
            }}
            onClick={()=>GeneratePDFStart("blob")}
          >
            {" "}
            Add to Dicom{" "}
          </Button>}
          <br />
          {roles.print_report && <Button
            className="button-dropdown button-dropdown-orange  btn btn-button-dropdown-orange"
            style={{
              width: "9rem",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              backgroundColor: "rgb(76, 188, 210)",
            }}
            onClick={()=>GeneratePDFStart('preview')}
          >
            {" "}
            Print{" "}
          </Button>}
          <br />
          <ActionBoutonView
            //tukar link - osimis viewer
            StudyInstanceUID={StudyInstanceUID}
            wsi_link={
              "https://strokesvr.padimedical.com/wsi/app/index.html?series=" +
              id  //For rishab to adds on - add SeriesOrthancID
            }
            osimis_link={
              "https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" +
              id
            }
            OhifLink={"/viewer-ohif/viewer/" + StudyInstanceUID}
            radiant={"radiant://?n=pstv&v=0020000D&v=%22" + StudyInstanceUID}
            osirix={
              "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
              id +
              "/archive"
            }
            downloadzip={
              "https://strokesvr.padimedical.com/studies/" + id + "/archive"
            }
          />
          {roles.can_assign_doctors ? (
            <AssignDoctor
              study_id={id}
              patient_name={data.patient_name}
              patient_id={data.patient_id}
              accesor={data.accesor}
              study_type={data.study_type}
              study_date={data.study_date}
              className="button-dropdown button-dropdown-blue w-10  btn"
            />
          ) : null}
        </div>
        <div
          id="area"
          style={{ lineHeight: "14px", fontSize: 14, color: "black" }}
          className="mb-6 view-report-area"
        >
          <br />
          <br />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img height={120} src={data.Logo||Logo} />{" "}
            {/*tukar report template - change logo size */}
          </div>
          <br />
          <br />
          <div style={{ marginTop: 10 }}>
            <div className="box">
              <div className="col-12">
              <p>Patient Name : {data.patient_name?.replaceAll("^", " ")}</p>
              <p>Study Modality : {data.study_type}</p>
              </div>
              <div className="col-6">
              <p>Patient ID : {data.patient_id}</p>
              {patient_data.PatientSex && (
                  <p>Gender : {patient_data.PatientSex}</p>
              )}
              {/* {patient_data.Age && (
                  <p>Patient Age : {patient_data.Age}</p>
              )} */}
              {/* {patient_data.PatientBirthDate && (
                  <p>Patient DOB : {" "}
                  {patient_data?.PatientBirthDate?.slice(6, 8) +
                    "-" +
                    patient_data?.PatientBirthDate?.slice(4, 6) +
                    "-" +
                    patient_data?.PatientBirthDate?.slice(0, 4)}</p>
              )} */}
              
              {patient_data.ReferringPhysicianName && (
                  <p>Reference Physician : {patient_data.ReferringPhysicianName}</p>
              )}
              </div>
              <div className="col-6">
                
                <p>
                  Study Date :{" "}
                  {data?.study_date?.slice(6, 8) +
                    "-" +
                    data?.study_date?.slice(4, 6) +
                    "-" +
                    data?.study_date?.slice(0, 4)}
                </p>
                {data.usg_no && (
                  <p>Study No. : {data.usg_no}</p>
              )}
              {data.accesor && (
                  <p>Study No. : {data.accesor}</p>
              )}
              {patient_data.OtherPatientIDs && (
                  <p>NRIC : {patient_data.OtherPatientIDs}</p>
                )}
              {/* </div>
              <div className="col-6">
                
                <p>
                  Date :{" "}
                  {data?.study_date?.slice(6, 8) +
                    "-" +
                    data?.study_date?.slice(4, 6) +
                    "-" +
                    data?.study_date?.slice(0, 4)}
                </p>
                <p>X-ray No. : {data.accesor}</p> 
                <p>
                  DOB :{" "}
                  {patient_data?.PatientBirthDate?.slice(6, 8) +
                    "-" +
                    patient_data?.PatientBirthDate?.slice(4, 6) +
                    "-" +
                    patient_data?.PatientBirthDate?.slice(0, 4)}
              </p>
                {patient_data.OtherPatientIDs && (
                  <p>NRIC : {patient_data.OtherPatientIDs}</p>
                )}
                 */}

                {/* <div className="col-6">
                <p>Patient Name : {data.patient_name?.replaceAll("^", " ")}</p>
                <p>MRN : {data.patient_id}</p>
              </div>
              <div className="col-6">
                <p>
                  Study Date :{" "}
                  {data?.study_date?.slice(6, 8) +
                    "/" +
                    data?.study_date?.slice(4, 6) +
                    "/" +
                    data?.study_date?.slice(0, 4)}
                </p>
                <p>X-ray No. : {data.accesor}</p> tambah accesion numb */}
              </div>
              <div className="col-6">
              </div>
              
            </div>
            {addendum.map((element, index) => (
              <AddendumView {...element} index={addendum.length - index} />
            ))}
            <br />
            <br />
            {addendum.length !== 0 ? (
              <>
                <p style={{ textAlign: "center", fontWeight: "bold" }}>
                  ORIGINAL REPORT
                </p>
                <br />{" "}
              </>
            ) : null}
            <div style={{ maxWidth: 550, lineHeight: "16px" }}>
              {text.text1 && text.text2 && (data.image || data.table) ? (
                <>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: text?.text1?.replaceAll("\n", "<br/>"),
                    }}
                  ></p>
                  {data.image && (
                    <>
                      <img
                        style={{
                          width: "500px",
                          margin: "auto",
                          display: "block",
                        }}
                        src={data.image}
                      />
                      <br />
                      <br />
                    </>
                  )}
                  <GetTableHTML data={data.table} />
                  <p
                    dangerouslySetInnerHTML={{
                      __html: text.text2
                        ?.replaceAll("\n", "<br/>")
                        .split("Reported by:")[0],
                    }}
                  ></p>
                  
                  <p>Reported by:</p>
                  <br />
                  {data.signature ? (
                    <img style={{ width: "200px" }} src={data.signature} />
                  ) : null}
                  <br />
                  <p
                    dangerouslySetInnerHTML={{
                      __html: text.text2
                        ?.replaceAll("\n", "<br/>")
                        ?.split("Reported by:")[1]
                        ?.replace("<br/>", ""),
                    }}
                  ></p>
                  
                </>
              ) : (
                <>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: data?.text
                        ?.replaceAll("\n", "<br/>")
                        .split("Reported by:")[0],
                    }}
                  ></p>
                  
                  <p>Reported by:</p>
                  <br />
                  {data.signature ? (
                    <img style={{ width: "200px" }} src={data.signature} />
                  ) : null}
                  <br />
                  <p
                    dangerouslySetInnerHTML={{
                      __html: data?.text
                        ?.replaceAll("\n", "<br/>")
                        ?.split("Reported by:")[1],
                    }}
                  ></p>
                  
                </>
              )}
            </div>
          </div>

          <br />
          {/* <p>Computer generated, no signature required.</p> */}
          <p>
            This report is created on {data.createdAt} transcribed by{" "}
            {data.created_by} ({data.practicing_no})
          </p>
        </div>
      </>
    </>
  );
};

export default ViewReport;
