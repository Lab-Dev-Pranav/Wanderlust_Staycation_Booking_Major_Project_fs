const express = require("express");
const router = express.Router();
const homeController = require("../controller/home");
const { islogged_in } = require("../MW");

// Home Route
router.get("/", homeController.home);

module.exports = router;
