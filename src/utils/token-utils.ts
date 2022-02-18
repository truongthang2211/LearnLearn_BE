import { Response } from "express";
import jwt from "jsonwebtoken";
const Token = {
  signToken: (sign: any, exp: string) => {
    return jwt.sign(sign, process.env.JWT_SECRET_TOKEN as string, {
      expiresIn: exp,
    });
  },
  verifyToken: (token: string, callback?: jwt.VerifyCallback): any => {
    return jwt.verify(token, process.env.JWT_SECRET_TOKEN as string, callback);
  },
  signAccessToken: (sign: any) => {
    return jwt.sign(sign, process.env.JWT_SECRET_TOKEN as string, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES,
    });
  },
  signRefreshToken: (sign: any) => {
    return jwt.sign(sign, process.env.JWT_SECRET_TOKEN as string, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    });
  },
  verifyAccessToken: (token: string, callback?: jwt.VerifyCallback) => {
    return jwt.verify(token, process.env.JWT_SECRET_TOKEN as string, callback);
  },
  verifyRefreshToken: (token: string, callback?: jwt.VerifyCallback) => {
    return jwt.verify(token, process.env.JWT_SECRET_TOKEN as string, callback);
  },
  refreshToken: (sign: any) => {
    const accessToken = Token.signAccessToken(sign);
    const refreshToken = Token.signRefreshToken(sign);
    return { accessToken, refreshToken };
  },
  setTokens: (res: Response, refreshToken: string) => {
    res.cookie("refreshToken", refreshToken);
  },
};
export default Token;
