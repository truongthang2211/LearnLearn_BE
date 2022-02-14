import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import User, { UserDocument } from "../models/user";
import jwt, { JwtPayload } from "jsonwebtoken";
import Token from "../utils/token-utils";
const authController = {
  registerUser: async (req: Request, res: Response, next: NextFunction) => {
    // Check valid request
    const validRequest = checkValidRequest(
      req,
      "email",
      "password",
      "fullname"
    );
    if (!validRequest.success) {
      return res
        .status(402)
        .json({ success: false, message: validRequest.message });
    }
    // Check username or email exist
    if (
      await User.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
      })
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Username or email existed" });
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.password, salt);

      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        fullname: req.body.fullname,
      });
      const payload = {
        id: newUser._id,
        email: newUser.email,
      };
      const { accessToken, refreshToken } = Token.refreshToken(payload);
      Token.setTokens(res, accessToken, refreshToken);
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
        const userOb = user.toObject();
        const validPassword = await bcrypt.compare(
          req.body.password,
          userOb.password
        );
        if (validPassword) {
          const payload = {
            id: userOb._id,
            email: userOb.email,
          };
          const { accessToken, refreshToken } = Token.refreshToken(payload);
          Token.setTokens(res, accessToken, refreshToken);
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
          const filteredToken = thisUser.refreshToken.filter(
            (token) => token !== _refreshToken
          );
          thisUser.refreshToken = filteredToken;
          const payload = {
            id: thisUser._id,
            email: thisUser.email,
          };
          const { accessToken, refreshToken } = Token.refreshToken(payload);
          thisUser.refreshToken.push(refreshToken);
          thisUser.save();
          Token.setTokens(res, accessToken, refreshToken);
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
export default authController;
