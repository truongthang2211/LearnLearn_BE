import routerAuth from "./auth";
import express from "express";
import routerUser from "./user";
const router = express.Router();
router.use("/v1/auth", routerAuth);
router.use("/v1/api", routerUser);
export default router;
