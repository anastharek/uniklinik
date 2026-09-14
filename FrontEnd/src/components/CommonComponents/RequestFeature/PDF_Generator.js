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


const generateHeader = (
  patient_id,
  study_date,
  PatientSex,
  usg_no,
  accesor,
  age,
  OtherPatientIDs,
  PatientBirthDate,
  ReferringPhysicianName
) => {
  let arr1 = [];
  let arr2 = [];
  if (patient_id) arr1.push({ label: "Patient ID", value: patient_id });

  if (study_date)
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "Study Date",
      value: study_date,
    });

  if (PatientSex)
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "Gender",
      value: PatientSex || "",
    });

  if (usg_no)
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "Study No.",
      value: usg_no,
    });

  if (accesor)
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "Study No.",
      value: accesor,
    });

  if (age && age !== "NA")
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "Patient Age",
      value: age,
    });

  if (OtherPatientIDs)
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "NRIC",
      value: OtherPatientIDs,
    });

  if (PatientBirthDate)
    (arr1.length > arr2.length ? arr2 : arr1).push({
      label: "Patient DOB",
      value: PatientBirthDate,
    });

  if (ReferringPhysicianName)
    arr1.push({ label: "Referring Physician", value: ReferringPhysicianName });

  const getBorderbyIndex = (index) => {
    if (index == arr1.length - 1) {
      return [
        [true, false, false, true],
        [false, false, false, true],
        [false, false, false, true],
        [false, false, true, true],
      ]; //last border;
    } else if (index == 0) {
      return [
        [true, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
        [false, false, true, false],
      ]; //top border
    }
    return [
      [true, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, true, false],
    ]; //mid border
  };

  let data = arr1.map((_, index) => {
    let borders = getBorderbyIndex(index);
    if (arr1[index]?.label?.includes("Referring Physician")) {
      return [
        {
          text: arr1[index].label || "",
          border: borders[0],
        },
        {
          text: arr1[index].value || "",
          border: [false, false, true, true],
          colSpan: 3,
        },
        {
          text: "",
          border: [false, false, false, true],
        },
        {
          text: "",
          border: [false, false, true, true],
        },
      ];
    }
    return [
      {
        text: arr1[index]?.label || "",
        border: borders[0],
      },
      {
        text: arr1[index]?.value || "",
        border: borders[1],
      },
      {
        text: arr2[index]?.label || "",
        border: borders[2],
      },
      {
        text: arr2[index]?.value || "",
        border: borders[3],
      },
    ];
  });
  return data;
};

async function GeneratePDF(report_data) {
  const { logo, 
    patient_name, 
    patient_id,
    study_type,
    request_type,
    study_date,
    hospital,
    radiologist ,
    type,
    indication,
} = report_data;
  let dd = {
    background: {
      image: await getBase64ImageFromURL(WaterMark),
      width: 400,
      alignment: "center",
      opacity: 0.2,
      absolutePosition: { y: 300 },
    },
    pageMargins: [40,130, 40, 60], //[left, top, right, bottom] #pdf-margin
    header: [
      {
        image: await getBase64ImageFromURL(logo),
        fit: [400, 80], //tukar report template - change logo size
        alignment: "center",
        margin: [0, 10, 0, 10], //logo margins
      },
    ],
    content: [
      {
        layout: "", // optional
        table: {
          // headers are automatically repeated if the table spans over multiple pages
          // you can declare how many rows should be treated as headers
          headerRows: 1,
          widths: ["*", "*"],
          body: [
            [
              {
                text: `Patient Name : ${patient_name} `,
                margin: [0, 14, 0, 14],
                lineHeight: 1,
                colSpan: 2,
                fontSize: 13,
              },
              "",
            ],
            [
              {
                text: `Patient ID : ${patient_id} `,
                margin: [0, 14, 0, 14],
                lineHeight: 1,
                colSpan: 1,
                fontSize: 13,
              },
              {
                text: `Study Date : ${study_date}`,
                margin: [0, 14, 0, 14],
                lineHeight: 1,
                colSpan: 1,
                fontSize: 13,
              },
            ],
            [  {
                text:`Study Type : ${study_type}`,
                margin: [0, 14, 0, 14],
                lineHeight:1,
                colSpan:1,
                fontSize:13,
              }, 
             {
                text:`Request Type : ${request_type} `,
                margin: [0, 14, 0, 14],
                lineHeight:1,
                colSpan:1,
                fontSize:13,
              }],
            [
              {
                text: `Hospital : ${hospital}`,
                margin: [0, 14, 0, 14],
                lineHeight: 1,
                colSpan: 2,
                fontSize: 13,
              },
              "",
            ],
            [
              {
                text: `Radiologist : ${radiologist}`,
                margin: [0, 14, 0, 14],
                lineHeight: 1,
                colSpan: 2,
                fontSize: 13,
              },
              "",
            ],
            [
              {
                text: `Indication : ${indication}`,
                margin: [0, 14, 0, 14],
                lineHeight: 1,
                colSpan: 2,
                fontSize: 13,
              },
              "",
            ],
          ],
        },
      },
    ],
    defaultStyle: {
      alignment: "justify",
      fontSize: 11,
      fontFamily: "Roboto",
      color: "#000",
      lineHeight: 1.5,
    },
  };
  const pdfDocGenerator = pdfMake.createPdf(dd);
  if (type == "preview") {
    pdfDocGenerator.open();
  } else {
    pdfDocGenerator.download(`${patient_name}.pdf`);
  }
}

export default GeneratePDF;
