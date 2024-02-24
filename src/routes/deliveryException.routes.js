
import express from 'express';
import {
  importDeliveryExceptionsFromCSV,
  getAllDeliveryExceptionsFromDB,
  getDeliveryExceptionById,
  createDeliveryException,
  updateDeliveryException,
  deleteDeliveryException
} from '../controllers/deliveryException.controller.js';

const router = express.Router();

router.get('/', getAllDeliveryExceptionsFromDB);
router.get('/importFromCSV',importDeliveryExceptionsFromCSV)
router.get('/:id', getDeliveryExceptionById);
router.post('/', createDeliveryException);
router.put('/:id', updateDeliveryException);
router.delete('/:id', deleteDeliveryException);

export default router;
