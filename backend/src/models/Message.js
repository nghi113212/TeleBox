import mongoose from "mongoose";
const {Schema} = mongoose;

const messageSchema = new Schema({
    roomId: {type: Schema.Types.ObjectId, ref: "ChatRoom"},
    senderId: {type: Schema.Types.ObjectId, ref: "User"},
    content: {type: String},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    isRead: {type: Boolean, default: false},
}, {timestamps: true, versionKey: false});

const Message = mongoose.model("Message", messageSchema);
export default Message;