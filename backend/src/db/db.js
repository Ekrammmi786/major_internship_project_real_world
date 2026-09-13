import mongoose from "mongoose";
 import dotenv from "dotenv";
 import dns from "dns";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);
    dotenv.config();
const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI,{
            
        });
        console.log(`MongoDB Connected`);
    }catch(error){
        console.error("error in db connection",error);
        process.exit(1);
    }
}

export default connectDB;