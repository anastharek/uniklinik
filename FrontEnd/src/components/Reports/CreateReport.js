import React, { useEffect, useState, Suspense } from "react";
import Logo from "../../assets/images/fast-logo.png"; //tukar report template - logo customer (FASTPACS default)
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import dateFormator from "../../utils/dateFormator";
import Select from "react-select";
import axios from "axios";

import {
  CHEST_X_RAY,
  MAMMOGRAM,
  US_ABDOMEN_PELVIS_MALE,
  US_ABDOMEN_PELVIS_FEMALE,
  CERVICAL,
  ABDOMINAL,
  KUB_XRAY,
  SPINE_XRAY,
  KNEE_XRAY,
  CHEST_RADIOGRAPH,
  LIMB_XRAY,
  CT_UROGRAPHY,
  CT_ABDOMEN,
  CTPA_PULMONARY,
  PARANASAL_SINUS,
  PLAIN_CT_BRAIN,
  HRCT_THORAX,
  CECT_RENAL,
  US_TESTIS_BILATERAL,
} from "../../report-template/index";
import ActionBoutonView from "../CommonComponents/RessourcesDisplay/ActionButtonView";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import socket from "../../socket/socket";
import "./typing-effect.css";
import Toggle from "react-toggle";
import SweetAlert from "react-bootstrap-sweetalert";
import ReportPoopup from "./ReportPopup/ReportPopup";
import { Avatar, Tooltip } from "@material-ui/core";
import apis from "../../services/apis";
import LogoData, { DEFAULT_LOGO_OPTION } from "./LogoData";
import moment from "moment";
const DynamicTable = React.lazy(() => import("./DynamicTable/DynamicTable"));

const getTodayDate = () => {
  return moment().format('DD/MM/YYYY hh:mm A')
};

const Typing = ({ id }) => {
  const [text, setText] = useState(null);
  let typingTime = new Date();
  useEffect(() => {
    socket.on(id, (payload) => {
      if (payload) {
        setText(
          payload.map((element) => {
            return "  Dr " + element[0].toUpperCase() + element.slice(1);
          })
        );
      } else {
        setText(null);
      }
      typingTime = new Date();
    });
    let interval = setInterval(() => {
      if ((new Date().getTime() - typingTime.getTime()) / 1000 > 1) {
        setText(null);
      }
    }, [1000]);
    return () => {
      clearInterval(interval);
      socket.off(id);
    };
  }, []);
  return (
    <h6
      style={{ textAlign: "right", visibility: text ? "visible" : "hidden" }}
      className="text-primary "
    >
      {text} is typing <span className="dot1">.</span>
      <span className="dot2">.</span>
      <span className="dot3">.</span>
    </h6>
  );
};

