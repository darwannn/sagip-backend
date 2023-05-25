const authController = require('express').Router()
const User = require("../models/User")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const { sendVerificationCode, apiController } = require('./apiController')

const currentDate = new Date()
const codeExpiration = new Date(currentDate.getTime() + 30 * 60000)
const dateTimeToday = new Date().toLocaleString();


authController.post('/register', async (req, res) => {
    try {
        // const isExisting = await User.findOne({email: req.body.email})
        // if(isExisting){
        //     throw new Error("Already such an account. Try a different email")
        // }

        // const hashedPassword = await bcrypt.hash(req.body.password, 10)
        // const newUser = await User.create({...req.body, password: hashedPassword})

        // const {password, ...others} = newUser._doc
        // const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {expiresIn: '5h'})

        // return res.status(201).json({user: others, token})
        const error = {};
        let {

          firstname,
          middlename,
          lastname,
          contactNumber,
          email,
          region,
          province,
          municipality,
          barangay,
          street,
          birthdate,
          gender,
          password,
          profilePicture,
          attempt,
          verificationCode,
          userType,
          isResident,
        } = req.body
      
        /* validation */
      /*   const userExists = await User.findOne({
          username
        }) */
       /*  const contactNumberExists = await User.findOne({
          contactNumber
        }) */
      
      /*   if (isEmpty(username)) {
          error["username"] = 'Required field'
        } else {
          if (userExists) {
            error['usename'] = 'User already existsss'
          } else {
            if(isUsername(username) ){
              error['usename'] = 'username must only be a number or character'
            }
          }
        } */
      
     /*    if (isEmpty(contactNumber)) {
          error["contact"] = 'Required field'
        } else {
          if (contactNumberExists) {
            error['contact'] = 'Contact Number already exists'
          } else {
            if(isContactNumber(contactNumber)) {
              error['contact'] = 'must be a number'
            }
          }
        }
      
        if (isEmpty(firstname)) error["firstname"] = 'Required field'
        if (isEmpty(lastname)) error["lastname"] = 'Required field'
        if (isEmpty(birthdate)) error["birthdate"] = 'Required field'
        if (isEmpty(gender)) error["gender"] = 'Required field'
      
      
      
        if (isEmpty(email)) {
          error["email"] = 'Required field'
        } else {
          if (isEmail(email)) {
            error['email'] = 'not email'
          }
        }
      
      
       if (isResident === "true") {
        region = "Region III"
        province = "Bulacan"
        municipality = "Malolos"
      
      } else {
        if (isEmpty(region)) error["region"] = 'Required field'
        if (isEmpty(province)) error["province"] = 'Required field'
        if (isEmpty(municipality)) error["municipality"] = 'Required field'
      }
      if (isEmpty(barangay)) error["barangay"] = 'Required field'
      if (isEmpty(street)) error["street"] = 'Required field'
       
      if (isEmpty(password)) {
        error["password"] = 'Required field'
      } else {
        if (verifyPassword(password)) {
          error['password'] = 'password requirement did not match'
        }
      }
       */
       
      
      
      
        if (Object.keys(error).length == 0) {

          profilePicture = "profile link"
          attempt = 0;
      
          verificationCode = await generateCode();
      
          const salt = await bcrypt.genSalt(10)
          const hashedPassword = await bcrypt.hash(password, salt)
          const emptyString = "d"
          userType = "resident"
          const unverifiedStatus = "unverified";
          const falseStatus = false
      
      
      
          /* create */
          const user = await User.create({
              email,
              password: hashedPassword,

              region,
              province,
              municipality,
              barangay,
              street,

              firstname,
              middlename,
              lastname,
              gender,
              birthdate,

              contactNumber,

            // username,
            isOnline: falseStatus,
            isBanned: falseStatus,
            password: hashedPassword,
            profilePicture,
            attempt,
            verificationCode,
            codeExpiration,
            verificationPicture: emptyString,
            userType,
            status: unverifiedStatus
          })
      
          if (user) {
            console.log('====================================');
            console.log("success");
            console.log('====================================');
            /*  sendVerificationCode(user.contactNumber,user.verificationCode) */
            if (process.env.ENVIRONMENT === 'production') {
                return   res.status(200).json({
                    success:true,
                message:"Please verify contact number",
              })
            } else {
                return  res.status(200).json({
                    success:true,
                _id: user.id,
                name: user.email,
                verificationCode: user.verficationCode,
                codeExpiration:user.codeExpiration,
                token: generateToken(user._id),
                message:"Please verify contact number",
              })
            }
           
          } else {
            console.log('====================================');
            console.log("error");
            console.log('====================================');
              error['error'] = 'Database Error'
            return  res.status(400)
          }
        }
      
        if (Object.keys(error).length != 0) {
          //console.log("error");
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

authController.post('/login', async (req, res) => {
    try {
        // const user = await User.findOne({email: req.body.email})
        // if(!user){
        //     throw new Error("Invalid credentials")
        // }

        // const comparePass = await bcrypt.compare(req.body.password, user.password)
        // if(!comparePass){
        //     throw new Error("Invalid credentials")
        // }

        // const {password, ...others} = user._doc
        // const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '5h'})        


        const error = {};
        const {
          identifier,
          password
        } = req.body
      
      
        if (isEmpty(identifier)) error["identifier"] = 'Required field'
        if (isEmpty(password)) error["password"] = 'Required field'
      
      
        let user = await checkIdentifier(identifier)
      
        if (!user) {
          error['error'] = 'Accoutn does not exist'
        }
      
        if (Object.keys(error).length == 0) {
      
          if (user && (await bcrypt.compare(password, user.password))) {
      
            if (process.env.NODE_ENV === 'production') {
                return res.status(200).json({
                message:"Login Succefully",
              })
            } else {
                return res.status(200).json({
                _id: user.id,
                name: user.email,
                verificationCode: user.verficationCode,
                codeExpiration:user.codeExpiration,
                token: generateToken(user._id),
              })
            }
          } else {
            error['password'] = 'Incorrect'
          }
        }
      
        if (Object.keys(error).length != 0) {
            return res.status(400).json(error)
        }

        return res.status(200).json({user: others, token})
    } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
        return res.status(500).json(error) 
    }
})


/* functions ---------------------------------------- */

const generateCode = async () => {
    let codeTaken, code;
    do {
      code = Math.floor(100000 + Math.random() * 900000)
      codeTaken = await User.findOne({
        verificationCode: code
      });
  
    } while (codeTaken)
    return code
  }
  
  const verifyPassword = (password, field) => {
    const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&,*.])(?=.*\d).{8,16}$/;
    if (!passwordRequirements.test(password)) {
     return true
    }
  }
  
  
  const isEmpty = (value) => {
    if (value == "") {
      return true
    }
  }
  
  const isNumber = (value) => {
    if (isNaN(Number(value))) {
      return true
    }
  }
  const isContactNumber = (value) => {
    if (!/^09\d{9}$/.test.test(value)) {
      return true
    }
  }
  
  const isEmail =  (value) => {
  
    if (!value.includes('@')) {
      return true
    } 
  }
  
/*   const isUsername =  (value) => {
    const regex = /^[a-zA-Z0-9]+$/; 
    if (!regex.test(value)) {
      return true
    } 
  }
   */
  
  const checkIdentifier = async (identifier) => {
    let identierType
    if (identifier.includes('@')) {
      identierType = 'email';
    } else if (/^09\d{9}$/.test(identifier)) {
      identierType = 'contactNumber';
    } /* else {
      identierType = 'username';
    } */
    const accountExists = await User.findOne({
      [identierType]: identifier
    });
    return accountExists;
  }
  
  const generateToken = (id) => {
    return jwt.sign({
      id
    }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    })
  }
  
module.exports = authController