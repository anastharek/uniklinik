import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import { Col, Row } from "react-bootstrap";
import MD5 from "crypto-js/md5";
import jsPDF from "jspdf";
import "../CreateReport/OpenSans-Regular-normal";
import WallpaperCard from "../../assets/images/wallpaper-card.png";
import PadiLogoTransparent from "../../assets/images/padi-logo-transparent.png"; //tukar share card - logo
import PadiLogoTransparent1 from "../../assets/images/padi-logo-transparent1.png";
import { QRCode } from "react-qrcode-logo";
import { Box, Button, MenuItem, Select, TextField } from "@material-ui/core";
import logo from "../../assets/images/logo-2.jpg";
import apis from "../../services/apis";

export default class ModalCardShareButtonDownloadLight extends Component {
  state = {
    doc: null,
    expiry:'year',
    duration:100,
    encryptedLink:'',
  };

  constructor(props) {
    super(props);
    this.DownloadLink = `${window.location.protocol}//${window.location.host}/external/download-light/`; //changes made by rishabh (25-05-2022)
    this.ViewLink = `${window.location.protocol}//${window.location.host}/external/stone/`;
  }

  generateCard = async () => {
    let res=await apis.cryptography.encrypt(`${this.props.StudyInstanceUID}---${this.props.orthancID}`,this.state.expiry,this.state.duration)
    this.setState({encryptedLink: this.ViewLink  + res.data})
    // console.log(this.props)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [248, 180],
      precision: 1,
      compress: true,
    });
    const IDs = res.data.split(".");
    const slicedPwd = MD5(IDs.pop()).toString();
    this.PWD = slicedPwd.slice(slicedPwd.length - 8);
    await this.addImageToDoc(doc, WallpaperCard);
    await this.addImageToDoc(doc, PadiLogoTransparent1, 120, 10, 125, 85); ////tukar share card - logo size(Right left), 10(up down), 125(scale width), 85(scaling height)); ()
    const el = document.getElementById("testqr");
    const canvas = el.children[0];
    const dataURL = canvas.toDataURL("image/jpeg,1.0");
    doc.addImage(dataURL, "JPEG", 10, 10, 85, 85);

    this.addWrappedText({
      text: `${this.props.pname}`
      .replaceAll("  ", " ")
      .replaceAll("^", " "), // Put a really long string here
      
      textWidth: 400,
      doc,
      // Optional
      fontSize: "8",
      fontType: "OpenSans-Regular",
      lineSpacing: 7, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 110, // Initial offset from top of document; set based on prior objects in document
      pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
    });

    this.addWrappedText({
      text: "(" + `${this.props.pid}` + ")"
        , // Put a really long string here
      textWidth: 280,
      doc,
      // Optional
      fontSize: "5",
      fontType: "OpenSans-Regular",
      lineSpacing: 7, // Space between lines
      xPosition: 50, // Text offset from left of document
      initialYPosition: 125, // Initial offset from top of document; set based on prior objects in document
      pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
    });

    // this.addWrappedText({
    //   text: `${this.props.pid} -- ${
    //     this.props.StudyDescription || "No Description"
    //   }`, // Put a really long string here
    //   textWidth: 280,
    //   doc,
    //   // Optional
    //   fontSize: "10",
    //   fontType: "OpenSans-Regular",
    //   lineSpacing: 7, // Space between lines
    //   xPosition: 50, // Text offset from left of document
    //   initialYPosition: 140, // Initial offset from top of document; set based on prior objects in document
    //   pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
    // });

    this.addWrappedText({
      text: "Access Code: " + this.PWD, // Put a really long string here
      textWidth: 200,
      doc,
      // Optional
      fontSize: "10",
      fontType: "OpenSans-Regular",
      lineSpacing: 7, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 138, // Initial offset from top of document; set based on prior objects in document
      pageWrapInitialYPosition: 10, // Initial offset from top of document when page-wrapping
    });
    this.addWrappedText({
      url: this.ViewLink + res.data,
      text: "Click Here To View  ",
      textWidth: 180,
      doc,

      // Optional
      fontSize: "12",
      fontType: "bold",
      lineSpacing: 7, // Space between lines
      xPosition: 70, // Text offset from left of document
      initialYPosition: 155, // Initial offset from top of document; set based on prior objects in document
    });

    this.addWrappedText({
      url: `${this.DownloadLink}${res.data}---${this.props.orthancID}`, //change by rishabh 3.3.2023
      text: "Click Here To Download ",
      textWidth: 240,
      doc,

      // Optional
      fontSize: "12",
      fontType: "bold",
      lineSpacing: 7, // Space between lines
      xPosition: 60, // Text offset from left of document
      initialYPosition: 170, // Initial offset from top of document; set based on prior objects in document
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
    fontWeight,
  }) => {
    const textLines = doc.splitTextToSize(text, textWidth); // Split the text into lines
    const pageWidth = doc.internal.pageSize.width;
    //    const pageHeight = doc.internal.pageSize.height; // Get page height, well use this for auto-paging
    if (fontType === "bold") doc.setFont(fontType, "bold");
    else doc.setFont(fontType);
    doc.setFontSize(fontSize);
    let cursorY = initialYPosition;
    doc.text(pageWidth / 2, cursorY, textLines, { align: "center" });
    // doc.text(xPosition, cursorY, textLines, { textAlign: "center" });
    if (url) {
      doc.link(0, cursorY - 10, textWidth, 20, { url });
    }
  };
  //tukar share card name - detele `${this.props.pname}-${this.props.pid}` - tukar dgn nama yang kita nak
  downloadDoc = async () => {
    await this.state.doc.save(`${this.props.pname}-${this.props.pid}`);
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
                value={this.state.encryptedLink}
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
            <Box sx={{display:'flex',margin:'auto',justifyContent:'center',alignItems:'center',my:2}}>
              <TextField style={{fontSize:'0.9rem',width:'50px'}} label='expiry' placeholder="Enter Expiry" value={this.state.duration}
              onChange={e=>this.setState({duration:e.target.value})}
              />
              <Select
                label="Age"
                placeholder="Label"
                value={this.state.expiry}
                style={{padding:'0px',margin:0,height:'40px',marginLeft:'20px',fontSize:'0.8rem',marginBottom:-10}}
                variant="outlined"
                onChange={this.handleExpiryChange}
              >
                <MenuItem value={'hr'}>HR</MenuItem>
                <MenuItem value={'day'}>DAY</MenuItem>
                <MenuItem value={'month'}>MONTH</MenuItem>
                <MenuItem value={'year'}>YEAR</MenuItem>
              </Select>
            </Box>
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
