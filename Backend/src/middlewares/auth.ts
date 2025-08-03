import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/server.config.js';
import { User } from '../models/user.model.js';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface JwtPayload {
  userId: number;
}

export const verifyJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid format' });
    }

    const token = authHeader.split(' ')[1]; 

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};



