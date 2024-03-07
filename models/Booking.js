const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const BookingSchema = new mongoose.Schema({
  userId: String,
  passengers: Number,
  passengerNames: [String],
  source: String,
  destination: String,
  dateOfJourney: Date,
  trainClass: String,
  totalPrice: Number,

  // Adding the following field for the unique constraint
  uniqueBooking: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    default: 'active'
  }
});

// Apply the unique validator plugin to the schema
BookingSchema.plugin(uniqueValidator);

// Define a pre-save hook to set the uniqueBooking field
BookingSchema.pre('save', function (next) {
  this.uniqueBooking = `${this.userId}_${this.dateOfJourney}_${this.trainClass}`;
  next();
});

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;