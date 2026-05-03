import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import { Col, Row } from "react-bootstrap";
import MD5 from "crypto-js/md5";
import jsPDF from "jspdf";
import "../CreateReport/OpenSans-Regular-normal";
import WallpaperCard from "../../assets/images/wallpaper-card.png";
import PadiLogoTransparent from "../../assets/images/padi-logo-transparent.png"; // card - logo
import PadiLogoTransparent1 from "../../assets/images/padi-logo-transparent1.png";
import { QRCode } from "react-qrcode-logo";
import { Button } from "@material-ui/core";
import logo from "../../assets/images/logo-2.jpg";

export default class ModalCardShareUpload extends Component {
  state = {
    doc: null,
  };

  constructor(props) {
    super(props);
  }

  generateCard = async () => {
    // console.log(this.props)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [248, 160],
      compress: true,
    });
    await this.addImageToDoc(doc, WallpaperCard);
    let { imgWidth,
      imgHeight,
      x,
      y}=await new Promise((resolve,reject)=>{
      let img=new Image()
      img.src=PadiLogoTransparent1;
      img.onload=()=>{
        const imgHeight = 50;// Adjust the height of the image as needed
        const imgWidth=(imgHeight*img.width)/ img.height; 
        const x = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
        const y =10;
        resolve({
          imgWidth,
          imgHeight,
          x,
          y
        })
      }
    })
    await this.addImageToDoc(doc, PadiLogoTransparent1, x, y, imgWidth, imgHeight); ////tukar share card - logo size(Right left), 10(up down), 125(scale width), 85(scaling height)

    this.addWrappedText({
      text: "Username : " + this.props.username, // Put a really long string here
      textWidth: 200,
      doc,
      // Optional
      fontSize: "10",
      fontType: "OpenSans-Regular",
      lineSpacing: 7, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 80, // Initial offset from top of document; set based on prior objects in document
      pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
    });
    this.addWrappedText({
      text: "Password : " + this.props.password, // Put a really long string here
      textWidth: 200,
      doc,
      // Optional
      fontSize: "10",
      fontType: "OpenSans-Regular",
      lineSpacing: 7, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 95, // Initial offset from top of document; set based on prior objects in document
      pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
    });
    this.addWrappedText({
      url: window.location.origin+"/login",
      text: "Click Here To Upload  ",
      textWidth: 180,
      doc,

      // Optional
      fontSize: "12",
      fontType: "bold",
      lineSpacing: 2, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 120, // Initial offset from top of document; set based on prior objects in document
    });
    this.addWrappedText({
      text:`${window.location.origin+"/login"}`,
      textWidth: 240,
      doc,
      // Optional
      fontSize: "12",
      fontType: "bold",
      lineSpacing: 8, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 135, // Initial offset from top of document; set based on prior objects in document
    });
    this.setState({ doc });
  };


  addImageToDoc = async (
    doc,
    src,
    posx = 0,
    posy = 0,
    width = 250,
    height = 250
  ) => {
    const img = new Image();
    img.crossOrigin = "";
    img.src = src;
    await img.decode();
    doc.addImage(img, "png", posx, posy, width, height, "", "FAST");
  };

  addWrappedText = ({
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

  downloadDoc = async () => {
    await this.state.doc.save(`uploader-card.pdf`);
  };

  handleExpiryChange=(e)=>{
    this.setState({expiry:e.target.value})
  }

  render = () => {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        onClick={(e) => e.stopPropagation()}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Share</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark">
          <Row style={{ textAlign: "center" }}>
            <Col id="testqr" style={{ display: "none" }}>
              <QRCode
                size={300}
                logoWidth={200}
                logoHeight={50}
                logoOpacity={0.6}
                value={this.OHIFLink + this.props.StudyInstanceUID}
                logoImage={logo}
              />
            </Col>
            {this.state.doc !== null && (
              <div>
                <h3>Preview</h3>
                <iframe
                  style={{ border: "none", height: 260, width: "100%" }}
                  src={this.state.doc.output("bloburl")}
                ></iframe>
              </div>
            )}
            <br />
            <Button onClick={this.generateCard}>Generate PDF card</Button>
            <br />
            <Button
              disabled={this.state.doc === null}
              onClick={this.downloadDoc}
            >
              Download PDF card
            </Button>
          </Row>
        </Modal.Body>
      </Modal>
    );
  };
}
