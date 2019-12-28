const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
    room: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', userSchema);
