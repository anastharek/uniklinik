const crypto = require("../adapter/cryptoAdapter");
const {
  OTJSNotFoundException,
  OTJSBadRequestException,
} = require("../Exceptions/OTJSErrors");
const Ldap = require("./Ldap");
const Role = require("../repository/Role");
const User = require("../repository/User");
const Option = require("../repository/Option");
const DistantUser = require("../repository/DistantUser");
const { send_limit_notification } = require("../utils/mailer");

class Users {
  constructor(username) {
    this.username = username;
    this.ldapUser = false;

    //if contain @, called User is from LDAP
    if (this.username.indexOf("@") !== -1) {
      this.ldapUsername = this.username;
      if (this.username.indexOf("@") === 0) {
        this.username = this.username.substr(1);
        this.ldapUsername = this.username;
      } else {
        this.username = this.username.split("@")[0];
      }
      this.ldapUser = true;
    }
  }

  _getUserEntity() {
    return User.getUser(this.username)
      .then((entity) => {
        if (!entity) {
          throw new OTJSNotFoundException("Not Found");
        } else {
          return entity;
        }
      })
      .catch((error) => {
        throw error;
      });
  }

  

  isAdmin() {
    return this._getUserEntity()
      .then((user) => user.super_admin)
      .catch((error) => {
        throw error;
      });
  }

  isActive() {
    return this._getUserEntity()
      .then((user) => user.is_active)
      .catch((error) => {
        throw error;
      });
  }

  checkLocalPassword(plainPassword) {
    return this._getUserEntity()
      .then((user) => {
        return crypto.compare(plainPassword, user.password);
      })
      .catch((error) => {
        throw error;
      });
  }

  getAuthenticationMode() {
    return Option.getOneAuthenticationMode();
  }

  static async checkRoleLimit(name){
    let role=await Role.getRoleByName(name)
    if(!role?.limit){
      return true;
    }
    let allUserCount=await User.getUserAllCountByRole(name)
    if(allUserCount>=role.limit){
      return false;
    }
    return true;
  }

  async checkPassword(plainPassword) {
    let option = await this.getAuthenticationMode();
    if (option.ldap && this.ldapUser) {
      //LDAP user
      return await Ldap.authenticateUser(
        this.ldapUsername,
        plainPassword
      ).catch((error) => {
        throw error;
      });
    } else {
      //Local user
      return await this.checkLocalPassword(plainPassword).catch((error) => {
        throw error;
      });
    }
  }

  static async createUser(
    username,
    firstname,
    lastname,
    email,
    password,
    role,
    super_admin,
    is_active,
    department = null,
    practicing_no,
    phone,
    place,
    uploader_of,
    plain_password,
    accepted_toc=false,
  ) {
    if (username.indexOf("@") !== -1)
      throw new OTJSBadRequestException(
        "@ not allowed for local username definition"
      );

    var hash = crypto.hash(password, 16);
    try {
      return User.create(
        username,
        firstname,
        lastname,
        email,
        hash,
        role,
        super_admin,
        is_active,
        department,
        (practicing_no = practicing_no),
        (phone = phone),
        (place = place),
        uploader_of,
        plain_password,
        accepted_toc=accepted_toc,
      );
    } catch (e) {
      throw new OTJSBadRequestException(e.toString());
    }
  }
  static async getUploader(username){
    return await User.getUploader(username)
  }

  static async toggleActive(username) {
    return User.toggleActive(username);
  }

  static async deleteUser(username) {
    let user = new Users(username);

    if (await user.isAdmin()) {
      let superUserCount = await User.findAndCountAllSuperUser();
      if (superUserCount <= 1) throw "Can't delete last super user";
    }

    await User.delete(username);
  }

  static async getRadiologist() {
    let users = await User.getRadiogist();
    return users;
  }

  static async getUserbyEmail(email) {
    let user = await User.getUserbyEmail(email);
    return user;
  }

  static async getUserbyUsername(username) {
    let user = await User.getUserbyUsername(username);
    return user;
  }

  static async getActiveUserCount(){
    return await User.getActiveUserCount();
  }

  static async modifyProfile(
    username,
    firstname,
    lastname,
    practicing_no,
    place,
    signature,
    profile_image,
    doctor_description
  ) {
    if (username.indexOf("@") !== -1) throw "@ is forbiden";

    let user = new Users(username);
    const mod = await user._getUserEntity();
    mod.firstname = firstname;
    mod.lastname = lastname;
    mod.practicing_no = practicing_no;
    mod.place = place;
    if (signature) {
      mod.signature = signature;
    }
    if (profile_image) {
      mod.profile_image = profile_image;
    }
    if ((doctor_description?.trim() || "") == "") {
      doctor_description = null;
    }
    mod.doctor_description = doctor_description;
    await mod.save();
  }

