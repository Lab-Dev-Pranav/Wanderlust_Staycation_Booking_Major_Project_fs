const Listing = require("../models/listing");
const Review = require("../models/review");
const Booking = require("../models/booking");

const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const MAPTOKEN = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: MAPTOKEN });

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  res.render("listings/new");
};

module.exports.createListings = async (req, res, next) => {

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

module.exports.showAllListings = async (req, res) => {

  let curr_user = res.locals.currUser;
  const listingItem = await Listing.findById(req.params.id)
    .populate("reviews")
    .populate("owner");

  const bookingdata = req.query.bookingdata ? JSON.parse(req.query.bookingdata) : null;

  // console.log("Booking Data:", bookingdata);

  // console.log("Listing Item:", listingItem);
  const rearr = [];
  for await (const ele of listingItem.review) {
    let re = await Review.findById(ele);
    if (re) {
      let autherdet = await User.findById(re.auther);
      if (autherdet) {
        re = re.toObject();
        re.username = autherdet.username;
        //     console.log("Updated object:", re);
        rearr.push(re);
      }
    }
  }
  if (!listingItem) {
    req.flash("error", "Listing Dose Not Exist");
    res.redirect("/listings");
  }
  res.render("listings/show", { listing: listingItem, reviews: rearr, curr_user, bookingdata });
};


module.exports.showXListings = async (req, res) => {

    
  let curr_user = res.locals.currUser;
  const listingItem = await Listing.findById(req.params.id)
    .populate("reviews")
    .populate("owner");

  const bookingdata = req.query.bookingdata ? JSON.parse(req.query.bookingdata) : null;

  // console.log("Booking Data:", bookingdata);

  // console.log("Listing Item:", listingItem);
  const rearr = [];
  for await (const ele of listingItem.review) {
    let re = await Review.findById(ele);
    if (re) {
      let autherdet = await User.findById(re.auther);
      if (autherdet) {
        re = re.toObject();
        re.username = autherdet.username;
        //     console.log("Updated object:", re);
        rearr.push(re);
      }
    }
  }
  if (!listingItem) {
    req.flash("error", "Listing Dose Not Exist");
    res.redirect("/listings");
  }
  res.render("listings/showx", { listing: listingItem, reviews: rearr, curr_user, bookingdata });

}



module.exports.editAListing = async (req, res) => {
  let listingItem = await Listing.findById(req.params.id);
  if (!listingItem) {
    req.flash("error", "Listing Dose Not Exist");
    res.redirect("/listings");
  }
  let originalimgurl = listingItem.image.url;
  originalimgurl = originalimgurl.replace("/upload", "/upload/h_300,w_250");

  res.render("listings/edit", { listing: listingItem, originalimgurl });
};

module.exports.updateAListing = async (req, res) => {
  let { id } = req.params;
  let list = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    list.image = { url, filename };
    await list.save();
  }
  list.capacity = req.body.listing.capacity;

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
