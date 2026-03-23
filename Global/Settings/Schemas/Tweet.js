const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
    tweetNo: { type: Number, unique: true, required: true },
    tweetId: { type: String, required: true, unique: true },
    content: { type: String, required: false, default: "" },
    likes: {
        type: [{ userId: String, username: String, likedAt: { type: Date, default: Date.now } }],
        default: []
    },
    retweets: {
        type: [{ userId: String, username: String, retweetedAt: { type: Date, default: Date.now } }],
        default: []
    },
    comments: { type: Number, default: 0 },
    dowlands: { type: Number, default: 0 },
    commentData: {
        type: [{ username: String, comment: String }],
        default: []
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tweet', tweetSchema);
