
import path from 'node:path'
import * as dotenv from 'dotenv'
//dotenv.config({ path: path.join('./src/config/.env.dev') })
dotenv.config({})
import authController from './modules/auth/auth.controller.js'
import messageController from './modules/message/message.controller.js'
import userController from './modules/user/user.controller.js'
import express from 'express'
import connectDB from './DB/connection.db.js'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { startExpiredTokensCron } from './utils/events/expiredToken.cron.js'
import { globalErrorHandling } from './utils/response.js'
import cors from 'cors'
import chalk from 'chalk'


const bootstrap = async () => {
    const app = express()
    const port = process.env.PORT || 3000

    //convert json buffer data
    app.use(express.json())

    //cors
    //var whitelist = process.env.ORIGINS.split(",")

    //var corsOptions = {
    //    origin: function (origin, callback) {
    //        if (whitelist.indexOf(origin) !== -1) {
    //            callback(null, true)
    //        } else {
    //            callback(new Error('Not allowed by CORS'))
    //        }
    //    }
    //}
    app.use(cors())

    app.use(helmet())

    const limiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: 2000,
        message: { error: "to many requests" },
        handler: (req, res, next, options) => {
            return res.status(options.statusCode).json(options.message)
        },
        //legacyHeaders:false
        standardHeaders: 'draft-8'
    })
    app.use('/auth', limiter)

    app.use(morgan('dev'))
    //DB
    await connectDB()
    app.use("/uploads", express.static(path.resolve('./src/uploads')))

    //app-routing
    app.get('/', (req, res) => {
        res.json({ message: "welcome to saraha app" })
    })
    app.use('/auth', authController)
    app.use('/user', userController)
    app.use('/message', messageController)
    app.all('/*dummy', (req, res) => {
        return res.status(404).json({ message: "In-valid app routing" })
    })
    app.use(globalErrorHandling)
    startExpiredTokensCron()

    return app.listen(port, () => console.log(chalk.bgGreen(chalk.black(`app listening on port ${port}!`))))
}
export default bootstrap