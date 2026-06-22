const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking");
const { islogged_in } = require("../MW");
const { tokenBucket } = require("../middlewares/tokenBucket.js");
const rateLimitHeavy = {
  capacity: 3,
  refillTime: 30000,
  tokensPerRefill: 1
};
const rateLimitModerate = {
  capacity: 5,
  refillTime: 20000,
  tokensPerRefill: 1
};
const rateLimitLight = {
  capacity: 10,
  refillTime: 15000,
  tokensPerRefill: 2
};

// Search Route (heavy DB query)
router.get(
  "/search",
  tokenBucket(rateLimitHeavy),
  bookingController.search
);

// Booking Routes
router.get(
  "/listings/:id/book",
  islogged_in,
  bookingController.getBookingForm
);
router.post(
  "/bookings/:id",
  islogged_in,
  tokenBucket(rateLimitHeavy),
  bookingController.createBooking
);
router.delete(
  "/bookings/:id",
  islogged_in,
  tokenBucket(rateLimitModerate),
  bookingController.deleteBooking
);

// Payment Routes
router.get(
  "/payments/:id",
  islogged_in,
  tokenBucket(rateLimitModerate),
  bookingController.getPaymentPage
);
router.post(
  "/payments/:id/confirm",
  islogged_in,
  tokenBucket(rateLimitHeavy),
  bookingController.confirmPayment
);
router.get(
  "/payments/:id/makeunpay",
  islogged_in,
  tokenBucket(rateLimitModerate),
  bookingController.revertPayment
);
router.get(
  "/getmypayments/:email",
  islogged_in,
  tokenBucket(rateLimitModerate),
  bookingController.getMyPayments
);

module.exports = router;
