
const mongoose = require('mongoose');

const starlineGameRateSchema = new mongoose.Schema({
    singleDigit: {
        min: { type: Number, default: 10 },
        max: { type: Number, default: 100 }
    },
    singlePana: {
        min: { type: Number, default: 10 },
        max: { type: Number, default: 1500 }
    },
    doublePana: {
        min: { type: Number, default: 10 },
        max: { type: Number, default: 3000 }
    },
    triplePana: {
        min: { type: Number, default: 10 },
        max: { type: Number, default: 7000 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StarlineGameRate', starlineGameRateSchema);