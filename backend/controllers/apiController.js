const apiController = require("express").Router();
const axios = require("axios");
const moment = require("moment");
const User = require("../models/User");
const Pusher = require("pusher");
const municipality = "Malolos";
const nodemailer = require("nodemailer");
const tokenMiddleware = require("../middlewares/tokenMiddleware");
const {
  createNotification,
  createNotificationAll,
  createPushNotificationTopic,
  createPushNotificationToken,
} = require("./notificationController");
const { firebase } = require("../utils/config");
const { isEmpty } = require("./functionController");
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

/* firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
 */
apiController.get("/signal", async (req, res) => {
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
                        location.includes.objects.includes(municipality)) ||
                      location.name === "Bulacan"
                    ) {
                      console.log("1");
                      hasSignal = true;
                      return res.status(200).json({
                        success: true,
                        signal: `${signal}`,
                        message: `Malolos is under Signal No.${signal}`,
                        track: `https://pubfiles.pagasa.dost.gov.ph/tamss/weather/track_${typhoonName}.png`,
                      });
                    }
                  });
                });
              }
            }
          );

          if (!hasSignal) {
            return res
              .status(200)
              .json({ success: true, message: "no signal", signal: 0 });
          }
        }
      }
    } while (looping);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
});

apiController.get("/weather", async (req, res) => {
  /*   createPushNotificationToken("title", "body", [
    "fgmqtj5qS1KbZldJHq6Hm1:APA91bE9Z4Q8u0rZYtqkS4habfNGaSdZvJNwvANWJg0pO_ZVo3SHSK8Bm-8rteFHe9ec9YvzBHoa7zYM5esenHeLw-QXTSZj8Ief88W7_YidTytICqRIgkw0-rXtanfUBkk30NZfvA7Q",
  ]);
  createPushNotificationTopic("Topic", "body", "sagip"); */
  /*   sendEmail(
    "darwinsanluis.ramos14@gmail.com",
    "SAGIP verification code",
    `Your SAGIP verification code is`
  ); */
  console.log("====================================");
  console.log("localhost");
  console.log("====================================");
  axios
    .get(
      `https://api.openweathermap.org/data/2.5/weather?q=${municipality}&appid=${process.env.WEATHER_API}`
    )
    .then((response) => response.data)
    .then((data) => {
      const weatherDescription = data.weather[0].description;
      res.json({ weather: weatherDescription });
    })
    .catch((error) => {
      res.status(500).json({ message: "An error occurred" });
    });

  getAllFcmTokensInBarangays("Malolos", ["Guinhawa", "Dakila"]);
});

