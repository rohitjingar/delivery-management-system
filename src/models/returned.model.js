import mongoose from 'mongoose';

const returnedSchema = new mongoose.Schema({
  returnedId:{
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
    default: Date.now // Timestamp of return
  },
  returnReason: {
    type: String,
    required: true // Reason for the return
  },
  comment: String // Additional comments or remarks
});

const Returned = mongoose.model('Returned', returnedSchema);

export default Returned;
