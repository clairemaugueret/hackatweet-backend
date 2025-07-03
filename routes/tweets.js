var express = require("express");
var router = express.Router();

const Tweet = require("../models/tweets");
const User = require("../models/users");

const {
  getAllTweets,
  postNewTweet,
  deleteTweet,
  likeOrUnlikeTweet,
  getAllHashtags,
  getTweetsByHashtag,
} = require("../controllers/tweetController");
const { checkToken } = require("../middlewares/auth");

// GET all tweets
router.get("/", getAllTweets);

// POST a tweet and then display all the tweets
router.post("/new", checkToken, postNewTweet);

// DELETE a tweet and then display all the tweets
router.delete("/delete/:id", checkToken, deleteTweet);

// PUT to like or unlike a tweet
router.put("/liked/:id", checkToken, likeOrUnlikeTweet);

// GET all hashtag
router.get("/trends", getAllHashtags);

// GET tweets by selected hashtag
router.get("/trends/:hashtag", getTweetsByHashtag);

module.exports = router;
