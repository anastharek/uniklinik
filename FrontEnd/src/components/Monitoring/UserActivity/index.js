import { useEffect, useRef, useState } from "react";
import Overlay from "react-bootstrap/Overlay";
import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;
const ActivityType = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  SEARCH_STUDY: "SEARCH STUDY",
  SEARCH_MYCASELIST: "SEARCH MYCASELIST",
  SEARCH_ALLCASELIST: "SEARCH ALLCASELIST",
  DELETE_STUDY: "DELETE STUDY",
  DELETE_STUDY_REPORT: "DELETE STUDY REPORT",
  DELETE_CASE_LIST: "DELETE CASE LIST",
  DELETE_REQUEST_REPORT: "DELETE_REQUEST_REPORT",
  CREATED_DRAFT_REPORT: "CREATED DRAFT REPORT",
  UPDATED_DRAFT_REPORT: "UPDATED DRAFT REPORT",
  CREATE_FINALIZE_REPORT: "CREATE FINALIZE REPORT",
  CREATED_ADDENDUM_REPORT: "CREATED ADDENDUM REPORT",
  VIEW_REPORT: "VIEW REPORT",
  VIEW_MY_CASELIST: "VIEW MY CASELIST",
  VIEW_ALL_CASELIST: "VIEW ALL CASELIST",
  ASSIGN_DOCTOR: "ASSIGN DOCTOR",
  UNASSIGN_DOCTOR: "UNASSIGN_DOCTOR",
  IMPORT: "IMPORT",
  CREATE_IMPORT: "CREATE IMPORT",
  CREATE_SHARE_CARD: "CREATE SHARE CARD",
  REQUEST_REPORT: "REQUEST REPORT",
  VIEW_OSIMIS: "VIEW OSIMIS",
  VIEW_AI: "VIEW AI",
  VIEW_HOROS: "VIEW HOROS",
  VIEW_RADIANT: "VIEW RADIANT",
  DOWNLOAD_ZIP: "DOWNLOAD ZIP",
  ANONYMISE: "ANONYMISE",
  EXPORT: "EXPORT",
  DELETE: "DELETE",
  VIEW_WSI: "VIEW WSI",
};

const Detail = ({ data }) => {
  const [show, setShow] = useState(false);
  const target = useRef(null);
  const toggle = () => {
    setShow((prev) => prev && !prev);
  };
  const getDetail = () => {
    if (data.includes("{")) {
      console.log("if true");
      try {
        let obj = JSON.parse(data);
        let html = Object.keys(obj).map((key) => {
          if (typeof obj[key] === "object") {
            return Object.keys(obj[key]).map((nestedKey) => {
              return (
                <p>
                  {nestedKey} : {obj[key][nestedKey]}
                </p>
              );
            });
          } else {
            return (
              <p>
                {key} :{obj[key]}
              </p>
            );
          }
        });
        return html;
      } catch {}
    } else {
      return <p>{data.toString()}</p>;
    }
  };

  return (
    <>
      <button
        onMouseLeave={toggle}
        variant="danger"
        ref={target}
        className="btn"
        onClick={() => setShow(!show)}
      >
        Click to see Detail
      </button>
      <Overlay target={target.current} show={show} placement="right">
        {({ placement, arrowProps, show: _show, popper, ...props }) => (
          <div
            {...props}
            style={{
              position: "absolute",
              backgroundColor: "rgba(255, 100, 100, 0.85)",
              padding: "2px 10px",
              color: "white",
              borderRadius: 3,
              ...props.style,
            }}
          >
            {getDetail()}
          </div>
        )}
      </Overlay>
    </>
  );
};
const ExportExcel = ({ data }) => {
  return (
    <ExcelFile
      element={
        <button
          style={{ width: "max-content" }}
          className="otjs-button otjs-button-green"
        >
          Export/Download
        </button>
      }
    >
      <ExcelSheet data={data} name="Employees">
        <ExcelColumn label="Activity Type" value="type" />
        <ExcelColumn label="Username" value="username" />
        <ExcelColumn label="IP Address" value="ip" />
        <ExcelColumn label="Description" value={"description"} />
        <ExcelColumn label="Created At" value={"createdAt"} />
      </ExcelSheet>
    </ExcelFile>
  );
};

const UserActivity = () => {
  const [activity, setActivity] = useState([]);
  const [data, setData] = useState({});
  const [query, setQuery] = useState("");
  const [loadmore, setLoadmore] = useState(true);
  const dateRef = useRef();
  const selectRef = useRef();
  const usernameRef = useRef();
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    setLoadmore(true);
    fetch("/api/activity")
      .then((res) => res.json())
      .then((resJson) => setActivity(resJson))
      .catch((err) => console.log(err));
  };

  const Loadmore = () => {
    setLoadmore(true);
    fetch(`/api/activity?offset=${activity.length}${query}`)
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.length === 0) {
          setLoadmore(false);
        }
        setActivity((prev) => [...prev, ...resJson]);
      })
      .catch((err) => console.log(err));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    let text = "";
    if (data.username) {
      text = text + `&&username=${data.username}`;
    }

    if (data.date) {
      text = text + `&&date=${data.date}`;
    }
    if (data.activity) {
      text = text + `&&activity=${data.activity}`;
    }
    setQuery(text);
    fetch(`/api/activity?offset=${0}${text}`)
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.length === 0) {
          setLoadmore(false);
        }
        setActivity(resJson);
      })
      .catch((err) => console.log(err));
  };

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRefresh = () => {
    setData({});
    setQuery("");
    dateRef.current.value = "";
    selectRef.current.selectedIndex = 0;
    usernameRef.current.value = "";
    fetchAll();
  };
  return (
    <div class="container mt-5">
      <h4 class="text-center">Activity Log</h4>
      <br />
      <br />
      <ExportExcel data={activity} />
      <br />
      <br />
      <div className="row">
        <div className="col-4">
          <input
            className="form-control col-3 d-flex"
            onChange={handleChange}
            name="username"
            placeholder="username"
            value={data.username}
            ref={usernameRef}
          />
        </div>

        <div className="col-4">
          <input
            className="form-control col-3 d-flex"
            onChange={handleChange}
            name="date"
            placeholder="Date"
            type="date"
            ref={dateRef}
            value={data.date}
          />
        </div>
        <div className="col-4">
          <select
            name="activity"
            onChange={handleChange}
            ref={selectRef}
            className="form-control col-3"
          >
            <option hidden value="">
              Select Activity Type
            </option>
            {Object.values(ActivityType).map((text) => (
              <option value={text}>{text}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="d-flex justify-content-center m-5">
        <button
          onClick={handleSearch}
          className="btn otjs-button otjs-button-blue p-1 me-5"
        >
          Search
        </button>
        <button
          onClick={handleRefresh}
          className="btn otjs-button otjs-button-blue p-1"
        >
          Refresh
        </button>
      </div>
      <div style={{ height: 500, overflow: "hidden", zIndex: 9999 }}>
        <div style={{ height: 500, overflowY: "scroll" }}>
          <table class="table table-striped">
            <thead
              style={{ position: "static", top: "0px" }}
              class="thead-dark"
            >
              <tr>
                <th>Sr </th>
                <th>Activity</th>
                <th>Date Time</th>
                <th>Username</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((data, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <b>{data.type}</b>
                  </td>
                  <td>{new Date(data.createdAt).toLocaleString()}</td>
                  <td>{data.username}</td>
                  <td>{data.ip}</td>
                  <td>
                    <Detail data={data.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-center">
            {loadmore && (
              <button
                onClick={Loadmore}
                className="btn otjs-button otjs-button-blue p-1"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;
