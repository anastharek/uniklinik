import React, { useEffect, useMemo, useState } from "react";
import {
  useExpanded,
  useFilters,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from "react-table";
import {
  Check,
  Close,
  Sync,
  FiberManualRecord,
  Assignment,
} from "@material-ui/icons";
import Table from "react-bootstrap/Table";
import { FormCheck } from "react-bootstrap";
import PaginationButton from "./PaginitionButton";
import ActionBoutonView from "../ActionButtonView";
import ActionBoutonReport from "../ActionButtonReport";
import { useDispatch } from "react-redux";
import { clickRow } from "../../../../actions/PadiMedical";
const actions = {};
actions.resetSelectedRows = "resetSelectedRows";
actions.toggleAllRowsSelected = "toggleAllRowsSelected";
actions.toggleRowSelected = "toggleRowSelected";
actions.toggleAllPageRowsSelected = "toggleAllPageRowsSelected";

const LOWEST_PAGE_SIZE = 10;

{
  /* <a href=
target='_blank' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className='btn otjs-button otjs-button-blue'>View</a> */
}

function SubRow({
  element,
  span,
  columns,
  data,
  setSelected,
  index,
  hiddenSelect,
  rowEvent,
  rowStyle,
  pid,
  pname,
  study,
  OtherPatientIDs,
}) {
  const [statusData, setStatusData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const data2 = useMemo(() => {
    if (Array.isArray(data)) {
      data.forEach((element, index) => {
        data[index] = {
          ...data[index],
          View: (
            <ActionBoutonView
              //tukar link - osimis viewer
              StudyInstanceUID={element.StudyInstanceUID}
              wsi_link={
                "https://strokesvr.padimedical.com/wsi/app/index.html?series=" +
                element.StudyOrthancID  //For rishab to adds on - add SeriesOrthancID
              }
              osimis_link={
                "https://uniklinikosimis.anzverse.com/osimis-viewer/app/index.html?study=" +
                element.StudyOrthancID
              }
              OhifLink={"/viewer-ohif/viewer/dicomweb?StudyInstanceUIDs=" + element.StudyInstanceUID}
              radiant={
                "radiant://?n=pstv&v=0020000D&v=%22" + element.StudyInstanceUID
              }
              osirix={
                "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
                element.StudyOrthancID +
                "/archive"
              }
              weasis={
                "weasis://?studyUID=" + element.StudyInstanceUID
              }
              downloadzip={
                "/api/studies/" +
                element.StudyOrthancID +
                "/archive"
              }
            />
          ),
          Report: (
            <ActionBoutonReport
              pid={pid}
              pname={pname}
              accessor={element.AccessionNumber}
              StudyInstanceUID={element.StudyInstanceUID}
              StudyOrthancID={element.StudyOrthancID}
              description={study[index]}
              row={data}
              nric={OtherPatientIDs}
              ReferringPhysicianName={element.ReferringPhysicianName}
              createOrviewLink={"/report/create/" + element.StudyOrthancID}
              viewLink={"/report/view/" + element.StudyOrthancID}
              requestLink={"/report/request/" + element.StudyOrthancID}
              addendun={"/report/addendun/" + element.StudyOrthancID}
              reqAdvImagin={
                "/report/request-advance-imagin/" + element.StudyOrthancID
              }
              noReport={statusData[index] === null}
            />
          ),
          Status: (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              {statusData[index] !== undefined ? (
                statusData[index] == true ? (
                  <Assignment
                    style={{
                      fontWeight: "bold",
                      color: "green",
                      boxShadow: "0px 0px 10px green",
                    }}
                  />
                ) : statusData[index] == false ? (
                  <Assignment style={{ fontWeight: "bold", color: "#000" }} />
                ) : null
              ) : (
                <Sync />
              )}
            </div>
          ),
        };
      });
    }
    return data;
  }, [statusData]);
  //added by rishabh
  useEffect(() => {
    const ids = data.map((element) => element.StudyOrthancID);
    const Options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ ids: ids }),
    };
    fetch("/api/report-status-by-ids", Options)
      .then((res) => res.json())
      .then((res) => setStatusData(res));
  }, []);

  useEffect(() => {
    setRefresh(!refresh);
  }, [statusData.length]);

  return (
    <tr>
      <td className={"subtable-row"} colSpan={span}>
        {element}
        {/*  added by rishabh */}
        <br />
        <NestedTable
          columns={[
            ...columns,
            { accessor: "View", Header: "View", show: true },
            { accessor: "Report", Header: "Report", show: true },
            { accessor: "Status", Header: "Status", show: true },
          ]}
          data={data2 || []}
          setSelected={
            !!setSelected
              ? (selected) => {
                  let t = [];
                  t[index] = selected;
                  setSelected({ sub: t });
                }
              : undefined
          }
          hiddenSelect={hiddenSelect}
          rowEvent={rowEvent}
          rowStyle={rowStyle}
        />
      </td>
    </tr>
  );
}

function LazySubRow({
  span,
  columns,
  getter,
  setSelected,
  index,
  hiddenSelect,
  rowEvent,
  rowStyle,
}) {
  const [data, setData] = useState(null);
  useEffect(() => {
    getter().then(setData);
  }, [getter]);
  return data != null ? (
    <tr>
      <td className={"subtable-row"} colSpan={span}>
        <NestedTable
          columns={columns}
          data={data}
          setSelected={
            !!setSelected
              ? (selected) => {
                  let t = [];
                  t[index] = selected;
                  setSelected({ sub: t });
                }
              : undefined
          }
          hiddenSelect={hiddenSelect}
          rowEvent={rowEvent}
          rowStyle={rowStyle}
        />
      </td>
    </tr>
  ) : null;
}

