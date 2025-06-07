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

    let isPasswordCorrect

    if (user) {
        isPasswordCorrect = await verify(user.password, password) 
    } else {
        isPasswordCorrect = false
    }


    if (user && isPasswordCorrect) {
        const token = generateToken(user.id)
        res.json({ token })
    } else {
        res.status(401)
        throw new Error("Invalid login or password")
    }
})

export const userRegistration = asyncHandler(async (req, res) => {
    const {email, name, password, role} = req.body
    
    const isUser = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (isUser) {
        res.status(400)
        throw new Error('User already exist')
    }

    try {
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: await hash(password),
                role,
            },
            select: {
                email: true,
                name: true,
                role: true,
            }
        })
    } catch (e) {
        console.log(e)
    }

    const token = generateToken(user.id)

    res.json({user, token})
})
