import asyncHandler from "express-async-handler"
import { prisma } from "../prisma.js"

export const addPosition = asyncHandler(async (req, res) => {
    const { from, to, move, type } = req.body;

    let fromTheory = await prisma.theory.findUnique({
        where: { fen: from },
    });

    if (!fromTheory) {
        fromTheory = await prisma.theory.create({
        data: {
            fen: from,
            positionName: '',
            positionDescription: '',
            circles: [],
            arrows: [],
        },
        });
    }

    let toTheory = await prisma.theory.findUnique({
        where: { fen: to },
    });

    if (!toTheory) {
        toTheory = await prisma.theory.create({
        data: {
            fen: to,
            positionName: '',
            positionDescription: '',
            circles: [],
            arrows: [],
        },
        });
    }

    if (type === 'continuation') {
        const isContinuationExist = await prisma.theoreticalContinuations.findFirst({
            where: {
                fromId: fromTheory.id,
                toId: toTheory.id,
            },
        });

        if (isContinuationExist) {
            res.status(400)
            return res.json({message: "Продолжение уже существует"})
        }

        await prisma.theoreticalContinuations.create({
            data: {
                fromId: fromTheory.id,
                toId: toTheory.id,
                move,
            },
        })
    } else if (type === 'blunder') {
        const isBlunderExist = await prisma.theoreticalBlunders.findFirst({
            where: {
                fromId: fromTheory.id,
                toId: toTheory.id,
                move,
            },
        })

        if (isBlunderExist) {
            res.status(400)
            return res.json({message: "Продолжение уже существует"})
        }

        await prisma.theoreticalBlunders.create({
            data: {
                fromId: fromTheory.id,
                toId: toTheory.id,
                move,
            },
        })
    }

    res.status(200)
    res.json({
        message: 'Position added'
    })
})

export const updatePosition = asyncHandler(async (req, res) => {
    let positionData = { 
        positionName: req.body.positionName,
        positionDescription: req.body.positionDescription,
        circles: req.body.circles,
        arrows: req.body.arrows,
    }

    const isPositionExist = await prisma.theory.findUnique({
        where: {
            fen: req.body.fen
        }
    })

    if (!isPositionExist) {
        res.status(400)
        throw new Error('Position doesnt exist')
    }

    const updatedPosition = await prisma.theory.update({
        where: {
            fen: req.body.fen
        },
        data: positionData
    })

    res.json(positionData)
})

export const deletePosition = asyncHandler(async (req, res) => {
    const position = await prisma.theory.delete({
        where: {
            fen: req.body.fen
        }
    })

    res.json(position)
})

export const deleteContinuation = asyncHandler(async (req, res) => {
    const { from, to } = req.body;

    if (!from || !to) {
        res.status(400)
        return res.json({error: 'Both FEN position needed'});
    }

    const fromTheory = await prisma.theory.findUnique({
        where: { fen: from },
    });

    const toTheory = await prisma.theory.findUnique({
        where: { fen: to },
    });

    if (!fromTheory || !toTheory) {
        res.status(400)
        return res.json({error: 'Positions not found'});
    }

    const continuation = await prisma.theoreticalContinuations.findFirst({
        where: {
            fromId: fromTheory.id,
            toId: toTheory.id,
        },
    });

    if (continuation) {
        await prisma.theoreticalContinuations.delete({
            where: { id: continuation.id },
        });

        res.status(200)
        return res.json({ message: 'Continuation deleted' });
    }

    const blunder = await prisma.theoreticalBlunders.findFirst({
        where: {
            fromId: fromTheory.id,
            toId: toTheory.id,
        },
    });

    if (blunder) {
        await prisma.theoreticalBlunders.delete({
            where: { id: blunder.id },
        });

        return res.status(200).json({ message: 'Blunder deleted' });
    }

    res.status(404) 
    res.json({message: 'Linked continuations not found'});
})

export const getContinuations = asyncHandler(async (req, res) => {
    const fen = req.body.fen
    if (!fen) {
        res.status(400)
        res.json({error: 'Error'})
    }

    const position = await prisma.theory.findUnique({
        where: { fen },
        include: {
            fromContinuations: {
                include: {
                    to: true,
                },
            },
            fromBlunders: {
                include: {
                    to: true,
                },
            },
        },
    });

    if (!position) {
        res.status(400)
        return res.json({error: 'Позиция не найдена'})
    }

    const continuations = position.fromContinuations.map((cont) => ({
        move: cont.move,
        toFen: cont.to.fen,
        toPositionName: cont.to.positionName,
        toPositionDescription: cont.to.positionDescription,
    }));

    const blunders = position.fromBlunders.map((blunder) => ({
        move: blunder.move,
        toFen: blunder.to.fen,
        toPositionName: blunder.to.positionName,
        toPositionDescription: blunder.to.positionDescription,
    }));

    res.status(200).json({
        positionName: position.positionName,
        positionDescription: position.positionDescription,
        continuations,
        blunders,
    });
})