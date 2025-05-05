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
                max: 100
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
    let games = []
    games = await prisma.games.findMany({
        where: {
            userID: req.id
        },
        orderBy: {
            id: 'desc'
        },
        // take: 2,
    })

    let globalFenList = []

    games.forEach(game => {
        let fenList = []
        let fen
        const moves = game.moves
        const chess = new Chess()
        let movesList = moves.split(' ')
        movesList = movesList.slice(0, 10)

        movesList.forEach(move => {
            chess.move(move)
            fen = chess.fen()   
            fenList.push(fen)
        });
        globalFenList.push(fenList)
    });

    globalFenList.forEach(arr => {
        arr.forEach(fen => {
            getEvaluation(fen).then(score => {
                console.log(`${fen} ${score}`)
            })
        })
    })


    res.json(globalFenList)
})


const getEvaluation = (fen) => {
    return new Promise((resolve, reject) => {
        const engine = stockfish(); 
        engine.onmessage = function (event) {
            if (event.toString().includes('info')) {
                let msg = event.split(' ')
                if (msg[2] == 10) {
                    const regex = /(score\s+([^\s]+)\s+(-?\d+)|mate\s+(\d+))/;
                    const match = event.match(regex);
                    engine.postMessage('quit')
                    console.log(`${match[2]} ${match[3]}`)
                }  
            }
            
        };

        engine.postMessage('uci');
        engine.postMessage('isready');

        engine.postMessage(`position fen ${fen}`);
        engine.postMessage('go depth 10');
    });
};


