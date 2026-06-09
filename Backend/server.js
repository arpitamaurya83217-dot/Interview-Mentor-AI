require("dotenv").config()
const { connect } = require("mongoose")
const app=require("./src/app")
const connectToDB = require("./src/config/database")

const  generateInterviewReport  = require("./src/services/ai.service")
connectToDB()




app.listen(3000, () => {
    console.log("Server is running on port 3000")
})