const CreateReport = () => {
  const [editing, setEditing] = useState(false);
  const { pid, pname, study_type, study_date, StudyInstanceUID, accessor } =
    useLocation();
  const [isfinalize, setFinalize] = useState(false);
  const [data, setData] = useState({
    logo: Logo, //tukar report template - default logo = FAST logo (can be overridden by the logo picker)
    patient_name: pname,
    tag: "",
    study_type: study_type,
    study_date: study_date,
    patient_id: null,
    text: null,
    signature: null,
    image: null,
    table: null,
    usg: null,
    logoText: null,
    type:null,
  });
  const { id } = useParams();
  const roles = useSelector((state) => state.PadiMedical.roles);
  const [showAlert, setShowAlert] = useState(false);
  const [viewingAlert, setViewingAlert] = useState({
    first_time_show: false,
    canShow: false,
    confirmFinalize: false,
    confirmDraft: false,
    confirmAddendum: false,
  });
  const [tags, setTags] = React.useState([]);
  const [user, setUser] = useState([]);
  const [showtable, setShowTable] = useState(false);
  const [prev_report, setPrevReport] = useState([]);
  const [selected_prev, setSelectedPrev] = useState("");
  const [prevData, setPrevData] = useState(null);
  const history = useHistory();
  const [viewer, setViewer] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [templates, setTemplates] = useState([]);
  let currentClick = null;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector("#main").style.width = "max-content";
    fetchReport();
    fetchPreviousReport();
    fetchTemplate();
    fetch("/api/users/radiologist")
      .then((res) => res.json())
      .then((res) => setUser(res))
      .catch((err) => console.log("err"));
    fetch("/api/roles-name/all")
      .then((res) => res.json())
      .then(setAllRoles);
    socket.emit("viewing-report-enter", { id });
    socket.on("viewing-report" + id, updateViewers);
    return () => {
      stop_type();
      let element = document.querySelector("#main");
      if (element) element.style.width = "none";
      socket.emit("viewing-report-leave", { id });
      socket.off("viewing-report" + id , updateViewers);
    };
  }, []);

  useEffect(() => {
    let timer = setInterval(() => {
      if (!isfinalize && data.text) {
        handleDraft(undefined, false);
      } else {
        clearInterval(timer);
      }
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, [isfinalize, data, roles, tags]);

  useEffect(() => {
    try {
      if (data.table) {
        let temp = JSON.parse(data.table);
        if (temp?.headers?.length) setShowTable(true);
      }
    } catch {}
  }, [data.table]);

  useEffect(() => {
    if (!viewingAlert.first_time_show && viewer.length > 1) {
      setViewingAlert((prev) => ({
        ...prev,
        canShow: true,
        first_time_show: true,
      }));
    }
    if (!viewingAlert.first_time_show && viewer.length == 1) {
      setViewingAlert((prev) => ({ ...prev, first_time_show: true }));
    }
  }, [viewer, viewingAlert]);


  const updateViewers = (data) => {
    setViewer(data);
  };

  const fetchPreviousReport = () => {
    fetch(`/api/get-previos-report/${pid}`)
      .then((res) => res.json())
      .then((res) => setPrevReport(res))
      .catch((err) => console.log(err));
  };

  const fetchTemplate = () => {
    apis.reportTemplate.getAll().then((res) => {
      setTemplates(res);
    })
    .catch((err) => console.log(err));
  }
  const handlePrevReport = (e) => {
    setSelectedPrev(e.target.value);
  };

  const showPopup = () => {
    if (selected_prev !== "") {
      setPrevData(prev_report?.filter((obj) => selected_prev == obj.id)[0]);
    } else {
      toast.error("please select previous report to show");
    }
  };

  const checkForSignature = () => {
    fetch("/api/users/profile")
      .then((res) => res.json())
      .then((res) => {
        if (!res.signature && roles.signature_compulsory) {
          setTimeout(() => {
            setShowAlert(true);
          }, 2000);
        } else {
          setData((prev) => ({
            ...prev,
            signature: res.signature,
            doctor_description: res.doctor_description,
          }));
        }
      })
      .catch((err) => console.log(err));
  };

  const fetchReport = () => {
    fetch(`/api/request-report/${id}/is_finalize`)
      .then((res) => res.json())
      .then((res) => setFinalize(res));

    fetch("/api/admin-report", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        studyid: id,
      }),
    })
      .then((res) => {
        if (res.status == 200) return res.json();
        else {
          throw "Bad req";
        }
      })
      .then((res) => {
        apis.content.getStudiesDetails(id).then((res) =>
          setData((prev) => ({
            ...prev,
            ReferringPhysicianName: res?.MainDicomTags?.ReferringPhysicianName,
            nric: res?.PatientMainDicomTags?.OtherPatientIDs,
          }))
        );
        setData((prev) => ({
          ...prev,
          patient_name: res?.patient_name || pname,
          tag: res?.tag || "",
          study_type: res?.study_type || study_type,
          study_date: res?.study_date || study_date,
          patient_id: res?.patient_id || pid,
          text: res?.text,
          image: res?.image,
          table: res?.table,
          usg_no: res?.usg_no,
          accesor: res?.accesor,
          type:res?.type,
        }));
        setTags(res?.doctors == "" ? [] : res?.doctors);
        setSelectedRoles(res?.roles == "" ? [] : res?.roles);
        setEditing(true);
        checkForSignature();
      })
      .catch((err) => {
        setData((prev) => ({ ...prev, text: "" }));
        checkForSignature();
      });
  };

  const validate = (isSave=false) => {
    let data1 = [data.patient_name, data.study_type];
    let key = ["patient name", "study type"];
    if(!isSave && roles.edit_report_type){
      key.push('type')
      data1.push(data.type)
    }
    let error = false;
    data1.map((element, index) => {
      if (element == "" || element == null) {
        error = true;
        toast.error(`${key[index]} field is required`);
      }
    });
    //tukar assign dr- enable compulsory assign dr - disble if compulsuray assign doctor not req --rishabh
    if (tags.toString().replaceAll(" ", "").length === 0) {
      toast.error("Please assign radiologist!");
      error = true;
    }

    if (data.text == "" || data.text == null) {
      toast.error("report is required !!");
      error = true;
    }

    return error;
  };

  const handleChange = (e) => {
    setData((prev) => {
      return { ...prev, [e.target.name]: e.target.value };
    });
    typing();
  };

  const handleDraft = (table_data, showAlert = true) => {
    if (!data.signature && roles.signature_compulsory) {
      setShowAlert(true);
      return;
    }
    if (!data.doctor_description && roles.doctor_description_required) {
      setShowAlert(true);
      return;
    }
    if (!validate(true)) {
      fetch("/api/create-report-draft", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        method: "POST",
        body: JSON.stringify({
          patient_name: data.patient_name,
          studyid: id,
          text: data?.text || "",
          ...data,
          patient_id: data.patient_id || pid,
          doctors: tags,
          StudyInstanceUID: StudyInstanceUID,
          accesor: accessor,
          table: table_data,
          roles: selectedRoles,
        }),
      }).then((res) => {
        if (res.status == 201) {
          fetchReport();
          showAlert && toast.success("draft report saved !!");
        } else {
          toast.error("something went wrong !!");
        }
      });
    }
  };

  const handleFinalize = (table_data) => {
    if (!data.signature && roles.signature_compulsory) {
      setShowAlert(true);
      return;
    }
    if (!data.doctor_description && roles.doctor_description_required) {
      setShowAlert(true);
      return;
    }
    let temp = data.text;
    if (data.doctor_description && temp) {
      temp = temp.split("Reported by:")[0];
      temp = temp + "Reported by:" + "\n" + data.doctor_description;
    }

    if (!validate()) {
      setFinalize(true);
      fetch("/api/create-report-final", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        method: "POST",
        body: JSON.stringify({
          ...data,
          patient_name: data.patient_name,
          studyid: id,
          text: temp || "",
          tag: "",
          created_by: roles?.firstname || roles.username,
          patient_id: data.patient_id || pid,
          practicing_no: roles?.practicing_no,
          doctors: tags || [],
          StudyInstanceUID: StudyInstanceUID,
          accesor: accessor || data.accesor,
          table: table_data,
          roles: selectedRoles,
        }),
      }).then((res) => {
        if (res.status == 201) {
          setTimeout(() => {
            fetchReport();
          }, [2000]);
          toast.success("report saved !!");
        } else {
          toast.error("something went wrong !!");
        }
      });
    }
  };

  const Addendum = (table_data) => {
    if (!data.signature && roles.signature_compulsory) {
      setShowAlert(true);
      return;
    }
    if (!data.doctor_description && roles.doctor_description_required) {
      setShowAlert(true);
      return;
    }
    let temp = data.text;
    if (data.doctor_description && temp) {
      temp = temp.split("Reported by:")[0];
      temp = temp + "Reported by:" + "\n" + data.doctor_description;
    }
    if (!validate()) {
    fetch("/api/create-report-final", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        ...data,
        patient_name: data.patient_name,
        studyid: id,
        text: temp || "",
        addendumby: roles?.firstname || roles.username,
        addendum_at: getTodayDate(),
        patient_id: data.patient_id || pid,
        practicing_no: roles?.practicing_no,
        doctors: tags || [],
        StudyInstanceUID: StudyInstanceUID,
        accesor: accessor,
        table: table_data,
        roles: selectedRoles,
      }),
    }).then((res) => {
      if (res.status == 201) {
        fetchReport();
        toast.success("report saved !!");
      } else {
        toast.error("something went wrong !!");
      }
    });
  }
  };

  async function encodeImageFileAsURL(element) {
    var file = element.target.files[0];
    // console.log(data)
    var reader = new FileReader();

    reader.onloadend = function () {
      setData((prev) => ({ ...prev, signature: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function encodePDFImageFileAsURL(element) {
    var file = element.target.files[0];
    // console.log(data)
    var reader = new FileReader();

    reader.onloadend = function () {
      setData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  }
  function arrayBufferToBase64(arrayBuffer) {
    var binary = "";
    var bytes = new Uint8Array(arrayBuffer);
    var len = bytes.byteLength;

    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return "data:image/png;base64," + btoa(binary);
  }
  async function encodeLogoImageFileAsURL(value) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      if (xhr.status === 200) {
        var arrayBuffer = xhr.response;
        var base64String = arrayBufferToBase64(arrayBuffer);
        setData((prev) => ({ ...prev, logo: base64String }));
      } else {
        console.error("Failed to load the image.");
      }
    };
    xhr.open("GET", value.img, true);
    xhr.send();
  }

  const deleteReport = () => {
    fetch("/api/admin-report", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "DELETE",
      body: JSON.stringify({
        studyid: id,
      }),
    }).then(() => {
      setData({
        patient_name: pname,
        tag: "",
        study_type: study_type,
        study_date: study_date,
        patient_id: null,
        text: null,
        signature: null,
        image: null,
      });
      fetchReport();
      toast.success("report deleted !!");
    });
  };

  const setTemplate = (e) => {
    // eslint-disable-next-line default-case
    let name=e.target.value;
    let temp = templates.filter((template) => template.name == name)[0]?.text;
    if(!temp)return;
    temp = temp.split("Reported by:")[0];
    temp = temp + "\nReported by:" + "\n" + data.doctor_description;
    return setData((prev) => ({ ...prev, text: temp }));
    switch (e.target.value) {
      case "CERVICAL": {
        let temp = CERVICAL;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }
      case "ABDOMINAL": {
        let temp = ABDOMINAL;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }
      case "CHEST_X_RAY": {
        let temp = CHEST_X_RAY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "MAMMOGRAM": {
        let temp = MAMMOGRAM;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "US_ABDOMEN_PELVIS_MALE": {
        let temp = US_ABDOMEN_PELVIS_MALE;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "US_ABDOMEN_PELVIS_FEMALE": {
        let temp = US_ABDOMEN_PELVIS_FEMALE;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "KUB_XRAY": {
        let temp = KUB_XRAY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "SPINE_XRAY": {
        let temp = SPINE_XRAY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "KNEE_XRAY": {
        let temp = KNEE_XRAY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "CHEST_RADIOGRAPH": {
        let temp = CHEST_RADIOGRAPH;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "LIMB_XRAY": {
        let temp = LIMB_XRAY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "CT_UROGRAPHY": {
        let temp = CT_UROGRAPHY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }
      case "CT_ABDOMEN": {
        let temp = CT_ABDOMEN;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "CTPA_PULMONARY": {
        let temp = CTPA_PULMONARY;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }
      case "PLAIN_CT_BRAIN": {
        let temp = PLAIN_CT_BRAIN;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "PARANASAL_SINUS": {
        let temp = PARANASAL_SINUS;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }
      case "CECT_RENAL": {
        let temp = CECT_RENAL;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }

      case "HRCT_THORAX": {
        let temp = HRCT_THORAX;
        if (data.doctor_description) {
          temp = temp.split("Reported by:")[0];
          temp = temp + "Reported by:" + "\n" + data.doctor_description;
        }
        setData((prev) => ({ ...prev, text: temp }));
        break;
      }
    }
  };

  const typing = () => {
    socket.emit("typing", { study_id: id });
  };

  const stop_type = () => {
    socket.emit("stop-typing", { study_id: id });
  };

  const getData = (data) => {
    switch (currentClick) {
      case "Draft":
        handleDraft(JSON.stringify(data));
        break;
      case "Finalize":
        handleFinalize(JSON.stringify(data));
        break;
      case "Addendum":
        Addendum(JSON.stringify(data));
        break;
      default:
        return;
    }
  };

  const Click = (e, type) => {
    e?.preventDefault();
    switch (type) {
      case "Draft":
        currentClick = "Draft";
        break;
      case "Finalize":
        currentClick = "Finalize";
        break;
      case "Addendum":
        currentClick = "Addendum";
        break;
      default:
        return;
    }
    let btn = document.querySelectorAll(".dynamic-table-wrapper div button");
    if (btn && btn[2]) {
      btn = btn[2];
      btn.click();
    } else {
      switch (type) {
        case "Draft":
          handleDraft(data.table);
          break;
        case "Finalize":
          handleFinalize(data.table);
          break;
        case "Addendum":
          Addendum(data.table);
          break;
        default:
          return;
      }
    }
    //  console.log('btn=>', btn)
    return;
  };

  const gotoProfile = () => {
    history.push("/dashboard");
  };
  return (
    <>
      <SweetAlert
        show={showAlert}
        warning
        showCancel
        confirmBtnText="Let's do it !"
        confirmBtnBsStyle="sucess"
        title="It seems you didn't updated signature , doctor-description on your profile !!, To Finalize Report we must need your signature , doctor-description"
        onConfirm={gotoProfile}
        onCancel={() => {
          setShowAlert((prev) => !prev);
        }}
        focusConfirmBtn
      ></SweetAlert>
      <SweetAlert
        show={viewingAlert.canShow}
        warning
        confirmBtnText="I understand"
        cancelBtnText="Take me back"
        confirmBtnBsStyle="sucess"
        showCancel
        title="Someone else also editing/viewing this report , its not recommended to do editing now."
        onConfirm={() =>
          setViewingAlert((prev) => ({ ...prev, canShow: false }))
        }
        onCancel={() => history.goBack()}
        closeOnClickOutside={false}
      ></SweetAlert>
      <SweetAlert
        show={viewingAlert.confirmAddendum}
        warning
        confirmBtnText="Confirm Addendum"
        cancelBtnText="Cancel"
        confirmBtnBsStyle="sucess"
        showCancel
        title="Are you sure you want to Addendum this report ?"
        onConfirm={() => {
          Click(null, "Addendum");
          setViewingAlert((prev) => ({ ...prev, confirmAddendum: false }));
        }}
        onCancel={() =>
          setViewingAlert((prev) => ({ ...prev, confirmAddendum: false }))
        }
        closeOnClickOutside={false}
      ></SweetAlert>
      <SweetAlert
        show={viewingAlert.confirmFinalize}
        warning
        confirmBtnText="Confirm Finalize"
        cancelBtnText="Cancel"
        confirmBtnBsStyle="sucess"
        showCancel
        title="Are you sure you want to Finalize this report ?"
        onConfirm={() => {
          Click(null, "Finalize");
          setViewingAlert((prev) => ({ ...prev, confirmFinalize: false }));
        }}
        onCancel={() =>
          setViewingAlert((prev) => ({ ...prev, confirmFinalize: false }))
        }
        closeOnClickOutside={false}
      ></SweetAlert>
      <ReportPoopup
        data={prevData}
        setPrevData={setPrevData}
        display={prevData ? "block" : "none"}
      />
      <div className="avatar-area">
        {viewer.map((username) => (
          <Tooltip title={"Dr. " + username.toUpperCase()} arrow>
            <Avatar
              style={{ marginLeft: 3, marginRight: 3, background: "red" }}
            >
              {username.toUpperCase().slice(0, 2)}
            </Avatar>
          </Tooltip>
        ))}
      </div>
      <div className="mb-5 create-report">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img height={120} src={Logo} />
        </div>
        <form
          style={{ maxWidth: 1400, marginTop: 10, minWidth: 800 }} //tukar report template - change logo size
          className="container"
        >
          <div className="row d-flex">
            <div className="col-6">
              <label for="pname" class="form-label">
                Patient's Name
              </label>
              <input
                required
                value={data.patient_name}
                name="patient_name"
                onChange={handleChange}
                id="pname"
                className="form-control"
              />
            </div>
            <div className="col-6">
              <label for="pid" class="form-label">
                Patient's ID
              </label>
              <input
                value={data.patient_id || pid}
                readOnly
                id="pid"
                className="form-control"
              />
            </div>
          </div>
          <br />
          <div className="row d-flex">
            <div className="col-6">
              <label for="stype" class="form-label">
                Study Type
              </label>
              <input
                id="stype"
                name="study_type"
                value={data.study_type}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-6">
              <label for="sdata" class="form-label">
                Study Date
              </label>
              <input
                id="sdata"
                name="study_date"
                value={data.study_date || study_date}
                className="form-control"
                readOnly
              />
            </div>
          </div>

          <div className="row d-flex">
            <div className="col-6">
              <label for="stype" class="form-label">
                Upload Radiologist Signature{" "}
                {/*tukar nama - Upload to Upload Radiologist Signature */}
              </label>
              <input
                id="stype"
                type="file"
                name="study_type"
                onChange={encodeImageFileAsURL}
                className="form-control"
              />
            </div>

            <div className="col-6">
              <label for="stype" class="form-label">
                Select Template
              </label>
              <input
                list="templates"
                onChange={setTemplate}
                class="form-control col-sm-6 custom-select custom-select-sm"
                name="template"
                id="template"
              />
              <datalist id="templates">
                {/* <option value={"CHEST_X_RAY"}>CHEST X-RAY NORMAL</option>
                <option value={"CHEST_RADIOGRAPH"}>
                  CHEST X-RAY PEADS INFECTION
                </option>
                <option value={"LIMB_XRAY"}>LIMB X-RAY NORMAL</option>
                <option value={"KNEE_XRAY"}>KNEE X-RAY - OSTEOARTHRITIS</option>
                <option value={"ABDOMINAL"}>ABDOMINAL X-RAY NORMAL</option>
                <option value={"KUB_XRAY"}>KUB X-RAY NORMAL</option>
                <option value={"SPINE_XRAY"}>SPINE X-RAY NORMAL</option>
                <option value={"CERVICAL"}>SPINE XRAT – SPONDYLOSIS</option>
                <option value={"MAMMOGRAM"}>MAMMOGRAM</option>
                <option value={"CT_UROGRAPHY"}>
                  CT UROGRAPHY - MALE (NORMAL)
                </option>
                <option value={"CT_ABDOMEN"}>CT ABDOMEN – MALE (NORMAL)</option>
                <option value={"CTPA_PULMONARY"}>
                  CTPA – PULMONARY EMBOLISM
                </option>
                <option value={"PARANASAL_SINUS"}>CT PARANASAL SINUS</option>
                <option value={"CT_BRAIN"}>PLAIN CT BRAIN</option>
                <option value={"CECT_RENAL"}>CECT RENAL</option>
                <option value={"HRCT THORAX"}>HRCT THORAX</option>
                <option value={"US_ABDOMEN_PELVIS_MALE"}>
                  US ABDOMEN PELVIS MALE
                </option>
                <option value={"US_ABDOMEN_PELVIS_FEMALE"}>
                  US ABDOMEN PELVIS FEMALE
                </option> */}
                {/*<option value={"TEMPLATE_AJWA"}></option>*/}

                {templates.map((template) => (
                  <option value={template.name}>{template.name}</option>
                ))}
              </datalist>
            </div>
          </div>
          <div className="row d-flex">
            {roles?.report_with_pdf ? (
              <div className="col-6">
                <label for="report_image" class="form-label">
                  Upload Report Image
                </label>
                <input
                  id="report_image"
                  type="file"
                  name="report_image"
                  onChange={encodePDFImageFileAsURL}
                  className="form-control"
                />
              </div>
            ) : null}

            <div
              style={{
                alignItems: "flex-end",
                display: "flex",
                justifyContent: "left",
              }}
              className="col-6"
            >
              <ActionBoutonView
                //tukar link - osimis viewer
                StudyInstanceUID={StudyInstanceUID}
                wsi_link={
                  "https://strokesvr.padimedical.com/wsi/app/index.html?series=" + id //For rishab to adds on - add SeriesOrthancID
                }
                osimis_link={
                  "https://fastpacsosimis.anzverse.com/osimis-viewer/app/index.html?study=" +
                  id
                }
                OhifLink={"/viewer-ohif/viewer/dicomweb?StudyInstanceUIDs=" + StudyInstanceUID}
                radiant={
                  "radiant://?n=pstv&v=0020000D&v=%22" + StudyInstanceUID
                }
                osirix={
                  "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
                  id +
                  "/archive"
                }
                weasis={"weasis://?studyUID=" + StudyInstanceUID}
                downloadzip={
                  "https://strokesvr.padimedical.com/studies/" + id + "/archive"
                }
              />
            </div>
          </div>
          <br />

          <div className="row d-flex">
            {roles.can_assign_doctors ? (
              <div className="col-6">
                <label for="stype" class="form-label">
                  Assign Radiologist
                </label>
                <Typeahead
                  multiple
                  onChange={(selected) => {
                    setTags(selected);
                  }}
                  options={user.map(
                    (element) =>
                      `Dr. ${element.firstname}  ${element.lastname} (${element.username})`
                  )}
                  selected={tags}
                  id="doctors"
                />
              </div>
            ) : null}

            {roles.usg_no && (
              <div className="col-6">
                <label for="stype" class="form-label">
                  Study No.
                </label>
                <input
                  class="form-control col-sm-6 "
                  value={data.usg_no}
                  name="usg_no"
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <div className="row d-flex">
            {roles.can_assign_report_by_role ? (
              <div className="col-6">
                <label for="stype" class="form-label">
                  Assign By Roles
                </label>
                <Typeahead
                  multiple
                  onChange={(selected) => {
                    setSelectedRoles(selected);
                  }}
                  options={allRoles.map(({ name }) => name)}
                  selected={selectedRoles}
                  id="roles"
                />
              </div>
            ) : null}
            {roles.can_add_logo && (
              <div className="col-6">
                <label for="logo" class="form-label">
                  Upload Logo Image
                  {/*tukar nama - Upload to Upload Radiologist Signature */}
                </label>
                <Select
                  defaultValue={DEFAULT_LOGO_OPTION}
                  onChange={encodeLogoImageFileAsURL}
                  options={LogoData}
                />
              </div>
            )}
          </div>

          <div className="row d-flex">
            <div className="col-6">
              <p for="stype" class="form-label">
                Select Previous Report
              </p>
              <div className="d-flex">
                <select onChange={handlePrevReport} className="form-control">
                  <option hidden>select previous report</option>
                  {prev_report?.map((obj) => (
                    <option value={obj.id}>
                      {obj.study_type} - {dateFormator(obj.study_date)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={showPopup}
                  type="button"
                  className="btn mr-5 otjs-button-blue text-light"
                >
                  show
                </button>
              </div>
            </div>
            {roles.edit_report_type && 
            <div className="col-6 mt-2">
            <b style={{marginTop:20}}>Report Type</b>
            <div className="d-flex mt-2">
            <div class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name="type"
                value='normal'
                id="report-type"
                style={{height:15,width:15}}
                checked={data.type=='normal'}
                onChange={handleChange}
              />
              <label for="report-type">
              <b class="form-check-label">
                Normal
              </b>
              </label>
            </div>
            <div style={{marginLeft:20}} class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name="type"
                value='abnormal'
                id="report-type-2"
                checked={data.type=='abnormal'}
                style={{height:15,width:15}}
                onChange={handleChange}
              />
              <label for="report-type-2">
              <b class="form-check-label">
                Abnormal
              </b>
              </label>
            </div>
            </div>
          </div>
            } 
          </div>
          <br />
          <br />

          {roles.can_add_table && (
            <>
              <div className="d-flex justify-content-start align-items-center ">
                <span className="h5">Show Table</span>
                <Toggle
                  className="ms-2"
                  checked={showtable}
                  onChange={(value) => setShowTable(!showtable)}
                />
              </div>
              {
                <div style={{ display: `${showtable ? "block" : "none"}` }}>
                  <Suspense fallback={null}>
                    <DynamicTable data={data.table} getData={getData} />
                  </Suspense>
                </div>
              }
            </>
          )}

          <div className="row d-flex">
            <div className="col-12">
              <Typing id={id} />
              <textarea
                className="form-control"
                cols="12"
                rows="20"
                name="text"
                value={data?.text}
                onChange={handleChange}
                onBlur={stop_type}
              />
            </div>
          </div>
          <br />
          <div className="d-flex">
            {editing ? (
              <Button
                disabled={!roles.edit_patient_report || isfinalize}
                type="submit"
                onClick={(e) => Click(e, "Draft")}
                className="btn m-1 "
              >
                Save
              </Button>
            ) : (
              <Button
                disabled={!roles.create_patient_report || isfinalize}
                type="submit"
                onClick={(e) => Click(e, "Draft")}
                className="btn m-1 "
              >
                Save
              </Button>
            )}

            <Link
              to={{
                pathname: `/report/view/${id}`,
                study_date: study_date,
                StudyInstanceUID,
              }}
            >
              <Button disabled={!isfinalize} className="btn m-1">
                View
              </Button>
            </Link>

            <Link
              to={{
                pathname: `/report/view/${id}`,
                study_date: study_date,
                StudyInstanceUID,
                preview: true,
              }}
            >
              <Button className="btn m-1">Preview</Button>
            </Link>

            <div className="ms-auto">
              {roles.delete_report ? (
                <Button onClick={deleteReport} className="btn m-1 btn-danger">
                  Delete
                </Button>
              ) : null}

              {roles?.addendun ? (
                <Button
                  disabled={!isfinalize}
                  onClick={(e) =>
                    setViewingAlert((prev) => ({
                      ...prev,
                      confirmAddendum: true,
                    }))
                  }
                  className="btn m-1 "
                >
                  Addendum
                </Button>
              ) : null}

              {editing ? (
                <Button
                  disabled={
                    !(roles.edit_patient_report && roles.can_finalize_report) ||
                    isfinalize
                  }
                  onClick={(e) =>
                    setViewingAlert((prev) => ({
                      ...prev,
                      confirmFinalize: true,
                    }))
                  }
                  className="btn m-1"
                >
                  Finalize
                </Button>
              ) : (
                <Button
                  disabled={
                    !(
                      roles.create_patient_report && roles.can_finalize_report
                    ) || isfinalize
                  }
                  onClick={(e) =>
                    setViewingAlert((prev) => ({
                      ...prev,
                      confirmFinalize: true,
                    }))
                  }
                  className="btn m-1"
                >
                  Finalize
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateReport;
