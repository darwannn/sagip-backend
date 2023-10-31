const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const authController = require("./controllers/authController");
const accountController = require("./controllers/accountController");
const { alertController } = require("./controllers/alertController");
const { apiController } = require("./controllers/apiController");
const safetyTipController = require("./controllers/safetyTipController");
const emergencyFacilityController = require("./controllers/emergencyFacilityController");
const teamController = require("./controllers/teamController");
const hazardReportController = require("./controllers/hazardReportController");
const assistanceRequestController = require("./controllers/assistanceRequestController");
const preAssessmentController = require("./controllers/preAssessmentController");
const {
  notificationController,
} = require("./controllers/notificationController");
const { cronJobController } = require("./controllers/cronJobController");
const wellnessSurveyController = require("./controllers/wellnessSurveyController");
const statisticsController = require("./controllers/statisticsController");

const app = express();
const server = http.createServer(app); // Create an HTTP server
/* const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});  */

const io = require("socket.io")(server, { cors: { origin: "*" } });

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, () =>
  console.log("MongoDB has been started successfully")
);

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  req.io = io;
  next();
});
app.use(express.static("assets"));
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
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
app.use("/pre-assessment", preAssessmentController);
app.use("/notification", notificationController);
app.use("/statistics", statisticsController);
app.use("/wellness-survey", wellnessSurveyController);

/* forwards data from mobile */
io.on("connection", (socket) => {
  socket.onAny((event, data) => {
    console.log("Received event:", event, "with data:", data);

    socket.broadcast.emit(event, data);
  });
});

server.listen(process.env.PORT, () =>
  console.log("Server has been started successfully")
);
