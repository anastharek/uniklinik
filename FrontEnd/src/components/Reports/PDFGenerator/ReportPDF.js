import pdfMake from "pdfmake/build/pdfmake";
import vfs from "./fonts/vfs_fonts";
import WaterMark from "../../../assets/images/watermark/WATERMARK.jpg"; //tukar report template - watermark


pdfMake.vfs = vfs;

pdfMake.fonts = {
  Roboto: {
    normal: "NimbusSanL-Reg.otf",
    bold: "NimbusSanL-Bol.otf",
    italics: "NimbusSanL-RegIta.otf",
    bolditalics: "NimbusSanL-BolIta.otf",
  },
};

const getBase64ImageFromURL = (url) => {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      var dataURL = canvas.toDataURL("image/png");

      resolve(dataURL);
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = url;
  });
};

function getReportFormate(
  text1,
  text2,
  text,
  image,
  tableData,
  signature,
  createdAt,
  created_by,
  practicing_no,
  addendum
) {
  let array = [];
  // A table is only usable if it actually has rows AND at least one cell.
  // An empty table like [[]] (sent when a report has no table) makes pdfmake
  // throw internally ("moveDown is not a function") and the PDF never generates.
  const hasTable =
    Array.isArray(tableData) &&
    tableData.length > 0 &&
    tableData.some((row) => Array.isArray(row) && row.length > 0);
  if (text1 && text2) {
    array.push({ text: text1 });
    
    if (hasTable) {
      array.push({
        margin: [0, 10, 0, 30],
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            table: {
              headerRows: 1,
              body: tableData,
              widths: tableData[0] ? tableData[0].map(() => "auto") : "auto",
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#000000",
              vLineColor: () => "#000000",
              paddingLeft: (i, node) => 10,
              paddingRight: (i, node) => 10,
              paddingTop: (i, node) => 5,
              paddingBottom: (i, node) => 5,
            },
          },
          { width: "*", text: "" },
        ],
      });
    }

    array.push({
      text: text2.split("Reported by:")[0] || "",
      margin: [0, 10, 0, 0],
    });
    
    array.push({ text: "Reported by", margin: [0, 20, 0, 5] });
    if (signature) {
      array.push({
        image: signature,
        width: 100,
        margin: [-5, 0, 0, 0],
      });
    }
    array.push({ text: text2.split("Reported by:")[1] || "" });
    
  } else {
    if (hasTable) {
      array.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            magin: [0, 0, 0, 20],
            table: {
              body: tableData,
            },
            layout: {
              paddingLeft: (i, node) => 10,
              paddingRight: (i, node) => 10,
              paddingTop: (i, node) => 5,
              paddingBottom: (i, node) => 5,
            },
          },
          { width: "*", text: "" },
        ],
      });
    }
    array.push({ text: text.split("Reported by:")[0] || "" });
    
    array.push({ text: "Reported by", margin: [0, 20, 0, 5] });
    if (signature) {
      array.push({
        image: signature,
        width: 150,
        margin: [-20, 0, 0, 0],
      });
    }
    array.push({ text: text.split("Reported by:")[1] || "" });
    
  }

  // array.push({
  //   text: "Computer generated, no signature required.",
  //   margin: [0, 20, 0, 0],
  // });

  if (addendum) {
    array.push({
      text: `Addendum of this report is done on ${createdAt} transcribed by ${created_by} (${practicing_no})`,
      margin: [0, 20, 0, 100], //tukar spacing
    });
  } else {
    array.push({
      text: `This report is created on ${createdAt} transcribed by ${created_by} (${practicing_no})`,
      margin: [0, 20, 0, 100],
    });
  }
  if (image) {
    array.push({
      margin: [0, 50],
      image: image,
      alignment: "center",
      width:595.35-80,
    });
  }

  return array;
}

const generateHeader=(
  patient_id,study_date,PatientSex,usg_no,accesor,age,OtherPatientIDs,PatientBirthDate,ReferringPhysicianName,
)=>{
  let arr1=[];
  let arr2=[];
  if(patient_id)arr1.push({label:'Patient ID',value:patient_id})

  if(study_date)(arr1.length>arr2.length?arr2:arr1).push({label:'Study Date',value:study_date})
  
  if(PatientSex)(arr1.length>arr2.length?arr2:arr1).push({label:'Gender',value:PatientSex||''})
  
  if(usg_no)(arr1.length>arr2.length?arr2:arr1).push({label:"Study No.",value:usg_no})
  
  if(accesor)(arr1.length>arr2.length?arr2:arr1).push({label:"Study No.",value:accesor})

  //if(age && age!=="NA")(arr1.length>arr2.length?arr2:arr1).push({label:"Patient Age",value:age})
  
  if(OtherPatientIDs)(arr1.length>arr2.length?arr2:arr1).push({label:"NRIC",value:OtherPatientIDs})
  
  //if(PatientBirthDate)(arr1.length>arr2.length?arr2:arr1).push({label:'Patient DOB',value:PatientBirthDate})
  
  
  
  if(ReferringPhysicianName)(arr1).push({label:"Referring Physician",value:ReferringPhysicianName})




const getBorderbyIndex=(index)=>{
  if(index==(arr1.length-1)){
    return [
      [true, false, false, true],
      [false, false, false, true],
      [false, false, false, true],
      [false, false, true, true],
    ] //last border;
  }
  else if(index==0){
    return [
      [true, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, true, false],
    ];//top border
  }
  return [
    [true, false, false, false], 
    [false, false, false, false],
    [false, false, false, false],
    [false, false, true, false],
  ]; //mid border
 }

 let data= arr1.map((_,index)=>{
  let borders=getBorderbyIndex(index);
  if(arr1[index]?.label?.includes('Referring Physician')){
    return [{
        text: arr1[index].label||'',
        border:borders[0]
        },
        {
        text: arr1[index].value||'',
        border:[false, false, true, true],
        colSpan:3,
        },{
          text:'',
          border:[false,false,false,true]
        },{
          text:'',
          border:[false,false,true,true]
        }
       ]
  
  }
  return [
    
      {
        text: arr1[index]?.label||'',
        border:borders[0]
      },
      {
        text: arr1[index]?.value||'',
        border:borders[1]
      },
      {
        text: arr2[index]?.label||'',
        border:borders[2]
      },
      {
        text: arr2[index]?.value||'',
        border:borders[3]
      }
   ]
  
 })
  return data
}

