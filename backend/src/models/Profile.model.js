import mongoose from "mongoose";
const {Schema} = mongoose;

const profileSchema = new Schema({
    familyName: {type: String},
    givenName: {type: String},
    birthDate: {type: String},
    gender: {type: String},
    imageUrl: {type: String},
}, {timestamps: true, versionKey: false});

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;