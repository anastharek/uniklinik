var nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

function formateDateStr(str) {
  //20220728
  if (!str) return "";
  return `${str?.slice(6)}/${str?.slice(4, 6)}/${str?.slice(0, 4)}`;
}

const formatDate = (date) => {
  //date object (new Date())
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();
  return `${day}/${month}/${year}`;
};

// Example usage:
//const myDate = new Date();
//const formattedDate = formatDate(myDate);
//console.log(formattedDate); // Output: "07/05/2023"

//Tukar email - email admin
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "admin@padimedical.com", //check correct, make sure use admin padimedical
    pass: "uibdmtvomxpzmhuo", //check correct, make sure correct security gmail - 2 step verification
  },
});

// point to the template folder
const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("./email-templates/"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./email-templates/"),
};

// use a template file with nodemailer
transporter.use("compile", hbs(handlebarOptions));

function registration_mail_admin(username, email, department) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ["anastharek@padimedical.com","admin@padimedical.com"], //tukar email - superadmin email
    subject: "New user registered please take a look",
    template: "new_account", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      username: username,
      user_profile_link: "",
    },
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function request_advance_imagin_mail(
  hospital_email,
  patient_name,
  patient_email,
  patient_id,
  patient_phone,
  study_type,
  request_date,
  text,
  is_consern
) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ["anastharek@padimedical.com","admin@padimedical.com", hospital_email, patient_email], //tukar email - customer email
    subject: `New request of advance report imaging for ${patient_name} (${study_type}) done on ${request_date}`,
    template: "request-imagin", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name,
      patient_email,
      patient_id,
      patient_phone,
      study_type,
      request_date,
      text,
      is_consern,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function request_report_mail_admin(
  pname,
  pid,
  study_type,
  report_type,
  text,
  study_date,
  radiologist_email,
  practicing_no,
  req_by,
  department
) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: radiologist_email
      ? ["anastharek@padimedical.com", radiologist_email]
      : ["anastharek@padimedical.com","admin@padimedical.com"], //tukar email - email radiologist
    subject: `New request reporting for ${pname} (${study_type}) done on ${study_date}`,
    attachments: [
      //tukar email - tutup attachment kalau bukan stroke
      {
        filename: "Universitas-Putra-Malaysia.png",
        path: "./email-templates/images/Universitas-Putra-Malaysia.png",
        cid: "logo",
      },
    ],
    template: "request-report-v2", // tukar email - tukar template kepada 'request-report'
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name: pname,
      patient_id: pid,
      study_type: study_type,
      report_type: report_type,
      text: text,
      study_date,
      practicing_no,
      req_by,
      department,
    },
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function request_report_done(
  pname,
  pid,
  study_type,
  report_type,
  text,
  study_date
) {
  var mailOptions = {
    from: "admin@padimedical.com", //tukar email - superadmin email
    to: ["anastharek@padimedical.com","admin@padimedical.com"], //tukar email - add customer email
    subject: `Report of ${pname} (${study_type}) done on ${study_date} is ready`,
    template: "request-report-done", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name: pname,
      patient_id: pid,
      study_type: study_type,
      report_type: report_type,
      text: text,
      study_date,
    },
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function registration_mail_user(email) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: email, // list of receivers
    subject: "Welcome",
    template: "register", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
    },
  };

  // trigger the sending of the E-mail
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: " + info.response);
  });
}

function userApproved_mail(email, username) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: email, // list of receivers
    subject: "You account has been approved",
    template: "approve", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      username: username,
      email: email,
      login_url: "https://padimedical.com/",
      site_url: "https://padimedical.com/",
    },
  };

  // trigger the sending of the E-mail
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: " + info.response);
  });
}

function set_password_email(email, link) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: email, // list of receivers
    subject: "Reset your password",
    template: "reset_password", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      password_reset_link: link,
      admin_email: "admin@padimedical.com",
    },
  };

  // trigger the sending of the E-mail
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: " + info.response);
  });
}

function delete_account_user(email) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: email, // list of receivers
    subject: "Your account has been deleted",
    template: "delete-account", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      admin_email: "admin@padimedical.com",
    },
  };

  // trigger the sending of the E-mail
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: " + info.response);
  });
}

