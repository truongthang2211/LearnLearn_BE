import { Request, Response, NextFunction } from "express";
import User from "../models/user";
const userController = {
  myProfile: async (req: Request, res: Response) => {
    try {
      res.status(200).json({ success: true, message: req.body.user });
    } catch (error) {
      res.status(500).json({ success: false, message: error });
    }
  },
};
export default userController;
