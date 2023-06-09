/* const User = require("../models/User"); */
/* 
const isAlreadyResponded = async (req, res, next) => {
  try {
    const { municipality } = req.body;
    console.log("====================================");
    console.log(municipality);
    console.log("====================================");
    if (municipality !== "Malolos") {
      return res.status(400).json({
        success: false,
        message: "Unfortunately the selected area is outside Malolos!",
      });
    } else {
      next();
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error });
  }
};

module.exports = isAlreadyResponded; */
