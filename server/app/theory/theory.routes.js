import { verifyJWT } from "../middleware/verifyToken.js";
import express from 'express'
import { addPosition, updatePosition } from "./theory.controller.js";

const router = express.Router()

router.route('/add').post(verifyJWT, addPosition)
router.route('/update').post(verifyJWT, updatePosition)

export default router