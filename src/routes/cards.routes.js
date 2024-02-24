import express from 'express';
import {
  getAllCards,
  getTheStatusOfCard,
  getCardById,
  createCard,
  updateCard,
  deleteCard
} from '../controllers/card.controller.js';

const router = express.Router();

router.get('/', getAllCards);
router.post('/get_card_status', getTheStatusOfCard)
router.get('/:id', getCardById);
router.post('/', createCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;
