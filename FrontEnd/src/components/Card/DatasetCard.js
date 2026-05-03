import React, { useState } from "react";
import { Edit, LibraryBooks, Person } from "@material-ui/icons";
import "./DatasetCard.css";
import { Button, Card, Tooltip, Typography } from "@material-ui/core";
import moment from "moment/moment";
import EditDatasetPopup from "../Dataverse/MyDataset/EditDataset";

const getText = () => {
  let num = parseInt(Math.random() * 10);
  if (num % 2) {
    return "Heart Disease Dataset for Monitoring in Clinical Environment";
  } else {
    return "Heart Disease Dataset for Monitoring in Clinical Environment, Heart Disease Dataset for Monitoring in Clinical Environment";
  }
};

const getClassWithStatus = (status) => {
  if (status == "pending") {
    return "btn-warning";
  } else if (status == "accepted") {
    return "btn-success";
  } else {
    return "btn-danger";
  }
};
const DatasetCard = ({
  data,
  onViewClick,
  allowEdit,
  disableView,
  showStatus,
  openLink,
  refresh,
}) => {
  const [showEdit, setShowEdit] = useState(false);
  const handleView = () => {
    if (openLink) {
      window.open(`/dataverse/${data.id}`, "_blank");
      return;
    } else {
      onViewClick(data.id);
    }
  };
  const handleClose = () => {
    setShowEdit(false);
  };
  return (
    <>
      {showEdit && (
        <EditDatasetPopup
          refresh={refresh}
          handleClose={handleClose}
          id={data.id}
        />
      )}
      <div class="col-12 my-3">
        <Card class="card dataset-card">
          {allowEdit && (
            <button
              onClick={() => setShowEdit(true)}
              className="btn btn-light"
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                padding: "4px",
              }}
            >
              <Edit />
            </button>
          )}
          {showStatus && (
            <button
              className={`btn ${getClassWithStatus(data.status)}`}
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                padding: "4px",
                display: showStatus ? "block" : "none",
                fontSize: "12px",
                fontWeight: "bold",
                paddingInline: "10px",
              }}
            >
              {data.status}
            </button>
          )}
          <div class="card-body">
            <Typography variant="h6" class="card-title text-dark">
              {data.name}
            </Typography>
            <p class="card-text mt-2">{data.detail}</p>
            <div className="info-parent">
              <div className="card-info-wrapper">
                <div>
                  Price
                  <b>
                    {" "}
                    {data.pricing_type == "paid" ? data.price_range : "Free"}
                  </b>
                </div>
                <div>
                  <Tooltip title={`${data.sample_count} Samples`}>
                    <span>
                      <LibraryBooks style={{ marginRight: 1 }} />
                      {data.sample_count}
                    </span>
                  </Tooltip>
                </div>
                <div>
                  <Tooltip title={`Researched by ${data.researcher_name}`}>
                    <span>
                      <Person
                        style={{
                          marginRight: { base: 0, md: 1 },
                          fontSize: { base: 12, md: 14 },
                        }}
                      />
                      {data.researcher_name}
                    </span>
                  </Tooltip>
                </div>
                <div>
                  <Tooltip title={`View by ${data.view_count} users`}>
                    <span>
                      View {data.view_count}
                    </span>
                  </Tooltip>
                </div>
                <div>
                  <Tooltip title={`Subscribed by ${data.subscribe_count} users`}>
                    <span>
                      Download {data.subscribe_count}
                    </span>
                  </Tooltip>
                </div>
                <div>
                  <Tooltip title={`Uploaded at ${moment(data.createdAt).format("DD/MM/YYYY")}`}>
                    <span>
                      {moment(data.createdAt).format("DD/MM/YYYY")}
                    </span>
                  </Tooltip>
                </div>
              </div>
              {disableView ? null : (
                <div className="view-btn-dataverse">
                  <Button size="small" variant="contained" onClick={handleView}>
                    View
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default DatasetCard;
