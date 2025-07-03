var express = require("express");
var router = express.Router();

const {
  signup,
  signin,
  updateProfilePicture,
  updateFirstname,
} = require("../controllers/userController");
const { checkToken } = require("../middlewares/auth");

//SIGNUP
router.post("/signup", signup);

//SIGNIN
router.post("/signin", signin);

//UPDATE PROFILE PICTURE
router.put("/picture", checkToken, updateProfilePicture);

//UPDATE FIRSTNAME
router.put("/firstname", checkToken, updateFirstname);

module.exports = router;
