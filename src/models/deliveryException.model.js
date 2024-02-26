import mongoose from 'mongoose';

const deliveryExceptionSchema = new mongoose.Schema({
  exceptionId:{
    type: String,
    required: true,
    unique:true
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
    default: Date.now // Timestamp of delivery exception
  },
  exceptionType: {
    type: String,
    required: true // Type of delivery exception
  },
  comment: String // Additional comments or remarks
});

const DeliveryException = mongoose.model('DeliveryException', deliveryExceptionSchema);

export default DeliveryException;
