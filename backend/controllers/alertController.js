const alertController = require("express").Router();

const Alert = require("../models/Alert");
const User = require("../models/User");
const axios = require("axios");
const moment = require("moment");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const { createAuditTrail } = require("./auditTrailController");
const { isEmpty } = require("./functionController");

const {
  createNotification,
  createNotificationAll,
} = require("./notificationController");
const { sendSMS, sendBulkSMS } = require("./apiController");
const { create } = require("../models/AuditTrail");
alertController.post(
  "/sms/add",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    const error = {};
    try {
      let { alertTitle, alertMessage, category } = req.body;

      if (isEmpty(alertTitle)) error["alertTitle"] = "Required field";
      if (isEmpty(alertMessage)) error["alertMessage"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";

      if (Object.keys(error).length === 0) {
        const alert = await Alert.create({
          alertTitle,
          alertMessage,
          category,
        });

        if (alert) {
          req.io.emit("alert");
          createAuditTrail(
            req.user._id,
            alert._id,
            "Alert",
            "Alert",
            "Add",
            `Added template, ${alert.alertTitle}`
          );
          return res.status(200).json({
            success: true,
            message: "Added Successfully",
            smsAlert: alert,
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
  "/sms",
  tokenMiddleware,
  /*  userTypeMiddleware(["employee", "admin"]), */ async (req, res) => {
    try {
      const alert = await Alert.find({
        archivedDate: { $exists: false },
        isArchived: false,
      });

      if (alert) {
        return res.status(200).json(alert);
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
  "/sms/update/:id",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    const error = {};
    try {
      let { alertTitle, alertMessage, category } = req.body;

      if (isEmpty(alertTitle)) error["alertTitle"] = "Required field";
      if (isEmpty(alertMessage)) error["alertMessage"] = "Required field";
      if (isEmpty(category)) error["category"] = "Required field";

      if (Object.keys(error).length === 0) {
        const updateFields = {
          alertTitle,
          alertMessage,
          category,
        };

        const alert = await Alert.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
        );

        if (alert) {
          req.io.emit("alert");
          createAuditTrail(
            req.user._id,
            alert._id,
            "Alert",
            "Alert",
            "Update",
            `Updated template, ${alert.alertTitle}`
          );
          return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            smsAlert: alert,
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
  "/sms/delete/:id",
  tokenMiddleware,
  /*  userTypeMiddleware(["employee", "admin"]), */ async (req, res) => {
    try {
      const alert = await Alert.findByIdAndDelete(req.params.id);
      if (alert) {
        createAuditTrail(
          req.user._id,
          alert._id,
          "Alert",
          "Alert",
          "Delete",
          `Deleted template, ${alert.alertTitle}`
        );
        req.io.emit("alert");
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

alertController.post("/sms/send", tokenMiddleware, async (req, res) => {
  const error = {};
  let { alertTitle, alertMessage, location } = req.body;

  if (alertTitle === "") {
    error["alertTitle"] = "Required field";
  }
  if (alertMessage === "") {
    error["alertMessage"] = "Required field";
  }

  if (location.length === 0) error["location"] = "Required field";

  if (Object.keys(error).length == 0) {
    let contactNumbers = [];
    let fcmTokens = [];
    let userIds = [];

    if (location.includes("All")) {
      const users = await getInfoByMunicipality("City Of Malolos (Capital)");

      if (
        !Array.isArray(users.contactNumbers) ||
        !Array.isArray(users.fcmTokens)
      ) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
      contactNumbers = users.contactNumbers;
      fcmTokens = users.fcmTokens;

      createNotificationAll(req, "", alertTitle, alertMessage, "warning", true);
    } else {
      const users = await getInfoByBarangay(
        "City Of Malolos (Capital)",
        location
      );

      if (
        !Array.isArray(users.contactNumbers) ||
        !Array.isArray(users.fcmTokens)
      ) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
      contactNumbers = users.contactNumbers;
      fcmTokens = users.fcmTokens;
      userIds = users._id;

      if (Array.isArray(userIds) && userIds.length > 0) {
        createNotification(
          req,
          [userIds],
          "",
          alertTitle,
          alertMessage,
          "warning"
        );
      }
    }

    /*  console.log(contactNumbers);
    console.log(fcmTokens); */

    try {
      const smsResponse = true;
      /* console.log(smsResponse); */
      const smsRes = await sendBulkSMS(
        `${alertTitle}\n\n${alertMessage}`,
        "alert",
        contactNumbers
      );
      /* console.log(smsRes); */
      if (smsResponse) {
        createAuditTrail(
          req.user._id,
          req.user._id,
          "User",
          "Alert",
          "Send SMS",
          `Sent SMS Alert, ${alertTitle} to ${
            location == "All" ? "Everyone" : location.join(", ")
          }`
        );
        return res
          .status(200)
          .json({ success: true, message: "SMS sent successfully" });
      } else {
        return res.status(200).json({
          success: true,
          message:
            "Failed condition pero gumagana na to, nakapatay lang yung service/gateway",
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error: " + error });
    }
  }
  if (Object.keys(error).length != 0) {
    error["success"] = false;
    error["message"] = "input error";

    return res.status(400).json(error);
  }
});

alertController.get("/signal", async (req, res) => {
  const response = await getTyphoonSignal();

  if (response.success) {
    res.status(200).json(response);
  } else {
    res.status(500).json(response);
  }
});

alertController.get("/weather", async (req, res) => {
  axios
    .get(
      `https://api.openweathermap.org/data/2.5/weather?q=Malolos&appid=${process.env.WEATHER_API}`
    )
    .then((response) => response.data)
    .then((data) => {
      const weatherDescription = data.weather[0].description;
      const weatherIcon = data.weather[0].icon;
      res.json({
        weather: weatherDescription,
        icon: `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`,
        success: true,
        message: weatherDescription,
      });
    })
    .catch((error) => {
      res.status(500).json({ success: false, message: "An error occurred" });
    });
});

const getInfoByMunicipality = async (municipality) => {
  try {
    const users = await User.find(/* { municipality: municipality } */);

    const contactNumbers = users.map((user) => user.contactNumber);
    const fcmTokens = users.flatMap((user) => user.fcmToken);

    return { contactNumbers, fcmTokens };
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

const getInfoByBarangay = async (municipality, location) => {
  try {
    /* console.log(municipality); */
    const users = await User.find({
      municipality: municipality,
      barangay: { $in: location },
    });

    const contactNumbers = users.map((user) => user.contactNumber);
    const fcmTokens = users.flatMap((user) => user.fcmToken);
    /* console.log(contactNumbers, fcmTokens); */
    return { contactNumbers, fcmTokens };
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

alertController.put(
  "/:action/:id",
  tokenMiddleware,
  /* userTypeMiddleware([
    "employee",
    "admin",
  ]), */
  async (req, res) => {
    try {
      let updateFields = {};
      let action = req.params.action.toLowerCase();
      if (action === "unarchive" || action === "archive") {
        console.log(action);
        if (action === "archive") {
          updateFields = {
            isArchived: true,
            archivedDate: Date.now(),
          };
        } else if (action === "unarchive") {
          updateFields = {
            isArchived: false,

            $unset: { archivedDate: Date.now() },
          };
        }
        const alert = await Alert.findByIdAndUpdate(
          req.params.id,
          updateFields
          /*  { new: true } */
        );

        if (alert) {
          req.io.emit("alert");
          if (action === "archive") {
            return res.status(200).json({
              success: true,
              message: "Archived Successfully",
            });
          } else if (action === "unarchive") {
            return res.status(200).json({
              success: true,
              message: "Unrchived Successfully",
            });
          }
        } else {
          return res.status(500).json({
            success: false,
            message: "not found",
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "Error 404: Not Found",
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

async function getWeatherData() {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=Malolos&appid=${process.env.WEATHER_API}`
    );

    const data = response.data;
    const weatherDescription = data.weather[0].description;
    const weatherIcon = data.weather[0].icon;

    return {
      weather: weatherDescription,
      icon: `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`,
      success: true,
      message: weatherDescription,
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred",
    };
  }
}

module.exports = { getWeatherData };

async function getTyphoonSignal() {
  try {
    const url = "https://pagasa.chlod.net/api/v1/bulletin/list";
    const response = await axios.get(url);
    const data = response.data;
    const bulletins = data.bulletins;

    let maxCount = 0;
    let maxIndex = 0;

    bulletins.forEach((bulletin, index) => {
      if (bulletin.count > maxCount) {
        maxCount = bulletin.count;
        maxIndex = index;
      }
    });

    const link = bulletins[maxIndex].link;
    const filename = link.substring(link.lastIndexOf("/") + 1);
    let counter = 0;
    let looping = true;

    const filenamParts = filename.split("_");
    const typhoonName = filenamParts[filenamParts.length - 1].split(".")[0];

    do {
      const parseUrl = `https://pagasa.chlod.net/api/v1/bulletin/parse/${filename}`;
      let parseResponse;

      try {
        parseResponse = await axios.head(parseUrl);
      } catch (error) {
        console.log("Error: Unable to retrieve data from URL.");
        const downloadUrl = `https://pagasa.chlod.net/api/v1/bulletin/download/${filename}`;
        const downloadResponse = await axios.get(downloadUrl);
        const datas = downloadResponse.data;
        counter++;

        if (counter > 1) {
          break;
        }
      }

      if (parseResponse && parseResponse.status === 200) {
        looping = false;
        const parseData = await axios.get(parseUrl).then((res) => res.data);

        const targetDate = moment(parseData.bulletin.info.expires);
        const currentDate = moment();

        if (currentDate > targetDate) {
          return {
            success: true,
            message: "no typhoon",
            signal: 0,
          };
        } else {
          let hasSignal = false;

          Object.entries(parseData.bulletin.signals).forEach(
            ([signal, signalData]) => {
              if (signalData !== null && !hasSignal) {
                const areas = Object.values(signalData.areas);
                areas.forEach((area) => {
                  area.forEach((location) => {
                    if (
                      (location.includes &&
                        location.includes.objects &&
                        location.includes.objects.includes("Malolos")) ||
                      location.name === "Bulacan"
                    ) {
                      hasSignal = true;
                      return {
                        success: true,
                        signal: `${signal}`,
                        message: `Malolos is under Signal No.${signal}`,
                        track: `https://pubfiles.pagasa.dost.gov.ph/tamss/weather/track_${typhoonName}.png`,
                        name: typhoonName,
                        category: "Typhoon",
                        updatedAt: Date.now(),
                      };
                    }
                  });
                });
              }
            }
          );

          if (!hasSignal) {
            return {
              success: true,
              message: "no signal",
              signal: 0,
              /*  success: true,
              signal: `2`,
              message: `Malolos is under Signal No.2`,
              track: `https://pubfiles.pagasa.dost.gov.ph/tamss/weather/track_goring.png`,
              name: "Goring",
              category: "Typhoon",
              updatedAt: Date.now(), */
            };
          }
        }
      }
    } while (looping);
  } catch (error) {
    return {
      success: false,
      message: "Internal Server Error: " + error,
    };
  }
}

module.exports = { alertController, getTyphoonSignal, getWeatherData };
