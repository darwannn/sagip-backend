const apiController = require("express").Router();
const axios = require("axios");
const { DateTime } = require("luxon");
const User = require("../models/User");

const municipality = "Malolos";

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

    const name = bulletins[maxIndex].name;
    const count = bulletins[maxIndex].count;
    const final = bulletins[maxIndex].final;
    const file = bulletins[maxIndex].file;
    const link = bulletins[maxIndex].link;
    const filename = link.substring(link.lastIndexOf("/") + 1);
    let counter = 0;
    let looping = true;

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

        const dateString = "2023-06-12T12:00:00.000Z";
        const targetDate = DateTime.fromISO(dateString);
        const currentDate = DateTime.now();

        if (currentDate > targetDate) {
          return res.status(201).json({ signal: 0 });
        } else {
          let hasSignal = false;

          for (const [signal, signalData] of Object.entries(
            parseData.bulletin.signals
          )) {
            if (signalData !== null) {
              const areas = Object.values(signalData.areas);
              for (const area of areas) {
                for (const location of area) {
                  if (
                    location.includes &&
                    location.includes.objects &&
                    location.includes.objects.includes(municipality)
                  ) {
                    return res.status(201).json({
                      signal: `${signal}`,
                      track:
                        "https://pubfiles.pagasa.dost.gov.ph/tamss/nwp/wrf/ccover/PH_ccover_d01_024h.gif",
                    });
                  } else if (location.name === municipality) {
                    hasSignal = true;
                  }
                }
              }
            }
          }

          if (!hasSignal) {
            return res.status(201).json({ signal: 0 });
          }
        }
      }
    } while (looping);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
});

apiController.get("/weather", async (req, res) => {
  /*  const to = "/topics/newsletter";

  const notification = {
    title: "May bagyo",
    body: "Magtago ka na sa puno",
    sound: "default",
  }; */
  /* sendNotificationAll(to, notification); */

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
});
apiController.post("/send-alert", async (req, res) => {
  const error = {};
  const { alertMessage, location } = req.body;

  if (isEmpty(alertMessage)) error["alertMessage"] = "Required field";
  if (isEmpty(location)) error["location"] = "Required field";

  if (Object.keys(error).length == 0) {
    let contactNumbers = [];

    if (location == "All") {
      contactNumbers = await getAllContactNumbersInMunicipality("Malolos");
      if (!Array.isArray(contactNumbers)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error" + contactNumbers,
        });
      }
    } else {
      contactNumbers = await getAllContactNumbersInBarangays(
        "Malolos",
        location
      );
      if (!Array.isArray(contactNumbers)) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error" + contactNumbers,
        });
      }
    }

    console.log(contactNumbers);
    try {
      /*  const smsResponse = await sendSMS("alertMessage", "09395372592"); */
      const smsResponse = await sendBulkSMS(alertMessage, contactNumbers);
      console.log(smsResponse);

      if (smsResponse.error === 0) {
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

const sendSMS = async (message, contactNumber) => {
  const smsData = {
    token: process.env.SMS_API,
    sendto: contactNumber,
    body: message,
    sim: "0",
    device_id: process.env.DEVICE_ID,
    urgent: "1",
  };
  console.log("====================================");
  console.log(smsData);
  console.log("====================================");
  return axios
    .post("https://smsgateway24.com/getdata/addsms", null, {
      params: smsData,
    })
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      throw error;
    });
};

const sendBulkSMS = async (message, contactNumbers) => {
  console.log(process.env.DEVICE_ID);
  const smsData = contactNumbers.map((contactNumber) => ({
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
      return response.data;
    })
    .catch(function (error) {
      throw error;
    });
};

const isEmpty = (value) => {
  if (value == "") {
    return true;
  }
};

const getAllContactNumbersInMunicipality = async (municipality) => {
  try {
    const users = await User.find({ municipality: municipality });
    const contactNumbers = users.map((user) => user.contactNumber);
    return contactNumbers;
  } catch (error) {
    /*  return res.status(500).json({
      success:false,
      message:"Internal Server Error" + error,
    }) */
    return "Internal Server Error" + error;
  }
};

// Function to get all contact numbers of users with the specified barangays
const getAllContactNumbersInBarangays = async (municipality, location) => {
  try {
    const barangays = location.split(","); // Split the location string into an array of barangays
    const users = await User.find({
      barangay: { $in: barangays },
      municipality,
    });
    const contactNumbers = users.map((user) => user.contactNumber);
    return contactNumbers;
  } catch (error) {
    return "Internal Server Error: " + error;
  }
};

const sendNotificationAll = (to, notif) => {
  const api_key = process.env.NOTIFICATION_API;

  const fields = { to, notification: notif };

  const headers = {
    Authorization: "key=" + api_key,
    "Content-Type": "application/json",
  };

  axios
    .post("https://fcm.googleapis.com/fcm/send", fields, { headers })
    .then((response) => {
      console.log("Notification Sent");
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });
};

module.exports = {
  sendSMS,
  apiController,
};
