import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';

const router = Router();

router.get('/', workspaceController.list);
router.patch('/:id', workspaceController.update);

export default router;
