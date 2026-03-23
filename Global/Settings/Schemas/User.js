const mongoose = require('mongoose');

const model = mongoose.model('User', mongoose.Schema({
  id: { type: String },
  name: { type: String },
  gender: { type: String },

  day: { type: Number, default: 1 },
  lastDayTime: { type: Number, default: () => new Date().setHours(0, 0, 0, 0) },

  dailyStreak: { type: Number, default: 0 },
  lastDailyTime: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },

  voices: { type: Object, default: {} },
  messages: { type: Object, default: {} },
  streams: { type: Object, default: {} },
  cameras: { type: Object, default: {} },

  lastVoice: { type: Number, default: 0 },
  lastMessage: { type: Number, default: 0 },
  wrongPunitives: { type: Number, default: 0 },

  inviter: { type: String, default: null },
  register: { type: String, default: null },
  isTagged: { type: Boolean, default: false },

  nameLogs: { type: [Object], default: [] },
  roleLogs: { type: [Object], default: [] },
  voiceLogs: { type: [Object], default: [] },
  warnLogs: { type: [Object], default: [] },
  invitesData: { type: Object, default: {} },

  records: { type: [Object], default: [] },
  invites: { type: [Object], default: [] },
  taggeds: { type: [Object], default: [] },
  staffs: { type: [Object], default: [] },

  inventory: {
    type: Object, default: {
      cash: 0, roelcoin: 0, rings: {
        type: Map,
        of: Number,
        default: {}
      },
      gifts: {
        type: [
          {
            id: String,
            name: String,
            icon: String,
            purchaseDate: Date
          }
        ],
        default: []
      },
      purchaseHistory: {
        type: [
          {
            id: String,
            name: String,
            price: Number,
            date: Date
          }
        ],
        default: []
      }
    }
  },
  marriage: { type: Object, default: { active: false, married: undefined, date: undefined, ring: undefined } },
  games: { type: Object, default: { currentStreak: 0, maxStreak: 0, totalWins: 0, totalLosses: 0 } },
  badges: { type: [Object], default: [] },

  level: { current: { type: Number, default: 1 }, exp: { type: Number, default: 0 } },

}));

module.exports = model; 