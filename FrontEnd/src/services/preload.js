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

  /** Start preload for many studies at once (server queues them) */
  startMany(studyIds) {
    return fetch(`/api/preload`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ studyIds }),
    })
      .then((res) => {
        if (!res.ok) throw res;
        return res.json();
      })
      .catch((err) => {
        throw err;
      });
  },

  /** All queued/running jobs - for the global progress widget */
  active() {
    return fetch(`/api/preload/active`, {
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

  /** Which studies are fresh-cached (within 2 weeks) - {studyId: {cached, cachedAt, totalSeries}} */
  cached(studyIds) {
    return fetch(`/api/preload/cached?studyIds=${encodeURIComponent(studyIds.join(","))}`, {
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
