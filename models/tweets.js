const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema({
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    date: Date,
    isLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    hashtag: [String],
})

const Tweet = mongoose.model('tweets', tweetSchema);

module.exports = Tweet;