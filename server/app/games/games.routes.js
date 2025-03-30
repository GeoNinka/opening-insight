import { analyseGames, getGames } from "./games.controller.js";
import { verifyJWT } from "../middleware/verifyToken.js";
import express from 'express'

const router = express.Router()

router.route('/fetchgames').post(verifyJWT, getGames)
router.route('/analyse').get(verifyJWT, analyseGames)

export default router