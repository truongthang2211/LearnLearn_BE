import jwt from "jsonwebtoken";
import Token from "../utils/token-utils";
import { Request, Response, NextFunction } from "express";
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (token) {
    const accessToken = token.split(" ")[1];
    Token.verifyAccessToken(accessToken, (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: "Invalid token" });
      } else {
        req.body.user = user;
        next();
      }
    });
  } else {
    return res
      .status(403)
      .json({ success: false, message: "You're not authenticated" });
  }
};
export default verifyToken;
