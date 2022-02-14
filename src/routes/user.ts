import express from "express";
import userController from "../controllers/userController";
import verifyToken from "../middleware/auth";
const routerUser = express.Router();
routerUser.get("/myprofile", verifyToken, userController.myProfile);

export default routerUser;
