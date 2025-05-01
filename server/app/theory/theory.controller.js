import asyncHandler from "express-async-handler"
import { prisma } from "../prisma.js"

export const addPosition = asyncHandler(async (req, res) => {
    let positionData = {
        fen: req.body.fen,
        pgn: req.body.pgn,
        positionName: req.body.positionName,
        positionDescription: req.body.positionDescription,
        theoreticalСontinuations: req.body.theoreticalСontinuations,
        theoreticalBlunders: req.body.theoreticalBlunders,
        circles: req.body.circles,
        arrows: req.body.arrows 
    } 

    const isPositionExist = await prisma.theory.findUnique({
        where: {
            fen: req.body.fen
        }
    })

    if (isPositionExist) {
        res.status(400)
        throw new Error('Position already exist')
    }

    const position = await prisma.theory.create({
        data: positionData
    })

    res.json(position)
})

export const updatePosition = asyncHandler(async (req, res) => {
    let positionData = { 
        pgn: req.body.pgn,
        positionName: req.body.positionName,
        positionDescription: req.body.positionDescription,
        circles: req.body.circles,
        arrows: req.body.arrows,
        theoreticalСontinuations: req.body.theoreticalСontinuations,
        theoreticalBlunders: req.body.theoreticalBlunders
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