import { Router } from 'express';
import * as pageController from '../controllers/page.controller.js';

const router = Router({ mergeParams: true }); // mergeParams to access :workspaceId from parent route

router.get('/', pageController.list);
router.post('/', pageController.create);
router.get('/:id', pageController.getById);
router.patch('/:id', pageController.update);
router.delete('/:id', pageController.softDelete);

export default router;
