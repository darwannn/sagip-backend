const authController = require('express').Router()
const User = require("../models/User")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const verifyToken = require('../middlewares/verifyToken')
// const isBanned = require('../middlewares/authMiddleware')
const { sendSMS, apiController } = require('./apiController')

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
         
            console.log("success");
         
           /*   sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */
          /*   if (process.env.ENVIRONMENT === 'production') {
                return   res.status(200).json({
                    success:true,
                message:"Please verify contact number",
              })
            } else { */


           // const { ...userData } = user._doc;

           /*  return res.status(200).json({
              success: true,
              message: "Please verify contact number",
              user: user._doc,
              token: generateToken(user._id)
            });
                 */
           
          return res.status(200).json({
            success: true,
            message: "Please verify contact number",
            user: {
              for: "register",
              id: user._doc._id,
              code: user._doc.verificationCode,
              userType: user._doc.userType
            },
            token: generateToken(user._id)
          });

              /*   return  res.status(200).json({
                    success:true,
                _id: user.id,
                name: user.email,
                verificationCode: user.verficationCode,
                codeExpiration:user.codeExpiration,
                token: generateToken(user._id),
                message:"Please verify contact number",
              }) */
          /*   } */
           
          } else {

            console.log("error");

              error['error'] = 'Database Error'
            return  res.status(400)
          }
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

authController.post('/contact-verification', verifyToken, async (req, res) => {
  try {
    const error = {};
    const { code,type } = req.body;
    const userId = req.user.id; 

/*     const userId = "646de7d73b43cfb85af16d77" */
    if (isEmpty(code)) {
      error["code"] = 'Required field';
    } else if (isNumber(code)) {
      error['code'] = 'Invalid code';
    }

    if (Object.keys(error).length == 0) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(500).json({
          success:false,
          message:"User Not Found" + error,
        })
      } else {
        if (code == user.verificationCode) {
          // Code matches, update user status to 'semi-verified'

          if(user.status == "unverified") {
                      user.status = 'semi-verified';
          }
          user.verificationCode = 0;
          await user.save();
   
         /*  return res.status(200).json({
            success: true,
            message: "Please verify contact number",
            user: user._doc,
            token: generateToken(user._id)
          }); */
              
          if(type == "register")
          return res.status(200).json({
            success: true,
            message: "Login Successfully",
            user: {
              for: "login",
              id: user._doc._id,
              code: user._doc.verificationCode,
              userType: user._doc.userType
            },
            token: generateToken(user._id)
          });
              
          if(type == "forgot-password")
          return res.status(200).json({
            success: true,
            message: "Enter your new-password",
            user: {
              for: "new-password",
              id: user._doc._id,
              userType: user._doc.userType
            },
            token: generateToken(user._id)
          });
          
              
        } else {
          error['code'] = 'Incorrect code';
      
        }
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
      const error = {};
      const {
        identifier,
        password
      } = req.body
    
    
      if (isEmpty(identifier)) error["identifier"] = 'Required field'
      if (isEmpty(password)) error["password"] = 'Required field'
    
    
      let user = await checkIdentifier(identifier)
    
      if (!user) {
        error['identifier'] = 'Accoutn does not exist'
      }

    
    
      if (Object.keys(error).length == 0) {
    
        if (user && (await bcrypt.compare(password, user.password))) {
    
         /*  if (process.env.NODE_ENV === 'production') {
           
            return   res.status(200).json({
              success:true,
          message:"Login Succefully",
        })
          } else { */
              

          if (user.status == "banned") {
            return res.status(500).json({
              success:false,
              message:"Account banned. Please contact the CDRRMO",
            })
          } else {
            
            return res.status(200).json({
              success: true,
              message: "Login Successfully",
              user: {
                for: "login",
                id: user._doc._id,
                userType: user._doc.userType
              },
              token: generateToken(user._id)
            });
            
          }

          
          
          
          
          
          // return res.status(200).json({
          //       success:true,
          // message:"Login Succefully",
          //     _id: user.id,
          //     name: user.email,
          //     verificationCode: user.verficationCode,
          //     codeExpiration:user.codeExpiration,
          //     token: generateToken(user._id),
          //   })


          
         /*  } */
        } else {
          error['password'] = 'Incorrect'
        }
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

authController.post('/forgot-password', async (req, res) => {
  // Variable declaration
  let accountExists;
  try {
    const error = {};
    const identifier = req.body.identifier;

    // Checking if the 'identifier' field is empty
    if (isEmpty(identifier)) {
      error["identifier"] = 'Required field';
    } else {
      // Checking if an account with the given identifier exists
      accountExists = await checkIdentifier(identifier);
      if (!accountExists) {
        error['identifier'] = 'Account does not exist';
      }

      
    }

    // If there are no errors so far
    if (Object.keys(error).length == 0) {
      // Generating a verification code
      let generatedCode = await generateCode();
      console.log(accountExists.id);
      // Updating the user's verification code and code expiration using 'User.updateById'
      const user = await User.findByIdAndUpdate(accountExists.id, {
        verificationCode: generatedCode,
        codeExpiration: codeExpiration,
      });


      if (user) {
      /*     sendSMS(`Your SAGIP verification code is ${verificationCode}`,user.contactNumber) */
        // Sending a verification code to the user (code not shown)
        // Responding with success message and user information
       
          if (user.status == "banned") {
            return res.status(500).json({
              success:false,
              message:"Account banned. Please contact the CDRRMO",
            })
          } else {
        return res.status(200).json({
          success: true,
          message: "Message has been sent to",
          user: {
            for: "forgot-password",
            id: user._doc._id,
            code: user._doc.verificationCode,
            userType: user._doc.userType
          },
          token: generateToken(user._id)
        });
      }
       /*  return res.status(200).json({
          success: true,
          message: "Login Successfully",
          user: user._doc,
          token: generateToken(user._id)
        }); */
      } else {
        error['error'] = 'Database Error';
        error["success"] = false;
      }
    }

    // If there are errors, respond with error messages
    if (Object.keys(error).length != 0) {
      error["success"] = false;
      error["message"] = "Input error";
      return res.status(400).json(error);
    }

  } catch (error) {
    // If an exception occurs, respond with an internal server error
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});
authController.post('/new-password', verifyToken,  async (req, res) => {
  // Variable declaration

  try {
    const error = {};
  const password = req.body.password

  // if (isEmpty(password)) {
  //   error["password"] = 'Required field'
  // } else {
  //   if (verifyPassword(password)) {
  //     error['password'] = 'password requirement did not match'
  //   }
  // }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  if (Object.keys(error).length == 0) {

    console.log(req.user);
    const user = await User.findByIdAndUpdate(req.user.id, {
      verificationCode: 0,
      password: hashedPassword
    });
    
    if (user) {
      return res.status(200).json({
        success: true,
        message: "Change Successfully. Login Now",
        // user: {
        //   for: "login",
        //   id: user._doc._id,
        //   userType: user._doc.userType
        // },
        //token: generateToken(user._id)
      });
    } else {
      error['message'] = 'Database Error'
    }

  }

  if (Object.keys(error).length != 0) {
    console.log("error");
    res.status(400).json(error)
  }
  } catch (error) {
    // If an exception occurs, respond with an internal server error
    return res.status(500).json({
      success: false,
      message: "Internal Server Error" + error,
    });
  }
});


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