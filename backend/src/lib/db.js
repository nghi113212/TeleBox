import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {console.log("MongoDB connected")});
        await mongoose.connect(`${process.env.DATABASE_URI}/teleBox_db`);
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
    }
}

export default connectDB;