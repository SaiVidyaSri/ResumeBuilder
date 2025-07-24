const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).select('-password -otp -resetPasswordToken');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const unverifiedUsers = await User.countDocuments({ isVerified: false });
        
        res.json({ 
            totalUsers,
            verifiedUsers,
            unverifiedUsers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -otp -resetPasswordToken');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { email, isVerified } = req.body;
        const updateData = {};
        
        if (email) updateData.email = email;
        if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -otp -resetPasswordToken');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

