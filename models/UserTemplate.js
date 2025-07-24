const mongoose = require('mongoose');

const userTemplateSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    originalTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    htmlContent: {
        type: String,
        required: true
    },
    customizations: {
        colorScheme: {
            type: String,
            default: 'default'
        },
        fontFamily: {
            type: String,
            default: 'default'
        },
        layoutStyle: {
            type: String,
            default: 'default'
        }
    },
    originalTemplate: {
        name: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        industry: {
            type: String,
            default: 'All Industries'
        }
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    downloads: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries
userTemplateSchema.index({ userId: 1, name: 1 }, { unique: true });
userTemplateSchema.index({ userId: 1, createdAt: -1 });
userTemplateSchema.index({ isPublic: 1, rating: -1 });

// Update the updatedAt field before saving
userTemplateSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const UserTemplate = mongoose.model('UserTemplate', userTemplateSchema);
module.exports = UserTemplate;