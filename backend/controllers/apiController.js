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

apiController.put("/web-socket", tokenMiddleware, async (req, res) => {
  try {
    /*  await createNotification(req,
    [req.user.id],
    req.user.id,
    "title1",
    "message1",
    "category1"
  );
  await createNotificationAll(req,req.user.id, "title2", "message2", "category2"); */
    console.log("====================================");
    console.log("push");
    console.log("====================================");
    const contactNumbers = ["09395372592"];
    const message = "Hello";

    const { receiver, content, event } = req.body;

    const data = {
      sender: req.user.id,
      receiver,
      content, // long lat
    };

    if (req.io.emit(event, data)) {
      console.log("true");
      return res.status(200).json({
        success: true,
        message: "Web socket sent successfully",
      });
    } else {
      console.log("false");
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

const createPusher = async (io, channel, event, data) => {
  /*   console.log("====================================");
  console.log("new push");
  console.log("====================================");
  try {
    io.emit(event, data); 
    return true;
  } catch (error) {
    console.log(error);
    return false;
  } */
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
      contactNumbers = await getInfoByMunicipality("Malolos");
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
      contactNumbers = await getInfoByBarangay(
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

      if (smsResponse) {
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
/* const sendSMS = async (message, contactNumber) => {
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
  // console.log("send sms");
  // return { error: 0, message: "testing" };

  return await send(contactNumber, message);
}; */

const sendBulkSMS = async (content, target, contactNumbers) => {
  console.log("=========contactNumbers===========================");
  console.log(contactNumbers);
  console.log("====================================");
  /* SMS GATE WAY GAGAMITIN */
  let message = "";
  const from = "SAGIP - Malolos CDRRMO:\n\n";
  if (target === "alert") {
    message = `${from} ${content}`;
  } else if (target === "notification") {
    message = `${from} ${content}`;
  }
  /*  const smsData = contactNumbers.map((contactNumber) => ({
    sendto: contactNumber,
    body: message,
    sim: "0",
    device_id: process.env.DEVICE_ID,
    urgent: "1",
  }));
  const params = {
    token: process.env.SMS_API,
    smsdata: smsData,
  };
  return axios
    .post("https://smsgateway24.com/getdata/addalotofsms", params)
    .then(function (response) {
      return response.data.error === 0 ? true : false;
    })
    .catch(function (error) {
      throw error;
    }); */
  const numbersString = contactNumbers.join(",");
  const params = {
    apikey: process.env.SEMAPHORE_API_KEY,
    number: numbersString,
    message: message,
  };
  return (
    axios
      /* .post(
      `https://api.semaphore.co/api/v4/messages?apikey=${process.env.SEMAPHORE_API_KEY}&number=${numbersString}&message=${message}`
    ) */
      .post("https://api.semaphore.co/api/v4/messages", params)
      .then(function (response) {
        return response.status === 200 ? true : false;
      })
      .catch(function (error) {
        throw error;
      })
  );
  /*  return true; */
};

const sendSMS = async (phone, target, content) => {
  let message = "";
  const from = "SAGIP - Malolos CDRRMO:\n\n";
  if (
    target === "notification" ||
    target === "verification-request" ||
    target === "alert"
  ) {
    message = `${from} ${content}`;
  } else if (target === "register") {
    message = `${from}Thank you for registering to SAGIP! Your verification code is ${content}. The code will expire after 15 minutes.`;
  } else if (target === "attempt") {
    message = `${from}We detected a suspicious activity on your SAGIP account. If this was you, please use the following code to verify your identity: ${content}. The link will expire after 15 minutes.`;
  } else if (target === "forgot-password") {
    message = `${from}We heard that you lost your SAGIP password. Sorry about that! But don’t worry! You can use the following code to reset your password: ${content}. The link will expire after 15 minutes.`;
  } else if (target === "sms-verification") {
    message = `${from}To verify your phone number, please use the following code: ${content}. The code will expire after 15 minutes.`;
  } else {
    message = `${from}Your SAGIP verification code is ${content}. The code will expire after 15 minutes.`;
  }

  /*   const encodedMessage = message;

  const smsData = {
    token: process.env.SMS_API,
    sendto: phone,
    body: message,
    sim: "0",
    device_id: process.env.DEVICE_ID,
    urgent: "1",
  };

  return axios
    .post("https://smsgateway24.com/getdata/addsms", null, {
      params: smsData,
    })
    .then(function (response) {
      console.log(response);
      return response.data.error === 0 ? true : false;
    })
    .catch(function (error) {
      throw error;
    }); */

  const params = {
    apikey: process.env.SEMAPHORE_API_KEY,
    number: phone,
    message: message,
  };

  /*  .post(`https://api.semaphore.co/api/v4/messages?apikey=${process.env.SEMAPHORE_API_KEY}&number=${phone}&message=${content}`, null, { */
  return axios

    .post("https://api.semaphore.co/api/v4/messages", params)
    .then(function (response) {
      return response.status === 200 ? true : false;
    })
    .catch(function (error) {
      throw error;
    });

  /* console.log("send sms");
  return { error: 0, message: "testing" };

  return await send(contactNumber, message); */
};

/* 
const getInfoByMunicipality = async (municipality) => {
  try {
    const users = await User.find({ municipality: municipality });
    const contactNumbers = users.map((user) => user.contactNumber);
    return contactNumbers;
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

const getInfoByBarangay = async (municipality, location) => {
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

async function sendEmail(to, target, code) {
  let subject = "";
  let content = "";
  if (target === "email-verification") {
    subject = "Change or verify your email address";
    content = `To change or verify your email address, please use the following code:`;
  } else if (target === "forgot-password") {
    subject = "Reset your password";
    content = `We heard that you lost your SAGIP password. Sorry about that! But don’t worry! You can use the following code to reset your password:`;
  } else if (target === "attempt") {
    subject = "Suspicious activity detected";
    content = `We detected a suspicious activity on your SAGIP account. If this was you, please use the following code to verify your identity:`;
  }

  const html = `
  <body style='font-family:Roboto, sans-serif; font-size: 18px; text-align: center; background-image:url(https://res.cloudinary.com/dantwvqrv/image/upload/v1693923120/sagip/media/others/malolos_city_hall_gradient.jpg);

  background-position: center;  background-size: cover; background-size: cover; 
    
  height:100%; margin: 0; padding: 0;'>
     <table style='width: 100%;'>
          <tr>
              <td style='vertical-align: middle;'>
                  <table style='padding: 0px 40px; width: 500px; margin: 0 auto;'>
                      <tr>
                          <td style='vertical-align: middle;'>
                              <table
              style='background-color:#f2f3f8!important; border-radius: 8px; margin:50px auto; padding: 30px 30px; width: 500px;'>
                  <tr>
                      <td>
                        <img src="https://res.cloudinary.com/dantwvqrv/image/upload/v1693923119/sagip/media/others/sagip_icon_gradient.png" style="width:3em; margin: 0 auto;" alt="Sagip Logo">
                      </td>
                  </tr>
                  <tr>
                      <td style='vertical-align: middle;'>
                          <table
                              style='background-color: white!important; border-radius: 8px; padding: 40px 40px; width: 500px; margin-top: 30px;'>
                              <tr>
                                  <td>
                                    <img src="https://res.cloudinary.com/dantwvqrv/image/upload/v1693923119/sagip/media/others/email_address_verification.png" style="width:28em; margin: 0 auto; border-radius: 8px;" alt="Sagip Logo">
                                  </td>
                              </tr>
                              <tr>
                                <td style='color:#292929!important; font-size: 25px; font-weight: bold; padding: 5px 0px;'>
                                    Confirm your email address
                                </td>
                            </tr>
                            <tr>
                                <td style='color:#292929!important; padding: 5px 0px;'>
                                    ${content}
                                </td>
                            </tr>
                            <tr>
                                <td style='color:#292929!important; font-weight: bold; padding: 5px 0px;'>
                                    Please enter this verification code:
                                </td>
                            </tr>
                            <tr>
                                <td>
                                      <div style='color:#292929; font-size: 60px; font-weight: bold; padding: 10px 0px;'>${code}</div>
                                </td>
                            </tr>
                              <tr>
                                  <td style='color:#292929!important;'>
                                  The verification code will expire after 15 minutes.
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr >
                      <td style='padding-top:15px;'>
                      <a href='https://www.facebook.com/maloloscdrrmo' target="_blank">
                            <img src="https://res.cloudinary.com/dantwvqrv/image/upload/v1693923119/sagip/media/others/facebook_icon.png" style="width:30px; margin: 0 auto;" alt="Facebook Logo">
                        </a>
                        </td>
                  </tr>
                  <tr>
                      <td style='color:#292929; font-size:15px; padding-top:5px;'>
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
                             
                          </td>
                      </tr>
                  </table>
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

      html,
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
