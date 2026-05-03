import apis from "../services/apis";
import pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const upladToDicom = async (blob, patient_name, id) => {
  new Promise((resolve, reject) => {
    try {
      pdfjsLib.getDocument({ data: blob }).promise.then(async (pdf) => {
        let pageImage = [];
        for (let i = 0; i < pdf.numPages; i++) {
          let img = await _getPageBlob(pdf, i);
          img.name = `${patient_name} (${i}).png`;
          pageImage.push(img);
        }
        await createDicom(pageImage, id);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

const _getPageBlob = (pdf, pageNum) => {
  return new Promise((resolve, reject) => {
    pdf.getPage(pageNum + 1).then((page) => {
      const scale = "1.5";
      const viewport = page.getViewport({
        scale: scale,
      });
      const canvas = document.createElement("canvas");
      const canvasContext = canvas.getContext("2d");
      canvas.height =
        viewport.height || viewport.viewBox[3]; /* viewport.height is NaN */
      canvas.width =
        viewport.width || viewport.viewBox[2]; /* viewport.width is also NaN */
      page
        .render({
          canvasContext,
          viewport,
        })
        .promise.then((res) => {
          canvas.toBlob((result) => {
            resolve(result);
          });
        });
    });
  });
};

const createDicom = async (imagesData, id) => {
  const images = await _getUniformImages(imagesData);
  try {
    let response = await apis.importDicom.createDicom(images[0], id, {});
    await Promise.all(
      images.slice(1).map((image) => {
        apis.importDicom.createDicom(image, response.ParentSeries, {});
      })
    );
  } catch (error) {
    throw error;
  }
};

const _getUniformImages = async (imagesFile) => {
  const images = await Promise.all(imagesFile.map((file) => createImageBitmap(file)));
  let targetWidth = Math.max(...images.map((img) => img.width));
  let targetHeight = Math.max(...images.map((img) => img.height));
  return images.map((img) => _resizeImage(img, targetWidth, targetHeight));
};

const _resizeImage = (image, targetWidth, targetHeight) => {
  const canvas = document.createElement("canvas");
  const canvasContext = canvas.getContext("2d");
  canvas.height = targetHeight;
  canvas.width = targetWidth;
  canvasContext.fillStyle = "black";
  canvasContext.fillRect(0, 0, targetWidth, targetHeight);
  canvasContext.drawImage(
    image,
    (targetWidth - image.width) / 2,
    (targetHeight - image.height) / 2,
    image.width,
    image.height
  );
  return canvas.toDataURL();
};
