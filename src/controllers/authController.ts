import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import User from "../models/user";
import Token from "../utils/token-utils";
import EmailVerify from "../models/emailVerify";
import nodemailer from "nodemailer";
const authController = {
  registerUser: async (req: Request, res: Response, next: NextFunction) => {
    // Check valid request
    const validRequest = checkValidRequest(
      req,
      "email",
      "password",
      "fullname",
      "verifycode"
    );
    if (!validRequest.success) {
      return res
        .status(402)
        .json({ success: false, message: validRequest.message });
    }

    try {
      // Check email exist
      if (
        await User.findOne({
          email: req.body.email,
        })
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Email existed" });
      }
      if (!(await checkVerifyCode(req.body.verifycode, req.body.email))) {
        return res.status(401).json({
          success: false,
          message: "Your verify code dose not match or expired",
        });
      }
      const hashedPassword = await HashPassword(req.body.password);
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        fullname: req.body.fullname,
      });
      const payload = {
        id: newUser._id,
        email: newUser.email,
      };
      const { accessToken, refreshToken } = Token.refreshToken(payload);
      Token.setTokens(res, refreshToken);
      newUser.refreshToken.push(refreshToken);
      newUser.save();
      res.cookie("refreshToken", refreshToken);
      res.status(200).json({ success: true, message: accessToken });
    } catch (error) {
      res.status(500).json({ success: false, message: error });
    }
  },
  loginUser: async (req: Request, res: Response) => {
    // Check valid request
    const validRequest = checkValidRequest(req, "email", "password");
    if (!validRequest.success) {
      return res
        .status(402)
        .json({ success: false, message: validRequest.message });
    }
    try {
      // Check user match
      const user = await User.findOne({ email: req.body.email }).select(
        "+password"
      );
      if (user) {
        const validPassword = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (validPassword) {
          const payload = {
            id: user._id,
            email: user.email,
          };
          const { accessToken, refreshToken } = Token.refreshToken(payload);
          Token.setTokens(res, refreshToken);
          user.refreshToken.push(refreshToken);
          user.save();
          res.status(200).json({
            success: true,
            message: accessToken,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Password was wrong!",
          });
        }
      } else {
        res.status(404).json({
          success: false,
          message: "This account does not exist",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error });
    }
  },
  logoutUser: async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: req.body.user.id });
    if (user) {
      user.refreshToken = user.refreshToken.filter(
        (e) => e !== req.cookies.refreshToken
      );
      user.save();
      res.clearCookie("refreshToken");
      res.status(200).json({ success: true, message: "Logged out!" });
    } else {
      res
        .status(200)
        .json({ success: false, message: "Invalid token, user not found!" });
    }
  },
  requestRefreshToken: (req: Request, res: Response) => {
    try {
      const _refreshToken = req.cookies.refreshToken;
      Token.verifyRefreshToken(_refreshToken, async (err, user: any) => {
        if (err)
          return res
            .status(403)
            .json({ success: false, message: "Refresh token not valid" });
        const thisUser = await User.findOne({ _id: user.id });
        if (thisUser) {
          if (!thisUser.refreshToken.includes(_refreshToken)) {
            return res
              .status(403)
              .json({ success: false, message: "Refresh token not valid" });
          }
          const payload = {
            id: thisUser._id,
            email: thisUser.email,
          };
          const { accessToken } = Token.refreshToken(payload);
          // Token.setTokens(res, accessToken);
          return res.status(200).json({ success: true, message: accessToken });
        } else {
          return res.status(403).json({
            success: false,
            message: "Refresh token not valid, user not found",
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error });
    }
  },
  sendVerifyCode: async (req: Request, res: Response) => {
    try {
      const emailverify = req.body.email;
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(process.env.EMAIL_SENDER, process.env.PASSWORD_EMAIL_SENDER);
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        service: "gmail",
        // host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_SENDER, // generated ethereal user
          pass: process.env.PASSWORD_EMAIL_SENDER, // generated ethereal password
        },
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: "	LearnLearn Verify", // sender address
        to: emailverify, // list of receivers
        subject: `${verifyCode} is your verify code`, // Subject line
        html: `Hi, you are registering at LearnLearn. Here your code to verify your account: <b>${verifyCode}</b>`, // html body
      });
      await EmailVerify.updateOne(
        {
          email: emailverify,
        },
        { verifyToken: Token.signToken({ verifyCode }, "5m") },
        {
          strict: true,
          upsert: true,
          timestamps: true,
        }
      );
      return res.status(200).json({
        success: true,
        message: "Email has been sent",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  requestResetPassword: async (req: Request, res: Response) => {
    try {
      const verifycode = req.body.verifycode;
      const email = req.body.email;
      if (await checkVerifyCode(verifycode, email)) {
        const resetpasswordToken = Token.signToken(
          {
            verifyCode: verifycode,
            email: email,
          },
          "10m"
        );
        const tes = await User.updateOne(
          { email: email },
          { resetPasswordToken: resetpasswordToken },
          {
            strict: true,
            upsert: true,
          }
        );

        return res.status(200).json({
          success: true,
          message: resetpasswordToken,
        });
      }
      return res.status(401).json({
        success: false,
        message: "Your verify code was not correct",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
  resetPassword: async (req: Request, res: Response) => {
    try {
      const resetPasswordToken = req.body.resetpasswordtoken;
      const payload = Token.verifyToken(resetPasswordToken);
      if (payload.email) {
        const emailveri = await User.findOne({ email: payload.email });
        if (emailveri && emailveri.resetPasswordToken === resetPasswordToken) {
          const hashedPassword = await HashPassword(req.body.password);
          await User.updateOne(
            { email: payload.email },
            { password: hashedPassword, resetPasswordToken: null },
            {
              upsert: true,
            }
          );
          return res.status(200).json({
            success: true,
            message: "Your password has been updated",
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: "Your verify code was not correct or expired",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  },
};
function checkValidRequest(req: Request, ...params: string[]) {
  for (let i = 0; i < params.length; ++i) {
    if (!req.body[params[i]]) {
      return {
        success: false,
        message: `${params[i]} is required`,
      };
    }
  }
  return {
    success: true,
  };
}
async function checkVerifyCode(code: string, email: string): Promise<boolean> {
  try {
    const verifyEmail = await EmailVerify.findOne({ email: email });
    if (!verifyEmail) {
      return false;
    } else {
      const verifiedCode = Token.verifyToken(verifyEmail.verifyToken);
      if (verifiedCode.verifyCode !== code) return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}
async function HashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}
export default authController;
