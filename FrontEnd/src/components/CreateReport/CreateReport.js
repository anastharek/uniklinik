import React from 'react'
import { InputGroup, Row, FormControl } from 'react-bootstrap'
import { TagTable } from '../CommonComponents/RessourcesDisplay/ReactTable/TagTable'
import Button from 'react-bootstrap/Button'
import { toast } from 'react-toastify'
import apis from '../../services/apis'
import jsPDF from 'jspdf'

import pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import './OpenSans-Regular-normal';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const REQUIRED_TAGS = ['PatientID', 'PatientName', 'SeriesDescription', 'StudyDescription']

export class CreateReport extends React.Component {

  state = {
    tags: [],
    files: [],
    reportDetails: ''
  }

  handleDataChange = (oldValue, newValue, row, column) => {
    let tags = [...this.state.tags];
    if (column === 'Value') {
      tags.find(x => x.TagName === row.TagName)[column] = newValue;
    } else {
      tags = tags.filter(x => x.TagName !== row.TagName);
    }
    this.setState({
      tags
    })
  }

  _getTags = () => {
    let tags = {};
    this.state.tags.forEach(tag => {
      if (tag.Value !== '[auto]' && !tag.Value.startsWith("[inherited]")) {
        tags[tag.TagName] = tag.Value;
      }
    })
    return tags;
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
    return (
      <Row className="pb-3">
        <InputGroup style={{ marginBottom: 20 }}>
          <InputGroup.Text>Study details</InputGroup.Text>
          <FormControl onChange={({ target }) => this.setState({ reportDetails: target.value })} rows={8} as="textarea" aria-label="Report details" />
        </InputGroup>
        <TagTable data={this.state.tags} onDataUpdate={this.handleDataChange} />
        <div className={"w-100 d-flex justify-content-between otjs-button"}>
          <InputGroup>
            <InputGroup.Text>{"Add Tag"}</InputGroup.Text>
            <input onChange={this.handleNewTagChange} value={this.state.newTag} />
            <Button type={"submit"} onClick={this.handleNewTag}>{'+'}</Button>
          </InputGroup>
          <Button type={"submit"} onClick={this.createReport}
            disabled={this.state.reportDetails === ''}>{'Create Report'}</Button>
        </div>
      </Row>
    )
  }
}