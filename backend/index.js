const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const authController = require("./controllers/authController");
const accountController = require("./controllers/accountController");
const {
  sendVerificationCode,
  apiController,
} = require("./controllers/apiController");
const safetyTipController = require("./controllers/safetyTipController");
const emergencyFacilityController = require("./controllers/emergencyFacilityController");
const teamController = require("./controllers/teamController");
const hazardReportController = require("./controllers/hazardReportController");
const notificationController = require("./controllers/notificationController");
const wellnessSurveyController = require("./controllers/wellnessSurveyController");

/* const multer = require("multer"); */
const app = express();

const bodyParser = require("body-parser");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, () =>
  console.log("MongoDB has been started successfully")
);

app.use(express.static("assets"));

app.use(cors());
app.use("/images", express.static("assets/images"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authController);
app.use("/account", accountController);
app.use("/safety-tips", safetyTipController);
app.use("/emergency-facility", emergencyFacilityController);
app.use("/api", apiController);
app.use("/team", teamController);
app.use("/hazard-report", hazardReportController);
app.use("/notification", notificationController);
app.use("/wellness-survey", wellnessSurveyController);

app.use(bodyParser.json());

app.listen(process.env.PORT, () =>
  console.log("Server has been started successfully")
);
