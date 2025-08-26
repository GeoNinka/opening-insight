import asyncHandler from "express-async-handler"
import { prisma } from "../prisma.js"
import axios from "axios"

import { Chess } from "chess.js"
import stockfish from "stockfish"

// Получение списка игр из базы данных 
export const getGames = asyncHandler(async (req, res) => {
    const nickname = req.body.nickname

    const items = await fetchGames(nickname, req.body.quantity, req.body.color)

    const gamesData = await Promise.all(items.map(async element => {

        const isGame = await prisma.games.findUnique({
            where: {
                userID: req.id,
                gameID: element.id
            }
        })

        try {
            if (!isGame) {
                let side = nickname.toLowerCase() === element.players.white.user.id ? 'white' : 'black' // Вывод стороны за которую играл пользователь
                let winner = element.winner == undefined ? '-1' : element.winner
                return {
                    userID: req.id,
                    gameID: element.id,
                    speed: element.speed,
                    white: element.players.white.user.id,
                    black: element.players.black.user.id,
                    side: side,
                    moves: element.moves,
                    winner: winner,
                    isAnalyzed: false
                }
            }
        } catch(e) {

        }
        
        return null
    }))

    const filteredGamesData = gamesData.filter(game => game !== null)

    const games = await prisma.games.createMany({
        data: filteredGamesData
    })

    res.json("Ok")
})

// Получение списка игр с Lichess.API по нику пользователя
const fetchGames = async (nickname, quantity, color) => {
    let response
    try {
        response = await axios.get(`https://lichess.org/api/games/user/${nickname}`, {
            params: color == 'both' ? {max: quantity} : {max: quantity, color: color},
            headers: {
                'Accept': 'application/x-ndjson',
            },
            responseType: 'text'
        })

        const lines = response.data.trim().split('\n')
        const jsonArray = lines.map(line => JSON.parse(line))
        return jsonArray.reverse()
    } catch (error) {
        console.error(error.message)
        throw new Error('Not OK')
    }
}

