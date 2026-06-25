const user = require("../models/user.js");
const Listing = require("../models/listing");
const Booking = require("../models/booking.js");
const { cloudinary } = require("../cloudConfig.js");

module.exports.signUpRender = async (req, res) => {
res.render("users/signup");
}

const crypto = require('crypto');
const nodemailer = require('nodemailer');

module.exports.signUpSave = async (req, res) => {
    try {
      let { username, email, password } = req.body;
      const newUser = new user({ email, username });
      const registerdUser = await user.register(newUser, password);
      console.log("THIS IS REG USER - " , registerdUser);
      req.login(registerdUser, (err)=>{
        if(err){
          return next(err)
        }
        req.flash("Success", "WELLCOME TO WANDERLUST!");
        res.redirect("/listings");
      })
    } catch (e) {
      req.flash("error", ` ${e.message} `);
      res.redirect("/signup");
    }
  }

module.exports.loginRender = async (req, res) => {
res.render("users/login");
}

module.exports.loginsave = async (req, res) => {
      let { username, password } = req.body;
      req.flash("Success", `Wellcome Back to WANDERLUST!`);
      let redirectUrl = res.locals.redirectUrl || "/listings";
      res.redirect(redirectUrl)
}

module.exports.logout =  async (req, res, next)=>{
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            req.flash("Success", "You logged-out!");
            res.render("home/home.ejs");
        });
     
      }

module.exports.Profile = async (req, res) => {
  try {
    let curr_user = res.locals.currUser;

    // Populate 'listing', and inside it populate 'owner', also populate 'user' for each booking
    let curuserbookings = await Booking.find({ user: curr_user._id })
      .populate({
        path: 'listing',
        model: 'listing',
        populate: {
          path: 'owner',
          model: 'User' // or 'User' based on your schema registration
        }
      })
      .populate('user')
      .sort({ checkIn: 1 });

    // console.log(curuserbookings);

    let curuserlistings = await Listing.find({ owner: curr_user._id });

    res.render("users/profile", {
      curr_user,
      curuserlistings,
      curuserbookings
    });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).send("Server Error");
  }
};



module.exports.bookingonmylocation = async (req, res) => {
  // Get current user
  let curr_user = res.locals.currUser;

  // 1. Get listings owned by current user
  let myListings = await Listing.find({ owner: curr_user._id });

  // 2. Get bookings for those listings
  let surusbk = await Booking.find({ listing: { $in: myListings.map(listing => listing._id) } })
   .populate('listing', null, 'listing') 
      .populate('user');

  // 3. Sort bookings by check-in date (earliest first)
  surusbk.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

  // 4. Render the view
  res.render("users/bookingonmylocation", { 
    curr_user, 
    surusbk 
  });
};





module.exports.allUser = async (req, res) => {
  let curr_user = res.locals.currUser;
  let allusers = await user.find({});
  res.render("users/allusers", { allusers, curr_user });
}

module.exports.Userprofile = async (req, res) => {
  let { id } = req.params;
  let userprofile = await user.findById(id);
  let curuserlistings = await Listing.find({ owner: id });
  res.render("users/userprofile", { userprofile, curuserlistings  });
}

module.exports.forgotpassword_forgot_get = async (req, res) => {
  res.render('users/forgot.ejs'); // render a form with email input
}

module.exports.forgotpassword_forgot_post = async (req, res) => {
    // console.log("TOKEN GEN STARTED");

    try {
        const token = crypto.randomBytes(20).toString('hex');

        // Use the correct reference to the User model
        const useremail = req.body.email;
        const userwanttoforgotpassword = await user.findOne({ email: useremail });
        // console.log( "USER by body" ,  req.body.email)
        // console.log( "USER from db" ,  userwanttoforgotpassword)
 
        if (!userwanttoforgotpassword) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
        }

        userwanttoforgotpassword.resetPasswordToken = token;
        userwanttoforgotpassword.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
        await userwanttoforgotpassword.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });
        const mailOptions = {
            
            to: userwanttoforgotpassword.email, // username is email in your case
            from: 'yourproject@support.com',
            subject: 'Password Reset',
            text: `
                You are receiving this by Wanderlust because you have requested the reset of the password for your account.\n\n
                Please click on the following link to complete the process for resetting your password:\n\n
                http://${req.headers.host}/reset/${token}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged OR safe at only your side.\n`,
        };

        await transporter.sendMail(mailOptions);

        req.flash('info', 'An e-mail has been sent to ' + userwanttoforgotpassword.email + ' with further instructions.');
        res.redirect('/forgot');

        // console.log("TOKEN GEN COMPLETED");
    } catch (err) {
        console.error(err);
        res.redirect('/forgot');
    }
}


module.exports.forgotpassword_resettoken_get = async (req, res) => {
  // console.log("RESET TOKEN CHECK STARTED for new password endpoint");
  try {
    const userwanttoforgotpassword = await user.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!userwanttoforgotpassword) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }

    res.render('users/reset.ejs', { token: req.params.token });
    // console.log("RESET TOKEN CHECK ended for new password endpoint");
  } catch (err) {
    console.error(err);
    res.redirect('/forgot');
  }
}

module.exports.forgotpassword_resettoken_post = async (req, res) => {
  // console.log( "TOKEN IS - ", req.params.token)

  try {
    // console.log("psaaword update started");
    const userwanttoforgotpassword = await user.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    // console.log("psaaword update started is avalable ro not" );
    if (!userwanttoforgotpassword) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('back');
    }

    // console.log("psaaword update started is equla or not" );
    if (req.body.password !== req.body.confirm) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('back');
    }

    // console.log("psaaword update started is seting a pass" );
    await userwanttoforgotpassword.setPassword(req.body.password); // from passport-local-mongoose
    userwanttoforgotpassword.resetPasswordToken = undefined;
    userwanttoforgotpassword.resetPasswordExpires = undefined;

    // console.log("psaaword update started is saving" );
    await userwanttoforgotpassword.save();

    // console.log("psaaword update relogining " );
    req.login(userwanttoforgotpassword, err => {
      if (err) return next(err);
      req.flash('success', 'Your password has been changed.');
      res.redirect('/'); // or wherever
    });
    // console.log("psaaword update ended " );
  } catch (err) {
    console.error(err);
    res.redirect('back');
  }
}

module.exports.uploadProfilePhoto = async (req, res) => {
  try {
    const userphoto = await user.findById(req.user._id);
    if (!userphoto) {
      req.flash('error', 'User not found.');
      return res.redirect('/profile');
    }

    // Delete the old profile photo from Cloudinary if it exists
    if (userphoto.profilePhoto && userphoto.profilePhoto.filename) {
      await cloudinary.uploader.destroy(userphoto.profilePhoto.filename);
    }

    // Update the user's profile photo
    userphoto.profilePhoto = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await userphoto.save();

    req.flash('success', 'Profile photo updated successfully!');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/profile');
  }
}