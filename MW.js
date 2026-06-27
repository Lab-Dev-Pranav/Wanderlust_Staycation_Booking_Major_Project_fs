const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/expressError.js");
const { listingSchema, reviewSchema  } = require("./schema.js");

// LISTINGS VALIDATION MW ON CLIENT SIDE
module.exports.validateListing = (req, res, next) => {
        if (req.body?.listing) {
          const legacyCategories = req.body.listing.categories;
          const checkboxAMFET = req.body.listing.checkboxAMFET;

          if (typeof checkboxAMFET === "undefined" && typeof legacyCategories !== "undefined") {
            req.body.listing.checkboxAMFET = legacyCategories;
          }

          delete req.body.listing.categories;

          if (typeof req.body.listing.checkboxAMFET !== "undefined" && !Array.isArray(req.body.listing.checkboxAMFET)) {
            req.body.listing.checkboxAMFET = [req.body.listing.checkboxAMFET];
          }
        }

        let { error, value } = listingSchema.validate(req.body);
        if (error) {
          let errorMsg = error.details.map((el) => el.message).join(", ");
          throw new ExpressError(400, errorMsg);
        } else {
          req.body = value;
          next();
        }
      };


// REVIEWS VALIDATION ON CLIENT SIDE
module.exports.validateReview = (req, res, next) => {
        let { error } = reviewSchema.validate(req.body);
        if (error) {
        //   console.log("IF START");
          let errorMsg = error.details.map((el) => el.message).join(", ");
          // console.log("errmsg " + errorMsg);
          throw new ExpressError(400, errorMsg);
        } else {
        //   console.log("ELSE START");
          next();
        }
      };


module.exports.islogged_in = (req, res, next)=>{
        // console.log(req.path , " | " , req.originalUrl)
        if(!req.isAuthenticated()){
                req.session.redirectUrl = req.originalUrl
                req.flash("error" , "You have to be logged in to go there!")
                return res.redirect("/login")
               
              }
                // return res.redirect("/profile")
         next()
}

module.exports.saveRedirectUrl = (req, res, next)=>{
        if(req.session.redirectUrl){
                res.locals.redirectUrl = req.session.redirectUrl
        }
        next();
}

module.exports.isOwner = async (req, res, next)=>{
        let { id } = req.params;
        let listing = await Listing.findById(id)
        if(!listing.owner.equals(res.locals.currUser._id)){
          req.flash("error" , "You are not the owner of this listing")
          return res.redirect(`/listings/${id}`);
        }
        next();
}

module.exports.isReviewAuthor = async (req, res, next)=>{
  let { id , revid } = req.params;
  let review = await Review.findById(revid)
  if(!review.auther.equals(res.locals.currUser._id)){
    req.flash("error" , "You are not the author of this review!")
    return res.redirect(`/listings/${id}`);
  }
  next();
}


