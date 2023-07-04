const cronJobController = require("express").Router();
const User = require("../models/User");
const AssistanceRequest = require("../models/AssistanceRequest");
const WellnessSurvey = require("../models/WellnessSurvey");
const HazardReport = require("../models/HazardReport");

const { MongoClient } = require("mongodb");
const { promises: fs } = require("fs");
const { ObjectId } = require("mongodb");
const path = require("path");

const { cloudinary } = require("../utils/config");
const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
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
              if (typeof element === "object" && element instanceof Date) {
                return { $date: element };
              } else if (/^[0-9a-fA-F]{24}$/.test(element)) {
                return { $oid: element };
              } else {
                return element;
              }
            });
          } else if (/^[0-9a-fA-F]{24}$/.test(doc[field])) {
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

cronJobController.post("/delete", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await WellnessSurvey.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });

    await HazardReport.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });
    const archivedUsers = await User.find({
      archivedDate: { $lte: thirtyDaysAgo },
    });

    for (const user of archivedUsers) {
      await user.remove();
    }
    await AssistanceRequest.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });
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
module.exports = {
  cronJobController,
};
