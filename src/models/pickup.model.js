
import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
  pickupId:{
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
    default: Date.now // Timestamp of pickup event
  },
  courierPartner: {
    type: String,
    required: true // Name or identifier of the courier partner
  },
  pickupLocation: String, // Location where the pickup occurred
  pickupTimestamp: {
    type: Date,
    default: Date.now, // Actual time when the item was picked up by the courier
  }
});

const Pickup = mongoose.model('Pickup', pickupSchema);

export default Pickup;
