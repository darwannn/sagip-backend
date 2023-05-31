

const path = require("path");
const Notification = require("../models/Notification")
  
  const isEmpty = (value) => {
    if (value == "") {
      return true
    }
  }
  const isImage = (file) => {
    const allowedExtensions = ['.png', '.jpeg', '.jpg'];
    const extname = path.extname(file.originalname).toLowerCase();
    console.log("ssss");
    console.log("s"+ extname);
    if (!allowedExtensions.includes(extname)) {
      
      return true;
      
    }
  }
  const isLessThanSize = (file, maxSize) => {
 /*    console.log(file);
    console.log("sizs+"+ file.size); */
  if (file.size > maxSize) {
    return true;
  }

  }


  const createNotification = async (id,title,message,category)=> {
    await Notification.findOneAndUpdate(
      { userId: id }, // Filter to find the notification by its ID
      {
        $push: {
          notifications: {
            title: title,
            message: message,
            dateSent: Date.now(),
            category: category,
            isRead: false
          }
        }
      }
    );
    
  }

module.exports = {isEmpty,isImage,isLessThanSize,createNotification}