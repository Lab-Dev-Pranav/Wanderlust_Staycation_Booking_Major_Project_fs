const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js").default;


const Listing = require("../models/listing");
const Booking = require("../models/booking");
const listingController = require("../controller/listing.js");

const multer = require('multer')
const { storage } = require("../cloudConfig.js")
const upload = multer({ storage })

const { islogged_in, isOwner, validateListing } = require("../MW.js");
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

const rateLimitLighter = {
  capacity: 50,
  refillTime: 15000,
  tokensPerRefill: 10
};

router
  .route("/")
  // INDEX ROUTE (heavy read)
  .get(
    islogged_in,
    tokenBucket(rateLimitModerate),
    wrapAsync(listingController.index)
  )
  // (CREATE) CREATE ROUTE (heavy write / upload)
  .post(
    islogged_in,
    tokenBucket(rateLimitHeavy),
    upload.single('listing[image][url]'),
    validateListing,
    wrapAsync(listingController.createListings)
  );

// (CREATE) NEW ROUTE
router.get(
  "/new",
  islogged_in,
  tokenBucket(rateLimitLight),
  listingController.rendernewform
);

router.get(
  "/searchatlistings",
  islogged_in,
  tokenBucket(rateLimitLighter),
  wrapAsync(listingController.searchatlistings)
);

router.get(
  "/filter",
  islogged_in,
  tokenBucket(rateLimitModerate),
  wrapAsync(listingController.filterListingsByTag)
);

router
  .route("/:id")
  // SHOW ROUTE (moderate read)
  .get(
    tokenBucket(rateLimitModerate),
    wrapAsync(listingController.showAllListings)
  )
  //
  .put(
    islogged_in,
    tokenBucket(rateLimitHeavy),
    isOwner,
    upload.single('listing[image][url]'),
    validateListing,
    wrapAsync(listingController.updateAListing)
  )
  //
  .delete(
    islogged_in,
    tokenBucket(rateLimitModerate),
    isOwner,
    wrapAsync(listingController.deleteAListing)
  );

// (UPDATE) EDIT ROUTE
router.get(
  "/:id/edit",
  islogged_in,
  tokenBucket(rateLimitLight),
  isOwner,
  wrapAsync(listingController.editAListing)
);

// SEARCH ROUTE (heavy DB query)
router.get(
  '/search',
  tokenBucket(rateLimitHeavy),
  async (req, res) => {
    const { location, checkIn, checkOut, people } = req.query;

    // Find listings in location with enough capacity
    let listings = await Listing.find({
      location: { $regex: new RegExp(location, 'i') },
      capacity: { $gte: people }
    });

    // Filter out listings that are already booked for those dates
    const availableListings = [];
    for (let listing of listings) {
      const overlapping = await Booking.findOne({
        listing: listing._id,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
        ]
      });
      if (!overlapping) availableListings.push(listing);
    }

    res.render('listings/index', { listings: availableListings });
  }
);

module.exports = router;
