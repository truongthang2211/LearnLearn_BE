import express from "express";
import authController from "../controllers/authController";
import verifyToken from "../middleware/auth";
const routerAuth = express.Router();
routerAuth.post("/register", authController.registerUser);
routerAuth.post("/login", authController.loginUser);
routerAuth.post("/logout", verifyToken, authController.logoutUser);
routerAuth.post("/refresh", authController.requestRefreshToken);
routerAuth.post("/sendverify", authController.sendVerifyCode);
routerAuth.post("/needresetpassword", authController.requestResetPassword);
routerAuth.post("/resetpassword", authController.resetPassword);

export default routerAuth;
