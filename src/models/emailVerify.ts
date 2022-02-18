import mongoose from "mongoose";
export interface EmailVerifyDocument extends mongoose.Document {
  email: string;
  verifyToken: string;
  createdAt: Date;
  updatedAt: Date;
}
const EmailVerifySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    verifyToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const EmailVerify = mongoose.model<EmailVerifyDocument>(
  "emailverify",
  EmailVerifySchema
);
export default EmailVerify;
