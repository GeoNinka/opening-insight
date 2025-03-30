import express from 'express'
import authRouter from './app/auth/auth.routes.js'
import userRouter from './app/user/user.routes.js'
import gamesRouter from './app/games/games.routes.js'
import dotenv from 'dotenv'
import { prisma } from './app/prisma.js'
import { errorHandler, notFound } from './app/middleware/middleware.error.js'

const app = express()

dotenv.config()

async function main() {
    app.use(express.json())

    app.use('/api/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/games', gamesRouter)

    app.use(notFound)
    app.use(errorHandler)

    app.listen(
        process.env.PORT,
        console.log(`Server listening on port ${process.env.PORT}`)
    )
}

main().then(async () => {
    await prisma.$disconnect()
}).catch(async e => {
    console.error(e)
    await prisma.$disconnect
    process.exit(1)
})