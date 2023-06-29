const User = require("../models/User");
const AssistanceRequest = require("../models/AssistanceRequest");
const WellnessSurvey = require("../models/WellnessSurvey");
const HazardReport = require("../models/HazardReport");
const { cloudinary } = require("../utils/config");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

async function backupDatabase() {
  const uri =
    "mongodb+srv://sagip:0OGHw78wfHrybYJq@cluster0.eqegern.mongodb.net/sagip?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();

    const database = client.db();
    const collection = database.collection("User");
    const data = await collection.find().toArray();

    console.log("Retrieved data:", data);

    if (data.length === 0) {
      console.log("No data found in the collection.");
      return;
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const jsonData = JSON.stringify(data);
    console.log("Backup JSON Data:", jsonData);

    /*   const result = await cloudinary.uploader.upload(jsonData, {
      resource_type: "raw",
      public_id: `mongodb_backup_${currentDate}.json`,
      overwrite: true,
    }); */

    /*    console.log("Backup uploaded to Cloudinary:", result); */
    console.log("Backup completed successfully.");
  } catch (err) {
    console.error("Error occurred during backup:", err);
  } finally {
    await client.close();
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
};
