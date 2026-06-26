const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Accounting = require("../models/accounting");
const User = require("../models/user");

function isValidDateInput(value = "") {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

// GET Search Route
module.exports.search = async (req, res) => {
  const { location, checkIn, checkOut, people } = req.query;
  const normalizedLocation = location?.trim() || "";
  const guestCount = Number(people);

  if (
    !normalizedLocation ||
    !Number.isInteger(guestCount) ||
    guestCount < 1 ||
    !isValidDateInput(checkIn) ||
    !isValidDateInput(checkOut) ||
    new Date(checkIn) >= new Date(checkOut)
  ) {
    req.flash("error", "Please enter a valid location, dates, and guest count.");
    return res.redirect("/");
  }

  const bookingdata = {
    location: normalizedLocation,
    checkIn,
    checkOut,
    people: guestCount,
  };

  // Find listings in location with enough capacity
  let listings = await Listing.find({
    location: { $regex: new RegExp(normalizedLocation, "i") },
    capacity: { $gte: guestCount },
  });

  // Filter out listings that are already booked for those dates
  const availableListings = [];
  for (let listing of listings) {
    const overlapping = await Booking.findOne({
      listing: listing._id,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) },
        },
      ],
    });
    if (!overlapping) availableListings.push(listing);
  }

  res.render("listings/index", {
    listings: availableListings,
    searchedLocation: normalizedLocation,
    selectedTag: "",
    bookingdata,
  });
};

// GET Booking Form Route
module.exports.getBookingForm = async (req, res) => {
  const { id } = req.params;
  const bookingdata = req.query.bookingdata
    ? JSON.parse(req.query.bookingdata)
    : null;

  const listing = await Listing.findById(id).populate("owner");
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("bookings/new.ejs", { listing, currUser: req.user, bookingdata });
};

// POST Create Booking Route
module.exports.createBooking = async (req, res) => {
  console.log("POST /bookings/:id");
  try {
    const { id } = req.params;
    const { checkIn, checkOut, people } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Validate people count
    if (Number(people) < 1 || Number(people) > listing.capacity) {
      req.flash(
        "error",
        `Number of people must be between 1 and ${listing.capacity}.`
      );
      return res.redirect(`/listings/${id}/book`);
    }

    // Validate dates
    if (!checkIn || !checkOut || new Date(checkIn) >= new Date(checkOut)) {
      req.flash("error", "Invalid check-in/check-out dates.");
      return res.redirect(`/listings/${id}/book`);
    }

    // Check for overlapping bookings
    const overlapping = await Booking.findOne({
      listing: listing._id,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) },
        },
      ],
    });
    if (overlapping) {
      req.flash(
        "error",
        "Location/Venue is not available for the selected dates."
      );
      return res.redirect(`/listings/${id}/book`);
    }

    // Validate min 10 days between today and check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time part
    const checkInDate = new Date(checkIn);
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 10) {
      req.flash("error", "Check-in date must be at least 10 days from today.");
      return res.redirect(`/listings/${id}/book`);
    }

    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      people: Number(people),
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await booking.save();
    req.flash("success", "Booking created successfully!");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error("Booking error:", err);
    req.flash("error", "Booking failed: " + err.message);
    res.redirect(`/listings/${req.params.id}/book`);
  }
};

// DELETE Booking Route
module.exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash("error", "Booking not found.");
      return res.redirect("/profile");
    }
    // Only the user who made the booking can delete it
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You are not authorized to delete this booking.");
      return res.redirect("/profile");
    }
    await Booking.findByIdAndDelete(req.params.id);
    req.flash("Success", "Booking deleted successfully.");
    res.redirect("/profile");
  } catch (err) {
    console.error("Delete booking error:", err);
    req.flash("error", "Failed to delete booking.");
    res.redirect("/profile");
  }
};

// GET Payment Page Route
module.exports.getPaymentPage = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || !booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized or booking not found.");
      return res.redirect("/profile");
    }

    const listing = await Listing.findById(booking.listing);
    const user = await User.findById(booking.user);

    const nights = Math.ceil(
      (booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24)
    );
    const baseAmount = listing.price * nights;
    const gstAmount = baseAmount * 0.18;
    const platformFee = baseAmount * 0.02;
    const grandTotal = baseAmount + gstAmount + platformFee;

    res.render("payments/payment.ejs", {
      booking,
      listing,
      user,
      baseAmount,
      gstAmount,
      platformFee,
      grandTotal,
    });
  } catch (err) {
    console.error("Payment page error:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/profile");
  }
};

// POST Confirm Payment Route
module.exports.confirmPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || !booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized access.");
      return res.redirect("/profile");
    }
    const listing = await Listing.findById(booking.listing);
    const user = await User.findById(booking.user);

    const nights = Math.ceil(
      (booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24)
    );
    const baseAmount = listing.price * nights;
    const taxAmount = baseAmount * 0.18; // 18% gst
    const platformAmount = baseAmount * 0.02; // 2% platform fee
    const totalAmount = baseAmount + taxAmount + platformAmount;

    const accounting = new Accounting({
      booking: booking._id,
      user: listing.owner,
      baseAmount,
      taxAmount,
      platformAmount,
      totalAmount,
    });

    await accounting.save();

    booking.status = "confirmed";
    booking.expiresAt = undefined;
    await booking.save();

    req.flash("Success", "Payment successful. Booking confirmed.");
    res.redirect("/profile");
  } catch (err) {
    console.error("Payment confirmation error:", err);
    req.flash("error", "Payment failed.");
    res.redirect("/profile");
  }
};

// GET Unpay (Revert Payment) Route
module.exports.revertPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash("error", "Booking Not Found.");
      return res.redirect("/profile");
    }
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You Are Not Authorized To Unpay For This Booking.");
      return res.redirect("/profile");
    }

    // delete the accounting record with booking details
    await Accounting.deleteOne({ booking: booking._id });

    booking.status = "pending";
    booking.expiresAt = new Date(
      booking.createdAt.getTime() + 24 * 60 * 60 * 1000
    );
    await booking.save();

    req.flash("Success", "Booking reverted to pending.");
    res.redirect("/profile");
  } catch (err) {
    console.error("Unpay error:", err);
    req.flash("error", "Failed to revert payment.");
    res.redirect("/profile");
  }
};

// GET My Payments Route
module.exports.getMyPayments = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/profile");
    }

    const accountingRecords = await Accounting.find({ user: user._id })
      .populate("booking")
      .populate("user");

    res.render("payments/mypayments", {
      accountingRecords,
    });
  } catch (err) {
    console.error("Error fetching payments:", err);
    req.flash("error", "Failed to retrieve payments.");
    res.redirect("/profile");
  }
};
