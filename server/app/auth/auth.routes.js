import { userAuth, userRegistration } from "./auth.controller.js"
import { verifyJWT } from "../middleware/verifyToken.js";
import express from 'express'

const router = express.Router()

router.route('/login').post(userAuth)
router.route('/registration').post(userRegistration)

export default router