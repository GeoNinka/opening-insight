import { verifyJWT } from "../middleware/verifyToken.js";
import { userProfile } from "./user.controller.js";
import express from 'express'

const router = express.Router()

router.route('/profile').get(verifyJWT, userProfile)

export default router