import asyncHandler from "express-async-handler"
import { prisma } from "../prisma.js"
import axios from "axios"

import { Chess } from "chess.js"
import stockfish from "stockfish"
import { response } from "express"

export const getGames = asyncHandler(async (req, res) => {
    const nickname = req.body.nickname;

    const items = await fetchGames(nickname);

    const gamesData = await Promise.all(items.map(async element => {

        const isGame = await prisma.games.findUnique({
            where: {
                userID: req.id,
                gameID: element.id
            }
        });

        try {
            if (!isGame) {
                let side = nickname.toLowerCase() === element.players.white.user.id ? 'white' : 'black';
                let winner = element.winner == undefined ? '-1' : element.winner
                return {
                    userID: req.id,
                    gameID: element.id,
                    speed: element.speed,
                    white: element.players.white.user.id,
                    black: element.players.black.user.id,
                    side: side,
                    moves: element.moves,
                    winner: winner
                };
            }
        } catch(e) {

        }
        
        return null;
    }));

    const filteredGamesData = gamesData.filter(game => game !== null);

    const games = await prisma.games.createMany({
        data: filteredGamesData
    })

    res.json("Ok");
})

const fetchGames = async (nickname) => {
    try {
        const response = await axios.get(`https://lichess.org/api/games/user/${nickname}`, {
            params: {
                max: 2
            },
            headers: {
                'Accept': 'application/x-ndjson',
            },
            responseType: 'text'
        });
        const lines = response.data.trim().split('\n');
        const jsonArray = lines.map(line => JSON.parse(line));
        return jsonArray.reverse();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Not OK');
    }
}

export const analyseGames = asyncHandler(async (req, res) => {
    const engine = await stockfish();
    const blunders = [];

    await new Promise((resolve) => {
        engine.onmessage = (msg) => {
            const text = msg.data || msg;
            if (text === 'readyok') resolve();
        };
        engine.postMessage('uci');
        engine.postMessage('isready');
    });

    const games = await prisma.games.findMany({
        where: { userID: req.id },
        orderBy: { id: 'desc' },
    });

    for (let i = 0; i < games.length; i++) {
        const chess = new Chess();
        const movesList = games[i].moves.split(' ').slice(0, 12);
        const fenList = [];

        for (let move of movesList) {
            chess.move(move);
            const fen = chess.fen().split(' -')[0];
            fenList.push(fen);
        }

        for (let j = 0; j < fenList.length - 1; j++) {
            const fromFEN = fenList[j];
            const toFEN = fenList[j + 1];

            const isUserMove = (games[i].side === 'white' && j % 2 === 0) || (games[i].side === 'black' && j % 2 === 1)

            if (isUserMove) continue

            const fromTheory = await prisma.theory.findUnique({ where: { fen: fromFEN } });
            const toTheory = await prisma.theory.findUnique({ where: { fen: toFEN } });

            if (fromTheory && toTheory) {
                const isContinuation = await prisma.theoreticalContinuations.findFirst({
                    where: {
                        fromId: fromTheory.id,
                        toId: toTheory.id
                    }
                });

                if (!isContinuation) {
                    const isBlunder = await prisma.theoreticalBlunders.findFirst({
                        where: {
                            fromId: fromTheory.id,
                            toId: toTheory.id
                        }
                    });

                    if (isBlunder) {
                        const blunder = await prisma.blunders.create({
                            data: {
                                from: fromFEN,
                                to: toFEN,
                                gameId: games[i].id,
                                userId: req.id,
                                loss: -1
                            }
                        });
                        blunders.push(blunder);
                        break;
                    }
                }
            } else {
                const firstEval = await getEvaluation(fromFEN, engine);
                const secondEval = await getEvaluation(toFEN, engine);

                if (firstEval.value !== null && secondEval.value !== null) {
                    const loss = Math.abs(firstEval.value - secondEval.value);

                    if (loss >= 1.2) {
                        const blunder = await prisma.blunders.create({
                            data: {
                                from: fromFEN,
                                to: toFEN,
                                gameId: games[i].id,
                                userId: req.id,
                                loss: loss
                            }
                        });
                        blunders.push(blunder);
                        break; 
                    }
                }
            }
        }
    }

    engine.postMessage('quit');
    res.json(blunders);
});



const getEvaluation = (fen, engine) => {
    return new Promise((resolve, reject) => {
        let resolved = false;
        let attempt = 0;

        const attemptEvaluation = () => {
            const timeout = setTimeout(() => {
                if (!resolved) {
                    attempt++;
                    console.log(`Timeout on FEN: ${fen}. Retrying... (${attempt}/${3})`);

                    if (attempt < 3) {
                        attemptEvaluation();
                    } else {
                        console.warn(`Exceeded retry attempts for FEN: ${fen}`);
                        resolve({ fen, scoreType: 'timeout', value: null });
                    }
                }
            }, 2000);

            engine.onmessage = (event) => {
                const msg = typeof event === 'string' ? event : event.data;

                if (msg.startsWith('info depth 18')) {
                    const match = msg.match(/score\s(cp|mate)\s(-?\d+)/);
                    if (match && !resolved) {
                        clearTimeout(timeout);
                        resolved = true;

                        const type = match[1];
                        let value = parseInt(match[2], 10);

                        const isBlackMove = fen.split(' ')[1] === 'b';

                        if (isBlackMove) {
                            value = -value;
                        }

                        if (type === 'cp') {
                            value = (value / 200).toFixed(2);
                            value = parseFloat(value);
                        }

                        console.log(`Evaluation for FEN: ${fen} — ${type} ${value}`);
                        resolve({ fen, scoreType: type, value });
                    }
                }
            };
            engine.postMessage(`position fen ${fen}`);
            engine.postMessage('go depth 18');
        };
        attemptEvaluation();
    });
};