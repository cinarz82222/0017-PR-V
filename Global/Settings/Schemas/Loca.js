const mongoose = require('mongoose');

const model = mongoose.model("luhuxd-loca", mongoose.Schema({
    id: String,
    ownerId: String,
    oluşturmatarih: { type: Number, default: Date.now() },
    paket: { type: Number },
    bitiştarih: { type: Number },
}));

module.exports = model;