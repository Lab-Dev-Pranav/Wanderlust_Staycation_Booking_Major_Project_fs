const Listing = require("../models/listing");
const Review = require("../models/review");
const Booking = require("../models/booking");

const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const MAPTOKEN = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: MAPTOKEN });

const {
  holidayCategories,
  amenities,
  experiences,
  attractions
} = require("../views/tags");


function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidDateInput(value = "") {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

module.exports.index = async (req, res) => {
  const listings = await Listing.find({});
  res.render("listings/index", {
    listings,
    searchedLocation: "",
    selectedTag: "",
  });
};

module.exports.rendernewform = (req, res) => {
  res.render("listings/new", {
    holidayCategories,
    amenities,
    experiences,
    attractions
  });
};

module.exports.createListings = async (req, res, next) => {
  const checkboxAMFET = Array.isArray(req.body.listing.checkboxAMFET)
    ? req.body.listing.checkboxAMFET
    : req.body.listing.checkboxAMFET
      ? [req.body.listing.checkboxAMFET]
      : [];

  req.body.listing.checkboxAMFET = checkboxAMFET;
  console.log("checkboxAMFET:", checkboxAMFET);

  // Get coordinates from Mapbox
  const loc = `${req.body.listing.location}, ${req.body.listing.country}`;

  const resp = await geocodingClient
    .forwardGeocode({
      query: loc,
      limit: 1,
    })
    .send();

  // Cloudinary image
  const url = req.file.path;
  const filename = req.file.filename;

  // Create listing directly from form data
  const newListing = new Listing(req.body.listing);

  // Add fields that don't come from the form
  newListing.owner = req.user._id;
  newListing.checkboxAMFET = checkboxAMFET;
  newListing.image = {
    url,
    filename,
  };
  newListing.geometry = resp.body.features[0].geometry;

  // Save
  await newListing.save();

  req.flash("Success", "New Listing Created");
  res.redirect("/listings");
};

module.exports.showXListings = async (req, res) => {

  let curr_user = res.locals.currUser;

  const listingItem = await Listing.findById(req.params.id)
    .populate("reviews")
    .populate("owner");

  if (!listingItem) {
    req.flash("error", "Listing Does Not Exist");
    return res.redirect("/listings");
  }

  const bookingdata = req.query.bookingdata
    ? JSON.parse(req.query.bookingdata)
    : null;

  const rearr = [];

  for await (const ele of listingItem.review) {

    let re = await Review.findById(ele);

    if (re) {

      let autherdet = await User.findById(re.auther);

      if (autherdet) {

        re = re.toObject();

        re.username = autherdet.username;

        rearr.push(re);

      }

    }

  }

  // ==========================
  // Calculate Average Rating
  // ==========================

  let averageRating = "New";

  if (rearr.length > 0) {

    const totalRating = rearr.reduce((sum, review) => {
      return sum + review.rating;
    }, 0);

    averageRating = (totalRating / rearr.length).toFixed(1);

  }

  // console.log("Average Rating :", averageRating);

  res.render("listings/showx", {
    listing: listingItem,
    reviews: rearr,
    curr_user,
    bookingdata,
    averageRating
  });

};



module.exports.editAListing = async (req, res) => {
  let listingItem = await Listing.findById(req.params.id);
  if (!listingItem) {
    req.flash("error", "Listing Dose Not Exist");
    res.redirect("/listings");
  }
  let originalimgurl = listingItem.image.url;
  originalimgurl = originalimgurl.replace("/upload", "/upload/h_300,w_250");

  res.render("listings/edit", {
    listing: listingItem,
    originalimgurl,
    holidayCategories,
    amenities,
    experiences,
    attractions
  });
};

module.exports.updateAListing = async (req, res) => {

  const { id } = req.params;

  // Handle Amenities
  const checkboxAMFET = Array.isArray(req.body.listing.checkboxAMFET)
    ? req.body.listing.checkboxAMFET
    : req.body.listing.checkboxAMFET
      ? [req.body.listing.checkboxAMFET]
      : [];

  req.body.listing.checkboxAMFET = checkboxAMFET;

  // Fetch Listing
  const list = await Listing.findById(id);

  if (!list) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
  }

  // Check if location changed
  const locationChanged =
    list.location !== req.body.listing.location ||
    list.country !== req.body.listing.country;

  // Update all fields
  Object.assign(list, req.body.listing);

  // Amenities
  list.checkboxAMFET = checkboxAMFET;

  // Update Geometry only if location changed
  if (locationChanged) {

    const loc = `${req.body.listing.location}, ${req.body.listing.country}`;

    const resp = await geocodingClient
      .forwardGeocode({
        query: loc,
        limit: 1,
      })
      .send();

    if (!resp.body.features.length) {
      req.flash("error", "Invalid location. Please enter a valid city and country.");
      return res.redirect(`/listings/${id}/edit`);
    }

    list.geometry = resp.body.features[0].geometry;
  }

  // Update Image
  if (req.file) {

    list.image = {
      url: req.file.path,
      filename: req.file.filename
    };

  }

  // Capacity
  list.capacity = req.body.listing.capacity;

  // Save
  await list.save();

  req.flash("Success", "Listing Updated!");
  res.redirect(`/listings/${id}`);

};



