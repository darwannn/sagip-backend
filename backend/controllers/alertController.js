const alertController = require("express").Router();

const Alert = require("../models/Alert");

const tokenMiddleware = require("../middlewares/tokenMiddleware");

alertController.put(
  "/add",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "admin",
    "super-admin",
  ]), */
  async (req, res) => {
    const error = {};
    try {
      let { title, message } = req.body;

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(message)) error["message"] = "Required field";

      if (Object.keys(error).length === 0) {
        const alert = await Alert.create({ title, message });

        if (alert) {
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            emergencyFacility,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      }

      if (Object.keys(error).length !== 0) {
        error["success"] = false;
        error["message"] = "input error";
        return res.status(400).json(error);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

alertController.get(
  "/",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    try {
      const alert = await Alert.find({});

      if (alert) {
        // console.log(alert._doc);
        return res.status(200).json(alert);
        return res.status(200).json({
          /* success: true,
        message: "found", 
        alert,*/
          ...alert,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "not found",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "not found",
      });
    }
  }
);

alertController.put(
  "/update/:id",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "admin",
    "super-admin",
  ]), */
  async (req, res) => {
    const error = {};
    try {
      let { title, message } = req.body;

      if (isEmpty(title)) error["title"] = "Required field";
      if (isEmpty(message)) error["message"] = "Required field";

      if (Object.keys(error).length === 0) {
        const updateFields = {
          title,
          message,
        };

        const alert = await Alert.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (alert) {
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            emergencyFacility,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      }

      if (Object.keys(error).length !== 0) {
        error["success"] = false;
        error["message"] = "input error";
        return res.status(400).json(error);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

alertController.delete(
  "/delete/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    try {
      const alert = await Alert.findByIdAndDelete(req.params.id);
      if (alert) {
        return res.status(200).json({
          success: true,
          message: "Deleted Successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: " + error,
      });
    }
  }
);

module.exports = alertController;
