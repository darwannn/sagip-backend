const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const authController = require("./controllers/authController");
const accountController = require("./controllers/accountController");
const alertController = require("./controllers/alertController");
const { apiController } = require("./controllers/apiController");
const safetyTipController = require("./controllers/safetyTipController");
const emergencyFacilityController = require("./controllers/emergencyFacilityController");
const teamController = require("./controllers/teamController");
const hazardReportController = require("./controllers/hazardReportController");
const assistanceRequestController = require("./controllers/assistanceRequestController");
const {
  notificationController,
} = require("./controllers/notificationController");
const { cronJobController } = require("./controllers/cronJobController");
const wellnessSurveyController = require("./controllers/wellnessSurveyController");

/* const multer = require("multer"); */
const app = express();

const bodyParser = require("body-parser");
const statisticsController = require("./controllers/statisticsController");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, () =>
  console.log("MongoDB has been started successfully")
);
//test
app.use(express.static("assets"));

app.use(cors());
app.use("/images", express.static("assets/images"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/cron-job", cronJobController);
app.use("/auth", authController);
app.use("/account", accountController);
app.use("/safety-tips", safetyTipController);
app.use("/emergency-facility", emergencyFacilityController);
app.use("/api", apiController);
app.use("/alert", alertController);
app.use("/team", teamController);
app.use("/hazard-report", hazardReportController);
app.use("/assistance-request", assistanceRequestController);
app.use("/notification", notificationController);
app.use("/statistics", statisticsController);
app.use("/wellness-survey", wellnessSurveyController);

app.use(bodyParser.json());

app.listen(process.env.PORT, () =>
  console.log("Server has been started successfully")
);
