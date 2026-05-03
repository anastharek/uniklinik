const db = require("../database/models");
const { reverseProxyGetStudy } = require("./reverseProxy");

const Accessionfiller = async (req,res) => {
  let reportDraft = await db.ReportDraft.findAll({
    where: {
      accesor: null,
    },
    attributes: ["study_id"],
    raw: true,
  });
  let reportFinalize = await db.ReportFinal.findAll({
    where: {
      accesor: null,
    },
    attributes: ["study_id"],
    raw: true,
  });
  reportDraft = reportDraft.map((report) => report.study_id);
  reportFinalize = reportFinalize.map((report) => report.study_id);
  let ids = Array.from(new Set([...reportDraft, ...reportFinalize]));
  for (let id of ids) {
    try {
      let data = await reverseProxyGetStudy(id);
      data = JSON.parse(data);
      if (data.code !== "ERR_NON_2XX_3XX_RESPONSE") {
        if (data.MainDicomTags.AccessionNumber) {
          await db.ReportDraft.update(
            {
              accesor: data.MainDicomTags.AccessionNumber,
            },
            {
              where: {
                study_id: id,
              },
            }
          );
          await db.ReportFinal.update(
            {
              accesor: data.MainDicomTags.AccessionNumber,
            },
            {
              where: {
                study_id: id,
              },
            }
          );
          
        }
      }
    } catch (err) {}
  }
  return res.status(200).json({ message: "Success" });
};

module.exports = {Accessionfiller};
