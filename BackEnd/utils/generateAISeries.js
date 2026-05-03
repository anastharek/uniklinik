const axios = require("axios");
const FormData = require("form-data");
const moment = require("moment");

const GenerateSeries = async (cookies,url,series,studyID,name,SeriesDescription,modality) => {
  function getBase64(url) {
    return axios
      .get(url, {
        responseType: "arraybuffer",
      })
      .then((response) =>
        Buffer.from(response.data, "binary").toString("base64")
      );
  }
  try {
    const response = await axios({
      url: `http://127.0.0.1:4000/api/tools/create-media-extended/`, // replace with your download URL
      method: "POST", // POST method for downloading
      responseType: "arraybuffer",
      data: {
        Synchronous: true,
        Resources: series,
      },
      headers: {
        "Content-Type": "application/json", // or any other content type you need
        "systemtoken":cookies.tokenOrthancJs
      },
    });
    let formData = new FormData();
    formData.append("file", response.data, "downloaded-file.zip");
    let temp_url = url
      .replace("127.0.0.1", "host.docker.internal")
      .replace("localhost", "host.docker.internal");
    let aiResponse = await axios.post(temp_url + "/api/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Content-Length": formData.getLengthSync(),
      },
    });
    if (!aiResponse.data?.processed_images?.length) {
      toast.error("No images processed");
    }
    let payload = [];
    let images = [];
    if (aiResponse.data?.processed_images) {
      images = aiResponse.data?.processed_images.sort((a, b) => {
        let numA = parseInt(a.match(/IM(\d+)_processed\.jpg/)?.[1]||a.match(/IM(\d+)_summary\.jpg/)?.[1]);
        let numB = parseInt(b.match(/IM(\d+)_processed\.jpg/)?.[1]||b.match(/IM(\d+)_summary\.jpg/)?.[1]);
        return numA - numB;
      });
    }
    for (let processedImage of images) {
      let base64 = await getBase64(temp_url + "/" + processedImage);
      base64 = "data:image/jpeg;base64," + base64;
      payload.push({ Content: base64 });
    }
    await axios.post("http://localhost:4000/api/tools/create-dicom", {
      Content: payload,
      Parent: studyID,
      SeriesDescription: `${SeriesDescription||'NEW'} (${name||'AI'} ${moment().format("DD-MMM-YYYY HH:mm A")})`,
      SOPClassUID: "1.2.840.10008.5.1.4.1.1.7",
      Tags: {
        SeriesDescription: `${SeriesDescription||'NEW'} (${name||'AI'} ${moment().format("DD-MMM-YYYY HH:mm A")})`,
        SOPClassUID: "1.2.840.10008.5.1.4.1.1.7",
        Modality:modality||"DX",
      },
    },{
        headers: {
            "Content-Type": "application/json",
            "systemtoken":cookies.tokenOrthancJs
        }
    });
    let folderName = aiResponse.data.processed_images[0].split("/")[1];
    await axios.delete(temp_url + "/api/uploads", {
      data: { files: [folderName] },
    });
  } catch (err) {
     throw new Error(err)
  }
};


module.exports = GenerateSeries;