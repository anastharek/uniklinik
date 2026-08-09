import { useMemo, useRef, useState, memo, useEffect } from "react";
import moment from "moment";
import CommonTable from "../../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import ActionBoutonView from "../../../CommonComponents/RessourcesDisplay/ActionButtonView";
import ActionButtonReport from "../../../CommonComponents/RessourcesDisplay/ActionButtonReport";
import ActionBouton from "../../../CommonComponents/RessourcesDisplay/ActionBouton";
import { useSelector } from "react-redux";
import ReportStatus from "../../ReportStatus";
import { FormCheck, Dropdown, ButtonGroup } from "react-bootstrap";
import SendAetDropdown from "../../../Export/SendAetDropdown";
import apis from "../../../../services/apis";
import preloadApi from "../../../../services/preload";
import { toast } from "react-toastify";

const PatientStudyTable = ({
  studies,
  rowEventsStudies,
  rowStyle,
  onDeletePatient,
  onDeleteStudy,
  setSelectedStudies,
  onModify,
  onDelete,
  refresh,
  hiddenRemoveRow,
  openLabelModal,
}) => {
  const roles = useSelector((state) => state?.PadiMedical?.roles);
  const [selected, setSelected] = useState({
    root: [],
    sub: [],
    mapper: {},
    selectedAll: false,
  });
  const [aets, setAets] = useState([]);
  const [preloaded, setPreloaded] = useState({});
  const preloadRefs = useRef({});

  useEffect(() => {
    apis.aets.getAets().then(setAets).catch(console.log);
  }, []);

  const columns = useMemo(
    () => [
      {
        id: "selected",
        accessor: "selected",
        show: roles.main_table_checkbox || false,
        sort: false,
        disableSortBy: true,
        disableFilters: true,
        disableGlobalFilter: true,
        disableResizing: true,
        Header: ({page}) => (
            <FormCheck
              checked={selected.selectedAll}
              onChange={(event)=>{
                let isChecked = event.target.checked;
                let newSelected = {
                  sub: [],
                  mapper: {},
                  selectedAll: isChecked,
              };
              if (isChecked) {
                page.forEach(({original}) => {
                  newSelected.sub.push(original.ID);
                  newSelected.mapper[original.ID] = true;
                });
              }
              setSelected(newSelected);
              setSelectedStudies({
                selectedPatients: [],
                selectedStudies: newSelected.sub,
              });
            }}
          />
          ),
        Cell: ({ row }) => {
          let ID = row?.original?.ID;
          return (
            <FormCheck
              checked={selected.mapper[ID]}
              onChange={() => {
                if (ID && !selected.sub.includes(ID)) {
                  selected.sub.push(ID);
                  selected.mapper[ID] = true;
                } else {
                  let index = selected.sub.findIndex((str) => ID);
                  if (index !== -1) {
                    selected.sub.splice(index, 1);
                    delete selected.mapper[ID];
                  }
                }
                setSelected((prev) => ({
                  ...prev,
                  sub: selected.sub,
                  mapper: selected.mapper,
                }));
                setSelectedStudies(getSelectedRessources());
              }}
            />
          );
        },
      },
      { Header: "No", accessor: "No", sort: true },
      {
        id: "ReportStatus",
        Header: "Report Status",
        accessor: "ReportStatus",
        show: roles.main_table_status,

        Cell: ({ row }) => {
          return <ReportStatus status={row.values.ReportStatus} />;
        },
      },
      {
        id: "Date",
        Header: "Date",
        accessor: "Date",
        show: roles.main_table_date,
        Cell: ({ row }) =>
          row.values.Time
            ? moment(row.values.Date).format("DD/MM/YYYY")
            : null,
        sort: true,
      },
      {
        id: "Time",
        Header: "Time",
        accessor: "Time",
        show: roles.main_table_time,
        Cell: ({ row }) =>
          row.values.Time ? (
            <p style={{ width: 70 }}>
              {moment(row.values.Time).format("hh:mm A")}
            </p>
          ) : null,
        sort: true,
      },
      {
        id: "Patient_Name",
        Header: "Patient Name",
        accessor: "PName",
        show: roles.main_table_patient_name,
        sort: true,
        Cell: ({ row }) => (
           row?.original?.PatientMainDicomTags?.PatientName.replaceAll('^', ' ')
        ),
      },
      {
        id: "PatientID",
        Header: "Patient ID",
        show: roles.main_table_patient_id,
        Cell: ({ row }) => {
          return <p>{row?.original?.PatientMainDicomTags?.PatientID}</p>;
        },
      },
      {
        id: "Accession",
        Header: "Accession Number",
        show: roles.main_table_accession,
        Cell: ({ row }) => {
          return <p>{row?.original?.MainDicomTags?.AccessionNumber}</p>;
        },
      },
      {
        id: "Description",
        Header: "Study Description",
        accessor: "StudyDescription",
        show: roles.main_table_description,
        sort: true,
      },
      {
        id: "Gender",
        Header: "Gender",
        show: roles.main_table_gender,
        Cell: ({ row }) => {
          return <p>{row?.original?.PatientMainDicomTags?.PatientSex}</p>;
        },
      },
      {
        id: "PatientDOB",
        Header: "Dob",
        show: roles.main_table_dob,
        Cell: ({ row }) => {
          let dobDate = row?.original?.PatientMainDicomTags?.PatientBirthDate;
          let formatedStr = dobDate
            ? moment(dobDate, "YYYYMMDD").format("DD/MM/YYYY")
            : null;
          return <p>{formatedStr}</p>;
        },
      },
      {
        id: "PatientAge",
        Header: "Patient Age",
        show: roles.main_table_age,
        Cell: ({ row }) => {
          let dobDate = row?.original?.PatientMainDicomTags?.PatientBirthDate;
          let formatedStr = dobDate
            ? moment(dobDate, "YYYYMMDD").fromNow().replace("years ago", "Yr")
            : null;
          return <p>{formatedStr}</p>;
        },
      },
      {
        id: "select",
        Header: "Select",
        show: roles.main_table_selectBtn,
        editable: false,
        Cell: ({ row }) => {
          return (
            <ActionBouton
              level="studies"
              orthancID={row.original.ID}
              StudyInstanceUID={row.original.MainDicomTags.StudyInstanceUID}
              onDelete={onDeleteStudy}
              //row={row}
              refresh={refresh}
              pname={row.original.PatientMainDicomTags.PatientName}
              pid={row.original.PatientMainDicomTags.PatientID}
              StudyDescription={row.original.MainDicomTags.StudyDescription}
              openLabelModal={openLabelModal}
            />
          );
        },
      },
      {
        id: "view",
        Header: "View",
        show: roles.main_table_viewBtn,
        Cell: ({ row }) => {
          return (
            <ActionBoutonView
              role={roles}
              //tukar link - osimis viewer
              StudyInstanceUID={row.original.MainDicomTags.StudyInstanceUID}
              wsi_link={
                "https://strokesvr.padimedical.com/wsi/app/index.html?series=" +
                row.original.ID //For rishab to adds on - add SeriesOrthancID
              }
              osimis_link={
                "https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" +
                row.original.ID
              }
              OhifLink={
                "/viewer-ohif/viewer/" +
                row.original.MainDicomTags.StudyInstanceUID
              }
              radiant={
                "radiant://?n=pstv&v=0020000D&v=%22" +
                row.original.MainDicomTags.StudyInstanceUID
              }
              osirix={
                "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
                row.original.ID +
                "/archive"
              }
              weasis={
                "weasis://?studyUID=" +
                row.original.MainDicomTags.StudyInstanceUID
              }
              downloadzip={
                "https://strokesvr.padimedical.com/studies/" +
                row.original.ID +
                "/archive"
              }
            />
          );
        },
      },
      {
        id: "preload-osimis",
        Header: "Preload",
        show: roles.preload_osimis,
        sort: false,
        disableSortBy: true,
        disableFilters: true,
        disableGlobalFilter: true,
        disableResizing: true,
        Cell: ({ row }) => {
          const studyId = row.original.ID;
          const state = preloaded[studyId];
          const osimisLink =
            "https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" +
            studyId;
          const handlePreload = () => {
            if (preloadRefs.current[studyId] || preloaded[studyId] === "done") {
              toast.info("Already preloaded");
              return;
            }
            setPreloaded((prev) => ({ ...prev, [studyId]: "loading" }));

            // 1. Start the server-side preload job (warms Orthanc caches, gives real progress)
            preloadApi
              .start(studyId)
              .then(() => {
                // 2. Also warm the browser cache by loading the viewer app shell in a hidden iframe
                if (!preloadRefs.current[studyId]) {
                  const iframe = document.createElement("iframe");
                  iframe.src = osimisLink;
                  iframe.style.display = "none";
                  iframe.style.width = "0";
                  iframe.style.height = "0";
                  iframe.onload = () => {
                    preloadRefs.current[studyId] = iframe;
                  };
                  document.body.appendChild(iframe);
                }

                // 3. Poll the server job for real progress
                const poll = setInterval(() => {
                  preloadApi
                    .status(studyId)
                    .then((job) => {
                      if (job.status === "done" || job.status === "error") {
                        clearInterval(poll);
                        if (job.status === "done") {
                          setPreloaded((prev) => ({ ...prev, [studyId]: "done" }));
                          toast.success(
                            `Preload complete: ${job.doneSeries}/${job.totalSeries} series cached`
                          );
                        } else {
                          setPreloaded((prev) => ({ ...prev, [studyId]: "error" }));
                          toast.error(`Preload failed: ${job.error || "unknown error"}`);
                        }
                      } else {
                        setPreloaded((prev) => ({ ...prev, [studyId]: "loading" }));
                      }
                    })
                    .catch(() => {
                      clearInterval(poll);
                      setPreloaded((prev) => ({ ...prev, [studyId]: "error" }));
                      toast.error("Preload status check failed");
                    });
                }, 2000);
              })
              .catch((err) => {
                setPreloaded((prev) => ({ ...prev, [studyId]: "error" }));
                toast.error("Could not start preload");
              });
          };
          const showProgress =
            state === "loading" && preloaded[studyId] !== "done";
          return (
            <button
              type="button"
              name="preload_osimis"
              className={
                state === "done"
                  ? "otjs-button otjs-button-green"
                  : "otjs-button otjs-button-blue"
              }
              onClick={handlePreload}
              disabled={state === "loading"}
            >
              {state === "loading"
                ? "Preloading..."
                : state === "done"
                ? "Cached ✓"
                : "Preload"}
            </button>
          );
        },
      },
      {
        id: "report",
        Header: "Report",
        show: roles.main_table_reportBtn,
        Cell: ({ row }) => {
          return (
            <ActionButtonReport
              pname={row.original.PatientMainDicomTags.PatientName}
              pid={row.original.PatientMainDicomTags.PatientID}
              accessor={row.values.accessor}
              StudyOrthancID={row.original.ID}
              StudyInstanceUID={row.original.MainDicomTags.StudyInstanceUID}
              description={{
                StudyDescription: row.original.MainDicomTags.StudyDescription,
                StudyDate: row.original.MainDicomTags.StudyDate,
              }}
              createOrviewLink={"/report/create/" + row.original.ID}
              viewLink={"/report/view/" + row.original.ID}
              requestLink={"/report/request/" + row.original.ID}
              addendun={"/report/addendun/" + row.original.ID}
              reqAdvImagin={"/report/request-advance-imagin/" + row.original.ID}
            />
          );
        },
      },
      {
        id: "select-patient",
        Header: "Study",
        show: roles.main_table_patient_select,
        editable: false,
        Cell: ({ row }) => {
          return (
            <ActionBouton
              level="patients"
              btnLable={"Study"}
              impClass="patient-btn-select"
              hideOsimisViewer={null}
              orthancID={row.original.ParentPatient}
              onDelete={onDelete}
              onModify={onModify}
              row={row.values.raw}
              refresh={refresh}
            />
          );
        },
      },
      {
        id: "send_to",
        Header: "Send To",
        show: roles.can_transfer,
        Cell: ({ row }) => {
          return (
            <Dropdown as={ButtonGroup} autoClose="outside" className="mt-2">
              <Dropdown.Item>
                <SendAetDropdown aets={aets} exportIds={[row.original.ID]} />
              </Dropdown.Item>
            </Dropdown>
          );
        },
      },
      {
        id: "Detail",
        Header: "Detail",
        show: roles.main_table_detail,
        Cell: ({ row }) => {
          return (
            <button
              className="btn"
              onClick={() => {
                rowEventsStudies([row?.original?.ID]);
                document.querySelector(".series-area").scrollIntoView();
              }}
            >
              Click
            </button>
          );
        },
      },
    ],
    [
      onDeletePatient,
      onDeleteStudy,
      onModify,
      refresh,
      roles,
      //    hiddenAccessionNumber,
      //    hiddenActionBouton,
      hiddenRemoveRow,
      openLabelModal,
      aets,
      selected.selectedAll
    ]
  );

  const getSelectedRessources = () => {
    return {
      selectedPatients: [],
      selectedStudies: selected.sub,
    };
  };

  const data = useMemo(
    () =>
      studies.map((element, index) => {
        let Date = element?.MainDicomTags?.StudyDate;
        let Time = element?.MainDicomTags?.StudyTime;
        if (Date && Time) {
          Date = moment
            (Date + Time, "YYYYMMDDHHmmss")
            .local()
            .format();
          Time = Date;
        } else {
          Date = Date ? moment(Date, "YYYYMMDD").format() : null;
          Time = Time ? moment(Time, "HHmmss").format() : null;
        }
        return {
          ...element,
          No: index + 1,
          Date: Date,
          Time: Time,
          PName: element?.PatientMainDicomTags?.PatientName?.toUpperCase(),
          StudyDescription: element?.MainDicomTags?.StudyDescription,
        };
      }),
    [studies]
  );


  return <CommonTable tableData={data} columns={columns} pagination={true} />;
};
export default memo(PatientStudyTable);
