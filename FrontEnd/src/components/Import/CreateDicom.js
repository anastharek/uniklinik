import React, { Component, createRef } from "react";
import Dropzone from "react-dropzone";
import apis from "../../services/apis";
import { TagTable } from "../CommonComponents/RessourcesDisplay/ReactTable/TagTable";
import { InputGroup } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { ModalPicEditor } from "../CreateDicom/ModalPicEditor";
import { toast } from "react-toastify";

import pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

import Images from "../../assets/images/images-removebg.png";
import {
  CircularProgressbar,
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import _ from "lodash";
import activity from "../../services/activity";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const REQUIRED_TAGS = [
  "PatientID",
  "PatientName",
  "SeriesDescription",
  "StudyDescription",
];

function Separator(props) {
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        transform: `rotate(${props.turns}turn)`,
      }}
    >
      <div style={props.style} />
    </div>
  );
}

function ProgressBar({ count }) {
  return (
    <>
      <div
        style={{
          width: "100%",
          maxWidth: "300px",
          height: "8px",
          background: "#e1e4e8",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            backgroundSize: "300% 100%",
            width: `${count}%`,
            background: "gold",
          }}
        ></span>
      </div>
      <span style={{ display: "inline-block", marginLeft: "2%" }}>
        {count} % uploaded
      </span>
    </>
  );
}

function RadialSeparators(props) {
  const turns = 1 / props.count;
  return _.range(props.count).map((index) => (
    <Separator turns={index * turns} style={props.style} />
  ));
}

export default class CreateDicom extends Component {
  constructor(props) {
    super(props);
    this.pdfCanvas = createRef();
  }

  state = {
    isDragging: false,
    tags: [],
    newTag: "",
    files: [],
    uploadState: "Selected",
    showEditor: false,
    uploadCount: 0,
    loadCount: 0,
    totalUpload: 0,
  };

  dragListener = (dragStarted) => {
    this.setState({ isDragging: dragStarted });
  };

  _getTags = () => {
    let tags = {};
    this.state.tags.forEach((tag) => {
      if (tag.Value !== "[auto]" && !tag.Value.startsWith("[inherited]")) {
        tags[tag.TagName] = tag.Value;
      }
    });
    return tags;
  };

  _checkDicomTags = () => {
    let ok = true;
    this.state.tags.forEach((tag) => {
      if (
        REQUIRED_TAGS.includes(tag.TagName) &&
        (!tag.Value || tag.Value.length < 1)
      ) {
        ok = false;
        toast.error(tag.TagName + " should be filled");
      }
    });
    return ok;
  };

  createDicom = async () => {
    if (!this._checkDicomTags()) {
      return;
    }
    if (this.state.files.length < 1) {
      toast.error("No files selected");
      return;
    }
    const images = await this._getUniformImages();
    try {
      this.setState({
        uploadState: "Uploading",
      });
      let response = await apis.importDicom.createDicom(
        images[0],
        this.props.OrthancID,
        this._getTags()
      );
      await Promise.all(
        images.slice(1).map((image) => {
          apis.importDicom.createDicom(image, response.ParentSeries, {});
        })
      ).then((res) => {
        res.map((element, index) => {
          this.setState((state) => {
            return { uploadCount: index + 1 };
          });
        });
        this.setState((state) => {
          return { uploadCount: ++state.uploadCount };
        });
      });
      this.setState({
        uploadState: "Uploaded",
      });
      
      let patient_id = this.state.tags.filter(
        ({ TagName }) => TagName === "PatientID"
      )[0]?.Value;
      let patient_name = this.state.tags.filter(
        ({ TagName }) => TagName === "PatientName"
      )[0]?.Value;
      toast.success(
        `Dicoms successfully created (Series : ${response.ParentSeries})`
      );
      activity.create_activity("CREATE IMPORT", { patient_id, patient_name });
    } catch (error) {
      this.setState({
        uploadState: "Failed To Upload",
      });
      toast.error("Dicoms creation failed");
      console.log(error);
    }
  };

