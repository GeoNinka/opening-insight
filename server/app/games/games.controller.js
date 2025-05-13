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
                max: 10
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


// HUETA NADO PEREPISAT
// export const generateReport = asyncHandler(async (req, res) => {
//     let blunders = await prisma.blunders.findMany({
//         where: {
//             userID: req.id
//         },
//         orderBy: {
//             id: 'desc'
//         }
//     })

//     for (const blunder of blunders) {
//         const winrate = blunder.winrate;
//         const lose = blunder.lose;
//         const count = blunder.count;
//         const criticalRating = count * lose * ((150 - winrate) / 100);

//         await prisma.blunder.update({
//             where: {
//                 id: blunder.id
//             },
//             data: {
//                 criticalRating: criticalRating
//             }
//         });
//     }

//     blunders = await prisma.blunders.findMany({
//         where: {
//             userID: req.id
//         },
//         orderBy: {
//             criticalRating: 'desc'
//         }
//     })

//     res.json(blunders)
// })



export const analyseGames = asyncHandler(async (req, res) => {
    const engine = await stockfish();
    const evaluations = [];
    const globalFenList = [];

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
        const chess = new Chess()
        const movesList = games[i].moves.split(' ').slice(0, 7)
        const fenList = []

        for (let move of movesList) {
            chess.move(move);
            const fen = chess.fen().split(' -')[0];
            fenList.push(fen);
        }

        for (let i = 0; i < fenList.length - 1; i++) {
            let fromFEN = fenList[i]
            let toFEN = fenList[i + 1]

            let fpe = await getEvaluation(fromFEN, engine)
            let spe = await getEvaluation(toFEN, engine)

            globalFenList.push({"first": fpe, "second": spe})
        }
    }

    res.json(globalFenList)

    // for (let game of games) {
    //     const chess = new Chess();
    //     const movesList = game.moves.split(' ').slice(0, 15);
    //     const fenList = [];

    //     for (let move of movesList) {
    //         chess.move(move);
    //         const fen = chess.fen().split(' -')[0];
    //         fenList.push(fen);
    //     }

    //     globalFenList.push(fenList);
    // }

    // for (let fenList of globalFenList) {
    //     for (let fen of fenList) {
    //         const evaluation = await getEvaluation(fen, engine);
    //         evaluations.push(evaluation);
    //     }
    // }

    // engine.postMessage('quit');

    // res.json(evaluations);
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// export const analyseGames = asyncHandler(async (req, res) => {
//     const engine = await stockfish();
//     const evaluations = [];
//     const globalFenList = [];

//     await new Promise((resolve) => {
//         engine.onmessage = (msg) => {
//             const text = msg.data || msg;
//             if (text === 'readyok') resolve();
//         };
//         engine.postMessage('uci');
//         engine.postMessage('isready');
//     });

//     const games = await prisma.games.findMany({
//         where: { userID: req.id },
//         orderBy: { id: 'desc' },
//     });

//     for (let game of games) {
//         const chess = new Chess();
//         const movesList = game.moves.split(' ').slice(0, 15);
//         const fenList = [];
//         const blunders = [];

//         for (let move of movesList) {
//             chess.move(move);
//             const fenBefore = chess.fen().split(' -')[0];
//             chess.move(move);
//             const fenAfter = chess.fen().split(' -')[0];
//             fenList.push({ fenBefore, fenAfter });

//             // Проверка наличия хода в таблице theoreticalBlunders
//             const blunder = await prisma.theoreticalBlunders.findFirst({
//                 where: {
//                     from: fenBefore,
//                     to: fenAfter,
//                 },
//             });

//             if (blunder) {
//                 // Если ход найден в таблице theoreticalBlunders, сохраняем его в таблице Blunders
//                 await prisma.blunders.create({
//                     data: {
//                         from: fenBefore,
//                         to: fenAfter,
//                         gameId: game.id,
//                         userId: req.id,
//                     },
//                 });
//                 blunders.push({ fenBefore, fenAfter });
//                 break; // Переходим к следующей игре после нахождения ошибки
//             } else {
//                 // Если ход не найден в таблице theoreticalBlunders, проверяем его с помощью getEvaluation
//                 const evaluationBefore = await getEvaluation(fenBefore, engine);
//                 const evaluationAfter = await getEvaluation(fenAfter, engine);

//                 if (
//                     evaluationBefore &&
//                     evaluationAfter &&
//                     Math.abs(evaluationBefore.value - evaluationAfter.value) > 1.2
//                 ) {
//                     // Если разница в оценке превышает 1.2, сохраняем ход в таблице Blunders
//                     await prisma.blunders.create({
//                         data: {
//                             from: fenBefore,
//                             to: fenAfter,
//                             gameId: game.id,
//                             userId: req.id,
//                         },
//                     });
//                     blunders.push({ fenBefore, fenAfter });
//                     break; // Переходим к следующей игре после нахождения ошибки
//                 }
//             }
//         }

//         globalFenList.push(fenList);
//     }

//     engine.postMessage('quit');

//     res.json();
// });



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



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