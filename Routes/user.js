const express = require("express");
const router = express
  .Router
  // {mergeParams : true}
  ();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { storage , cloudinary } = require("../cloudConfig.js")
const upload = multer({ storage });
// const { cloudinary } = require('../utils/cloudinary');

const user = require("../models/user");
const { default: wrapAsync } = require("../utils/wrapAsync");
const passport = require("passport");

const userController = require("../controller/user.js")
const { tokenBucket } = require("../middlewares/tokenBucket.js");
// const autncontroller = require("./routes/auth.js")

const {saveRedirectUrl} = require("../MW.js")
const { islogged_in, isOwner, validateListing } = require("../MW.js");
const rateLimitHeavy = {
  capacity: 3,
  refillTime: 30000,
  tokensPerRefill: 1
};
const rateLimitModerate = {
  capacity: 6,
  refillTime: 20000,
  tokensPerRefill: 1
};
const rateLimitLight = {
  capacity: 10,
  refillTime: 15000,
  tokensPerRefill: 2
};




router
  .route("/signup")
  // SIGNUP FORM RENDER
  .get( userController.signUpRender )
    // SIGNUP USER SAVE
  .post(
    tokenBucket(rateLimitHeavy),
    wrapAsync(userController.signUpSave)
  );

router
  .route("/login")
   // LOGIN FORM RENDER
  .get(  userController.loginRender)
  // LOGIN FORM USER IN TO SITE
  .post(
    tokenBucket(rateLimitModerate),
    saveRedirectUrl,
    passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
    }),
    wrapAsync(userController.loginsave)
);

// LOGOUT USER FROM SITE
router.get("/logout" , userController.logout)


router.get("/profile" , userController.Profile)


router.get("/bookingonmylocation" , userController.bookingonmylocation)

router.get("/user" ,  userController.allUser)

router.get("/userprofile/:id" , islogged_in,  userController.Userprofile)

router.get('/forgot', userController.forgotpassword_forgot_get);

router.post('/forgot',
  tokenBucket(rateLimitModerate),
  userController.forgotpassword_forgot_post );


router.get('/reset/:token', userController.forgotpassword_resettoken_get);



router.post('/reset/:token',
  tokenBucket(rateLimitHeavy),
  userController.forgotpassword_resettoken_post);

router.post('/profile/photo',
            islogged_in,
            tokenBucket(rateLimitHeavy),
            upload.single('profilePhoto'),
            userController.uploadProfilePhoto
            );

module.exports = router;