function assign_doctor(req_user, pname, study_type, study_date, doctor_email) {
  study_date = formateDateStr(study_date);
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [doctor_email], //tukar put here admins email
    subject: `${req_user} has assign a  case to you  - ${pname} done ${study_type} on ${study_date}`,
    template: "patient-assign", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name: pname,
      study_type: study_type,
      study_date,
      req_user,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function finalize_addendum_report_email(req_user, pname, study_type, study_date,type) {
  study_date = formateDateStr(study_date);
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ['anastharek@padimedical.com'], //tukar put here admins email
    subject: `${req_user} has ${type} a  case of  - ${pname} done ${study_type} on ${study_date}`,
    template: "report-finalize-addendum", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name: pname,
      study_type: study_type,
      study_date,
      req_user,
      type
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}



function request_scan_mail_to_doctor(
  pname,
  patient_id,
  doctor_email,
  req_user,
  clinic_name,
  indication,
  study_description,
  date,
  modality
) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [doctor_email], //tukar put here admins email
    subject: `${req_user} has assign a  case to you for scan - ${pname}-${patient_id} `,
    template: "request-scan-doctor", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name: pname,
      clinic_name: clinic_name,
      indication: indication,
      patient_id: patient_id,
      study_description: study_description,
      date: formatDate(date),
      user: req_user,
      modality,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function request_scan_mail_to_admin(
  pname,
  patient_id,
  doctor_email,
  req_user,
  clinic_name,
  indication,
  study_description,
  date,
  modality
) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ["admin@padimedical.com", "anastharek@padimedical.com"], //tukar put here admins email
    subject: `${req_user} has assign a  ${doctor_email} for scan - ${pname}-${patient_id} `,
    template: "request-scan-admin", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name: pname,
      clinic_name: clinic_name,
      indication: indication,
      patient_id: patient_id,
      study_description: study_description,
      date: formatDate(date),
      modality: modality,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function request_feature_mail(
  patient_name,
  patient_id,
  study_type,
  study_date,
  hospital,
  radiologist,
  request_type,
  indication,
  recipient
) {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ["admin@padimedical.com", "anastharek@padimedical.com",...recipient], //tukar put here admins email
    subject: `Hospital ${hospital} has request a form for ${patient_name}-${patient_id}`,
    template: "request-feature", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      patient_name:patient_name,
      patient_id:patient_id,
      study_type:study_type,
      study_date:study_date,
      hospital:hospital,
      radiologist:radiologist,
      request_type:request_type,
      indication:indication,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function send_inventory_notification(
  item_name,
  item_code,
  stock_id,
  qty,
  vendor_name,
  manufacure_name,
  category_name,
  location_name,
  exp_date
){
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ["anastharek@padimedical.com"], //tukar put here admins email
    subject: `${item_name} has reach minimum quantity limit ${new Date().toLocaleDateString()}`,
    template: "inventory-notification", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      item_name,
      item_code,
      stock_id,
      qty,
      vendor_name,
      manufacure_name,
      category_name,
      location_name,
      exp_date:new Date(exp_date).toLocaleDateString(),
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  }); 
}
function send_limit_notification(role_name){
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: ["anastharek@padimedical.com"], //tukar put here admins email
    subject: `maximum limit reached for ${role_name}`,
    template: "role-limit-reached", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      role_name:role_name,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  }); 
}

const send_free_dataset_subscription = (email, dataset_name, owner_name,no_of_dataset) => {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [email], //tukar put here admins email
    subject: `Thank you for subscribing to ${dataset_name}`,
    template: "free-subscription-user", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
      owner_name:owner_name,
      no_of_dataset:no_of_dataset
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  }); 
}

const send_free_dataset_subscription_owner_admin = (owner_email, dataset_name, user_name,user_email,user_phone) => {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [owner_email,"anastharek@padimedical.com"], //tukar put here admins email
    subject: `User has subscribe to free dataset (${dataset_name})`,
    template: "free-subscription-admin-owner", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
      name:user_name,
      email:user_email,
      phone:user_phone
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });  
}

const dataset_request_owner = (owner_email, dataset_name, user_name,user_email,user_phone) => {

  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [owner_email,"anastharek@padimedical.com"], //tukar put here admins email
    subject: `There is request of your dataset ${dataset_name}`,
    template: "dataset-request-admin", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
      name:user_name,
      email:user_email,
      phone:user_phone
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  }); 
}

const dataset_request_user= (email, dataset_name, owner_name,no_of_dataset) => {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [email], //tukar put here admins email
    subject: `Thank you for subscribing to ${dataset_name}`,
    template: "dataset-request-user", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
      owner_name:owner_name,
      no_of_dataset:no_of_dataset
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}


const send_email_dataset_request_accepted_user= (email,
dataset_name
) => {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [email], //tukar put here admins email
    subject: `Dataset request has been accepted.`,
    template: "dataset-request-accept-user", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

const send_email_dataset_request_accepted_owner=(
  owner_email,
  dataset_name,
  user_name,
  user_email,
  user_phone,
)=>{
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [owner_email], //tukar put here admins email
    subject: `Users Dataset request has been accepted.`,
    template: "dataset-request-accept-owner", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
      name:user_name,
      email:user_email,
      phone:user_phone
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

const send_email_dataset_request_rejected_user= (email,
dataset_name
) => {
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [email], //tukar put here admins email
    subject: `Dataset request has been rejected.`,
    template: "dataset-request-rejected-user", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
 }

const send_email_dataset_request_rejected_owner=(
  owner_email,
  dataset_name,
  user_name,
  user_email,
  user_phone,
)=>{
  var mailOptions = {
    from: "admin@padimedical.com", //check correct, make sure use admin padimedical
    to: [owner_email], //tukar put here admins email
    subject: `Users Dataset request has been rejected.`,
    template: "dataset-request-rejected-owner", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke", //tukar email - nama hospital
      dataset_name:dataset_name,
      name:user_name,
      email:user_email,
      phone:user_phone
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

const assign_dataset_to_user= (email,name)=>{
  var mailOptions = {
    from: "admin@padimedical.com",
    to: [email],
    subject: `You have been assigned a dataset`,
    template: "assign-dataset", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke",
      dataset_name:name
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

const send_otp_mail= (email,otp)=>{
  var mailOptions = {
    from: "admin@padimedical.com",
    to: [email],
    subject: `OTP verification code for your padimedical account`,
    template: "otp", // the name of the template file i.e email.handlebars
    context: {
      site_name: "stroke",
      otp_code: otp
    },
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

module.exports = {
  assign_dataset_to_user,
  registration_mail_admin,
  registration_mail_user,
  request_feature_mail,
  userApproved_mail,
  set_password_email,
  delete_account_user,
  request_report_mail_admin,
  request_report_done,
  request_advance_imagin_mail,
  assign_doctor,
  request_scan_mail_to_doctor,
  request_scan_mail_to_admin,
  finalize_addendum_report_email,
  send_inventory_notification,
  send_limit_notification,
  send_free_dataset_subscription,
  send_free_dataset_subscription_owner_admin,
  dataset_request_owner,
  dataset_request_user,
  send_email_dataset_request_accepted_user,
  send_email_dataset_request_accepted_owner,
  send_email_dataset_request_rejected_user,
  send_email_dataset_request_rejected_owner,
  send_otp_mail
};

