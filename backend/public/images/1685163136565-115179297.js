const safetyTipController = require("express").Router()
const SafetyTip = require("../models/SafetyTip")
const verifyToken = require('../middlewares/verifyToken')
const multer = require('multer');
const path = require('path');

// Set up storage for uploaded images using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'backend/public/image');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ext);
  },
});

// Validate the file type of uploaded images
const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG files are allowed.'));
  }
};

// Set up multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Maximum file size: 20MB
  },
  fileFilter: imageFileFilter,
}).single('image');

// Add the image upload middleware to your route handler
safetyTipController.post('/add', verifyToken, async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A multer error occurred during upload
        return res.status(400).json({ error: err.message });
      } else if (err) {
        // An unknown error occurred during upload
        return res.status(500).json({ error: 'An error occurred during file upload.' });
      }

      // File upload successful, continue creating the SafetyTip
      const safetyTipData = { ...req.body, userId: req.user.id };

      // Add the image path to the safetyTipData
      if (req.file) {
        safetyTipData.image = req.file.path;
      }

      const safetyTip = await SafetyTip.create(safetyTipData);
      return res.status(201).json({ message: 'SafetyTip created successfully', safetyTip });
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});


/* get all */
safetyTipController.get('/', async (req, res) => {
    try {
        const safetyTips = await SafetyTip.find({}).populate("userId", '-password')
        console.log("dasd");
        console.log(safetyTips);
        return res.status(200).json(safetyTips)
    } catch (error) {
        return res.status(500).json(error)
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
        return res.status(500).json(error)
    }
})




safetyTipController.put("/update/:id", verifyToken, async (req, res) => {
    try {
     console.log('====================================');
     console.log("Dasdas");
     console.log('====================================');
     
        const safetyTip = await SafetyTip.findById(req.params.id)
        if (safetyTip.userId.toString() !== req.user.id.toString()) {
            throw new Error("You can update only your own posts")
        }

        const updatedSafetyTip = await SafetyTip
            .findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
            .populate('userId', '-password')

        return res.status(200).json({ message: 'SafetyTip updated successfully', updatedSafetyTip })
    } catch (error) {
        return res.status(500).json(error.message)
    }
})

/* safetyTipController.put('/saves/:id', verifyToken, async (req, res) => {
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
}) */

safetyTipController.delete('/delete/:id', verifyToken, async(req, res) => {
    try {
        const safetyTip = await SafetyTip.findById(req.params.id)
        if(safetyTip.userId.toString() !== req.user.id.toString()){
            throw new Error("You can delete only your own posts")
        }
        
        await SafetyTip.findByIdAndDelete(req.params.id)

        return res.status(200).json({message: "Successfully deleted the safetyTip"})
    } catch (error) {
        return res.status(500).json(error)
    }
})
safetyTipController.get('/saved/:userId', async (req, res) => {
    try {
      const likedSafetyTips = await SafetyTip.find({ saves: req.params.userId }).populate("userId", "-password");
      return res.status(200).json(likedSafetyTips);
    } catch (error) {
      return res.status(500).json(error);
    }
  });
  
module.exports = safetyTipController