import { verifyJWT } from "../middleware/verifyToken.js";
import express from 'express'
import { addPosition, updatePosition, getContinuations, deleteContinuation } from "./theory.controller.js";

const router = express.Router()

router.route('/add').post(verifyJWT, addPosition)
router.route('/update').post(verifyJWT, updatePosition)
router.route('/get').post(getContinuations)
router.route('/delete').post(verifyJWT, deleteContinuation)



export default router