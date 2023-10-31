const cronJobController = require("express").Router();
const User = require("../models/User");
const AssistanceRequest = require("../models/AssistanceRequest");
const WellnessSurvey = require("../models/WellnessSurvey");
const HazardReport = require("../models/HazardReport");
const moment = require("moment");
const { MongoClient, ObjectId } = require("mongodb");
const { promises: fs } = require("fs");

const path = require("path");
const { getTyphoonSignal, getWeatherData } = require("./alertController");
const { createNotificationAll } = require("./notificationController");
const { cloudinary } = require("../utils/config");
const currentDate = moment().format("MMMM DD, YYYY");
const folderPath = `sagip/backup/${currentDate}`;

cronJobController.post("/backup", async (req, res) => {
  try {
    const tempFolderPath = path.join(__dirname, "../temp");
    const client = new MongoClient(process.env.MONGO_URL, {
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("Connected successfully to the server");
    const db = client.db("sagip");
    const collections = await db.listCollections().toArray();
    console.log(collections);
    for (const collection of collections) {
      const query = {};
      const docs = await db.collection(collection.name).find(query).toArray();
      const transformedDocs = docs.map((doc) => {
        const transformedDoc = {};

        for (const field in doc) {
          if (typeof doc[field] === "object" && doc[field] instanceof Date) {
            transformedDoc[field] = { $date: doc[field] };
          } else if (Array.isArray(doc[field])) {
            transformedDoc[field] = doc[field].map((element) => {
              /* if (typeof element === "object" && element instanceof Date) {
                return { $date: element };
              } else */ if (isValidObjectId(doc[element])) {
                return { $oid: element };
              } else {
                return element;
              }
            });
          } else if (isValidObjectId(doc[field])) {
            transformedDoc[field] = { $oid: doc[field] };
          } else {
            transformedDoc[field] = doc[field];
          }
        }

        return transformedDoc;
      });

      const fileName = `${collection.name}.json`;
      const jsonDocs = JSON.stringify(transformedDocs);

      await fs.writeFile(path.join(tempFolderPath, fileName), jsonDocs);
      console.log(`Successfully backed up ${collection.name} to ${fileName}`);

      const fileBuffer = await fs.readFile(path.join(tempFolderPath, fileName));

      const cloudinaryUploadResult = await cloudinary.uploader.upload(
        path.join(tempFolderPath, fileName),
        {
          folder: folderPath,
          resource_type: "raw",
          public_id: fileName,
        }
      );

      console.log("Uploaded to Cloudinary:", cloudinaryUploadResult.secure_url);

      await fs.unlink(path.join(tempFolderPath, fileName));
    }

    client.close();
    return res.status(200).json({
      success: true,
      message: "Backup successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

cronJobController.post("/archive", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 360);

    await WellnessSurvey.deleteMany({
      archivedDate: { $lte: thirtyDaysAgo },
    });

    /* await HazardReport.deleteMany({
      archivedDate: { $lte: thirtyDaysAgo },
    }); */
    const archivedUsers = await User.find({
      archivedDate: { $lte: thirtyDaysAgo },
    });

    for (const user of archivedUsers) {
      await user.remove();
    }
    /*   await AssistanceRequest.deleteMany({
      archivedDate: { $lte: thirtyDaysAgo },
    });
    await Team.deleteMany({
      archivedDate: { $lte: thirtyDaysAgo },
    });
 */
    return res.status(200).json({
      success: true,
      message: "Archived data deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

cronJobController.get("/alert/signal", async (req, res) => {
  const response = await getTyphoonSignal();
  if (response.success) {
    const { signal, message, category, name } = response;
    console.log();
    if (signal !== 0) {
      const alertTitle = `${category} ${name} Update`;
      const alertMessage = `${message}. Stay indoors or evacuate to a safer place when necessary.`;
      createNotificationAll(req, "", alertTitle, alertMessage, "warning", true);
    }
  }
  res.status(200).json(response);
});

cronJobController.get("/alert/weather", async (req, res) => {
  const response = await getWeatherData();
  if (response.success) {
    const { weather } = response;

    const alertTitle = `Malolos City Weather Update`;
    const alertMessage = `Good Morning Maloleños! Expect ${
      ["a", "e", "i", "o", "u"].includes(weather[0].toLowerCase())
        ? "an "
        : "a "
    } ${weather} weather condition today.`;
    createNotificationAll(req, "", alertTitle, alertMessage, "warning", true);
  }
  res.status(200).json(response);
});

cronJobController.post("/survey/active", async (req, res) => {
  try {
    const currentDate = moment().startOf("day");

    const wellnessSurvey = await WellnessSurvey.find({
      endDate: {
        $lte: currentDate.toDate(),
      },
      status: "active",
    });

    const updatedSurveys = await Promise.all(
      wellnessSurvey.map(async (survey) => {
        survey.status = "inactive";
        return survey.save();
      })
    );

    return res.status(200).json({
      success: true,
      message: "Survey status updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
    });
  }
});

const isValidObjectId = (value) => {
  return ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value);
};

module.exports = {
  cronJobController,
};
