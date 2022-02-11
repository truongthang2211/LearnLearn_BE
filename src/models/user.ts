import exp from "constants";
import mongoose from "mongoose";
export interface UserDocument extends mongoose.Document {
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
      minlength: 10,
    },
    password: {
      type: String,
      default: null,
      minlength: 3,
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const User = mongoose.model<UserDocument>("users", userSchema);
export default User;
