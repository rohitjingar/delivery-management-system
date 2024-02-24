
import express from 'express';
import {
  importPickupsFromCSV,
  getPickupFromDB,
  getPickupById,
  createPickup,
  updatePickup,
  deletePickup
} from '../controllers/pickup.controller.js';

const router = express.Router();

router.get('/', getPickupFromDB);
router.get('/importFromCSV', importPickupsFromCSV)
router.get('/:id', getPickupById);
router.post('/', createPickup);
router.put('/:id', updatePickup);
router.delete('/:id', deletePickup);

export default router;
