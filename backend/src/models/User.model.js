import mongoose from "mongoose";
const {Schema} = mongoose;

const userSchema = new Schema({
    username: {type: String, unique: true},
    password: {type: String},
    friends: {type: [Schema.Types.ObjectId], ref: "User"}, 
    profile: {type: Schema.Types.ObjectId, ref: "Profile"},

}, {timestamps: true, versionKey: false});

const User = mongoose.model("User", userSchema);
export default User;

