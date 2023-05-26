const safetyTipController = require("express").Router()
const SafetyTip = require("../models/SafetyTip")
const verifyToken = require('../middlewares/verifyToken')

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


safetyTipController.post('/add', verifyToken, async (req, res) => {
    try {
        const safetyTip = await SafetyTip.create({ ...req.body, userId: req.user.id })
        return res.status(201).json({ message: 'SafetyTip created successfully', safetyTip })
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