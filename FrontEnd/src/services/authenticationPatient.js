import axios from "axios";

const authenticationPatient = {

  sendOtp( patientId, contact) {
    return axios.post('/api/authentication/patient/get-otp',{
      patientId: patientId,
      contact: contact
    })
  },
  verifyOTP(patientId, contact,otp) {
    return axios.post('/api/authentication/patient/verify-otp', {
      otp: otp,
      patientId: patientId,
      contact: contact
    });
  }
}

export default authenticationPatient;