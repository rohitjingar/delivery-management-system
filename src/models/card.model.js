// models/card.js
import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true, // Unique identifier for the card
    unique: true
  },
  userContact: {
    type: String,
    required: true // Contact information of the user associated with the card
  },
  timestamp: {
    type: Date,
    default: Date.now // Timestamp of when the card status was last updated
  },
  status: {
    type: String,
    enum: ['CREATED','PICKUP', 'DELIVERY_EXCEPTION', 'DELIVERED', 'RETURNED'], // Possible statuses for the card
    required: true, // Current status of the card
    default: 'CREATED' // Default status when a card is created
  },
  comment: String // Additional comments or remarks related to the card
});

const Card = mongoose.model('Card', cardSchema);
export default Card;