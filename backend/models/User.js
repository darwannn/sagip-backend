const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    
    firstname: {
      type: String,
      //required: [true, 'Please add a firstname'],
    },
    middlename: {
      type: String,
      //required: [true, 'Please add a middlename'],
    },
    lastname: {
      type: String,
      //required: [true, 'Please add a lastname'],
    },
    contactNumber: {
      type: String,
      //required: [true, 'Please add a contactNumber'],
    },
    email: {
      type: String,
      //required: [true, 'Please add a email'],
    },
    region: {
      type: String,
      //required: [true, 'Please add a region'],
    },
    province: {
      type: String,
      //required: [true, 'Please add a province'],
    },
    municipality: {
      type: String,
      //required: [true, 'Please add a municipality'],
    },
    barangay: {
      type: String,
      //required: [true, 'Please add a barangay'],
    },
    street: {
      type: String,
      //required: [true, 'Please add a street'],
    },
    gender :{
      type: String,
    },
    birthdate:{
      type:Date
    },
    password: {
      type: String,
      //required: [true, 'Please add a password'],
    },
    profilePicture: {
      type: String,
      ////required: [true, 'Please add a name'],
    },
    attempt: {
      type: Number,
      //required: [true, 'Please add a attempt'],
    },
    verificationCode: {
      type: Number,
      //required: [true, 'Please add a verificationCode'],
    },
    codeExpiration: {
      type: Date,
      //required: [true, 'Please add a codeExpiration'],
    },
    verificationPicture: {
      type: String,
      //required: [true, 'Please add a verificationPicture'],
    },
    userType: {
      type: String,
      //required: [true, 'Please add a userType'],
    },
    isOnline: {
      type: Boolean,
      //required: [true, 'Please add a name'],
  
    },

    isBanned: {
      type: String,
      //required: [true, 'Please add a password'],

    },
    status: {
      type: String,
      //required: [true, 'Please add a password'],

    },
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', userSchema)
