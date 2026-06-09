const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username:{
        type: String,
        unique:[true, "Username is already taken"],
        reuqired: true,
    },

    email:{
        type: String,
        unique:[true,"Account already exists with this email adress"],
        required: true,
    },

    password:{
        type: String,
        required: true
    }
})

const userModel = mongoose.model("user", userSchema)

module.exports=userModel