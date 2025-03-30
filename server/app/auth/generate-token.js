import jwt from "jsonwebtoken"

export const generateToken = (userID) => (
    jwt.sign({userID}, process.env.JWT_SECRET)
)