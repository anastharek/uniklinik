const padilabelModel = require("../model/Padilabel");
const createPadilabel = async (req, res) => {
  try {
    const payload = req.body;
    await padilabelModel.createPadilabel(payload);
    res.status(201).json({ message: "Padilabel created successfully" });
  } catch (error) {
    console.error("Error creating Padilabel:", error);
    res.status(500).json({ error: "Failed to create Padilabel" });
  }
};

const getAllPadilabels = async (req, res) => {
  try {
    const padilabels = await padilabelModel.getAllPadilabels();
    res.status(200).json(padilabels);
  } catch (error) {
    console.error("Error retrieving Padilabels:", error);
    res.status(500).json({ error: "Failed to retrieve Padilabels" });
  }
};

const getPadilabelById = async (req, res) => {
  try {
    const { id } = req.params;
    const padilabel = await padilabelModel.getPadilabelById(id);
    res.status(200).json(padilabel);
  } catch (error) {
    console.error("Error retrieving Padilabel:", error);
    res.status(500).json({ error: "Failed to retrieve Padilabel" });
  }
};

const updatePadilabel = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    await padilabelModel.updatePadilabel(id, payload);
    res.status(200).json({ message: "Padilabel updated successfully" });
  } catch (error) {
    console.error("Error updating Padilabel:", error);
    res.status(500).json({ error: "Failed to update Padilabel" });
  }
};

const deletePadilabel = async (req, res) => {
  try {
    const { id } = req.params;
    await padilabelModel.deletePadilabel(id);
    res.status(200).json({ message: "Padilabel deleted successfully" });
  } catch (error) {
    console.error("Error deleting Padilabel:", error);
    res.status(500).json({ error: "Failed to delete Padilabel" });
  }
};
const getPadiLabel = async (req, res) => {
  try {
    const role = req.roles?.name;
    if(!role){
      return res.status(401).json({ error: "Role not found" });
    }
    const padiLabel = await padilabelModel.getByRoles(role);
    res.status(200).json(padiLabel);
  } catch (error) {
    console.error("Error retrieving PadiLabel:", error);
    res.status(500).json({ error: "Failed to retrieve PadiLabel" });
  }
}
module.exports = {
    createPadilabel,
    getAllPadilabels,
    getPadilabelById,
    updatePadilabel,
    deletePadilabel,
    getPadiLabel,
};