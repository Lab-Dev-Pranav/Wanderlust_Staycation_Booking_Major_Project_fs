const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js").default;
const ExpressError = require("../utils/expressError.js");
const { reviewSchema } = require("../schema.js");
const Listing = require("../models/listing");
const Review = require("../models/review");

const reviewController = require("../controller/review.js")
const { tokenBucket } = require("../middlewares/tokenBucket.js");

const { validateReview, islogged_in, isReviewAuthor } = require("../MW.js");
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

// (POST) REVIEWS ROUTE (write-heavy)
router.post(
  "/",
  islogged_in,
  tokenBucket(rateLimitHeavy),
  validateReview,
  wrapAsync(reviewController.reviewRoute)
);

// (DELETE) REVIEWS ROUTE (write-heavy)
router.delete(
  "/:revid",
  islogged_in,
  tokenBucket(rateLimitHeavy),
  isReviewAuthor,
  wrapAsync(reviewController.deleteReview)
);

module.exports = router;