async function GeneratePDF(report_data) {
  const {
    logo,
    patient_name,
    patient_id,
    study_type,
    study_date,
    text1,
    text2,
    image,
    table,
    text,
    signature,
    addendumby,
    addendum_at,
    practicing_no,
    accesor,
    is_addebdum,
    PatientSex,
    ReferringPhysicianName,
    OtherPatientIDs,
    usg_no,
    type,
    age,
    PatientBirthDate,
  }=report_data;
  let dd = {
    background: {
      image: await getBase64ImageFromURL(WaterMark),
      width: 400,
      alignment: "center",
      opacity: 0.2,
      absolutePosition: { y: 300 },
    },
    pageMargins: [ 40, 190, 40, 60 ], //[left, top, right, bottom] #pdf-margin
    header: [
      {
        image: await getBase64ImageFromURL(logo),
        fit: [400, 80], //tukar report template - change logo size
        alignment: "center",
        margin: [0, 10, 0, 10],//logo margins
      },
      {
       style: "tableExample",
       width: "100%",
       margin: [40, 0, 40, 10],
       lineHeight: 1.0,
       table: {
         widths: ["auto","*","auto","*"],
         margin: [40, 10, 40, 10],
         body: [
          [{
            text: `Patient Name `,
            colSpan:1,
            border: [true, true, false, false],
            margin: [0, 5, 0, 0]
          },{
            text: patient_name,
            colSpan:3,
            border: [false, true, true, false],
            margin: [0, 5, 0, 0]
          },{
            text:'',
            border: [false, true, false, false],
          },{
            text:'',
            border: [false, true, true, false],
          }],
          [{
            text: `Study Modality `,
            colSpan:1,
            border: [true, false, false, false],
          },{
            text:study_type,
            colSpan:3,
            border: [false, false, true, false],
            // margin: [0, 2, 0, 0]
          },
          {
            text:'',
            border: [false, false, false, false],
          },{
            text:'',
            border: [false, false, true, false],
          }],
           ...generateHeader(patient_id,study_date,PatientSex,usg_no,accesor,OtherPatientIDs,ReferringPhysicianName)
         ],
       }, 
     },
   ],
    ///do not 
    content: [
      ...getReportFormate(
        text1,
        text2,
        text,
        image,
        table,
        signature,
        addendum_at,
        addendumby,
        practicing_no,
        is_addebdum
      ),
    ], //tukar report template - footer
    /*footer: [
      {
        text: "AFFAZ HEALTHCARE GROUP SDN BHD - (1351230-H)",
        alignment: "center",
        fontSize: 7,
        bold: true,
      },
      {
        text: "A wholly owned subsidiary of U.n.i. Klinik Bandar Baru Bangi",
        fontSize: 5,
        alignment: "center",
      },
      {
        text: "B-G-03 & C-G-3A, Street Mall, Jalan Gerbang Wawasan 1, Bangi Gateway, Seksyen 15, 43650 Bandar Baru Bangi, Selangor",
        fontSize: 6,
        alignment: "center",
      },
      {
        text: "Phone : +60389223067 & +60389124087 or WhatsApp : +601159123067",
        fontSize: 7,
        alignment: "center",
      },
    ],*/
    defaultStyle: {
      alignment: "left",
      fontSize: 10,
      fontFamily: "Roboto",
      color: "#000",
      lineHeight: 1.2,
    },
  };
  const pdfDocGenerator = pdfMake.createPdf(dd);
  if(type=='preview'){
    pdfDocGenerator.open();
  }
  else if(type=='blob'){
    return new Promise((resolve, reject) => {
      pdfDocGenerator.getBlob((blob) => {
        resolve(blob.arrayBuffer());
      });
    });

  }
  else{
   pdfDocGenerator.download(`${patient_name}.pdf`);
  }
  
}

export default GeneratePDF;
