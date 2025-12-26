const express = require("express");
const connectDB = require('./config/db');
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const app = express();
require('dotenv').config()
require("./cron/quizStatusCron");
//middlewares
app.use(cors());
app.use(helmet());
app.disable("x-powered-by");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan("dev"));
app.use(express.json());
//routes
const superAdminRoutes=require('./routes/superAdmin.route')
const userRoutes=require('./routes/user.route')
const schoolRoutes=require('./routes/school.route')
const locationRoutes=require('./routes/location.route')
const { sendSuccess } = require("./utils/response");
const { constants } = require("./constant");

//home route
app.get('/',(req, res)=>{
    const healthInfo = {
    appName: 'KnowAllEdge API',
    status: 'running',
    uptime: process.uptime().toFixed(2) + ' seconds',
    environment: process.env.NODE_ENV || 'development'
  };
  return sendSuccess(res, constants.OK, "KnowAllEdge app working fine.",healthInfo)
})

app.use("/api/v1/superAdmin",superAdminRoutes)
app.use("/api/v1/user",userRoutes)
app.use("/api/v1/school",schoolRoutes)
app.use("/api/v1/locations",locationRoutes)

//Connect to MongoDb and Server
if (process.env.NODE_ENV !== "test") {
const PORT = process.env.PORT || 8080;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server up at ${PORT}`);
  });
});
}

module.exports = app;