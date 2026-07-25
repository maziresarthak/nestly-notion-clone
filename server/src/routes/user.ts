import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);

export default router;
