import asyncHandler from "express-async-handler";
import { prisma } from "../prisma.js";


export const userProfile = asyncHandler(async (req, res) => {
    const id = req.id
    const user = await prisma.user.findUnique({
        where: {
            id
        }
    })

    if (user) {
        res.json({
            "name": user.name,
            "email": user.email,
            "role": user.role
        })
    } else { 
        res.status(404)
        res.json("User not found")
    }
})