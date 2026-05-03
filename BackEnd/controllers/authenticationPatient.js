const { default: axios } = require("axios");
const RegisteredPatient = require("../model/RegisteredPatient");
const Role = require("../model/Roles");
const { send_otp_mail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");

const getOTP = async (req, res) => {
  try {
    const { patientId, contact } = req.body;
    const email = contact && contact.includes("@") ? contact : null;
    let phone = contact && !contact.includes("@") ? contact : null;
    //formate phone number to malaysia formate igore country code and spaces
    if (phone) {
      phone = phone.replace(/\s+/g, "");
      if (phone.startsWith("+60")) {
        phone = phone.slice(2);
      } else if (phone.startsWith("60")) {
        phone = phone.slice(1);
      }
    }
    if (!patientId || !email && !phone) {
      return res
        .status(400)
        .json({ message: "patientId and email or phone are required" });
    }
    const existsPatient = await RegisteredPatient.checkPatientExists(
      email, phone
    );
    if (!existsPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (existsPatient.otp_createdAt) {
      const currentTime = new Date();
      const otpCreatedAt = new Date(existsPatient.otp_createdAt);
      const timeDiff = Math.abs(currentTime - otpCreatedAt);
      const diffSeconds = Math.floor(timeDiff / 1000);
      if (diffSeconds < 30) {
        return res
          .status(400)
          .json({ message: "Please wait 30 seconds before requesting a new OTP" });
      }
    }
    const otp = await RegisteredPatient.generateOTP(patientId);
    if (!otp) {
      return res.status(500).json({ message: "Failed to generate OTP" });
    }
    console.log("OTP generated:", otp);
    if (email) {
      await send_otp_mail(email, otp);
    }else {
      const message = `Your One-Time Password (OTP) is ${otp} . It is valid for 5 minutes. Please do not share this OTP with anyone.`;
      let formattedPhone = phone.startsWith('0') ? phone.slice(1) : phone;
      await axios.get('https://ww3.isms.com.my/isms_send_all_id.php',{
        params: {
          un: 'mohdfazrin',
          pwd: 'Minicooper@12',
          dstno: '60'+formattedPhone,
          msg: message,
          type: 1,
          sendid: '10c8o8ed754idv3q2b28276lg0',
          agreedterm: 'YES'
        }
      })
      .then((res)=>console.log(res.data))
      .catch(console.warn);
    }
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in getOTP:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong, please try after some time." });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { patientId, contact, otp } = req.body;
    const email = contact && contact.includes("@") ? contact : null;
    let phone = contact && !contact.includes("@") ? contact : null;
    //formate phone number to malaysia formate igore country code and spaces
    if (phone) {
      phone = phone.replace(/\s+/g, "");
      if (phone.startsWith("+60")) {
        phone = phone.slice(2);
      } else if (phone.startsWith("60")) {
        phone = phone.slice(1);
      }
    }
    if (!patientId || !otp) {
      return res
        .status(400)
        .json({ message: "patientId and otp are required" });
    }
    const Patient = await RegisteredPatient.checkPatientExists(
      email, phone
    );
    if (!Patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const verifyOtp = await RegisteredPatient.verifyOTP(patientId, otp);
    if (!verifyOtp.status) {
      return res.status(400).json({ message: verifyOtp.message });
    }

    var TOKEN = jwt.sign(
      {
        id: Patient.id,
        username: Patient.patient_id,
        name: Patient.name,
        patient_id: Patient.patient_id,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "5h",
      }
    );

    res.cookie("tokenOrthancJs", TOKEN, { httpOnly: true });
    let payload = await Role.getPermission(Patient.role);
    payload = {
      ...payload.dataValues,
      username: Patient.patient_id,
      patient_name: Patient.name,
      email: Patient.email,
      role: Patient.role,
    };
    return res.json(payload);
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong, please try after some time." });
  }
};


module.exports = {
    getOTP,
    verifyOTP,
};