  async componentDidMount() {
    // console.log(this.props)
    let tags = [
      ...(this.props.level === "studies"
        ? await apis.content
            .getStudiesDetails(this.props.OrthancID)
            .then((response) => [
              ...Object.entries(response?.MainDicomTags||{}).map(
                ([TagName, Value]) => ({
                  TagName,
                  Value: "[inherited] " + Value,
                  deletable: false,
                  editable: false,
                })
              ),
              ...Object.entries(response?.PatientMainDicomTags||{}).map(
                ([TagName, Value]) => ({
                  TagName,
                  Value: "[inherited] " + Value,
                  deletable: false,
                  editable: false,
                })
              ),
            ])
        : [
            {
              TagName: "StudyInstanceUID",
              Value: "[auto]",
              deletable: false,
              editable: false,
            },
            {
              TagName: "StudyDescription",
              Value: "",
              deletable: false,
              editable: true,
            },
            ...(this.props.level === "patients"
              ? await apis.content
                  .getPatientDetails(this.props.OrthancID)
                  .then((response) =>
                    Object.entries(response?.MainDicomTags||{}).map(
                      ([TagName, Value]) => ({
                        TagName,
                        Value:
                          (TagName !== "PatientID" ? "[inherited] " : "") +
                          Value,
                        deletable: false,
                        editable: false,
                      })
                    )
                  )
              : [
                  {
                    TagName: "PatientID",
                    Value: "",
                    deletable: false,
                    editable: true,
                  },
                  {
                    TagName: "PatientName",
                    Value: "",
                    deletable: false,
                    editable: true,
                  },
                ]),
          ]),
      {
        TagName: "SeriesInstanceUID",
        Value: "[auto]",
        deletable: false,
        editable: false,
      },
      {
        TagName: "SOPClassUID",
        Value: "1.2.840.10008.5.1.4.1.1.7",
        deletable: false,
        editable: true,
      },
      {
        TagName: "SeriesDescription",
        Value: "",
        deletable: false,
        editable: true,
      },
    ];
    if(!tags.some(tag=>tag.TagName==="AccessionNumber")){
      tags.push({
        TagName: 'AccessionNumber',
        Value: '',
        deletable: false,
        editable: true
      });
    }
    if(!tags.some(tag=>tag.TagName==="Modality")){
      tags.push({
        TagName: 'Modality',
        Value: '',
        deletable: false,
        editable: true
      });
    }
    this.setState({
      tags,
    });
  }

  __pFileReader = (file) => {
    return new Promise((resolve, reject) => {
      let fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = () => {
        resolve(fr);
      };
    });
  };

