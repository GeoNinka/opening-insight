import jwt from 'jsonwebtoken'

export const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        return res.sendStatus(401)
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, decoded) => {
            if (err) {
                return res.sendStatus(403)
            }
            req.id = decoded.userID
            next()
        }
    )
}