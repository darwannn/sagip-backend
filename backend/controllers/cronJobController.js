const cronJobController = require("express").Router();
const User = require("../models/User");
const AssistanceRequest = require("../models/AssistanceRequest");
const WellnessSurvey = require("../models/WellnessSurvey");
const HazardReport = require("../models/HazardReport");

const { MongoClient } = require("mongodb");
const { promises: fs } = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dbName = "sagip";
const dbURL = process.env.MONGO_URL;
const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const path = require("path");
const folderPath = `sagip/backup/${currentDate}`;
const { cloudinary } = require("../utils/config");
cronJobController.post("/backup", async (req, res) => {
  backupDatabase();
});
async function backupDatabase() {
  try {
    const tempFolderPath = path.join(__dirname, "../temp");
    const client = new MongoClient(dbURL, { useUnifiedTopology: true });
    await client.connect();
    console.log("Connected successfully to the server");
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(collections);
    for (const collection of collections) {
      const query = {};
      const docs = await db.collection(collection.name).find(query).toArray();
      const fileName = `${collection.name}.json`;

      const jsonDocs = JSON.stringify(docs);

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

    console.log("Backup completed successfully");
    client.close();
  } catch (err) {
    console.log("An error occurred during backup", err);
  }
}

const deleteArchivedData = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await User.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });

    await AssistanceRequest.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });

    await WellnessSurvey.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });

    await HazardReport.deleteMany({
      isArchived: true,
      archivedDate: { $lte: thirtyDaysAgo },
    });

    console.log("Archived data deleted successfully");
  } catch (error) {
    console.error("Error deleting archived data:", error);
  }
};

module.exports = {
  backupDatabase,
  deleteArchivedData,
  cronJobController,
};
