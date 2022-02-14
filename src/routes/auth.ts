import express from "express";
import authController from "../controllers/authController";
const routerAuth = express.Router();
routerAuth.post("/register", authController.registerUser);
routerAuth.post("/login", authController.loginUser);
routerAuth.post("/refresh", authController.requestRefreshToken);

export default routerAuth;
