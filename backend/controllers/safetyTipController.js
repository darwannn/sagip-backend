const safetyTipController = require("express").Router()
const SafetyTip = require("../models/SafetyTip")
const tokenMiddleware = require('../middlewares/tokenMiddleware')
const { isEmpty, isImage, isLessThanSize } = require('./functionController')

const uploadMiddleware = require('../middlewares/uploadMiddleware')
const upload = uploadMiddleware('public/images/Safety Tip'); 

const fs = require('fs');

safetyTipController.post('/add', tokenMiddleware, upload.single('image'), async (req, res) => {
    const error = {};
    try {
      const { title, content, category } = req.body;
  
      if (isEmpty(title)) error["title"] = 'Required field';
      if (isEmpty(content)) error["content"] = 'Required field';
      if (isEmpty(category)) error["category"] = 'Required field';
     
      if (!req.file) { error["image"] = 'Required field';}
      else {

        if (isImage(req.file)) {
          error["image"] = 'Only PNG, JPEG, and JPG files are allowed';
        } else {
                if (isLessThanSize(req.file,10 * 1024 * 1024)) {
                  error["image"] = 'File size should be less than 10MB';
                }
        }
      }


      if (Object.keys(error).length === 0) {
        const safetyTip = await SafetyTip.create({
          title,
          content,
          category,
          image: req.file.filename,
          userId: req.user.id
        });
        if (safetyTip) {
        return res.status(200).json({
          success: true,
          message: "SafetyTip created successfully",
          safetyTip
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
safetyTipController.get('/', async (req, res) => {
    try {
        const safetyTips = await SafetyTip.find({}).populate("userId", '-password')
     
   
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

        await safetyTip.save()
        return res.status(200).json(safetyTip)
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "not found"
      });
    }
})


safetyTipController.put('/update/:id', tokenMiddleware, upload.single('image'), async (req, res) => {
  const error = {};
  try {
    const { title, content, category, hasChanged } = req.body;
  
    if (isEmpty(title)) error["title"] = 'Required field';
    if (isEmpty(content)) error["content"] = 'Required field';
    if (isEmpty(category)) error["category"] = 'Required field';

    if (hasChanged == "true") {
      if (!req.file) error["image"] = 'Required field';
    
        if (isImage(req.file)) {
          error["image"] = 'Only PNG, JPEG, and JPG files are allowed';
        }
      
        if (isLessThanSize(req.file, 10 * 1024 * 1024)) {
          error["image"] = 'File size should be less than 10MB';
        }
      
    }
 
    if (Object.keys(error).length === 0) {
      const updateFields = { title, content, category, userId: req.user.id };
      let imagePath = '';

      if (hasChanged && req.file) {
        updateFields.image = req.file.filename;

        const deletedSafetyTip = await SafetyTip.findById(req.params.id);
        if (deletedSafetyTip) {
          imagePath = `public/images/Safety Tip/${deletedSafetyTip.image}`;
        }
      }

      const safetyTip = await SafetyTip.findByIdAndUpdate(req.params.id, updateFields, { new: true });

      if (safetyTip) {
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
          message: "SafetyTip updated successfully",
          safetyTip
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

  

safetyTipController.delete('/delete/:id', tokenMiddleware, async (req, res) => {
    try {
     /*  const safetyTip = await SafetyTip.findById(req.params.id);
      if(safetyTip.userId.toString() !== req.user.id.toString()){
          throw new Error("You can delete only your own posts")
      } */
  
      const deletedSafetyTip = await SafetyTip.findByIdAndDelete(req.params.id);
  
      if (deletedSafetyTip) {
 
        const imagePath = `public/images/Safety Tip/${deletedSafetyTip.image}`;
        fs.unlink(imagePath, (err) => {
          if (err) {
          
            return res.status(500).json({
              success: false,
              message: 'Error deleting the image ',
            });
          } else {

            return res.status(200).json({
              success: true,
              message: 'SafetyTip  deleted successfully',
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
  


safetyTipController.put('/saves/:id', tokenMiddleware, async (req, res) => {
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