// Старт анализа игр
export const analyseGames = asyncHandler(async (req, res) => {
    const engine = stockfish() // Инициализация движка
    const blunders = [] // Найденные ошибки

    // Старт движка
    await new Promise((resolve) => {
        engine.onmessage = (msg) => {
            const text = msg.data || msg
            if (text === 'readyok') resolve()
        }
        engine.postMessage('uci') // Указываем что будем использовать протокол uci для взаимодействие с движком
        engine.postMessage('isready')
    })

    // Получаем список непроанализированных игр
    const games = await prisma.games.findMany({
        where: {
            userID: req.id,
            isAnalyzed: false
        },
        orderBy: { id: 'desc' },
    })

    // Перебираем каждую игру
    for (let i = 0; i < games.length; i++) {
        const chess = new Chess()
        const movesList = games[i].moves.split(' ').slice(0, 8)
        let fenList = []

        // Представляем список ходов как положение фигур на доске в формате FEN нотации
        fenList.push(chess.fen().split(' -')[0]) // Записываем в массив стартовую позицию
        try {
            for (let move of movesList) {
                chess.move(move)
                const fen = chess.fen().split(' -')[0]
                fenList.push(fen)
            }
        } catch {
            fenList = []
        }

        // Перебираем список получившихся позиций, каждый ход представлен как две позиции на доске до и после его совершения
        for (let j = 0; j < fenList.length - 1; j++) {
            const fromFEN = fenList[j]
            const toFEN = fenList[j + 1]

            // Проверяем только ходы пользователя, ходы противника пропускаем
            const isUserMove = (games[i].side === 'white' && j % 2 === 0) || (games[i].side === 'black' && j % 2 === 1) 
            if (!isUserMove) continue

            // Пытаемся найти ход в теоретической базе прежде чем проверять его движком для экономии ресурсов
            // Если ход найден, идём дальше, если ход теоретическая ошибка то записываем его в базу данных и идём к
            // следующему ходу
            const fromTheory = await prisma.theory.findUnique({ where: { fen: fromFEN } })
            const toTheory = await prisma.theory.findUnique({ where: { fen: toFEN } })

            if (fromTheory && toTheory) {
                const continuation = await prisma.theoreticalContinuations.findFirst({
                    where: {
                        fromId: fromTheory.id,
                        toId: toTheory.id,
                    },
                })

                if (continuation) {
                    console.log('Theory founded')
                    continue
                } 

                const blunderTheory = await prisma.theoreticalBlunders.findFirst({
                    where: {
                        fromId: fromTheory.id,
                        toId: toTheory.id,
                    },
                })

                if (blunderTheory) {
                    const existing = await prisma.blunders.findFirst({
                        where: {
                            from: fromFEN,
                            to: toFEN,
                        },
                    })

                    if (existing) {
                        await prisma.blunders.update({
                            where: { id: existing.id },
                            data: { counter: { increment: 1 } },
                        })
                    } else {
                        await prisma.blunders.create({
                            data: {
                                from: fromFEN,
                                to: toFEN,
                                counter: 1,
                                loss: -1,
                                game: {
                                    connect: {
                                        id: games[i].id,
                                    },
                                },
                                user: {
                                    connect: {
                                        id: req.id, 
                                    },
                                }
                            },
                        })
                    }

                    blunders.push({ gameID: games[i].id, fromFEN, toFEN })
                    break
                }
            }

            // Если ход не найден в базе данных то оцениваем две позиции движком
            // Если разность оценок выше 0.8, значит ход ошибочный, записываем его в базу данных
            const firstEval = await getEvaluation(fromFEN, engine)
            const secondEval = await getEvaluation(toFEN, engine)

            const loss = Math.abs(firstEval.value - secondEval.value)
            if (loss >= 0.8) {
                const existing = await prisma.blunders.findFirst({
                    where: {
                        from: fromFEN,
                        to: toFEN,
                    },
                })

                if (existing) {
                    await prisma.blunders.update({
                        where: { id: existing.id },
                        data: { counter: { increment: 1 } },
                    })
                } else {
                    await prisma.blunders.create({
                        data: {
                            from: fromFEN,
                            to: toFEN,
                            counter: 1,
                            loss: loss,
                            game: {
                                connect: {
                                    id: games[i].id,
                                },
                            },
                            user: {
                                connect: {
                                    id: req.id,
                                },
                            }
                        },
                    })
                }

                blunders.push({ gameID: games[i].id, fromFEN, toFEN })
                break
            }
        }

        await prisma.games.update({
            where: {
                id: games[i].id
            },
            data: {
                isAnalyzed: true
            }
        })
        console.log(`${i}/${games.length}`)
    }
    // Завершаем работу движка и возвращаем найденные ошибки
    engine.postMessage('quit') 
    res.json(blunders)
})

// Нужно перенести оценку единичной позиции на клиент
export const getEvaluationForClient = asyncHandler( async (req, res) => {
    const fen = req.body.fen

    let bestMove = await getBestMove(fen)

    res.status(200)
    res.json(bestMove)
})

const getBestMove = (fen) => {
    return new Promise((resolve, reject) => {
        const engineGBM = stockfish();

        let evaluation = null;
        let bestMove = null;

        engineGBM.onmessage = function (event) {
            const message = event?.data || event;

            if (message === 'readyok') {
                engineGBM.postMessage('ucinewgame');
                engineGBM.postMessage(`position fen ${fen}`);
                console.log(fen)
                engineGBM.postMessage('go depth 15');
            }

            if (message.startsWith('info')) {
                const match = message.match(/score (cp|mate) (-?\d+)/);
                if (match) {
                    const type = match[1];
                    const value = parseInt(match[2], 10);
                    evaluation = type === 'cp' ? (value / 200).toFixed(2) : `#${value}`;
                    console.log(evaluation)
                }
            }

            if (message.startsWith('bestmove')) {
                bestMove = message.split(' ')[1];

                engineGBM.postMessage('quit');
                engineGBM.onmessage = null;

                resolve({
                    evaluation,
                    bestMove,
                });
            }
        };

        engineGBM.postMessage('uci');
        engineGBM.postMessage('isready');
    });
}