  static async deleteSignature(username) {
    let user = new Users(username);
    const mod = await user._getUserEntity();
    mod.signature = null;
    await mod.save();
  }

  static async deleteProfile(username) {
    let user = new Users(username);
    const mod = await user._getUserEntity();
    mod.profile_image = null;
    await mod.save();
  }

  static async modifyUser(
    username,
    firstname,
    lastname,
    password,
    email,
    role,
    isSuperAdmin,
    department,
    phone,
    practicing_no,
    place,
    plain_password,
  ) {
    if (username.indexOf("@") !== -1) throw "@ is forbiden";

    let user = new Users(username);

    if ((await user.isAdmin()) && role !== "admin")
      throw new OTJSBadRequestException("Can't modify superAdmin's role");

    const mod = await user._getUserEntity();
    if(username) mod.username = username;
    if(firstname) mod.firstname = firstname;
    if(lastname) mod.lastname = lastname;
    if(isSuperAdmin) mod.super_admin = isSuperAdmin;
    if(email) mod.email = email;
    if(department) mod.department = department;
    if(phone) mod.phone = phone;
    if(practicing_no) mod.practicing_no = practicing_no;
    if(place) mod.place = place;
    if (password !== null) {
      try {
        mod.password = crypto.hash(password, 16);
      } catch (error) {
        throw error;
      }
    }
    if(plain_password){
      mod.plain_password=plain_password;
    }

    if(role && mod.role!==role) {
      let res=await this.checkRoleLimit(role)
      if(!res){
        send_limit_notification(role);
        throw  new OTJSBadRequestException("You have exceeded your role of in this pacs system. Please get in touch with Padimedical admin to allow us to add another user to this role.");
      }
      mod.role = role
    };
    await mod.save();
  }

  static async getActiveUsers(username) {
    let userEntities = await User.getActiveUser(username);
    let usersAnswer = [];
    userEntities.forEach((user) => {
      usersAnswer.push({
        id: user.id,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        superAdmin: user.super_admin,
        is_active: user.is_active,
        department: user.department,
        practicing_no: user.practicing_no,
        phone: user.phone,
        place: user.place,
        accepted_toc: user.accepted_toc,
      });
    });
    return usersAnswer;
  }

  static async getInActiveUsers() {
    let userEntities = await User.getInActiveUser();
    let usersAnswer = [];
    userEntities.forEach((user) => {
      usersAnswer.push({
        id: user.id,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        superAdmin: user.super_admin,
        is_active: user.is_active,
        department: user.department,
        practicing_no: user.practicing_no,
        phone: user.phone,
        place: user.place,
        accepted_toc: user.accepted_toc,
      });
    });
    return usersAnswer;
  }

  getLocalUserRight() {
    //add
    return this._getUserEntity().then((user) => {
      return Role.getRole(user.role);
    });
  }

