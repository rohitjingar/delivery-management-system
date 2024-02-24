import mongoose from 'mongoose';

const deliveryExceptionSchema = new mongoose.Schema({
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
    default: Date.now // Timestamp of delivery exception
  },
  exceptionType: {
    type: String,
    required: true // Type of delivery exception
  },
  deliveryAttempts: {
    type: Number,
    default: 0, // Initialize with 0 delivery attempts
    min: 0,
    max: 2 // Limit delivery attempts to 2
  },
  comment: String // Additional comments or remarks
});

const DeliveryException = mongoose.model('DeliveryException', deliveryExceptionSchema);

export default DeliveryException;