// Функция оценки позиции
const getEvaluation = (fen, engine) => {
    return new Promise((resolve, reject) => {
        let resolved = false
        let attempt = 0 // Счётчик неудачных попыток

        const attemptEvaluation = () => {
            const timeout = setTimeout(() => {
                if (!resolved) {
                    attempt++
                    console.log(`Timeout on FEN: ${fen}. Retrying... (${attempt}/${3})`)
                    engine.postMessage('stop')
                    if (attempt < 3) {
                        attemptEvaluation()
                    } else {
                        resolve({ fen, scoreType: 'timeout', value: null })
                    }
                }
            }, 1000)

            engine.onmessage = (event) => {
                // Парсим ответы движка для поиска сообщения с оценкой позиции
                const msg = typeof event === 'string' ? event : event.data
                if (msg.startsWith('info depth 15')) {
                    engine.postMessage('stop')
                    const match = msg.match(/score\s(cp|mate)\s(-?\d+)/) 
                    if (match && !resolved) {
                        clearTimeout(timeout)
                        resolved = true

                        const type = match[1]
                        let value = parseInt(match[2], 10)
                        // Проверяем чей ход, если ход черных инвертируем оценку
                        const isBlackMove = fen.split(' ')[1] === 'b'
                        if (isBlackMove) {
                            value = -value
                        }
                        // Переводим оценку в формат сантипешек
                        if (type === 'cp') {
                            value = (value / 200).toFixed(2)
                            value = parseFloat(value)
                        }

                        console.log(`Evaluation for FEN: ${fen} — ${type} ${value}`)
                        resolve({ fen, scoreType: type, value })
                    }
                }
            }
            engine.postMessage(`position fen ${fen}`)
            // Глубина определяет время и качество оценки позиции
            engine.postMessage('go depth 15')
        }
        attemptEvaluation()
    })
}

// Фкнция для оптравки списка ошибок пользователя клиенту
export const getBlundersReport = asyncHandler(async (req, res) => {
    if (isNaN(req.id)) {
        return res.status(400).json({ error: 'Invalid or missing userId' })
    }

    const blunders = await prisma.blunders.findMany({
        where: {
            userId: req.id
        },
        include: {
            game: true
        }
    })

    const sortedBlunders = blunders.map(b => ({
            ...b,
            criticality: b.loss * (b.counter + 1) 
        })).sort((a, b) => {
            if (b.counter !== a.counter) {
                return b.counter - a.counter
            }
            return b.criticality - a.criticality
        })

    res.json(sortedBlunders)
})

// Список аккаунтов, игры которых были скачаны пользователем
export const getUsernames = asyncHandler(async (req, res) => {
    const games = await prisma.games.findMany({
        where: {userID: req.id},
        select: {
            side: true,
            white: true,
            black: true,
        },
    })

    const nicknames =  games.map(game => {
        return game.side === 'white' ? game.white : game.black;
    });

    const uniqueNicknames = [...new Set(nicknames)]

    res.json(uniqueNicknames)
})

export const deleteGamesByUsername = asyncHandler(async (req, res) => {
    try{ 
        const gamesToDelete = await prisma.games.findMany({
            where: {
                userID: req.id,
                OR: [
                    { white: req.body.nickname },
                    { black: req.body.nickname }
                ],
            },
            select: { id: true }
        })

        const gamesIDs = gamesToDelete.map(game => game.id)

        await prisma.blunders.deleteMany({
            where: {
                gameId: { in: gamesIDs}
            }
        })

        await prisma.games.deleteMany({
            where: {
                id: { in: gamesIDs }
            }
        })

        res.status(200)
        res.json({message: 'Deleted', games: gamesIDs})
    } catch (e) {
        res.status(500)
        res.json({error: e.message})
    }
    
})

export const getGamesByUserId = asyncHandler(async (req, res) => {

    const page = req.body.page
    const pageSize = req.body.pageSize

    const firstElement = (page - 1) * pageSize

    if (!req.id) {
        return res.status(400).json({ error: 'Invalid or missing userId' })
    }

    const games = await prisma.games.findMany({
        where: {
            userID: req.id
        },
        orderBy: {
            createdAt: 'desc' 
        },
        skip: firstElement,
        take: pageSize
    })

    const totalUnanalyzedGames = await prisma.games.count({
        where: {
            userID: req.id,
            isAnalyzed: false
        }
    })

    const totalGames = await prisma.games.count({
        where: {
            userID: req.id
        }
    })

    const totalPages = Math.ceil(totalGames / pageSize)

    res.json({
        games,
        pagination: {
            totalGames,
            totalPages,
            currentPage: page,
            pageSize,
            totalUnanalyzedGames
        }
    })
})

