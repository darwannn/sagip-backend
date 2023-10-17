const alertController = require("express").Router();

const Alert = require("../models/Alert");
const User = require("../models/User");
const axios = require("axios");
const moment = require("moment");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

const {
  isEmpty,
  isImage,
  isLessThanSize,
  isContactNumber,
  cloudinaryUploader,
} = require("./functionController");

const {
  createNotification,
  createNotificationAll,
  createPushNotificationTopic,
  createPushNotificationToken,
} = require("./notificationController");
const {
  createPusher,
  sendSMS,
  sendBulkSMS,
  sendEmail,
} = require("./apiController");
alertController.post(
  "/sms/add",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "admin",
    "super-admin",
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
  "/sms/update/:id",
  tokenMiddleware,
  /*   userTypeMiddleware([
    "admin",
    "super-admin",
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
  /*  userTypeMiddleware(["admin", "super-admin"]), */ async (req, res) => {
    try {
      const alert = await Alert.findByIdAndDelete(req.params.id);
      if (alert) {
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

  console.log("====================================");
  console.log(req.user.id);
  console.log(alertTitle);
  console.log(alertMessage);
  console.log(location);
  console.log("====================================");
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
      /*    console.log(contactNumbers); */
      /*  fcmTokens = await getAllFcmTokensInMunicipality(
        "City Of Malolos (Capital)"
      ); */
      /* console.log(fcmTokens); */

      /* createPushNotificationTopic(alertTitle, alertMessage, "sagip", ""); */
      createNotificationAll("", alertTitle, alertMessage, "warning", true);
    } else {
      const users = await getInfoByBarangay(
        "City Of Malolos (Capital)",
        location
      );
      /* 
      console.log(contactNumbers);

      if (!Array.isArray(contactNumbers)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error:3 " + contactNumbers,
        });
      } */
      /* fcmTokens = await getAllFcmTokensInBarangays(
        "City Of Malolos (Capital)",
        location
      ); */
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
      /* createPushNotificationToken(alertTitle, alertMessage, fcmTokens, ""); */

      if (Array.isArray(userIds) && userIds.length > 0) {
        createNotification([userIds], "", alertTitle, alertMessage, "warning");
      }
    }

    console.log(contactNumbers);
    console.log(fcmTokens);

    try {
      const smsResponse = true;
      console.log(smsResponse);
      const smsRes = await sendBulkSMS(
        `${alertTitle}\n\n${alertMessage}`,
        "alert",
        contactNumbers
      );
      console.log(smsRes);
      if (smsResponse) {
        return res
          .status(200)
          .json({ success: true, message: "SMS sent successfully" });
      } else {
        /* return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" }); */
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
  try {
    /* req.io.emit("banned", { receiver: `64c0ece7ea4101cc029b459c` }); */
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

    /*   const name = bulletins[maxIndex].name;
    const count = bulletins[maxIndex].count;
    const final = bulletins[maxIndex].final;
    const file = bulletins[maxIndex].file; */
    const link = bulletins[maxIndex].link;
    const filename = link.substring(link.lastIndexOf("/") + 1);
    let counter = 0;
    let looping = true;
    console.log("====================================");
    console.log(filename);
    console.log("====================================");

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
        /* all data */
        /* const sampleExpirationDate = "2023-06-12T12:00:00.000Z"; */
        const targetDate = moment(parseData.bulletin.info.expires);
        const currentDate = moment();

        if (currentDate > targetDate) {
          return res
            .status(200)
            .json({ success: true, message: "no typhoon", signal: 0 });
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
                      console.log("1");
                      hasSignal = true;
                      return res.status(200).json({
                        success: true,
                        signal: `${signal}`,
                        message: `Malolos is under Signal No.${signal}`,
                        track: `https://pubfiles.pagasa.dost.gov.ph/tamss/weather/track_${typhoonName}.png`,
                        name: typhoonName,
                        category: "Typhoon",
                        updatedAt: Date.now(),
                      });
                    }
                  });
                });
              }
            }
          );

          if (!hasSignal) {
            return res.status(200).json({
              success: true,
              message: "no signal",
              signal: 0,
              /* success: true,
              signal: `2`,
              message: `Malolos is under Signal No.2`,
              track: `https://pubfiles.pagasa.dost.gov.ph/tamss/weather/track_hanna.png`,
              name: "Hanna",
              category: "Typhoon",
              updatedAt: Date.now(), */
            });
          }
        }
      }
    } while (looping);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error: " + error });
  }
});

