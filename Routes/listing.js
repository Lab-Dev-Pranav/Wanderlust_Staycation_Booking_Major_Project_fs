const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js").default;
const ExpressError = require("../utils/expressError.js");
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const listingController = require("../controller/listing.js");

const multer  = require('multer')
const { storage } = require("../cloudConfig.js")
const upload = multer({ storage })

const { islogged_in, isOwner, validateListing } = require("../MW.js");
const { tokenBucket } = require("../middlewares/tokenBucket.js");

router
  .route("/")
  // INDEX ROUTE
  .get(
    islogged_in,
    tokenBucket,
     wrapAsync(listingController.index)
    )
  // (CREATE) CREATE ROUTE
  .post(
    islogged_in,
    upload.single('listing[image][url]'),
    validateListing,
    wrapAsync(listingController.createListings)
  );
  


// (CREATE) NEW ROUTE
router
  .get("/new", islogged_in, listingController.rendernewform);


router
  .route("/:id")
  //
  .get( wrapAsync(listingController.showAllListings))
  //
  .put(
    islogged_in,
    isOwner,
    upload.single('listing[image][url]'),
    validateListing,
    wrapAsync(listingController.updateAListing)
  )
  //
  .delete(
    islogged_in,
    isOwner,
    wrapAsync(listingController.deleteAListing)
  );

// (UPDATE) EDIT ROUTE
router.get(
  "/:id/edit",
  islogged_in,
  isOwner,
  wrapAsync(listingController.editAListing)
);

// SEARCH ROUTE
router.get('/search', async (req, res) => {
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
});

module.exports = router;
