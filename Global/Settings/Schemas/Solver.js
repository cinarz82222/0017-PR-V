const mongoose = require('mongoose');

const model = mongoose.model('Solver', mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    guildId: {
        type: String,
        required: true
    },
    username: {
        type: String
    },
    issueSession: {
        active: {
            type: Boolean,
            default: false
        },
        staffId: {
            type: String
        },
        startTime: {
            type: Date
        },
        endTime: {
            type: Date
        },
        subject: {
            type: String
        },
        resolution: {
            type: String
        },
        channelId: {
            type: String
        },
        messageId: {
            type: String
        }
    },
    issueHistory: [{
        staffId: {
            type: String,
            required: true
        },
        staffUsername: {
            type: String
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        resolution: {
            type: String,
            required: true
        },
        durationSeconds: {
            type: Number
        }
    }]
}, { 
    timestamps: true,
    versionKey: false
}));

module.exports = model;