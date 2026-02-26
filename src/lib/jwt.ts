import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
export function signToken(payload: object, expiresIn: string) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as any;
}