  _getPageBlob = (pdf, pageNum) => {
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
          viewport.width ||
          viewport.viewBox[2]; /* viewport.width is also NaN */
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

  _toImages = (file) => {
    return new Promise((resolve, reject) => {
      let fr = new FileReader();
      fr.readAsBinaryString(file);
      fr.onload = () => {
        //  console.log(fr)
        resolve(fr);
      };
    }).then(({ result }) => {
      // console.log(result)
      return pdfjsLib
        .getDocument({ data: result })
        .promise.then(async (pdf) => {
          //   console.log(pdf)
          let pageImage = [];
          for (let i = 0; i < pdf.numPages; i++) {
            let img = await this._getPageBlob(pdf, i);
            img.name = `${file.name}(${i})`;
            pageImage.push(img);
          }
          this.setState((state) => {
            return state.loadCount == state.totalUpload
              ? {}
              : { loadCount: state.loadCount + 1 };
          });
          return pageImage;
        });
    });
  };

  _getUniformImages = async () => {
    const images = await Promise.all(
      this.state.files.map((file) => createImageBitmap(file))
    );
    let targetWidth = Math.max(...images.map((img) => img.width));
    let targetHeight = Math.max(...images.map((img) => img.height));
    // console.log(images.map(img => img.width));
    // console.log(`resizing to (${targetWidth},${targetHeight})`);
    return images.map((img) =>
      this._resizeImage(img, targetWidth, targetHeight)
    );
  };

  _resizeImage = (image, targetWidth, targetHeight) => {
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

  handleDrop = async (files) => {
    this.setState({ totalUpload: files.length });
    this.setState({
      files: (
        await Promise.all(
          files.map(async (file) =>
            file.type === "application/pdf" ? await this._toImages(file) : file
          )
        )
      ).flat(),
      uploadState: "Selected",
      loadCount: files.length,
    });
  };

  handleDataChange = (oldValue, newValue, row, column) => {
    let tags = [...this.state.tags];
    if (column === "Value") {
      tags.find((x) => x.TagName === row.TagName)[column] = newValue;
    } else {
      tags = tags.filter((x) => x.TagName !== row.TagName);
    }
    this.setState({
      tags,
    });
  };

  handleNewTagChange = (e) => {
    this.setState({ newTag: e.target.value });
  };

  handleNewTag = (e) => {
    let tags = [...this.state.tags];
    tags.push({
      TagName: this.state.newTag,
      Value: "",
    });
    this.setState({
      tags,
      newTag: "",
    });
  };

  handleHide = () => {
    this.setState({
      showEditor: false,
    });
  };

  handleEditorSave = (blob, idx) => {
    let files = this.state.files;
    files[idx] = blob;
    this.setState({
      files,
    });
  };

  render = () => {
    return (
      <div>
        <Dropzone
          accept={"application/pdf, image/jpeg, image/png"}
          onDragEnter={() => this.dragListener(true)}
          onDragLeave={() => this.dragListener(false)}
          onDrop={this.handleDrop}
          multiple
        >
          {({ getRootProps, getInputProps }) => (
            <section>
              <div
                className={
                  this.state.isDragging || !!this.state.files.length
                    ? "dropzone dz-parsing"
                    : "dropzone"
                }
                {...getRootProps()}
              >
                <div
                  class="responsive"
                  style={{ width: "114px", position: "relative", left: "41%" }}
                >
                  <img
                    src={Images}
                    width="300px"
                    height="300px"
                    text-align="center"
                  ></img>
                  <div
                    style={{
                      position: "absolute",
                      top: "31%",
                      left: "76%",
                      width: 130,
                    }}
                  >
                    <div>
                      <CircularProgressbarWithChildren
                        value={(
                          100 *
                            (this.state.uploadCount /
                              this.state.files.length) || 0
                        ).toFixed(2)}
                        text={`${(
                          100 *
                            (this.state.uploadCount /
                              this.state.files.length) || 0
                        ).toFixed(2)}%`}
                        strokeWidth={10}
                        styles={buildStyles({
                          strokeLinecap: "butt",
                        })}
                      >
                        <RadialSeparators
                          count={12}
                          style={{
                            background: "#fff",
                            width: "2px",
                            height: `${10}%`,
                          }}
                        />
                      </CircularProgressbarWithChildren>
                    </div>
                  </div>
                </div>
                <input {...getInputProps()} />
                <div
                  className={
                    "d-flex flex-column justify-content-center align-items-center h-100"
                  }
                >
                  <p style={{ "line-height": "normal" }}>
                    {this.state.files.length
                      ? `${this.state.uploadState} ${
                          this.state.files.length > 1
                            ? this.state.files.length + " files"
                            : "one file"
                        } `
                      : "Drop png, jpeg or pdf"}
                  </p>

                  {this.state.files.length ? (
                    <Button
                      onClick={(e) => {
                        this.setState({
                          showEditor: true,
                        });
                        e.stopPropagation();
                      }}
                    >
                      {"Open Editor"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>
          )}
        </Dropzone>
        {0 == this.state.totalUpload ? (
          ""
        ) : (
          <div
            style={{
              display: "flex",
              margin: "30px auto",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ProgressBar
              count={(
                100 * (this.state.loadCount / this.state.totalUpload) || 0
              ).toFixed(2)}
            />
          </div>
        )}
         <div className={"w-100 d-flex justify-content-between my-4"}>
          <InputGroup>
            <InputGroup.Text>{"Add Tag"}</InputGroup.Text>
            <input
              onChange={this.handleNewTagChange}
              value={this.state.newTag}
            />
            <Button type={"submit"} onClick={this.handleNewTag}>
              {"+"}
            </Button>
          </InputGroup>
          <Button
            className="btn otjs-button otjs-button-blue"
            style={{width:180}}
            type={"submit"}
            onClick={this.createDicom}
            disabled={this.state.files.length < 1}
          >
            {"Create DICOM"}
          </Button>
        </div>
        <ModalPicEditor
          files={this.state.showEditor ? this.state.files : null}
          onHide={this.handleHide}
          onSave={this.handleEditorSave}
        />
        <TagTable data={this.state.tags} onDataUpdate={this.handleDataChange} />
      </div>
    );
  };
}
