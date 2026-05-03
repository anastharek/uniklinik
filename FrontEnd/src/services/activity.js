const activity = {
  create_activity(type, description) {
    const getReportDataROptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
      body: JSON.stringify({
        type,
        description,
      }),
    };
    return fetch("/api/activity", getReportDataROptions)
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
      })
      .catch((err) => {
        throw err;
      });
  },
};

export default activity;
