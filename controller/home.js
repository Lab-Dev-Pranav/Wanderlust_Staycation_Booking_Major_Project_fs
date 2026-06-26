const {
  holidayCategories,
  amenities,
  experiences,
  attractions
} = require("../views/tags");

// GET Home Route
module.exports.home = (req, res) => {
  res.render("home/home.ejs", {
    holidayCategories,
    amenities,
    experiences,
    attractions
  });
};
