import { hash, verify } from 'argon2'
import { prisma } from '../prisma.js'
import asyncHandler from 'express-async-handler'
import { generateToken } from './generate-token.js'

export const userAuth = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    const isPasswordCorrect = await verify(user.password, password)

    if (user && isPasswordCorrect) {
        const token = generateToken(user.id)

        res.json({ user, token })
    } else {
        res.status(401)
        throw new Error("Invalid login or password")
    }
})

export const userRegistration = asyncHandler(async (req, res) => {
    const {email, name, password} = req.body
    
    const isUser = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (isUser) {
        res.status(400)
        throw new Error('User already exist')
    }

    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: await hash(password)
        },
        select: {
            email: true,
            name: true
        }
    })

    const token = generateToken(user.id)

    res.json({user, token})
})