module.exports.deleteAListing = async (req, res) => {

  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).send("Listing not found");
  }

  //check if the listing has any associated booking for future dates 

  const now = new Date();
  const futureBookings = await Booking.find({ listing: id, checkIn: { $gte: now } });
  if (futureBookings.length > 0) {
    req.flash("error", "Cannot delete listing with future bookings");
    return res.redirect(`/listings/${id}`);
  }

  for (let reviewId of listing.review) {
    await Review.findByIdAndDelete(reviewId);
  }

  await Listing.findByIdAndDelete(id);
  req.flash("Success", "Listing Deleted!");
  res.redirect("/listings");
};



module.exports.searchatlistings = async (req, res) => {

  // console.log("Search Query:", req.query);

  const location = req.query.location?.trim() || "";
  if (!location) {
    return res.redirect("/listings");
  }

  const locationRegex = new RegExp(escapeRegex(location), "i");
  const listingItem = await Listing.find({
    $or: [
      { location: { $regex: locationRegex } },
      { title: { $regex: locationRegex } },
    ],
  });

  if (listingItem.length === 0) {
    req.flash("error", "No listings found for that search");
  }

  res.render("listings/index", {
    listings: listingItem,
    searchedLocation: location,
    selectedTag: "",
  });
};

module.exports.searchByAvailability = async (req, res) => {
  const checkIn = req.query.checkIn?.trim() || "";
  const checkOut = req.query.checkOut?.trim() || "";

  if (
    !isValidDateInput(checkIn) ||
    !isValidDateInput(checkOut) ||
    new Date(checkIn) >= new Date(checkOut)
  ) {
    req.flash("error", "Please select a valid check-in and check-out range.");
    return res.redirect("/listings");
  }

  const bookedListings = await Booking.find({
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  }).select("listing");

  const bookedListingIds = bookedListings.map((booking) => booking.listing);

  const availableListings = await Listing.find({
    _id: { $nin: bookedListingIds },
  });

  res.render("listings/index", {
    listings: availableListings,
    searchedLocation: "",
    selectedTag: "",
    bookingdata: {
      checkIn,
      checkOut,
    },
  });
};

module.exports.filterListingsByTag = async (req, res) => {
  const tag = req.query.tag?.trim() || "";
  if (!tag) {
    return res.redirect("/listings");
  }

  const tagRegex = new RegExp(`^${escapeRegex(tag)}$`, "i");
  const listings = await Listing.find({ tag: { $regex: tagRegex } });

  if (listings.length === 0) {
    req.flash("error", "No listings found for that category");
  }

  res.render("listings/index", {
    listings,
    searchedLocation: "",
    selectedTag: tag,
  });
};





