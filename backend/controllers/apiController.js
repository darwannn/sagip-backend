const apiController = require("express").Router();
const axios = require("axios");
const moment = require("moment");
const User = require("../models/User");

const nodemailer = require("nodemailer");
const tokenMiddleware = require("../middlewares/tokenMiddleware");

apiController.put("/web-socket", tokenMiddleware, async (req, res) => {
  try {
    const { receiver, content, event } = req.body;

    const data = {
      sender: req.user.id,
      receiver,
      content,
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

const sendBulkSMS = async (content, target, contactNumbers) => {
  console.log("=========contactNumbers=============");
  console.log(contactNumbers);
  console.log("====================================");

  let message = "";
  const from = "SAGIP - Malolos CDRRMO:\n\n";
  if (target === "alert") {
    message = `${from}${content}`;
  } else if (target === "notification") {
    message = `${from}${content}`;
  }
  /* SMS Gateway */
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
  /* SEMAPHORE */
  return axios

    .post("https://api.semaphore.co/api/v4/messages", params)
    .then(function (response) {
      return response.status === 200 ? true : false;
    })
    .catch(function (error) {
      throw error;
    });
  //return true;
};

const sendSMS = async (phone, target, content) => {
  let message = "";
  const from = "SAGIP - Malolos CDRRMO:\n\n";
  if (
    target === "notification" ||
    target === "verification-request" ||
    target === "alert"
  ) {
    message = `${from}${content}`;
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
  /* SMS Gateway */
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
  /* SEMAPHORE */
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

module.exports = {
  sendSMS,
  sendBulkSMS,

  sendEmail,
  apiController,
};
