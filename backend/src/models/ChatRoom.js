import mongoose from "mongoose";
const {Schema} = mongoose;

const chatRoomSchema = new Schema({
    roomName: {type: String, default: ""},
    isGroup: {type: Boolean, default: false},
    groupAvatar: {type: String, default: ""},
    members: {type: [Schema.Types.ObjectId], ref: "User"},
    deletedFor: {
        type: [{
            userId: { type: Schema.Types.ObjectId, ref: "User" },
            deletedAt: { type: Date, default: Date.now },
        }],
        default: [],
    },
}, {timestamps: true, versionKey: false});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
export default ChatRoom;