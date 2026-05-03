var USERS = null;

const caseList = {
  get() {
    const getCaseListOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    };
    return fetch("/api/doctor-case-list", getCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
  delete(studyid) {
    const deleteCaseListOptions = {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ id: studyid }),
    };
    return fetch("/api/doctor-case-list", deleteCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
      })
      .catch((err) => {
        throw err;
      });
  },
  deleteAdmin(studyid, name) {
    const deleteAdminCaseListOptions = {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ id: studyid, name }),
    };
    return fetch("/api/remove-assign-doctor", deleteAdminCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
      })
      .catch((err) => {
        throw err;
      });
  },
  getAdmin() {
    const getCaseListOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    };
    return fetch("/api/all-doctor-case-list", getCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },

   searchCaseListPaginated(data) {
    const searchCaseListOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(data),
    };
    return fetch("/api/seach-reports-pagination", searchCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
  searchCaseList(data) {
    const searchCaseListOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ data }),
    };
    return fetch("/api/seach-reports", searchCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
  searchDoctorCaseList(data) {
    const searchCaseListOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ data }),
    };
    return fetch("/api/doctor/seach-reports", searchCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
  searchPatientCaseList(data) {
    const searchCaseListOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ data }),
    };
    return fetch("/api/patient/seach-reports", searchCaseListOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
  getAllDoctor() {
    const getCaseDoctorOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    };
    if (USERS) {
      return USERS;
    }
    return fetch("/api/users/radiologist", getCaseDoctorOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        USERS = res.json();
        return USERS;
      })
      .catch((err) => {
        throw err;
      });
  },
  updateDoctors(id, name, status) {
    const updateCaseDoctorOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ id, name, status }),
    };
    return fetch("/api/update-report-doctors", updateCaseDoctorOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return;
      })
      .catch((err) => {
        throw err;
      });
  },
  updateLabels(id, labels) {
    const updateCaseLabelsOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ id,labels }),
    };
    return fetch("/api/update-report-labels", updateCaseLabelsOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return;
      })
      .catch((err) => {
        throw err;
      });
  },
  getRerportData(study_id) {
    const getReportDataROptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        studyid: study_id,
      }),
    };
    return fetch("/api/admin-report", getReportDataROptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
  assignDoctor(
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    doctors,
    StudyInstanceUID
  ) {
    const assignDoctorOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        study_id,
        patient_name,
        patient_id,
        accesor,
        study_type,
        study_date,
        doctors,
        StudyInstanceUID,
      }),
    };
    return fetch("/api/assign-doctor/report", assignDoctorOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return;
      })
      .catch((err) => {
        throw err;
      });
  },
  assignRoles(
    study_id,
    patient_name,
    patient_id,
    accesor,
    study_type,
    study_date,
    roles,
    StudyInstanceUID
  ) {
    const assignDoctorOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        study_id,
        patient_name,
        patient_id,
        accesor,
        study_type,
        study_date,
        roles,
        StudyInstanceUID,
      }),
    };
    return fetch("/api/assign-roles/report", assignDoctorOptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return;
      })
      .catch((err) => {
        throw err;
      });
  },
};

export default caseList;
