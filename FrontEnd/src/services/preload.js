const preload = {
  start(studyId) {
    return fetch(`/api/preload/${studyId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((res) => {
        if (!res.ok) throw res;
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },

  status(studyId) {
    return fetch(`/api/preload/${studyId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((res) => {
        if (!res.ok) throw res;
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },
};

export default preload;
