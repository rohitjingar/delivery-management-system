
import express from 'express';
import {
  importDeleveredFromCSV,
  getAllDeliveredFromDB,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery
} from '../controllers/delivered.controller.js';

const router = express.Router();

router.get('/', getAllDeliveredFromDB);
router.get('/importFromCSV', importDeleveredFromCSV)
router.get('/:id', getDeliveryById);
router.post('/', createDelivery);
router.put('/:id', updateDelivery);
router.delete('/:id', deleteDelivery);

export default router;
