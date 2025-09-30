import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { 
    register, 
    login, 
    getProfile, 
    updateProfile,
    logout 
} from '../controllers/auth.controller.js';

const authRouter = express.Router();

// Public routes
authRouter.post('/register', register);
authRouter.post('/login', login);

// Protected routes
authRouter.get('/profile', authenticateToken, getProfile);
authRouter.put('/profile', authenticateToken, updateProfile);
authRouter.post('/logout', authenticateToken, logout);

export default authRouter;