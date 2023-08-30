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

const codeExpiration = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

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

/* apiController.post("/send-alert", tokenMiddleware, async (req, res) => {
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

    console.log(contactNumbers);
    console.log(fcmTokens);

    createPushNotificationToken(alertTitle, alertMessage, fcmTokens);

    try {
      const smsResponse = await sendBulkSMS(alertMessage, contactNumbers);
      console.log(smsResponse);

      if (smsResponse.error === 0) {
        return res
          .status(200)
          .json({ success: true, message: "SMS sent successfully" });
            return res
          .status(200)
          .json({ success: true, message: smsResponse.message });
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
 */
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
/* 
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
}; */

async function sendEmail(to, subject, code, expiration) {
  // const html = ` `;
  const html = `
<body
  style='font-family:Roboto, sans-serif; font-size: 18px;text-align: center; background-color:#5E72D2; margin: 0; padding: 0;'>
  <table style='width: 100%;'>
      <tr>
          <td style='  vertical-align: middle;'>
              <table style=' margin:0 auto; padding: 50px 20px 80px 20px;'>
                  <tr>
                      <td>
                          <div style="font-size: 40px; font-weight:bold; color:white;">SAGIP</div>
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <table
                              style='background-color: white!important; border-radius: 20px; padding: 100px 40px; width: 500px;'>
                              <tr>
                                  <td style='color:black!important;'>
                                      Here is your SAGIP verification code
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      <div style='font-size: 60px; color: #5E72D2; font-weight: bold; padding: 30px 0px;'>${code}</div>
                                  </td>
                              </tr>
                              <tr>
                                  <td style='color:black!important;'>
                                     If you didn't request this, you can ignore this email or let us know.
                                  </td>
                              </tr>
                     
                          </table>
                      </td>
                  </tr>
                  <tr >
                      <td style='font-size:17px; color:white; padding-top:15px;'>
                          The link will expire after a day, on ${moment(
                            expiration
                          ).format("MMM DD, YYYY | hh:MM A")}.
                      </td>
                  </tr>
                  <tr>
                      <td style='font-size:15px; color:white; padding-top:5px;'>
                          Copyright © ${moment().format(
                            "YYYY"
                          )} SAGIP. All Rights Reserved.
                      </td>
                  </tr>
                  <tr>
                      <td style='opacity: 0;'>
                          <script>
                              ${moment()}
                          </script>
                          </div>
                      </td>
                  </tr>
              </table>
          </td>
      </tr>
  </table>
</body>
`;
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
        /*  user: "sagip.cityofmalolos.drrmo@gmail.com",
        pass: "agehxjemnwwohrig", */
      },
    });

    let info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to,
      subject,
      html: `Your SAGIP verification code is ${code}. The link will expire after a day, on ${moment(
        expiration
      ).format("MMM DD, YYYY | hh:MM A")}.`,
    });

    console.log(info.messageId);
  } catch (error) {
    console.log(error);
  }
}

/* const isEmpty = (value) => {
  if (value === "" || value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string" && value.trim() === "") {
    return true;
  }

  return false;
}; */

module.exports = {
  sendSMS,
  sendBulkSMS,
  createPusher,
  sendEmail,
  apiController,
};
