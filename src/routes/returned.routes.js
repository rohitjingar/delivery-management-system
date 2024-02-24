
import express from 'express';
import {
  importReturnsFromCSV,
  getAllreturnedFromDB,
  getReturnById,
  createReturn,
  updateReturn,
  deleteReturn
} from '../controllers/returned.controller.js';

const router = express.Router();

router.get('/', getAllreturnedFromDB )
router.get('/importFromCSV', importReturnsFromCSV);
router.get('/:id', getReturnById);
router.post('/', createReturn);
router.put('/:id', updateReturn);
router.delete('/:id', deleteReturn);

export default router;
