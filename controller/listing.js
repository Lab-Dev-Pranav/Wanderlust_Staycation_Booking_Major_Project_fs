const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const MAPTOKEN = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: MAPTOKEN });

module.exports.index = async (req, res) => {
      console.log("controller called")
  const listings = await Listing.find({});
  res.render("listings/index", { listings });
};

module.exports.rendernewform = (req, res) => {
  res.render("listings/new");
};

module.exports.createListings = async (req, res, next) => {
  let loc = `${req.body.listing.location}, ${req.body.listing.country}`;

  let resp = await geocodingClient
    .forwardGeocode({
      query: loc,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;

  const { title, description, price, location, country, tag, capacity, exactLocation } = req.body.listing;

  const newListing = new Listing({
    title,
    description,
    price,
    location,
    country,
    tag,
    capacity,
    owner: req.user._id,
    image: { url, filename },
    geometry: resp.body.features[0].geometry,
    exactLocation,
  });
  let sl = await newListing.save();
  // console.log(sl)
  req.flash("Success", "New Listing Created");
  res.redirect(`/listings`);
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
  res.render("listings/show", { listing: listingItem, reviews: rearr , curr_user , bookingdata});
};

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
  for (let reviewId of listing.review) {
    await Review.findByIdAndDelete(reviewId);
  }
  await Listing.findByIdAndDelete(id);
  req.flash("Success", "Listing Deleted!");
  res.redirect("/listings");
};
