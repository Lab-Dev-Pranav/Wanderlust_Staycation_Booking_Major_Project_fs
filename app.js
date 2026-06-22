const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const { islogged_in, isOwner, validateListing } = require("./MW.js");

// --------MODEL FILES----------
// REQUIRING LISTING MODEL IN app.js FROM [ models --> listing.js ]
const Listing = require("./models/listing");
// REQUIRING BOOKING MODEL IN app.js FROM [ models --> booking.js ]
const Booking = require("./models/booking.js");
// REQUIRING ACCOUNTING MODEL IN app.js FROM [ models --> accounting.js ]
const Accounting = require("./models/accounting.js");
// REQUIRING USER MODEL IN app.js FROM [ models --> user.js ]
const User = require("./models/user.js");

// -----ROUTES FILES---------
// REQUIRING LISTINGS ALL ROUTES IN app.js FROM [ Routes --> listing.js ]
const listingsRouter = require("./Routes/listing.js");
// REQUIRING REVIEWS ALL ROUTES IN app.js FROM [ routes --> review.js ]
const reviewsRouter = require("./Routes/review.js");
// REQUIRING USER ALL ROUTES IN app.js FROM [ routes --> user.js ]
const userRouter = require("./Routes/user.js");
// REQUIRING BOOKING ALL ROUTES IN app.js FROM [ routes --> booking.js ]
const bookingRouter = require("./Routes/booking.js");
// REQUIRING HOME ALL ROUTES IN app.js FROM [ routes --> home.js ]
const homeRouter = require("./Routes/home.js");

const app = express();
let port = process.env.PORT || 8080;

//--------MONGO DB CONECTION S--------
const ATLAS_DB_URL = process.env.ATLAS_DB_URL;
mongoose.set("strictPopulate", false);
main()
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(ATLAS_DB_URL);
}
//--------MONGO DB CONECTION E--------

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// --------SESSION CREATION S-------
const store = MongoStore.create({
  mongoUrl: ATLAS_DB_URL,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR IN MONGO SESSION STORE");
});

const sessionOption = {
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOption));
// --------SESSION CREATION E-------



app.use(flash());

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --------LOCALS CREATION S-------
app.use((req, res, next) => {
  res.locals.success = req.flash("Success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.use((req, res, next) => {
  res.locals.curr_user = req.user;
  next();
});
// --------LOCALS CREATION E-------

// LISTINGS ALL ROUTES FORM [ Routes --> listing.js ] TO [ app.js ]
app.use("/listings", listingsRouter);
// ---------------------------------------------
// REVIEWS ALL ROUTES FORM [ Routes --> review.js ] TO [ app.js ]
app.use("/listings/:id/reviews", reviewsRouter);
// ---------------------------------------------
// USER ALL ROUTES FORM [ Routes --> user.js ] TO [ app.js ]
app.use("/", userRouter);
// ---------------------------------------------
// BOOKING ALL ROUTES FORM [ Routes --> booking.js ] TO [ app.js ]
app.use("/", bookingRouter);
// ---------------------------------------------
// HOME ALL ROUTES FORM [ Routes --> home.js ] TO [ app.js ]
app.use("/", homeRouter);
// ---------------------------------------------

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  let { statusCode = 500, message = "SOMETHING WENT WRONG!" } = err;
  res.status(statusCode).render("error", { message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
