import { analyseGames, getGames, getBlundersReport, getGamesByUserId } from "./games.controller.js";
import { verifyJWT } from "../middleware/verifyToken.js";
import express from 'express'

const router = express.Router()

router.route('/fetch').post(verifyJWT, getGames)
router.route('/analyse').get(verifyJWT, analyseGames)
router.route('/blunders').get(verifyJWT, getBlundersReport)
router.route('/get').post(verifyJWT, getGamesByUserId)


export default router