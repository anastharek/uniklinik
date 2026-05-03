import { useEffect, useMemo, useRef, useState } from "react";
import DatasetRequestTable from "./DatasetRequestTable";
import axios from "axios";


const DatasetRequest = () => {
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState("Pending");
  useEffect(() => {
    fetchData();
  }, []);


  function getComponentToDisplay() {
    switch (activeTab) {
      case "Pending":
        return <DatasetRequestTable refresh={fetchData} key={'pending'} data={data.pending?.rows||[]} />;
      case "Accepted":
        return <DatasetRequestTable refresh={fetchData} key={'accepted'} data={data.accepted?.rows||[]} />;
      case "Rejected":
        return <DatasetRequestTable refresh={fetchData} key={'rejected'} data={data.rejected?.rows||[]} />;
      default:
        return [];
    }
  }

  const fetchData = () => {
    axios.get("/api/dataverse/request-admin")
    .then((res) => setData(res.data))
    .catch((err) => console.log(err));
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    } 

  return (
        <div>
          <div className="mb-5">
            <nav className="otjs-navmenu container-fluid">
              <div className="otjs-navmenu-nav">
                <li className="col-3 text-center">
                  <button
                    className={
                      activeTab === "Pending"
                        ? "otjs-navmenu-nav-link link-button-active link-button"
                        : "otjs-navmenu-nav-link link-button"
                    }
                    onClick={() => switchTab("Pending")}
                  >
                    Pending
                  </button>
                </li>
                <li className="col-3 text-center">
                  <button
                    className={
                      activeTab === "Accepted"
                        ? "otjs-navmenu-nav-link link-button-active link-button"
                        : "otjs-navmenu-nav-link link-button"
                    }
                    onClick={() => switchTab("Accepted")}
                  >
                    Accepted
                  </button>
                </li>
                <li className="col-4 text-center">
                  <button
                    className={
                      activeTab === "Rejected"
                        ? "otjs-navmenu-nav-link link-button-active link-button"
                        : "otjs-navmenu-nav-link link-button"
                    }
                    onClick={() => switchTab("Rejected")}
                  >
                    Rejected
                  </button>
                </li>
              </div>
            </nav>
          </div>
          <div>{getComponentToDisplay()}</div>
        </div>
  );
};

export default DatasetRequest;
