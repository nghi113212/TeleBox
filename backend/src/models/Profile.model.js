import mongoose from "mongoose";
const {Schema} = mongoose;

const profileSchema = new Schema({
    familyName: {type: String},
    givenName: {type: String},
    birthDate: {type: String},
    gender: {type: String},
    about: {type: String, default: ""},
    imageUrl: {type: String, default: "https://cloudanary.s3.ap-southeast-1.amazonaws.com/basic-avatar.jpg"},
    imageKey: {type: String, default: ""},
}, {timestamps: true, versionKey: false});

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;