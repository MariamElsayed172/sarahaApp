import mongoose from "mongoose"

const connectDB = async ()=>{
    try {
        const uri = process.env.DB_URL
        const result = await mongoose.connect(uri , {
            serverSelectionTimeoutMS: 30000
        })
        console.log("DB connected successfully");
        
        
    } catch (error) {
        console.log("fail to connect to DB", error);
        
    }
}
export default connectDB