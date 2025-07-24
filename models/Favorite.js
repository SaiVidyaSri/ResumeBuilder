const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure a user can't favorite the same template twice
favoriteSchema.index({ userId: 1, templateId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);