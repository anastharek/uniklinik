import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useCallback, useMemo } from "react";
import { InputCell, SelectCell } from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import moment from "moment/moment";



export default function AppointmentTable({tableData=[],saveModal ,changeHandler,setDeletedId}) {
  const getColor=useCallback((status)=>{
    if(status=='arrived'){
      return 'green';
    }
    else if(status=='performed'){
      return '#4CBCD2';
    }
    return '#F1A630';
  },[]);

  const columns = useMemo(
    () => [
      {
        id:'id',
        accessor:'id',
        show:false,
      },
      {
        Header: "Appointment Date",
        sort: true,
        editable:true,
        type:'date',
        Cell:(props)=><InputCell {...props} value={props.row.original.appointment_datetime} formatter={(value)=>moment(value).local().format('DD/MM/YYYY')}/>,
      },
      {
        Header: "Appointment Time",
        editable:true,
        type:'time',
        Cell:(props)=><InputCell {...props} value={props.row.original.appointment_datetime} formatter={(value)=>{
          if(moment(value).isValid()){
           return moment(value).local().format('hh:mm A')
          }else{    
            return moment(value, ["HH:mm"]).format("hh:mm A");;
          }
        }}/>,
      },
      {
        accessor: "status",
        Header: "Status",
        sort: true,
        editable:true,
        options:async()=>['schedule','arrived','performed'].map(text=>({value:text,label:text})),
        Cell:(props)=><div style={{background:getColor(props.row?.values?.status)}} className="p-1"><SelectCell {...props}/></div>,
      },
      {
        Header: "Name",
        sort: true,
        editable:true,
        Cell:(props)=><InputCell {...props} value={props.row.original?.Patient?.name}/>,
      },
      {
        Header: "Patient ID",
        sort: true,
        editable:false,
        Cell:(props)=><InputCell {...props} value={props.row.original?.Patient?.patient_id}/>,
      },
      {
        Header: "NRIC",
        sort: true,
        editable:true,
        Cell:(props)=><InputCell {...props} value={props.row.original?.Patient?.nric}/>,
      },
      {
        Header: "DOB",
        sort: true,
        editable:true,
        type:'date',
        Cell:(props)=><InputCell {...props} value={props.row.original?.Patient?.dob} formatter={(value)=>moment(value).local().format('DD/MM/YYYY')}/>,
      },
      {
        accessor:'modality_type',
        Header: "Modality Type",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        accessor:'scan_region',
        Header: "Scan Region",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        accessor:'request_department',
        Header: "Requested Department",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        accessor:'ref_physician',
        Header: "Ref. Physician",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        Header: "Patient Type",
        accessor:"patient_type",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        Header: "Allergic",
        sort: true,
        editable:true,
        Cell:(props)=><InputCell {...props} value={props.row.original?.Patient?.allergic}/>,
      },
      {
        Header: "Asthma",
        sort: true,
        editable:true,
        Cell:(props)=><InputCell {...props} value={props.row.original?.Patient?.asthma}/>,
      },
      {
        Header: "Creatinine",
        accessor:'creatinine',
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        Header: "Institution Name",
        accessor:"institution_name",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        Header: "Clinical Summary",
        accessor:'clinical_summary',
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        Header: "Accession No.",
        accessor:'accesion_number',
        sort: true,
        editable:false,
        Cell:InputCell,
      },
      {
        Header: "Save",
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-green"
              onClick={() => saveModal(row.values.id)}
            >
              Save
            </button>
          );
        },
      }
    ],
    [saveModal]
  );

  const data = useMemo(
    () =>
    tableData.map((element, index) => {
        return { ...element, No: index + 1 };
      }),
    [tableData]
  );
  return <CommonTable onDataChange={changeHandler} tableData={data} columns={columns}  pagination={true} />;
}
