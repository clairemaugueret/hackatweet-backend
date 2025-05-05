var express = require("express");
var router = express.Router();

require("../models/connection");
const Tweet = require("../models/tweets");
const User = require("../models/users");

// Route to display all tweets
router.get("/", (req, res) => {
  Tweet.find()
    .populate("author")
    .populate("isLiked")
    .then((data) => {
      if (data.length !== 0) {
        res.json({ result: true, tweetsList: data });
      } else {
        res.json({ result: false, error: "No tweet to display" });
      }
    });
});

// Route to add a tweet and then to display all the tweets
router.post("/new", (req, res) => {
  if (req.body.content.length <= 280) {
    User.findOne({ token: req.body.token }).then((userData) => {
      if (!userData.token) {
        return res.json({ result: false, error: "User not found" });
      }

      const hashtags = [
        ...new Set(
          (req.body.content.match(/#[A-zÀ-ú0-9]+/gi) || []).map(tag => tag.slice(1).toLowerCase())
        )
      ];

      const newTweet = new Tweet({
        content: req.body.content,
        author: userData._id,
        date: Date.now(),
        isLiked: [],
        hashtag: hashtags,
      });

      newTweet.save().then(() => {
        Tweet.find()
          .populate("author")
          .populate("isLiked")
          .then((data) => {
            if (data.length !== 0) {
              res.json({ result: true, tweetsList: data });
            } else {
              res.json({ result: false, error: "No tweet to display" });
            }
          });
      });
    });
  }
});

// Route to delete a tweet and then to display all the remaining tweets
router.delete("/delete/:id", (req, res) => {
  const tweetId = req.params.id;
  const token = req.body.token;

  User.findOne({ token }).then((user) => {
    if (!token) {
      return res.json({ result: false, error: "User not found" });
    }

    Tweet.findById(tweetId).then((tweet) => {
      if (!tweet) {
        return res.json({ result: false, error: "Tweet not found" });
      }

      if (!tweet.author.equals(user._id)) {
        return res.json({
          result: false,
          error: "Unauthorized: you are not the author of this tweet",
        });
      }

      Tweet.deleteOne({ _id: tweetId }).then((data) => {
        if (data.deletedCount > 0) {
          Tweet.find()
            .populate("author")
            .populate("isLiked")
            .then((data) => {
              res.json({ result: true, tweetsList: data });
            });
        } else {
          res.json({ result: false, error: "Tweet not deleted" });
        }
      });
    });
  });
});

// Route display only the tweet with the selected hashtag
router.put("/liked/:id", (req, res) => {
  const tweetId = req.params.id;
  const token = req.body.token;

  User.findOne({ token }).then((user) => {
    if (!token || !user) {
      return res.json({ result: false, error: "User not found" });
    }

    Tweet.findById(tweetId).then((tweet) => {
      if (!tweet) {
        return res.json({ result: false, error: "Tweet not found" });
      }

      const userAlreadyLiked = tweet.isLiked.includes(user._id);

      const update = userAlreadyLiked
        ? { $pull: { isLiked: user._id } }
        : { $push: { isLiked: user._id } };

      Tweet.updateOne({ _id: tweetId }, update).then((data) => {
        if (data.modifiedCount > 0) {
          Tweet.find()
            .populate("author")
            .populate("isLiked")
            .then((data) => {
              res.json({ result: true, tweetsList: data });
            });
        } else {
          res.json({ result: false, error: "Tweet not updated" });
        }
      });
    });
  });
});

module.exports = router;

// Route to display all hashtag
router.get("/trends", (req, res) => {
  Tweet.find().then((data) => {
    if (data.length !== 0) {
      let hashtagList = [];
      for (let tweet of data) {
        hashtagList.push(...tweet.hashtag);
      }
      res.json({ result: true, hashtagList });
    } else {
      res.json({ result: false, error: "No hashtag to display" });
    }
  });
});

// Route display only the tweet with the selected hashtag
router.post("/trends/:hashtag", (req, res) => {
  const hashtag = req.params.hashtag;

  Tweet.find({ hashtag: hashtag })
    .populate("author")
    .populate("isLiked")
    .then((tweets) => {
      if (!tweets) {
        return res.json({ result: false, error: "Tweet not found" });
      }
      res.json({ result: true, tweetsList: tweets });
    });
});
