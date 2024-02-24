
import mongoose from 'mongoose';

const pickupSchema = new mongoose.Schema({
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
    required: true // Timestamp of when the pickup occurred
  }
});

const Pickup = mongoose.model('Pickup', pickupSchema);

export default Pickup;
