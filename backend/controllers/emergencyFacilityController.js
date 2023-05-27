const emergencyFacilityController = require("express").Router()
const EmergencyFacility = require("../models/EmergencyFacility")
const verifyToken = require('../middlewares/verifyToken')
const {isEmpty,isImage,isLessThanSize} = require('./functionController')


const multer = require("multer");
const path = require("path");

const fs = require('fs');


// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

emergencyFacilityController.post('/add', verifyToken, upload.single('image'), async (req, res) => {
    const error = {};
    try {
      const { title, content, category } = req.body;
  
      if (isEmpty(title)) error["title"] = 'Required field';
      if (isEmpty(content)) error["content"] = 'Required field';
      if (isEmpty(category)) error["category"] = 'Required field';
      if (!req.file) error["image"] = 'Required field';
  
      // Multer file filter validation

  
      // Check file extension
   
  if (isImage(req.file)) {
    error["image"] = 'Only PNG, JPEG, and JPG files are allowed';
  }
 
      if (isLessThanSize(req.file,10 * 1024 * 1024)) {
        error["image"] = 'File size should be less than 10MB';
      }

      if (Object.keys(error).length === 0) {
        const EmergencyFacility = await EmergencyFacility.create({
          title,
          content,
          category,
          image: req.file.filename,
          userId: req.user.id
        });
        if (EmergencyFacility) {
        return res.status(200).json({
          success: true,
          message: "EmergencyFacility created successfully",
          EmergencyFacility
        });
    } else {
        return res.status(500).json({
          success:false,
          message:"DB Error",
        })
      }
      }
  
      if (Object.keys(error).length !== 0) {
        error["success"] = false;
        error["message"] = "Input error";
        return res.status(400).json(error);
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error" + error
      });
    }
  });


/* get all */
emergencyFacilityController.get('/', async (req, res) => {
    try {
        const safetyTips = await EmergencyFacility.find({}).populate("userId", '-password')
        console.log("dasd");
        console.log(safetyTips);
        return res.status(200).json(safetyTips)
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error" + error,
          })
    }
})

/* get specific  */
emergencyFacilityController.get('/:id', async (req, res) => {
    try {
        const EmergencyFacility = await EmergencyFacility.findById(req.params.id).populate("userId", '-password')
        
        EmergencyFacility.views += 1
        console.log(EmergencyFacility);
        await EmergencyFacility.save()
        return res.status(200).json(EmergencyFacility)
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error" + error,
          })
    }
})


emergencyFacilityController.put('/update/:id', verifyToken, upload.single('image'), async (req, res) => {
  const error = {};
  try {
    const { title, content, category, hasChanged } = req.body;
    console.log(hasChanged);
    if (isEmpty(title)) error["title"] = 'Required field';
    if (isEmpty(content)) error["content"] = 'Required field';
    if (isEmpty(category)) error["category"] = 'Required field';

    if (hasChanged == true) {
      if (!req.file) error["image"] = 'Required field';
      else {
        if (isImage(req.file)) {
          error["image"] = 'Only PNG, JPEG, and JPG files are allowed';
        }
      
        if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
          error["image"] = 'File size should be less than 10MB';
        }
      }
    }

    if (Object.keys(error).length === 0) {
      const updateFields = { title, content, category, userId: req.user.id };
      let imagePath = '';

      if (hasChanged && req.file) {
        updateFields.image = req.file.filename;

        const deletedSafetyTip = await EmergencyFacility.findById(req.params.id);
        if (deletedSafetyTip) {
          imagePath = `public/images/${deletedSafetyTip.image}`;
        }
      }

      const EmergencyFacility = await EmergencyFacility.findByIdAndUpdate(req.params.id, updateFields, { new: true });

      if (EmergencyFacility) {
        if (hasChanged && req.file) {
          fs.unlink(imagePath, (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error deleting the image',
              });
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: "EmergencyFacility updated successfully",
          EmergencyFacility
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "DB Error",
        });
      }
    }

    if (Object.keys(error).length !== 0) {
      error["success"] = false;
      error["message"] = "Input error";
      return res.status(400).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error
    });
  }
});

  

emergencyFacilityController.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
     /*  const EmergencyFacility = await EmergencyFacility.findById(req.params.id);
      if(EmergencyFacility.userId.toString() !== req.user.id.toString()){
          throw new Error("You can delete only your own posts")
      } */
  
      const deletedSafetyTip = await EmergencyFacility.findByIdAndDelete(req.params.id);
  
      if (deletedSafetyTip) {
 
        const imagePath = `public/images/${deletedSafetyTip.image}`;
        fs.unlink(imagePath, (err) => {
          if (err) {
          
            return res.status(500).json({
              success: false,
              message: 'Error deleting the image ',
            });
          } else {

            return res.status(200).json({
              success: true,
              message: 'EmergencyFacility  deleted successfully',
            });
          }
       
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'DB Error',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error' + error,
      });
    }
  });
  

/* 
emergencyFacilityController.put('/saves/:id', verifyToken, async (req, res) => {
    try {
        const EmergencyFacility = await EmergencyFacility.findById(req.params.id)
        if(EmergencyFacility.saves.includes(req.user.id)){
            EmergencyFacility.saves = EmergencyFacility.saves.filter((userId) => userId !== req.user.id)
            await EmergencyFacility.save()

            return res.status(200).json({msg: 'Successfully unliked the EmergencyFacility'})
        } else {
            EmergencyFacility.saves.push(req.user.id)
            await EmergencyFacility.save()

            return res.status(200).json({msg: "Successfully liked the EmergencyFacility"})
        }

    } catch (error) {
        return res.status(500).json(error)
    }
})

emergencyFacilityController.get('/saved/:userId', async (req, res) => {
    try {
      const likedSafetyTips = await EmergencyFacility.find({ saves: req.params.userId }).populate("userId", "-password");
      return res.status(200).json(likedSafetyTips);
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error" + error,
          })
    }
  }); */
  
module.exports = emergencyFacilityController