alertController.get("/weather", async (req, res) => {
  /*   req.io.emit("banned", { receiver: `64c0ece7ea4101cc029b459c` }); */
  const codeExpiration = new Date(new Date().getTime() + 15 * 60000);
  /*  createNotificationAll(
    "home",
    "Safety Tip",
    `Read the recently added safety tip: test.`,
    "info",
    true
  ); */
  /* sendEmail("darwinsanluis.ramos14@gmail.com", "Test", "1234", codeExpiration);
  sendSMS("09395372592", "sms-verification", "22222",codeExpiration); */
  /*   createPushNotificationToken("title", "body", [
    "fgmqtj5qS1KbZldJHq6Hm1:APA91bE9Z4Q8u0rZYtqkS4habfNGaSdZvJNwvANWJg0pO_ZVo3SHSK8Bm-8rteFHe9ec9YvzBHoa7zYM5esenHeLw-QXTSZj8Ief88W7_YidTytICqRIgkw0-rXtanfUBkk30NZfvA7Q",
  ]);
  createPushNotificationTopic("Topic", "body", "sagip"); */
  /*   createPushNotificationTopic("Topic", "body", "sagip"); */
  console.log("====================================");
  console.log("localhost");
  console.log("====================================");
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
    /*    console.log(municipality); */
    const users = await User.find(/* { municipality: municipality } */);

    const contactNumbers = users.map((user) => user.contactNumber);
    const fcmTokens = users.flatMap((user) => user.fcmToken);

    return { contactNumbers, fcmTokens };
  } catch (error) {
    return "Internal Server Error: " + error;
  }
  /*  try {
    console.log(municipality);
    const allUsers = await User.find({});
    const matchingUsers = allUsers.filter((user) =>
      user.municipality.includes(municipality)
    );
    const contactNumbers = matchingUsers.map((user) => user.contactNumber);
    const fcmTokens = matchingUsers.flatMap((user) => user.fcmToken);

    return { contactNumbers, fcmTokens };
  } catch (error) {
    return "Internal Server Error: " + error;
  } */
};

const getInfoByBarangay = async (municipality, location) => {
  try {
    console.log(municipality);
    const users = await User.find({
      municipality: municipality,
      barangay: { $in: location },
    });

    const contactNumbers = users.map((user) => user.contactNumber);
    const fcmTokens = users.flatMap((user) => user.fcmToken);
    console.log(contactNumbers, fcmTokens);
    return { contactNumbers, fcmTokens };
  } catch (error) {
    return "Internal Server Error: " + error;
  }
  /*  try {
    console.log(municipality);
    const allUsers = await User.find({ barangay: { $in: location } });
    const matchingUsers = allUsers.filter(
      (user) => user.municipality.includes(municipality) 
    );
    const contactNumbers = matchingUsers.map((user) => user.contactNumber);
    const fcmTokens = matchingUsers.flatMap((user) => user.fcmToken);
    console.log(contactNumbers, fcmTokens);
    return { contactNumbers, fcmTokens };
  } catch (error) {
    return "Internal Server Error: " + error;
  }
   */
};

/* const getAllFcmTokensInBarangays = async (municipality, location) => {
  try {
    const users = await User.find({
      barangay: { $in: location },
      municipality,
    });

    const fcmTokens = users.flatMap((user) => user.fcmToken);
    //console.log(fcmTokens);
    return fcmTokens;
  } catch (error) {
    return "Internal Server Error: " + error;
  }
}; */
module.exports = alertController;
