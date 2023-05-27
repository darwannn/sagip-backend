const safetyTipController = require("express").Router()
const SafetyTip = require("../models/SafetyTip")
const verifyToken = require('../middlewares/verifyToken')
const { isEmpty } = require('./functionController')

const express = require("express");
const multer = require("multer");
const path = require("path");



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

safetyTipController.post('/add', verifyToken, upload.single('image'), async (req, res) => {
  const error = {};
  try {
    const { title, content, category } = req.body;

    if (isEmpty(title)) error["title"] = 'Required field';
    if (isEmpty(content)) error["content"] = 'Required field';
    if (isEmpty(category)) error["category"] = 'Required field';

    if (Object.keys(error).length === 0) {
      const safetyTip = await SafetyTip.create({
        title,
        content,
        category,
        image: req.file.filename,
        userId: req.user.id
      });
      
      return res.status(200).json({
        success: true,
        message: "SafetyTip created successfully",
        safetyTip
      });
    }

    if (Object.keys(error).length !== 0) {
      error["success"] = false;
      error["message"] = "input error";
      return res.status(400).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error
    });
  }
});

safetyTipController.put('/update/:id', verifyToken, upload.single('image'), async (req, res) => {
  const error = {};
  try {
    const { title, content, category } = req.body;
    const { id } = req.params;

    if (isEmpty(title)) error["title"] = 'Required field';
    if (isEmpty(content)) error["content"] = 'Required field';
    if (isEmpty(category)) error["category"] = 'Required field';

    if (Object.keys(error).length === 0) {
      let updateData = {
        title,
        content,
        category,
      };

      if (req.file) {
        updateData.image = req.file.filename;
      }

      const safetyTip = await SafetyTip.findByIdAndUpdate(id, updateData, { new: true });

      if (!safetyTip) {
        return res.status(404).json({
          success: false,
          message: "SafetyTip not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "SafetyTip updated successfully",
        safetyTip
      });
    }

    if (Object.keys(error).length !== 0) {
      error["success"] = false;
      error["message"] = "input error";
      return res.status(400).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error
    });
  }
});

module.exports = safetyTipController;

/* get all */
safetyTipController.get('/', async (req, res) => {
    try {
        const safetyTips = await SafetyTip.find({}).populate("userId", '-password')
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
safetyTipController.get('/:id', async (req, res) => {
    try {
        const safetyTip = await SafetyTip.findById(req.params.id).populate("userId", '-password')
        
        safetyTip.views += 1
        console.log(safetyTip);
        await safetyTip.save()
        return res.status(200).json(safetyTip)
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error" + error,
          })
    }
})



safetyTipController.put("/update/:id", verifyToken, async (req, res) => {
   

          const error = {};
          try {
              const {title, content,category, image} = req.body;
               if (isEmpty(title)) error["title"] = 'Required field'
               if (isEmpty(content)) error["content"] = 'Required field'
               if (isEmpty(category)) error["category"] = 'Required field'
      
               if (Object.keys(error).length == 0) {
    
            /*     const safetyTip = await SafetyTip.findById(req.params.id)
                if (safetyTip.userId.toString() !== req.user.id.toString()) {
                    throw new Error("You can update only your own posts")
                } */
        
                const updatedSafetyTip = await SafetyTip
                    .findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
                    .populate('userId', '-password')
        
                return res.status(200).json({
                    success: true,
                    message: "Safety Tip updated successfully",
                  });
               }
        
              if (Object.keys(error).length != 0) {
                  error["success"] = false;
                  error["message"] = "input error";
                  return res.status(400).json(error)
                  
                }
          } catch (error) {
              return res.status(500).json({
                  success:false,
                  message:"Internal Server Error" + error,
                })
          }
})


safetyTipController.delete('/delete/:id', verifyToken, async(req, res) => {
    


  
    
    try {
        const safetyTip = await SafetyTip.findById(req.params.id)
       /*  if(safetyTip.userId.toString() !== req.user.id.toString()){
            throw new Error("You can delete only your own posts")
        } */
        
        await SafetyTip.findByIdAndDelete(req.params.id)
        return res.status(200).json({
            success: true,
            message: "SafetyTip deleted successfully",
          });

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error" + error,
          })
    }
})


safetyTipController.put('/saves/:id', verifyToken, async (req, res) => {
    try {
        const safetyTip = await SafetyTip.findById(req.params.id)
        if(safetyTip.saves.includes(req.user.id)){
            safetyTip.saves = safetyTip.saves.filter((userId) => userId !== req.user.id)
            await safetyTip.save()

            return res.status(200).json({msg: 'Successfully unliked the safetyTip'})
        } else {
            safetyTip.saves.push(req.user.id)
            await safetyTip.save()

            return res.status(200).json({msg: "Successfully liked the safetyTip"})
        }

    } catch (error) {
        return res.status(500).json(error)
    }
})

safetyTipController.get('/saved/:userId', async (req, res) => {
    try {
      const likedSafetyTips = await SafetyTip.find({ saves: req.params.userId }).populate("userId", "-password");
      return res.status(200).json(likedSafetyTips);
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error" + error,
          })
    }
  });
  
module.exports = safetyTipController