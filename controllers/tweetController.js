const Tweet = require("../models/tweets");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const { post } = require("../routes/tweets");

// Fetch all tweets (reusable function)
const fetchAllTweets = (filter = {}) => {
  return Tweet.find(filter)
    .populate("author")
    .populate("isLiked")
    .sort({ date: -1 });
}; // tweets triés du plus récent au plus ancien

// Reusable function to extract hashtags from tweet content
const extractHashtags = (content) => {
  return [
    ...new Set(
      (content.match(/#[A-zÀ-ú0-9]+/gi) || []).map((tag) =>
        tag.slice(1).toLowerCase()
      )
    ),
  ];
};

// Reusable function to check if the user is the author of the tweet
const isAuthor = (tweet, user) => {
  return tweet.author.equals(user._id);
};

// GET all tweets
const getAllTweets = (req, res) => {
  fetchAllTweets()
    .then((tweets) => {
      if (tweets.length > 0) {
        res.status(200).json({ result: true, tweetsList: tweets });
      } else {
        res.status(404).json({ result: false, error: "No tweet to display" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ result: false, error: "Error fetching tweets" });
    });
};

// POST a tweet and then display all the tweets
const postNewTweet = (req, res) => {
  if (!checkBody(req.body, ["content"])) {
    return res
      .status(400)
      .json({ result: false, error: "Missing or empty content" });
  }

  if (req.body.content.length > 280) {
    return res.status(400).json({ result: false, error: "Tweet is too long" });
  }

  const hashtags = extractHashtags(req.body.content).map((tag) =>
    tag.toLowerCase()
  ); // on s'assure doublement que les hastags sont en minuscules

  const newTweet = new Tweet({
    content: req.body.content,
    author: req.user._id, // injecté par le middleware checkToken
    date: Date.now(),
    isLiked: [],
    hashtag: hashtags,
  });

  newTweet
    .save()
    .then(() => fetchAllTweets())
    .then((tweets) => {
      if (tweets.length > 0) {
        res.status(201).json({ result: true, tweetsList: tweets });
      } else {
        res.status(404).json({ result: false, error: "No tweet to display" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ result: false, error: "Error posting tweet" });
    });
};

// DELETE a tweet and then display all the tweets
const deleteTweet = (req, res) => {
  const tweetId = req.params.id;

  Tweet.findById(tweetId)
    .then((tweet) => {
      if (!tweet) {
        return res
          .status(404)
          .json({ result: false, error: "Tweet not found" });
      }

      if (!isAuthor(tweet, req.user)) {
        return res.status(403).json({
          result: false,
          error: "Unauthorized: you are not the author of this tweet",
        });
      }

      Tweet.deleteOne({ _id: tweetId })
        .then((result) => {
          if (result.deletedCount > 0) {
            return fetchAllTweets().then((tweets) => {
              res.status(200).json({ result: true, tweetsList: tweets });
            });
          } else {
            return res
              .status(400)
              .json({ result: false, error: "Tweet not deleted" });
          }
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .json({ result: false, error: "Error deleting tweet" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ result: false, error: "Error fetching tweet" });
    });
};

// PUT to like or unlike a tweet
const likeOrUnlikeTweet = (req, res) => {
  const tweetId = req.params.id;
  const userId = req.user._id; // fourni par checkToken

  Tweet.findById(tweetId)
    .then((tweet) => {
      if (!tweet) {
        return res
          .status(404)
          .json({ result: false, error: "Tweet not found" });
      }

      const userAlreadyLiked = tweet.isLiked.includes(userId);
      const update = userAlreadyLiked
        ? { $pull: { isLiked: userId } }
        : { $push: { isLiked: userId } };

      Tweet.updateOne({ _id: tweetId }, update)
        .then((result) => {
          if (result.modifiedCount > 0) {
            return fetchAllTweets().then((tweets) => {
              res.status(200).json({ result: true, tweetsList: tweets });
            });
          } else {
            return res
              .status(400)
              .json({ result: false, error: "Tweet not updated" });
          }
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ result: false, error: "Error updating like" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ result: false, error: "Error fetching tweet" });
    });
};

// GET all hashtag
const getAllHashtags = (req, res) => {
  Tweet.find()
    .then((tweets) => {
      if (tweets.length > 0) {
        const hashtagList = [
          ...new Set(tweets.flatMap((tweet) => tweet.hashtag)),
        ];

        return res.status(200).json({ result: true, hashtagList });
      } else {
        return res
          .status(404)
          .json({ result: false, error: "No hashtag to display" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ result: false, error: "Error fetching hashtags" });
    });
};

// GET tweets by selected hashtag
const getTweetsByHashtag = (req, res) => {
  fetchAllTweets({ hashtag: req.params.hashtag.toLowerCase() })
    .then((tweets) => {
      if (!tweets || tweets.length === 0) {
        return res
          .status(404)
          .json({ result: false, error: "No tweets found with this hashtag" });
      }

      res.status(200).json({ result: true, tweetsList: tweets });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ result: false, error: "Error fetching tweets by hashtag" });
    });
};

module.exports = {
  getAllTweets,
  postNewTweet,
  deleteTweet,
  likeOrUnlikeTweet,
  getAllHashtags,
  getTweetsByHashtag,
};
