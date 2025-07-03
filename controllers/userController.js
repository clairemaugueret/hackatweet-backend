const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

//SIGNUP
const signup = (req, res) => {
  if (!checkBody(req.body, ["firstname", "username", "password"])) {
    return res
      .status(400)
      .json({ result: false, error: "Missing or empty fields" });
  }

  const { firstname, username, password } = req.body;

  User.findOne({ username })
    .then((existingUser) => {
      if (existingUser === null) {
        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = new User({
          firstname,
          username,
          password: hashedPassword,
          token: uid2(32),
          image: "",
        });

        return newUser.save().then((newDoc) => {
          return res.status(201).json({ result: true, token: newDoc.token });
        });
      } else {
        return res
          .status(409)
          .json({ result: false, error: "User already exists" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ result: false, error: "Database error during signup" });
    });
};

//SIGNIN
const signin = (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    return res
      .status(400)
      .json({ result: false, error: "Missing or empty fields" });
  }

  const { username, password } = req.body;

  User.findOne({ username })
    .then((user) => {
      if (user) {
        if (bcrypt.compareSync(password, user.password)) {
          return res.status(200).json({
            result: true,
            token: user.token,
            firstname: user.firstname,
            image: user.image,
          });
        } else {
          return res
            .status(401)
            .json({ result: false, error: "Wrong password" });
        }
      } else {
        return res.status(401).json({ result: false, error: "User not found" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ result: false, error: "Database error during signin" });
    });
};

//UPDATE PROFILE PICTURE
const updateProfilePicture = (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id }, // On utilise req.user._id car on a déjà vérifié le token dans le middleware auth.js
    { image: req.body.image },
    { new: true } // retourne le document mis à jour
  )
    .then((updatedUser) => {
      if (updatedUser) {
        return res.json({
          result: true,
          token: updatedUser.token,
          image: updatedUser.image,
        });
      } else {
        return res.status(400).json({
          result: false,
          error: "Profile picture not updated",
        });
      }
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ result: false, error: "Database update error" });
    });
};

//UPDATE FIRSTNAME
const updateFirstname = (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id }, // On utilise req.user._id car on a déjà vérifié le token dans le middleware auth.js
    { firstname: req.body.firstname },
    { new: true } // retourne le document mis à jour
  )
    .then((updatedUser) => {
      if (updatedUser) {
        return res.json({
          result: true,
          token: updatedUser.token,
          firstname: updatedUser.firstname,
        });
      } else {
        return res.status(400).json({
          result: false,
          error: "Firstname not updated",
        });
      }
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ result: false, error: "Database update error" });
    });
};

module.exports = { signup, signin, updateProfilePicture, updateFirstname };