function NestedTable({
  hide0and4,
  columns,
  data,
  setSelected,
  hiddenSelect,
  rowEvent,
  rowStyle,
  filtered = false,
  sorted = false,
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    prepareRow,
    visibleColumns,
    selectedFlatRows,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      autoResetExpanded: false,
      initialState: {
        hiddenColumns: columns
          .map((column) => {
            if (column.show === false || column.table instanceof Array)
              return column.accessor || column.id;
            return null;
          })
          .filter((x) => x != null),
        pageIndex: 0,
        pageSize: 20,
      },
    },
    filtered ? useFilters : () => {},
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect,
    (hooks) => {
      if (!hiddenSelect)
        hooks.visibleColumns.push((columns) => [
          {
            id: "selection",
            Header: ({ getToggleAllRowsSelectedProps }) => (
              <div>
                <FormCheck {...getToggleAllRowsSelectedProps()} />
              </div>
            ),
            Cell: ({ row }) => (
              <div>
                <FormCheck {...row.getToggleRowSelectedProps()} />
              </div>
            ),
          },
          ...columns,
        ]);
      if (columns.filter((column) => column.table instanceof Array).length > 0)
        hooks.visibleColumns.push((columns) => [
          {
            id: "expanded",
            Header: "",
            Cell: ({ row }) => (
              <div
                className={
                  "d-flex justify-content-center expand-cell align-content-center"
                }
                {...row.getToggleRowExpandedProps()}
              >
                <span>{row.isExpanded ? "(-)" : "(+)"}</span>
              </div>
            ),
          },
          ...columns.map((column, i) => {
            return column.alsoExpands
              ? {
                  ...column,
                  id: `expanded-${i}`,
                  Cell: ({ row }) => {
                    return (
                      <div
                        style={{ height: "100%", width: "100%" }}
                        className="d-flex"
                        {...row.getToggleRowExpandedProps()}
                      >
                        <span>{row.original[column.id]}</span>
                      </div>
                    );
                  },
                }
              : column;
          }),
        ]);
    }
  );

  const dispatch = useDispatch();
  React.useEffect(() => {
    // console.log("effexu", localStorage.getItem("refresh_table"))
    if (localStorage.getItem("refresh_table")) {
      setSelected({ root: [] });
      localStorage.removeItem("refresh_table");
    } else {
      if (setSelected)
        setSelected({ root: selectedFlatRows.map((x) => x.values) });
    }

    // eslint-disable-next-line
  }, [selectedFlatRows.length, data]);

  return (
    <Table striped bordered responsive {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, index) => {
              if (hide0and4 && (index == 0 || index == 4)) return null; //added by rishabh
              return (
                // remove column.getSortByToggleProps() from parameter if you dont want sorting -rishabh
                <th {...column.getHeaderProps()}>
                  {column.render("Header")}
                  {/* span to show sorting */}
                  {/* <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? ' 🔽'
                                                : ' 🔼'
                                            : ''}
                                    </span> */}
                  {!!column.Filter && filtered ? column.render("Filter") : null}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {page.map((row) => {
          prepareRow(row);
          return (
            // Use a React.Fragment here so the table markup is still valid
            <React.Fragment>
              <tr
                id={row.values.PatientID}
                {...row.getRowProps()}
                onClick={() => {
                  dispatch(clickRow(row.values.PatientID));
                  if (rowEvent) rowEvent(row.values);
                }}
                style={rowStyle ? rowStyle(row.values) : null}
              >
                {row.cells.map((cell, index) => {
                  if (hide0and4 && (index == 0 || index == 4)) return null;
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")} </td>
                  );
                })}
              </tr>
              {row.isExpanded
                ? Object.entries(row.values).map(([key, value], index) => {
                    let matchingColumn = columns.filter(
                      (column) => !!column.table && column.accessor === key
                    )[0];
                    return !!matchingColumn ? (
                      !matchingColumn.lazy ? (
                        <>
                          <SubRow
                            span={visibleColumns.length}
                            columns={matchingColumn.table}
                            data={value}
                            index={index}
                            setSelected={setSelected}
                            hiddenSelect={hiddenSelect}
                            rowEvent={rowEvent}
                            rowStyle={rowStyle}
                            pid={row?.values?.PatientID}
                            pname={row?.values?.PatientName}
                            study={row?.values?.studies}
                            // OtherPatientIDs={row?.values?.OtherPatientIDs}
                            // ReferringPhysicianName={row?.values?.ReferringPhysicianName}
                            element={
                              <td role="cell">
                                {row?.cells[4]?.render("Cell")}
                              </td>
                            } //added by rishabh
                          />
                        </>
                      ) : (
                        <>
                          <LazySubRow
                            span={visibleColumns.length}
                            columns={matchingColumn.table}
                            getter={value}
                            index={index}
                            setSelected={setSelected}
                            hiddenSelect={hiddenSelect}
                            rowEvent={rowEvent}
                            rowStyle={rowStyle}
                          />
                          {row?.cells[2]?.render("Cell")}
                        </>
                      )
                    ) : null;
                  })
                : null}
            </React.Fragment>
          );
        })}
        {LOWEST_PAGE_SIZE < data.length ? (
          <tr>
            <td
              colSpan={visibleColumns.length}
              aria-colspan={visibleColumns.length}
            >
              <div className={"d-flex justify-content-end"}>
                <PaginationButton
                  gotoPage={gotoPage}
                  previousPage={previousPage}
                  nextPage={nextPage}
                  canPreviousPage={canPreviousPage}
                  canNextPage={canNextPage}
                  pageIndex={pageIndex}
                  pageCount={pageCount}
                  pageOptions={pageOptions || []}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  rowsCount={data.length}
                />
              </div>
            </td>
          </tr>
        ) : null}
      </tbody>
    </Table>
  );
}

export default NestedTable;
