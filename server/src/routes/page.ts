import { Router } from 'express';
import * as pageController from '../controllers/page.controller.js';

const router = Router({ mergeParams: true }); // mergeParams to access :workspaceId from parent route

// Trash & Search (must come BEFORE /:id routes)
router.get('/trash', pageController.listTrash);
router.get('/search', pageController.search);

// CRUD
router.get('/', pageController.list);
router.post('/', pageController.create);
router.get('/:id', pageController.getById);
router.patch('/:id', pageController.update);
router.delete('/:id', pageController.softDelete);

// Trash actions on specific page
router.post('/:id/restore', pageController.restore);
router.delete('/:id/permanent', pageController.permanentDelete);

export default router;
