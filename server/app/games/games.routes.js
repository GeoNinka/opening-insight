import { analyseGames, getGames, getBlundersReport, getGamesByUserId, getEvaluationForClient, getUsernames, deleteGamesByUsername} from "./games.controller.js";
import { verifyJWT } from "../middleware/verifyToken.js";
import express from 'express'

const router = express.Router()

router.route('/fetch').post(verifyJWT, getGames)
router.route('/analyse').get(verifyJWT, analyseGames)
router.route('/blunders').get(verifyJWT, getBlundersReport)
router.route('/get').post(verifyJWT, getGamesByUserId)
router.route('/bestmove').post(getEvaluationForClient)
router.route('/usernames').get(verifyJWT, getUsernames)
router.route('/delete').post(verifyJWT, deleteGamesByUsername)


export default router