const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");

const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js").default;
const ExpressError = require("../utils/expressError.js");
const { listingSchema } = require("../schema.js");

const adminController = require("../controller/admin.js");
const { tokenBucket } = require("../middlewares/tokenBucket.js");

const { islogged_in, isOwner, validateListing, isAdmin } = require("../MW.js");

const rateLimitModerate = {
  capacity: 5,
  refillTime: 20000,
  tokensPerRefill: 1
};

const multer = require("multer");
// const { storage } = require("../cloudinary/index.js");
// const upload = multer({ storage });     

// Admin dashboard route (moderate read)
router.get(
  "/",
  islogged_in,
  isAdmin,
  tokenBucket(rateLimitModerate),
  adminController.renderAdminDashbord
);

module.exports = router;
