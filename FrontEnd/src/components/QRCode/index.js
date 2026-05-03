import { useState,useRef, useEffect } from "react";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { Col, Row } from "react-bootstrap";
import "../CreateReport/OpenSans-Regular-normal";
import { QRCode } from "react-qrcode-logo";
import { Button } from "@material-ui/core";
import logo from "../../assets/images/logo-2.jpg";
import jsPDF from "jspdf";


const CustomeQRCode=({value,onClose})=>{
const [show,setShow]=useState(true);
const [doc,setDoc]=useState(null);


useEffect(()=>{
  setTimeout(()=>{
    generateCard()
  },[1000])
  
},[value])
const qrCodeRef = useRef(null);

const generateCard = async () => {
  // console.log(this.props)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [120, 110],
    compress: true,
  });
const addWrappedText = ({
  url,
  text,
  textWidth,
  doc,
  fontSize = 14,
  fontType = "normal",
  lineSpacing = 7,
  xPosition = 10,
  initialYPosition = 10,
  pageWrapInitialYPosition = 10,
}) => {
  const textLines = doc.splitTextToSize(text, textWidth); // Split the text into lines
  const pageWidth = doc.internal.pageSize.width; // Get page height, well use this for auto-paging
  if (fontType === "bold") doc.setFont(fontType, "bold");
  else doc.setFont(fontType);
  doc.setFontSize(fontSize);

  let cursorY = initialYPosition;

  doc.text(pageWidth / 2, cursorY, textLines, { align: "center" });
  if (url) {
    doc.link(0, cursorY - 10, textWidth, 20, { url });
  }
};


  const el = document.getElementById("testqr");
  const canvas = el.children[0];
  const dataURL = canvas.toDataURL("image/jpeg,1.0");
  doc.addImage(dataURL, "JPEG", 15, 5, 90,90);
  addWrappedText({
    text: `Stock ID : ${value}`,
    textWidth: 280,
    doc,
    // Optional
    fontSize: "5",
    fontType: "OpenSans-Regular",
    lineSpacing: 7, // Space between lines
    xPosition: 50, // Text offset from left of document
    initialYPosition: 105, // Initial offset from top of document; set based on prior objects in document
    pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
  });

 // doc.autoPrint();
  setDoc(doc)
};


const downloadDoc = async () => {
  await doc.save();
};

return(
    <Modal
    show={show}
    onHide={onClose}
    onClick={(e) => e.stopPropagation()}
    size="lg"
  >
    <Modal.Header closeButton>
      <Modal.Title>Inventory QR</Modal.Title>
    </Modal.Header>
    <Modal.Body className="text-dark">
      <Row style={{ textAlign: "center", }}>
        <Col style={{display:'none'}} id="testqr">
          <QRCode
           key={value}
            ref={qrCodeRef}
            size={300}
            logoWidth={200}
            logoHeight={50}
            logoOpacity={0.6}
            value={value?.toString()}
            logoImage={logo}
          />
        </Col>
        <br />
        {doc !== null && (
              <div>
                <h3>Preview</h3>
                <iframe
                  style={{ border: "none", height: 260, width: "100%" }}
                  src={doc.output("bloburl")}
                ></iframe>
              </div>
            )}
        <Button
          onClick={downloadDoc}
        >
          Download QR 
        </Button>
      </Row>
    </Modal.Body>
  </Modal>   
)
}
export default CustomeQRCode;