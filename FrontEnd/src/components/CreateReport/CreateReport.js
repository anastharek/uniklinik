import React from 'react'
import { InputGroup, Row, Col, FormControl } from 'react-bootstrap'
import Button from 'react-bootstrap/Button'
import { toast } from 'react-toastify'
import { connect } from 'react-redux'
import apis from '../../services/apis'
import activity from '../../services/activity'
import jsPDF from 'jspdf'

import pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import './OpenSans-Regular-normal';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const REQUIRED_TAGS = ['PatientID', 'PatientName', 'StudyDescription']

class CreateReportComponent extends React.Component {

  state = {
    tags: [],
    files: [],
    reportDetails: '',
    showMoreMetadata: false
  }

  _getTags = () => {
    let tags = {};
    this.state.tags.forEach(tag => {
      if (tag.Value && tag.Value !== '[auto]' && !tag.Value.startsWith("[inherited]")) {
        tags[tag.TagName] = tag.Value;
      }
    })
    return tags;
  }

  _todayDicomDate = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}${mm}${dd}`;
  }

  _assignToCurrentUser = async (response) => {
    try {
      const { roles } = this.props;
      if (!response || !response.ParentStudy || !roles || !roles.username) {
        return;
      }
      const studyDetails = await apis.content.getStudiesDetails(response.ParentStudy);
      const patient_name = studyDetails?.PatientMainDicomTags?.PatientName || '';
      const patient_id = studyDetails?.PatientMainDicomTags?.PatientID || '';
      const StudyInstanceUID = studyDetails?.MainDicomTags?.StudyInstanceUID || '';
      const study_date = studyDetails?.MainDicomTags?.StudyDate || '';
      const study_id = studyDetails?.ID || response.ParentStudy;
      const study_type = studyDetails?.MainDicomTags?.StudyDescription || '';
      const accesor = studyDetails?.MainDicomTags?.AccessionNumber || '';
      const doctors = [roles.uploader_of
        ? `Dr. ${roles.uploader_of_name} (${roles.uploader_of})`
        : `Dr. ${roles.firstname} (${roles.username})`];
      await apis.caseList.assignDoctor(
        study_id,
        patient_name,
        patient_id,
        accesor,
        study_type,
        study_date,
        doctors,
        StudyInstanceUID
      );
      activity.create_activity("IMPORT", { patient_name, patient_id });
    } catch (error) {
      console.error('Failed to auto-assign study to user', error);
    }
  }

  handleNewTagChange = (e) => {
    this.setState({ newTag: e.target.value })
  }

  handleNewTag = (e) => {
    let tags = [...this.state.tags];
    tags.push({
      'TagName': this.state.newTag,
      Value: '',
    })
    this.setState({
      tags,
      newTag: ''
    })
  }

  _checkReportTags = () => {
    let ok = true;
    this.state.tags.forEach((tag) => {
      if (REQUIRED_TAGS.includes(tag.TagName) && (!tag.Value || tag.Value.length < 1)) {
        ok = false;
        toast.error(tag.TagName + ' should be filled');
      }
    })
    return ok;
  }

  _getPageBlob = (pdf, pageNum) => {
    return new Promise((resolve, reject) => {
      pdf.getPage(pageNum + 1).then(page => {
        const scale = "1.5";
        const viewport = page.getViewport({
          scale: scale
        });
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d');
        canvas.height = viewport.height || viewport.viewBox[3]; /* viewport.height is NaN */
        canvas.width = viewport.width || viewport.viewBox[2];  /* viewport.width is also NaN */
        page.render({
          canvasContext, viewport
        }).promise.then((res) => {
          canvas.toBlob((result) => {
            resolve(result)
          });
        })
      })
    })
  }

  _toImages = file => {
    return new Promise((resolve, reject) => {
      let fr = new FileReader()
      fr.readAsBinaryString(file)
      fr.onload = () => {
        resolve(fr)
      }
    }).then(({ result }) => {
      return pdfjsLib.getDocument({ data: result }).promise.then(async (pdf) => {
        let pageImage = []
        for (let i = 0; i < pdf.numPages; i++) {
          let img = await this._getPageBlob(pdf, i);
          img.name = `${file.name}(${i})`
          pageImage.push(img);
        }
        return pageImage;
      })
    })
  }

  _resizeImage = (image, targetWidth, targetHeight) => {
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    canvas.height = targetHeight;
    canvas.width = targetWidth;

    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(0, 0, targetWidth, targetHeight)
    canvasContext.drawImage(image, (targetWidth - image.width) / 2, (targetHeight - image.height) / 2, image.width, image.height)
    return canvas.toDataURL()
  }

  _getUniformImages = async (files) => {
    const images = await Promise.all(files.map(file => createImageBitmap(file)));
    let targetWidth = Math.max(...images.map(img => img.width));
    let targetHeight = Math.max(...images.map(img => img.height));
    //console.log(images.map(img => img.width));
    // console.log(`resizing to (${targetWidth},${targetHeight})`);
    return images.map(img => this._resizeImage(img, targetWidth, targetHeight));
  }

  addWrappedText = ({ text, textWidth, doc, fontSize = 14, fontType = 'normal', lineSpacing = 7, xPosition = 10, initialYPosition = 10, pageWrapInitialYPosition = 10 }) => {
    const textLines = doc.splitTextToSize(text, textWidth); // Split the text into lines
    const pageHeight = doc.internal.pageSize.height;        // Get page height, well use this for auto-paging
    doc.setFont(fontType);
    doc.setFontSize(fontSize);

    let cursorY = initialYPosition;

    textLines.forEach(lineText => {
      if (cursorY > pageHeight) { // Auto-paging
        doc.addPage();
        cursorY = pageWrapInitialYPosition;
      }
      doc.text(xPosition, cursorY, lineText);
      cursorY += lineSpacing;
    })
  }

  createReport = async () => {
    if (!this._checkReportTags()) {
      return;
    }
    if (this.state.reportDetails === '') {
      toast.error('No report content selected');
      return;
    }
    const doc = new jsPDF()
    this.addWrappedText({
      text: this.state.reportDetails, // Put a really long string here
      textWidth: 210,
      doc,

      // Optional
      fontSize: '14',
      fontType: 'OpenSans-Regular',
      lineSpacing: 7,               // Space between lines
      xPosition: 10,                // Text offset from left of document
      initialYPosition: 10,         // Initial offset from top of document; set based on prior objects in document
      pageWrapInitialYPosition: 10  // Initial offset from top of document when page-wrapping
    });
    const file = new File([doc.output('blob')], 'report.pdf')
    const fileImages = await this._toImages(file)
    const images = await this._getUniformImages(fileImages)
    try {
      this.setState({
        uploadState: "Uploading"
      });
      let response = await apis.importDicom.createDicom(images[0], this.props.OrthancID, this._getTags());
      for (const image of images.slice(1)) {
        await apis.importDicom.createDicom(image, response.ParentSeries, {})
      }
      this.setState({
        uploadState: 'Uploaded'
      });
      await this._assignToCurrentUser(response);
      toast.success(`Reports successfully created (Series : ${response.ParentSeries})`);
    } catch (error) {
      this.setState({
        uploadState: 'Failed To Upload'
      });
      toast.error('Reports creation failed');
      console.log(error);
    }
  }

  async componentDidMount() {
    let tags = [
      ...(this.props.level === "studies" ?
        await apis.content.getStudiesDetails(this.props.OrthancID).then(response => [
          ...(Object.entries(response.MainDicomTags).map(([TagName, Value]) =>
          ({
            TagName,
            Value: '[inherited] ' + Value,
            deletable: false,
            editable: false
          })
          )),
          ...(Object.entries(response.PatientMainDicomTags).map(([TagName, Value]) =>
          ({
            TagName,
            Value: '[inherited] ' + Value,
            deletable: false,
            editable: false
          })
          )),
        ]) :
        [
          {
            TagName: 'StudyInstanceUID',
            Value: '[auto]',
            deletable: false,
            editable: false
          },
          {
            TagName: 'StudyDescription',
            Value: '',
            deletable: false,
            editable: true
          },
          {
            TagName: 'StudyDate',
            Value: this._todayDicomDate(),
            deletable: false,
            editable: true
          },
          {
            TagName: 'NRIC',
            Value: '',
            deletable: false,
            editable: true
          },
          
          ...(this.props.level === "patients" ?
            await apis.content.getPatientDetails(this.props.OrthancID).then(response => (Object.entries(response.MainDicomTags).map(([TagName, Value]) =>
            ({
              TagName,
              Value: (TagName !== 'PatientID' ? '[inherited] ' : '') + Value,
              deletable: false,
              editable: false
            })
            ))) :
            [
              {
                TagName: 'PatientID',
                Value: '',
                deletable: false,
                editable: true
              },
              {
                TagName: 'PatientName',
                Value: '',
                deletable: false,
                editable: true
              }
            ]),
        ]
      ),
      {
        TagName: 'SeriesInstanceUID',
        Value: '[auto]',
        deletable: false,
        editable: false
      }, {
        TagName: 'SOPClassUID',
        Value: '1.2.840.10008.5.1.4.1.1.7',
        deletable: false,
        editable: true
      },
      {
        TagName: 'SeriesDescription',
        Value: '',
        deletable: false,
        editable: true
      },
    ]
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
      tags
    })
  }

  render() {
    const { tags, showMoreMetadata, reportDetails } = this.state;

    const getValue = (tagName) => {
      const t = tags.find(x => x.TagName === tagName);
      return t ? t.Value : '';
    };
    const setValue = (tagName, value) => {
      this.setState({
        tags: tags.map(t => t.TagName === tagName ? { ...t, Value: value } : t)
      });
    };

    const primaryTags = ['PatientName', 'PatientID', 'StudyDescription', 'StudyDate'];
    const extraTags = ['NRIC', 'Modality', 'AccessionNumber', 'SeriesDescription', 'SOPClassUID'];
    const isAutoOrInherited = (t) => t.Value === '[auto]' || String(t.Value).startsWith('[inherited]');
    const customTags = tags.filter(t =>
      !primaryTags.includes(t.TagName) &&
      !extraTags.includes(t.TagName) &&
      !isAutoOrInherited(t)
    );

    const field = (label, tagName) => (
      <div className="mb-3">
        <FormControl
          placeholder={label}
          aria-label={label}
          value={getValue(tagName)}
          onChange={(e) => setValue(tagName, e.target.value)}
        />
      </div>
    );

    const dateField = (label, tagName) => {
      const raw = getValue(tagName);
      const iso = raw && raw.length === 8
        ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
        : '';
      return (
        <div className="mb-3">
          <FormControl
            type="date"
            aria-label={label}
            value={iso}
            onChange={(e) => setValue(tagName, e.target.value.replace(/-/g, ''))}
          />
        </div>
      );
    };

    return (
      <Row className="pb-3">
        <InputGroup style={{ marginBottom: 20 }}>
          <InputGroup.Text>Study details</InputGroup.Text>
          <FormControl onChange={({ target }) => this.setState({ reportDetails: target.value })} rows={8} as="textarea" aria-label="Report details" />
        </InputGroup>

        <Row className="mb-3">
          <Col md={3}>{field('Patient Name', 'PatientName')}</Col>
          <Col md={3}>{field('Patient ID', 'PatientID')}</Col>
          <Col md={3}>{field('Study Description', 'StudyDescription')}</Col>
          <Col md={3}>{dateField('Study Date', 'StudyDate')}</Col>
        </Row>

        <div className="mb-3">
          <Button variant="outline-secondary" onClick={() => this.setState({ showMoreMetadata: !showMoreMetadata })}>
            {showMoreMetadata ? '−' : '+'} Additional metadata
          </Button>
        </div>

        {showMoreMetadata && (
          <Row className="mb-3">
            <Col md={4}>{field('NRIC', 'NRIC')}</Col>
            <Col md={4}>{field('Modality', 'Modality')}</Col>
            <Col md={4}>{field('Accession Number', 'AccessionNumber')}</Col>
            <Col md={4}>{field('Series Description', 'SeriesDescription')}</Col>
            <Col md={4}>{field('SOP Class UID', 'SOPClassUID')}</Col>
          </Row>
        )}

        {customTags.length > 0 && (
          <Row className="mb-3">
            {customTags.map(t => (
              <Col md={4} key={t.TagName}>{field(t.TagName, t.TagName)}</Col>
            ))}
          </Row>
        )}

        <div className={"w-100 d-flex justify-content-between otjs-button"}>
          <InputGroup style={{ maxWidth: 480 }}>
            <InputGroup.Text>{"Add Tag"}</InputGroup.Text>
            <input onChange={this.handleNewTagChange} value={this.state.newTag} />
            <Button type={"submit"} onClick={this.handleNewTag}>{'+'}</Button>
          </InputGroup>
          <Button type={"submit"} onClick={this.createReport}
            disabled={reportDetails === ''}>{'Create Report'}</Button>
        </div>
      </Row>
    )
  }
}

const mapStateToProps = (state) => ({
  roles: state.PadiMedical.roles,
});

export const CreateReport = connect(mapStateToProps)(CreateReportComponent);
export default CreateReport;