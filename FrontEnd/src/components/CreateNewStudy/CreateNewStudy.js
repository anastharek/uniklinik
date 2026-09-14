import React from 'react'
import { Modal, FormControl, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import apis from '../../services/apis'
import activity from '../../services/activity'

class CreateNewStudy extends React.Component {

  state = {
    show: false,
    studyDescription: '',
    studyDate: '',
    creating: false,
  }

  // NOTE: must be a plain (non-class-field) method and is called in
  // componentDidMount — using it inside the `state = {...}` field initializer
  // throws `TypeError: this._todayISO is not a function`, which blanks the page.
  _todayISO() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  componentDidMount() {
    this.setState({ studyDate: this._todayISO() });
  }

  open = () => this.setState({ show: true })

  close = () => this.setState({ show: false })

  _blankImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 512);
    return canvas.toDataURL();
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

  createStudy = async () => {
    const { studyDescription, studyDate } = this.state;
    if (!studyDescription || !studyDescription.trim()) {
      toast.error('Study description is required');
      return;
    }
    const date = studyDate ? studyDate.replace(/-/g, '') : '';
    if (!date || date.length !== 8) {
      toast.error('Study date is required');
      return;
    }
    this.setState({ creating: true });
    try {
      // Find the patient Orthanc ID (parent of the selected study)
      const currentStudy = await apis.content.getStudiesDetails(this.props.orthancID);
      const patientID = currentStudy?.ParentPatient;
      if (!patientID) {
        toast.error('Could not locate the patient');
        return;
      }
      const tags = {
        StudyDescription: studyDescription.trim(),
        StudyDate: date,
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
        Modality: 'OT',
        SeriesDescription: studyDescription.trim(),
      };
      const response = await apis.importDicom.createDicom(this._blankImage(), patientID, tags);
      await this._assignToCurrentUser(response);
      toast.success('New study created successfully');
      this.setState({ show: false, studyDescription: '', studyDate: this._todayISO() });
      if (this.props.refresh) this.props.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create study');
    } finally {
      this.setState({ creating: false });
    }
  }

  render() {
    const { studyDescription, studyDate, creating } = this.state;
    return (
      <>
        <button className="dropdown-item bg-green" type="button" onClick={this.open}>
          Create New Study
        </button>
        <Modal
          show={this.state.show}
          onHide={this.close}
          onClick={(e) => e.stopPropagation()}
          size="md"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Study</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label>Study Description</label>
              <FormControl
                placeholder="Study Description"
                aria-label="Study Description"
                value={studyDescription}
                onChange={(e) => this.setState({ studyDescription: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label>Study Date</label>
              <FormControl
                type="date"
                aria-label="Study Date"
                value={studyDate}
                onChange={(e) => this.setState({ studyDate: e.target.value })}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.close}>Cancel</Button>
            <Button variant="primary" onClick={this.createStudy} disabled={creating}>
              {creating ? 'Creating…' : 'Create Study'}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default CreateNewStudy;
