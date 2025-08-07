import path from 'node:path'
import * as dotenv from 'dotenv'
dotenv.config({path:path.join('./src/config/.env.dev')})
import express from 'express'
import connectDB from './DB/connection.db.js'
import authController from './modules/auth/auth.controller.js'
import userController from './modules/user/user.controller.js'
import { globalErrorHandling } from './utils/response.js'
import cors from 'cors'

const bootstrap = async () => {
    const app = express()
    const port = process.env.PORT || 3000

    //convert json buffer data
    app.use(express.json())

    //
    app.use(cors())
    //DB
    await connectDB()

    //app-routing
    app.get('/', (req,res) => {
        res.json({message:"welcome to saraha app"})
    })
    app.use('/auth', authController)
    app.use('/user', userController)
    app.all('/*dummy', (req , res) =>{
        return res.status(404).json({message:"In-valid app routing"})
    })
    app.use(globalErrorHandling)

    return app.listen(port, ()=> console.log(`app listening on port ${port}!`))
}
export default bootstrap