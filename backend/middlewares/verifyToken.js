const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    console.log("dd")
    if(!req.headers.authorization) return res.status(403).json({  success:false,
        message: "Not authorized. No token"})

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")){
        const token = req.headers.authorization.split(" ")[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if(err) return res.status(403).json({success:false, message: "Wrong or expired token"})
            else {
                req.user = data // an object with the user id as its only property -> data = {id: .....}
                next()
            }
        })
    }
}

module.exports = verifyToken