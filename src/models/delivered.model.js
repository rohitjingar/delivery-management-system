import mongoose from 'mongoose';

const deliveredSchema = new mongoose.Schema({
  deliveredId:{
    type: String,
    required: true, // Unique identifier for the card
    unique: true
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true // Associated card ID
  },
  userContact: {
    type: String,
    required: true // User contact information
  },
  timestamp: {
    type: Date,
    default: Date.now // Timestamp of delivery
  },
  comment: String // Additional comments or remarks
});

const Delivered = mongoose.model('Delivered', deliveredSchema);

export default Delivered;