apiController.put("/pusher", tokenMiddleware, async (req, res) => {
  /*  await createNotification(
    [req.user.id],
    req.user.id,
    "title1",
    "message1",
    "category1"
  );
  await createNotificationAll(req.user.id, "title2", "message2", "category2"); */
  console.log("====================================");
  console.log("push");
  console.log("====================================");
  const { purpose, content, channel, event } = req.body;

  const data = {
    from: req.user.id,
    purpose,
    content,
  };

  if (await createPusher(channel, event, data)) {
    console.log("true");
    return res.status(200).json({
      success: true,
      message: "Pusher sent successfully",
    });
  } else {
    console.log("false");
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

const createPusher = async (channel, event, data) => {
  console.log("====================================");
  console.log("new push");
  console.log("====================================");
  try {
    pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    return false;
  }
};

apiController.post("/send-alert", tokenMiddleware, async (req, res) => {
  const error = {};
  let { alertTitle, alertMessage, location } = req.body;

  console.log("====================================");
  console.log(req.user.id);
  console.log(alertTitle);
  console.log(alertMessage);
  console.log(location);
  console.log("====================================");
  if (isEmpty(alertTitle)) error["alertTitle"] = "Required field";
  if (isEmpty(alertMessage)) error["alertMessage"] = "Required field";
  if (location.length === 0) error["location"] = "Required field";

  if (Object.keys(error).length == 0) {
    let contactNumbers = [];
    let fcmTokens = [];

    if (location.includes("All")) {
      contactNumbers = await getAllContactNumbersInMunicipality("Malolos");
      if (!Array.isArray(contactNumbers)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error: " + contactNumbers,
        });
      }
      console.log(contactNumbers);
      fcmTokens = await getAllFcmTokensInMunicipality("Malolos");
      console.log(fcmTokens);
      if (!Array.isArray(fcmTokens)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error:2 " + contactNumbers,
        });
      }
    } else {
      contactNumbers = await getAllContactNumbersInBarangays(
        "Malolos",
        location
      );

      console.log(contactNumbers);

      if (!Array.isArray(contactNumbers)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error:3 " + contactNumbers,
        });
      }
      fcmTokens = await getAllFcmTokensInBarangays("Malolos", location);
      if (!Array.isArray(fcmTokens)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error:4 " + contactNumbers,
        });
      }
    }

    /*    console.log(contactNumbers);
    console.log(fcmTokens);

    createPushNotificationToken(alertTitle, alertMessage, fcmTokens); */

    try {
      const smsResponse = await sendBulkSMS(alertMessage, contactNumbers);
      console.log(smsResponse);

      if (smsResponse.error === 0) {
        return res
          .status(200)
          .json({ success: true, message: "SMS sent successfully" });
        /*     return res
          .status(200)
          .json({ success: true, message: smsResponse.message }); */
      } else {
        return res
          .status(400)
          .json({ success: false, message: smsResponse.message });
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

const sendSMS = async (message, contactNumber) => {
  // const smsData = {
  //   token: process.env.SMS_API,
  //   sendto: contactNumber,
  //   body: message,
  //   sim: "0",
  //   device_id: process.env.DEVICE_ID,
  //   urgent: "1",
  // };

  // return axios
  //   .post("https://smsgateway24.com/getdata/addsms", null, {
  //     params: smsData,
  //   })
  //   .then(function (response) {
  //     return response.data;
  //   })
  //   .catch(function (error) {
  //     throw error;
  //   });
  console.log("send sms");
  return { error: 0, message: "testing" };
};

const sendBulkSMS = async (message, contactNumbers) => {
  // console.log(process.env.DEVICE_ID);
  // const smsData = contactNumbers.map((contactNumber) => ({
  //   sendto: contactNumber,
  //   body: message,
  //   sim: "0",
  //   device_id: process.env.DEVICE_ID,
  //   urgent: "1",
  // }));

  // const params = {
  //   token: process.env.SMS_API,
  //   smsdata: smsData,
  // };

  // return axios
  //   .post("https://smsgateway24.com/getdata/addalotofsms", params)

  //   .then(function (response) {
  //     return response.data;
  //   })
  //   .catch(function (error) {
  //     throw error;
  //   });
  console.log("send bulk sms");
  return { error: 0, message: "testing" };
};

const getAllContactNumbersInMunicipality = async (municipality) => {
  try {
    const users = await User.find({ municipality: municipality });
    const contactNumbers = users.map((user) => user.contactNumber);
    return contactNumbers;
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

const getAllContactNumbersInBarangays = async (municipality, location) => {
  try {
    const users = await User.find({
      barangay: { $in: location },
      municipality,
    });
    const contactNumbers = users.map((user) => user.contactNumber);
    return contactNumbers;
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

const getAllFcmTokensInMunicipality = async (municipality) => {
  try {
    const users = await User.find({ municipality: municipality });
    const fcmTokens = users.flatMap((user) => user.fcmToken);
    return fcmTokens;
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

const getAllFcmTokensInBarangays = async (municipality, location) => {
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
};
async function sendEmail(to, subject, html) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "snackwise.hagonoy@gmail.com",
        pass: "gesjppxbvxkswodb",
      },
    });

    let info = await transporter.sendMail({
      from: "sagip.cityofmalolos.drrmo@gmail.com",
      to,
      subject,
      html,
    });

    console.log(info.messageId);
  } catch (error) {
    console.log(error);
  }
}
module.exports = {
  sendSMS,
  sendBulkSMS,
  createPusher,
  sendEmail,
  apiController,
};