  async getLDAPUserRight() {
    //Get Ldap Group having a local role correspondance
    const ldapMatches = await DistantUser.getAllLocalRoleAndLdapGroup();

    //Flatten known LdapGroup in Array
    let knownLdapGroups = ldapMatches.map((match) => {
      return match.ldap_group;
    });

    //Get user's group from LDAP
    let userLdapGroups = await Ldap.getGroupMembershipForUser(
      this.ldapUsername
    );

    let role = {
      import: false,
      content: false,
      anon: false,
      export_local: false,
      export_extern: false,
      query: false,
      auto_query: false,
      delete: false,
      modify: false,
      cd_burner: false,
      create_report: false,
      sharing: false,
      card_sharing: false,
      admin: false,
      premium: false,
      create_patient_report: false,
      edit_patient_report: false,
      view_patient_report: false,
      request_patient_report: false,
      can_finalize_report: false,
      view_request_report: false,
      delete_req_report: false,
      can_change_report_status: false,
      report_with_pdf: false,
      delete_imagin: false,
      view_imagin: false,
      can_req_imaging: false,
      can_add_radiologist_email: false,
      can_view_assign_caselist: false,
      can_view_admin_caselist: false,
      can_assign_doctors: false,
      can_download_zip: false,
      can_add_table: false,
      can_download_zip: false,
      share_card_download: false,
      meddream: false,
      view_and_download_light: false,
      can_delete_request_scan:false,
      can_add_logo:false,
      can_search_institution:false,
      can_register_patient:false,
      can_view_appointment:false,
      can_view_demographic:false,
    };

    //Loop user's group until we found a known group having a local role
    for (let i = 0; i < userLdapGroups.length; i++) {
      //Get and return the first match
      if (knownLdapGroups.includes(userLdapGroups[i].cn)) {
        let local_role = ldapMatches.filter((match) => {
          return match.ldap_group === userLdapGroups[i].cn;
        });

        //get Role data and return it to controller
        let currentRole = await Role.getRole(local_role[0].local_role);
        if (role.import === false) role.import = currentRole.import;
        if (role.content === false) role.content = currentRole.content;
        if (role.anon === false) role.anon = currentRole.anon;
        if (role.export_local === false)
          role.export_local = currentRole.export_local;
        if (role.export_extern === false)
          role.export_extern = currentRole.export_extern;
        if (role.query === false) role.query = currentRole.query;
        if (role.auto_query === false) role.auto_query = currentRole.auto_query;
        if (role.delete === false) role.delete = currentRole.delete;
        if (role.modify === false) role.modify = currentRole.modify;
        if (role.cd_burner === false) role.cd_burner = currentRole.cd_burner;
        if (role.create_report === false)
          role.create_report = currentRole.create_report;
        if (role.sharing === false) role.sharing = currentRole.sharing;
        if (role.card_sharing === false)
          role.card_sharing = currentRole.card_sharing;
        if (role.admin === false) role.admin = currentRole.admin;
        if (role.premium === false) role.premium = currentRole.premium;
        if (role.create_patient_report === false)
          role.create_patient_report = currentRole.create_patient_report;
        if (role.edit_patient_report === false)
          role.edit_patient_report = currentRole.edit_patient_report;
        if (role.view_patient_report === false)
          role.view_patient_report = currentRole.view_patient_report;
        if (role.request_patient_report === false)
          role.request_patient_report = currentRole.request_patient_report;
        if (role.can_finalize_report == false)
          role.can_finalize_report = currentRole.can_finalize_report;
        if (role.view_request_report == false)
          role.view_request_report = currentRole.view_request_report;
        if (role.delete_req_report == false)
          role.delete_req_report = currentRole.delete_req_report;
        if (role.can_change_report_status == false)
          role.can_change_report_status = currentRole.can_change_report_status;
        if (role.report_with_pdf == false)
          role.report_with_pdf = currentRole.report_with_pdf;
        if (role.view_imagin == false)
          role.view_imagin = currentRole.view_imagin;
        if (role.delete_imagin == false)
          role.delete_imagin = currentRole.delete_imagin;
        if (role.can_req_imaging == false)
          role.can_req_imaging = currentRole.can_req_imaging;
        if (role.can_add_radiologist_email == false)
          role.can_add_radiologist_email =
            currentRole.can_add_radiologist_email;
        if (can_view_assign_caselist == false)
          role.can_view_assign_caselist = currentRole.can_view_assign_caselist;
        if (can_view_admin_caselist == false)
          role.can_view_admin_caselist = currentRole.can_view_admin_caselist;
        if (can_assign_doctors == false)
          role.can_assign_doctors = currentRole.can_assign_doctors;
        if (can_download_zip == false)
          role.can_download_zip = currentRole.can_download_zip;
        if (can_add_table == false)
          role.can_add_table = currentRole.can_add_table;
        if (can_download_zip == false)
          role.can_download_zip = currentRole.can_download_zip;
        if (share_card_download == false)
          role.share_card_download = currentRole.share_card_download;

        role.meddream = currentRole.meddream;
        role.view_and_download_light = currentRole.view_and_download_light;
        role.view_monitoring = currentRole.view_monitoring;
        role.view_system_monitoring = currentRole.view_system_monitoring;
        role.view_user_activity = currentRole.view_user_activity;
        role.view_my_dashboard = currentRole.view_my_dashboard;
        role.signature_compulsory = currentRole.signature_compulsory;
        role.moderator = currentRole.moderator;
        role.doctor_description_required =currentRole.doctor_description_required;
        role.request_scan = currentRole.request_scan;
        role.request_scan_calender = currentRole.request_scan_calender;
        role.request_scan_list = currentRole.request_scan_list;
        role.usg_no = currentRole.usg_no;
        role.can_delete_request_scan=currentRole.can_delete_request_scan;
        role.view_wsi=currentRole.view_wsi;
        role.share_card_wsi=currentRole.share_card_wsi;
        role.add_manufacture=currentRole.add_manufacture;
        role.add_vendor=currentRole.add_vendor;
        role.add_store_location=currentRole.add_store_location;

        role.view_manufacture=currentRole.view_manufacture;
        role.view_vendor=currentRole.view_vendor;
        role.view_store_location=currentRole.view_store_location;

        role.change_inventory_min_qty=currentRole.change_inventory_min_qty;
        role.change_inventory_qty=currentRole.change_inventory_qty;
        role.delete_record_excel=currentRole.delete_record_excel;
        role.save_inventory=currentRole.save_inventory;
        role.delete_inventory=currentRole.delete_inventory;
        role.use_inventory=currentRole.use_inventory;

        role.view_inventory=currentRole.view_inventory;
        role.view_maintance=currentRole.view_maintance;
        role.edit_inventory=currentRole.edit_inventory;
        
        role.can_assign_report_by_role=currentRole.can_assign_report_by_role;
        role.can_view_uploader=currentRole.can_view_uploader;
        role.can_create_uploader=currentRole.can_create_uploader;
        role.can_search_ref_physician=currentRole.can_search_ref_physician;
        role.can_add_logo=currentRole.can_add_logo;
        
        role.can_search_institution=currentRole.can_search_institution;
        role.can_register_patient=currentRole.can_register_patient;
        role.can_view_appointment=currentRole.can_view_appointment;
        role.can_view_demographic=currentRole.can_view_demographic;
        
        role.see_report_label=currentRole.see_report_label;
        role.edit_report_label=currentRole.edit_report_label;
        role.see_report_type=currentRole.see_report_type;
        role.edit_report_type=currentRole.edit_report_type;
        role.limit=currentRole.limit;
        role.view_registered_user=currentRole.view_registered_user;
        
        role.main_table_checkbox=currentRole.main_table_checkbox,
        role.main_table_status=currentRole.main_table_status,
        role.main_table_detail=currentRole.main_table_detail,
        role.main_table_date=currentRole.main_table_date,
        role.main_table_time=currentRole.main_table_time,
        role.main_table_patient_name=currentRole.main_table_patient_name,
        role.main_table_patient_id=currentRole.main_table_patient_id,
        role.main_table_accession=currentRole.main_table_accession,
        role.main_table_description=currentRole.main_table_description,
        role.main_table_gender=currentRole.main_table_gender,
        role.main_table_dob=currentRole.main_table_dob,
        role.main_table_age=currentRole.main_table_age,
        role.main_table_selectBtn=currentRole.main_table_selectBtn,
        role.main_table_viewBtn=currentRole.main_table_viewBtn,
        role.main_table_reportBtn=currentRole.main_table_reportBtn  
        
        role.can_request_feature=currentRole.can_request_feature  
        role.can_view_request_feature=currentRole.can_view_request_feature  
        
        role.main_table_patient_select=currentRole.main_table_patient_select  
        role.delete_request_feature=currentRole.delete_request_feature  
        role.can_transfer=currentRole.can_transfer  
        role.generate_series=currentRole.generate_series  

        role.create_dataset=currentRole.create_dataset
        role.dataset_request=currentRole.dataset_request
        
        role.download_dataset_excel=currentRole.download_dataset_excel
        role.view_dataset=currentRole.view_dataset
        role.view_my_dataset=currentRole.view_my_dataset
        role.copy_osimis=currentRole.copy_osimis
        role.copy_stone=currentRole.copy_stone
        role.copy_download_zip=currentRole.copy_download_zip
        role.main_table_modality_view=currentRole.main_table_modality_view
        role.delete_dataset=currentRole.delete_dataset

        role.manage_report_template=currentRole.manage_report_template
        role.send_report_dicom=currentRole.send_report_dicom
        role.manage_auto_send_ai=currentRole.manage_auto_send_ai
        role.patient_management=currentRole.patient_management
        role.view_radiant=currentRole.view_radiant
        role.view_horos=currentRole.view_horos
        role.view_weasis=currentRole.view_weasis
        role.preload_osimis=currentRole.preload_osimis
        role.view_osimis=currentRole.view_osimis
        role.view_aiViewer=currentRole.view_aiViewer
        role.download_report=currentRole.download_report
        role.print_report=currentRole.print_report
        role.view_padiLabel=currentRole.view_padiLabel
      }
    }
    return role;
  }

  getUserRight() {
    return this.getAuthenticationMode()
      .then(async (option) => {
        if (option.ldap && this.ldapUser) {
          //LDAP user
          return await this.getLDAPUserRight();
        } else {
          //Local user
          return await this.getLocalUserRight();
        }
      })
      .catch((error) => {
        throw error;
      });
  }
}

module.exports = Users;
