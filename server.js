require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const mongoose = require('mongoose');
const fs = require("fs");
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require("multer");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Handlebars = require("handlebars");
const moment = require("moment");

const User = require('./models/User');
const headlineRoutes = require('./models/resumeheadline');
const ResumeHeadline = require('./models/resumeheadline');
const KeySkills = require('./models/KeySkills');
const Education = require('./models/Education');
const ITSkills = require('./models/ITskills'); 
const Projects = require('./models/Projects');
const ProfileSummary = require('./models/ProfileSummary');
const CareerProfile = require('./models/CareerProfile');
const PersonalDetails = require('./models/PersonalDetails');
const OnlineProfile = require('./models/OnlineProfile');
const WorkSample = require('./models/WorkSample');
const Publication = require('./models/Publication');
const Presentation = require('./models/Presentation');
const Patent = require('./models/Patent');
const Certification = require('./models/Certification');
const ProfileDetails = require('./models/ProfileDetails');
const Template = require('./models/Template');
const Favorite = require('./models/Favorite');
const UserTemplate = require('./models/UserTemplate');

const cors = require('cors');
app.use(cors({
  origin: '*', // Allow all origins for better compatibility
  credentials: true
}));

// MongoDB connection using environment variable
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume')
  .then(() => {
    console.log("✅ MongoDB connected to database:", mongoose.connection.db.databaseName);
    
    mongoose.connection.db.collection('resumeheadlines').countDocuments({})
      .then(count => console.log(`Current resume headlines count: ${count}`))
      .catch(err => console.error("Count error:", err));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    console.log("⚠️ Continuing without database connection for testing...");
    // Don't exit, continue running for testing purposes
  });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hirewithnexthire@gmail.com"; 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "azqsxwdcefv@011"; // Your specific admin password

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api', router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts',express.static(path.join(__dirname, 'scripts')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use('/templateimages', express.static(path.join(__dirname, 'images', 'templateimages')));
app.use('/templatescollection', express.static(path.join(__dirname, 'templatescollection')));
app.use('/api/resume-headline', headlineRoutes);

// Test connection endpoint
app.get('/api/test-connection', (req, res) => {
    console.log('Test connection endpoint called');
    res.json({ success: true, message: 'Server is connected' });
});

// Static file routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'index.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'dashboard.html'));
});
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'profile.html'));
});
app.get('/favorites', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'favorites.html'));
});
app.get('/logout', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'logout.html'));
});
app.get('/resume-editor', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'resume-editor.html'));
});
app.get('/section-editor', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'section-editor.html'));
});
app.get('/templates', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'templates.html'));
});
app.get('/template-preview', (req, res) => {
    res.sendFile(path.join(__dirname,'public' ,'template-preview.html'));
});
app.get('/admin- index', (req,res) => {
    res.sendFile(path.join(__dirname,'public' ,'admin- index.html'));
})

app.get('/reset-password', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.redirect('/');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reset Password</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            </style>
            <script>
                // Store the token in sessionStorage (more reliable than localStorage for this flow)
                sessionStorage.setItem('resetToken', '${token}');
                
                // Redirect to homepage with hash to trigger modal
                window.location.href = '/#reset-password-modal';
                
                // Fallback in case redirect doesn't work
                setTimeout(function() {
                    window.location.href = '/#reset-password-modal';
                }, 2000);
            </script>
        </head>
        <body>
            <h2>Preparing password reset...</h2>
            <p>If you're not redirected automatically, <a href="/#reset-password-modal">click here</a>.</p>
        </body>
        </html>
    `);
});

// Authentication Routes
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

  let user = await User.findOne({ email });
  if (!user) user = new User({ email });
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

const transporter = nodemailer.createTransport({ 
      service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'hirewithnexthire@gmail.com',      
    pass: process.env.EMAIL_PASS || 'leey xxvf akda pjxe'         
  }
 });
  await transporter.sendMail({
    from: '"NextHire"<hirewithnexthire@gmail.com>',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`
  });

  res.json({ message: 'OTP sent to email' });
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  console.log('User OTP:', user.otp, 'Input OTP:', otp);

  if (!user) return res.status(400).json({ message: 'User not found' });

  if ((user.otp || '').trim() !== (otp || '').trim()) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  if (user.otpExpires < Date.now()) return res.status(400).json({ message: 'OTP expired' });

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: 'OTP verified successfully' });
});

router.post('/set-password', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isVerified: true });

  if (!user) return res.status(400).json({ message: 'User not verified' });

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'hirewithnexthire@gmail.com',
      pass: process.env.EMAIL_PASS || 'leey xxvf akda pjxe'
    }
  });

  const htmlBody = `
    <div style="font-family:Arial; padding:20px; border:1px solid #eee;">
      <h2>🎉 Account Successfully Created!</h2>
      <p>Dear User,</p>
      <p>Your account has been successfully registered. You can now log in and prepare your resume in just a few minutes.</p>
      <a href="http://192.168.1.5:3000/index.html#loginModal"
            style="display:inline-block;padding:10px 20px;background:#007BFF;color:#fff;text-decoration:none;border-radius:5px;">
            Login Now
      </a>

      <p style="margin-top:20px;">Thank you,<br/>NextHire Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: '"NextHire" <hirewithnexthire@gmail.com>',
    to: email,
    subject: '🎉 Account Created - Start Preparing Your Resume',
    html: htmlBody
  });

  res.json({ message: 'Password set successfully and email sent' });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ 
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ 
                success: true,
                message: 'If an account exists with this email, a reset link has been sent'
            });
        }
        
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); 
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'hirewithnexthire@gmail.com',
                pass: process.env.EMAIL_PASS || 'leey xxvf akda pjxe'
            }
        });
        
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        
        const htmlBody = `
            <div style="font-family:Arial; padding:20px; border:1px solid #eee;">
                <h2>🔑 Password Reset Request</h2>
                <p>You are receiving this because you (or someone else) requested a password reset for your account.</p>
                <p>Please click the button below to reset your password:</p>
                <a href="${resetUrl}"
                    style="display:inline-block;padding:10px 20px;background:#007BFF;color:#fff;text-decoration:none;border-radius:5px;">
                    Reset Password
                </a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p style="margin-top:20px;">Thank you,<br/>NextHire Team</p>
            </div>
        `;
        
        await transporter.sendMail({
            from: `"NextHire" <${process.env.EMAIL_USER || 'hirewithnexthire@gmail.com'}>`,
            to: email,
            subject: '🔑 Password Reset Request',
            html: htmlBody
        });
        
        res.json({ 
            success: true,
            message: 'If an account exists with this email, a reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing password reset request',
            error: error.message 
        });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ 
            success: false,
            message: 'Token and new password are required' 
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ 
            success: false,
            message: 'Password must be at least 8 characters long' 
        });
    }

    try {
        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired token. Please request a new password reset.' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'hirewithnexthire@gmail.com',
                pass: process.env.EMAIL_PASS || 'leey xxvf akda pjxe'
            }
        });
        
        await transporter.sendMail({
            from: `"NextHire" <${process.env.EMAIL_USER || 'hirewithnexthire@gmail.com'}>`,
            to: user.email,
            subject: '✅ Your password has been reset',
            html: `
                <div style="font-family:Arial; padding:20px;">
                    <h2>Password Successfully Reset</h2>
                    <p>Your NextHire account password has been successfully reset.</p>
                    <p>If you did not perform this action, please contact support immediately.</p>
                    <p style="margin-top:20px;">Thank you,<br/>NextHire Team</p>
                </div>
            `
        });
        
        res.json({ 
            success: true,
            message: 'Password updated successfully. You can now login with your new password.' 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error resetting password',
            error: error.message 
        });
    }
});

// Consolidated Login API Endpoint
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // --- FIRST: Check for specific ADMIN credentials ---
        // For admin, we are using a simple direct comparison. 
        // In a production admin system, you might also hash the admin password.
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Admin login successful
            return res.status(200).json({ message: "Admin login successful", role: "admin", redirectUrl: "/admin- index.html" });
        }

        // --- SECOND: If not admin, check against your regular User database ---
        const user = await User.findOne({ email });

        // Use your existing user verification logic
        if (!user || !user.isVerified) {
            return res.status(400).json({ message: "User not found or not verified" });
        }

        // Use your existing bcrypt password comparison
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Regular user login successful
        return res.status(200).json({ 
            message: "Sign in successful",
            userId: user._id, // Include userId as per your original signin
            role: "user", 
            redirectUrl: "/dashboard.html" 
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An internal server error occurred." });
    }
});


// Resume Headline Routes
router.post('/resume-headline', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { userId, headline } = req.body;

        if (!userId) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'No user ID provided',
                debug: { receivedUserId: userId }
            });
        }

        let userIdObj;
        try {
            userIdObj = new mongoose.Types.ObjectId(userId);
        } catch (err) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                debug: { 
                    receivedUserId: userId,
                    expectedFormat: '24-character hex string'
                }
            });
        }

        if (!headline || headline.trim().length < 10) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Headline must be at least 10 characters',
                debug: { receivedHeadline: headline }
            });
        }

        const result = await ResumeHeadline.findOneAndUpdate(
            { userId: userIdObj },
            { headline },
            { 
                upsert: true,
                new: true,
                runValidators: true,
                session: session
            }
        );

        const verifiedDoc = await ResumeHeadline.findOne(
            { _id: result._id },
            null,
            { session }
        );

        if (!verifiedDoc) {
            throw new Error('Verification failed - document not found after save');
        }

        await session.commitTransaction();
        
        const postCommitDoc = await ResumeHeadline.findById(result._id);
        console.log('Post-commit verification:', postCommitDoc);

        return res.json({ 
            success: true,
            message: 'Resume headline saved successfully',
            data: verifiedDoc,
            debug: {
                operationResult: result,
                verifiedDoc: verifiedDoc,
                postCommitVerification: postCommitDoc
            }
        });

    } catch (error) {
        await session.abortTransaction();
        
        console.error('Complete error details:', {
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString(),
            requestBody: req.body
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to save resume headline',
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                requestBody: req.body
            } : undefined
        });
    } finally {
        session.endSession();
    }
});

router.get('/resume-headline/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const headline = await ResumeHeadline.findOne({ userId: userIdObj });
        
        if (!headline) {
            return res.status(404).json({
                success: false,
                message: 'No headline found for this user'
            });
        }

        return res.json({
            success: true,
            data: headline
        });

    } catch (error) {
        console.error('Error fetching headline:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching resume headline',
            error: error.message
        });
    }
});

// Key Skills Routes
router.post('/key-skills', async (req, res) => {
    try {
        const { userId, skills } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const result = await KeySkills.findOneAndUpdate(
            { userId: userIdObj },
            { skills },
            { 
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        return res.json({ 
            success: true,
            message: 'Key skills saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Key skills save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save key skills',
            error: error.message
        });
    }
});

router.get('/key-skills/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const keySkills = await KeySkills.findOne({ userId: userIdObj });
        
        if (!keySkills) {
            return res.status(404).json({
                success: false,
                message: 'No key skills found for this user'
            });
        }

        return res.json({
            success: true,
            data: keySkills
        });

    } catch (error) {
        console.error('Error fetching key skills:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching key skills',
            error: error.message
        });
    }
});

// Education Routes
router.post('/education', async (req, res) => {
    try {
        const { userId, ...educationData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const education = new Education({
            userId: userIdObj,
            ...educationData
        });

        const result = await education.save();

        return res.json({ 
            success: true,
            message: 'Education saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Education save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save education',
            error: error.message
        });
    }
});

router.get('/education/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const education = await Education.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: education
        });

    } catch (error) {
        console.error('Error fetching education:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching education',
            error: error.message
        });
    }
});

router.put("/education/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...educationData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid education ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const educationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Education.findOneAndUpdate(
            { _id: educationIdObj, userId: userIdObj },
            educationData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Education entry not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Education updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Education update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update education",
            error: error.message
        });
    }
});

// Delete Education by ID
router.delete("/education/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid education ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const educationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Education.findOneAndDelete({
            _id: educationIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Education entry not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Education deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Education delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete education",
            error: error.message
        });
    }
});


// IT Skills Routes
router.post('/it-skills', async (req, res) => {
    try {
        const { userId, ...itSkillData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const itSkill = new ITSkills({
            userId: userIdObj,
            ...itSkillData
        });

        const result = await itSkill.save();

        return res.json({ 
            success: true,
            message: 'IT skill saved successfully',
            data: result
        });

    } catch (error) {
        console.error('IT skills save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save IT skill',
            error: error.message
        });
    }
});

router.get('/it-skills/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const itSkills = await ITSkills.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: itSkills
        });

    } catch (error) {
        console.error('Error fetching IT skills:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching IT skills',
            error: error.message
        });
    }
});

// Update IT Skill by ID
router.put("/it-skills/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...itSkillData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid IT skill ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const skillIdObj = new mongoose.Types.ObjectId(id);

        const result = await ITSkills.findOneAndUpdate(
            { _id: skillIdObj, userId: userIdObj },
            itSkillData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "IT skill not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "IT skill updated successfully",
            data: result
        });

    } catch (error) {
        console.error("IT skill update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update IT skill",
            error: error.message
        });
    }
});

// Delete IT Skill by ID
router.delete("/it-skills/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid IT skill ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const skillIdObj = new mongoose.Types.ObjectId(id);

        const result = await ITSkills.findOneAndDelete({
            _id: skillIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "IT skill not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "IT skill deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("IT skill delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete IT skill",
            error: error.message
        });
    }
});


// Projects Routes
router.post('/projects', async (req, res) => {
    try {
        const { userId, ...projectData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const project = new Projects({
            userId: userIdObj,
            ...projectData
        });

        const result = await project.save();

        return res.json({ 
            success: true,
            message: 'Project saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Projects save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save project',
            error: error.message
        });
    }
});

router.get('/projects/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const projects = await Projects.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: projects
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message
        });
    }
});

router.put("/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...projectData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const projectIdObj = new mongoose.Types.ObjectId(id);

        const result = await Projects.findOneAndUpdate(
            { _id: projectIdObj, userId: userIdObj },
            projectData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Project updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Project update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update project",
            error: error.message
        });
    }
});

// Delete Project by ID
router.delete("/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const projectIdObj = new mongoose.Types.ObjectId(id);

        const result = await Projects.findOneAndDelete({
            _id: projectIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Project deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Project delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete project",
            error: error.message
        });
    }
});


// Profile Summary Routes
router.post('/profile-summary', async (req, res) => {
    try {
        const { userId, summary } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const result = await ProfileSummary.findOneAndUpdate(
            { userId: userIdObj },
            { summary },
            { 
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        return res.json({ 
            success: true,
            message: 'Profile summary saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Profile summary save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save profile summary',
            error: error.message
        });
    }
});

router.get('/profile-summary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const profileSummary = await ProfileSummary.findOne({ userId: userIdObj });
        
        if (!profileSummary) {
            return res.status(404).json({
                success: false,
                message: 'No profile summary found for this user'
            });
        }

        return res.json({
            success: true,
            data: profileSummary
        });

    } catch (error) {
        console.error('Error fetching profile summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching profile summary',
            error: error.message
        });
    }
});

// Career Profile Routes
router.post('/career-profile', async (req, res) => {
    try {
        const { userId, ...careerData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const career = new CareerProfile({
            userId: userIdObj,
            ...careerData
        });

        const result = await career.save();

        return res.json({ 
            success: true,
            message: 'Career profile saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Career profile save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save career profile',
            error: error.message
        });
    }
});

router.get('/career-profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const careerProfile = await CareerProfile.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: careerProfile
        });

    } catch (error) {
        console.error('Error fetching career profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching career profile',
            error: error.message
        });
    }
});

router.put("/career-profile/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...careerData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid career profile ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const careerIdObj = new mongoose.Types.ObjectId(id);

        const result = await CareerProfile.findOneAndUpdate(
            { _id: careerIdObj, userId: userIdObj },
            careerData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Career profile not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Career profile updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Career profile update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update career profile",
            error: error.message
        });
    }
});

// Delete Career Profile by ID
router.delete("/career-profile/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid career profile ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const careerIdObj = new mongoose.Types.ObjectId(id);

        const result = await CareerProfile.findOneAndDelete({
            _id: careerIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Career profile not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Career profile deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Career profile delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete career profile",
            error: error.message
        });
    }
});

// Personal Details Routes
router.post('/personal-details', async (req, res) => {
    try {
        const { userId, ...personalData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const result = await PersonalDetails.findOneAndUpdate(
            { userId: userIdObj },
            personalData,
            { 
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        return res.json({ 
            success: true,
            message: 'Personal details saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Personal details save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save personal details',
            error: error.message
        });
    }
});

router.get('/personal-details/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const personalDetails = await PersonalDetails.findOne({ userId: userIdObj });
        
        if (!personalDetails) {
            return res.status(404).json({
                success: false,
                message: 'No personal details found for this user'
            });
        }

        return res.json({
            success: true,
            data: personalDetails
        });

    } catch (error) {
        console.error('Error fetching personal details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching personal details',
            error: error.message
        });
    }
});

// Online Profile Routes (Accomplishments)
router.post('/online-profile', async (req, res) => {
    try {
        const { userId, ...profileData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const profile = new OnlineProfile({
            userId: userIdObj,
            ...profileData
        });

        const result = await profile.save();

        return res.json({ 
            success: true,
            message: 'Online profile saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Online profile save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save online profile',
            error: error.message
        });
    }
});

router.get('/online-profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const onlineProfiles = await OnlineProfile.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: onlineProfiles
        });

    } catch (error) {
        console.error('Error fetching online profiles:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching online profiles',
            error: error.message
        });
    }
});

// Online Profile Update and Delete
router.put("/online-profile/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...profileData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid online profile ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const profileIdObj = new mongoose.Types.ObjectId(id);

        const result = await OnlineProfile.findOneAndUpdate(
            { _id: profileIdObj, userId: userIdObj },
            profileData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Online profile not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Online profile updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Online profile update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update online profile",
            error: error.message
        });
    }
});

router.delete("/online-profile/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid online profile ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const profileIdObj = new mongoose.Types.ObjectId(id);

        const result = await OnlineProfile.findOneAndDelete({
            _id: profileIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Online profile not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Online profile deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Online profile delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete online profile",
            error: error.message
        });
    }
});


// Work Sample Routes (Accomplishments)
router.post('/work-sample', async (req, res) => {
    try {
        const { userId, ...sampleData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const sample = new WorkSample({
            userId: userIdObj,
            ...sampleData
        });

        const result = await sample.save();

        return res.json({ 
            success: true,
            message: 'Work sample saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Work sample save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save work sample',
            error: error.message
        });
    }
});

router.get('/work-sample/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const workSamples = await WorkSample.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: workSamples
        });

    } catch (error) {
        console.error('Error fetching work samples:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching work samples',
            error: error.message
        });
    }
});

router.put("/work-sample/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...sampleData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid work sample ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const sampleIdObj = new mongoose.Types.ObjectId(id);

        const result = await WorkSample.findOneAndUpdate(
            { _id: sampleIdObj, userId: userIdObj },
            sampleData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Work sample not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Work sample updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Work sample update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update work sample",
            error: error.message
        });
    }
});

router.delete("/work-sample/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid work sample ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const sampleIdObj = new mongoose.Types.ObjectId(id);

        const result = await WorkSample.findOneAndDelete({
            _id: sampleIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Work sample not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Work sample deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Work sample delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete work sample",
            error: error.message
        });
    }
});


// Publication Routes (Accomplishments)
router.post('/publication', async (req, res) => {
    try {
        const { userId, ...publicationData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const publication = new Publication({
            userId: userIdObj,
            ...publicationData
        });

        const result = await publication.save();

        return res.json({ 
            success: true,
            message: 'Publication saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Publication save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save publication',
            error: error.message
        });
    }
});

router.get('/publication/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const publications = await Publication.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: publications
        });

    } catch (error) {
        console.error('Error fetching publications:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching publications',
            error: error.message
        });
    }
});

router.put("/publication/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...publicationData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid publication ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const publicationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Publication.findOneAndUpdate(
            { _id: publicationIdObj, userId: userIdObj },
            publicationData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Publication not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Publication updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Publication update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update publication",
            error: error.message
        });
    }
});

router.delete("/publication/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid publication ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const publicationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Publication.findOneAndDelete({
            _id: publicationIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Publication not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Publication deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Publication delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete publication",
            error: error.message
        });
    }
});


// Presentation Routes (Accomplishments)
router.post('/presentation', async (req, res) => {
    try {
        const { userId, ...presentationData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const presentation = new Presentation({
            userId: userIdObj,
            ...presentationData
        });

        const result = await presentation.save();

        return res.json({ 
            success: true,
            message: 'Presentation saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Presentation save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save presentation',
            error: error.message
        });
    }
});

router.get('/presentation/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const presentations = await Presentation.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: presentations
        });

    } catch (error) {
        console.error('Error fetching presentations:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching presentations',
            error: error.message
        });
    }
});

router.put("/presentation/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...presentationData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid presentation ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const presentationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Presentation.findOneAndUpdate(
            { _id: presentationIdObj, userId: userIdObj },
            presentationData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Presentation not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Presentation updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Presentation update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update presentation",
            error: error.message
        });
    }
});

router.delete("/presentation/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid presentation ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const presentationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Presentation.findOneAndDelete({
            _id: presentationIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Presentation not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Presentation deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Presentation delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete presentation",
            error: error.message
        });
    }
});


// Patent Routes (Accomplishments)
router.post('/patent', async (req, res) => {
    try {
        const { userId, ...patentData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const patent = new Patent({
            userId: userIdObj,
            ...patentData
        });

        const result = await patent.save();

        return res.json({ 
            success: true,
            message: 'Patent saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Patent save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save patent',
            error: error.message
        });
    }
});

router.get('/patent/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const patents = await Patent.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: patents
        });

    } catch (error) {
        console.error('Error fetching patents:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching patents',
            error: error.message
        });
    }
});


router.put("/patent/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...patentData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patent ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const patentIdObj = new mongoose.Types.ObjectId(id);

        const result = await Patent.findOneAndUpdate(
            { _id: patentIdObj, userId: userIdObj },
            patentData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Patent not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Patent updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Patent update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update patent",
            error: error.message
        });
    }
});

router.delete("/patent/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patent ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const patentIdObj = new mongoose.Types.ObjectId(id);

        const result = await Patent.findOneAndDelete({
            _id: patentIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Patent not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Patent deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Patent delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete patent",
            error: error.message
        });
    }
});


// Certification Routes (Accomplishments)
router.post('/certification', async (req, res) => {
    try {
        const { userId, ...certificationData } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const certification = new Certification({
            userId: userIdObj,
            ...certificationData
        });

        const result = await certification.save();

        return res.json({ 
            success: true,
            message: 'Certification saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Certification save error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save certification',
            error: error.message
        });
    }
});

router.get('/certification/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const certifications = await Certification.find({ userId: userIdObj }).sort({ createdAt: -1 });
        
        return res.json({
            success: true,
            data: certifications
        });

    } catch (error) {
        console.error('Error fetching certifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching certifications',
            error: error.message
        });
    }
});

router.put("/certification/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...certificationData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid certification ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const certificationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Certification.findOneAndUpdate(
            { _id: certificationIdObj, userId: userIdObj },
            certificationData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Certification not found or you don't have permission to update it"
            });
        }

        return res.json({ 
            success: true,
            message: "Certification updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Certification update error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update certification",
            error: error.message
        });
    }
});

router.delete("/certification/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid certification ID format"
            });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const certificationIdObj = new mongoose.Types.ObjectId(id);

        const result = await Certification.findOneAndDelete({
            _id: certificationIdObj,
            userId: userIdObj
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Certification not found or you don't have permission to delete it"
            });
        }

        return res.json({ 
            success: true,
            message: "Certification deleted successfully",
            data: result
        });

    } catch (error) {
        console.error("Certification delete error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete certification",
            error: error.message
        });
    }
});

// Debug Routes (for development/testing)
router.get('/debug/resume-headlines', async (req, res) => {
    try {
        const docs = await ResumeHeadline.find({});
        console.log('All resume headlines in DB:', docs);
        res.json({
            success: true,
            count: docs.length,
            data: docs
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

router.get('/debug/db-stats', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const stats = await db.command({ dbStats: 1 });
        const collections = await db.listCollections().toArray();
        
        const headlines = await ResumeHeadline.find({});
        
        res.json({
            success: true,
            dbStats: stats,
            collections: collections.map(c => c.name),
            resumeHeadlines: headlines
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/debug/test-insert', async (req, res) => {
    try {
        const testDoc = await ResumeHeadline.create({
            userId: new mongoose.Types.ObjectId(),
            headline: 'Test headline ' + new Date().toISOString()
        });
        
        res.json({
            success: true,
            inserted: testDoc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/debug/user-headlines/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        const docs = await ResumeHeadline.find({ userId: userIdObj });
        const count = await ResumeHeadline.countDocuments({ userId: userIdObj });
        
        res.json({
            success: true,
            count,
            data: docs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/debug/collection-stats', async (req, res) => {
    try {
        const stats = await ResumeHeadline.collection.stats();
        const indexes = await ResumeHeadline.collection.indexes();
        
        res.json({
            success: true,
            stats,
            indexes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public", "uploads");
        fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "previewImage") {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed for previewImage!"), false);
            }
        } else if (file.fieldname === "htmlFile") {
            if (!file.originalname.match(/\.(html)$/i)) {
                return cb(new Error("Only HTML files are allowed for htmlFile!"), false);
            }
        }
        cb(null, true);
    },
});

// User Routes
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/users/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        res.json({ totalUsers, verifiedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        const { email, isVerified } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { email, isVerified },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Profile API Routes (for frontend compatibility)
app.get("/api/users/:userId/profile", async (req, res) => {
    console.log("=== GET /api/users/:userId/profile called ===");
    console.log("User ID:", req.params.userId);
    console.log("Request headers:", req.headers);
    
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log("Invalid user ID format:", userId);
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        
        // Get user basic info
        const user = await User.findById(userIdObj);
        if (!user) {
            console.log("User not found:", userId);
            return res.status(404).json({ error: "User not found" });
        }
        
        // Get profile details
        const profileDetails = await ProfileDetails.findOne({ userId: userIdObj });
        console.log("Profile details found:", profileDetails);
        
        // Format response for frontend
        const response = {
            user: {
                fullName: profileDetails ? `${profileDetails.firstName || ''} ${profileDetails.lastName || ''}`.trim() : user.fullName || '',
                email: user.email,
                username: user.username,
                avatar: profileDetails?.profilePicture || null
            },
            personalInfo: {
                phone: profileDetails?.mobileNumber || '',
                location: profileDetails?.location || '',
                bio: profileDetails?.bio || ''
            },
            completion: {
                percentage: profileDetails?.profileCompletionPercentage || 0
            }
        };
        
        console.log("Sending response:", response);
        res.json(response);
    } catch (error) {
        console.error("Error in GET /api/users/:userId/profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/users/:userId/profile", async (req, res) => {
    console.log("=== PROFILE UPDATE ENDPOINT HIT ===");
    console.log("User ID:", req.params.userId);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    try {
        const { userId } = req.params;
        const { user, personalInfo } = req.body;
        
        console.log("Validating user ID:", userId);
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log("Invalid user ID format");
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        console.log("Converting to ObjectId:", userIdObj);
        
        // Update user basic info if provided
        if (user) {
            console.log("Updating User collection with:", user);
            await User.findByIdAndUpdate(userIdObj, {
                fullName: user.fullName,
                email: user.email,
                username: user.username
            });
            console.log("User collection updated");
        }
        
        // Update profile details
        const updateData = {};
        if (user?.fullName) {
            const nameParts = user.fullName.split(' ');
            updateData.firstName = nameParts[0] || '';
            updateData.lastName = nameParts.slice(1).join(' ') || '';
        }
        if (personalInfo?.phone) updateData.mobileNumber = personalInfo.phone;
        if (personalInfo?.location) updateData.location = personalInfo.location;
        if (personalInfo?.bio) updateData.bio = personalInfo.bio;
        
        console.log("Updating ProfileDetails with:", updateData);
        const profileDetails = await ProfileDetails.findOneAndUpdate(
            { userId: userIdObj },
            updateData,
            { new: true, upsert: true }
        );
        console.log("ProfileDetails update result:", profileDetails);
        
        // Return updated profile data
        console.log("Fetching updated user data...");
        const updatedUser = await User.findById(userIdObj);
        const response = {
            user: {
                fullName: `${profileDetails.firstName || ''} ${profileDetails.lastName || ''}`.trim(),
                email: updatedUser.email,
                username: updatedUser.username,
                avatar: profileDetails.profilePicture || null
            },
            personalInfo: {
                phone: profileDetails.mobileNumber || '',
                location: profileDetails.location || '',
                bio: profileDetails.bio || ''
            },
            completion: {
                percentage: profileDetails.profileCompletionPercentage || 0
            }
        };
        
        console.log("Sending response:", JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error("Error saving user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Change password endpoint
app.put("/api/users/:userId/change-password", async (req, res) => {
    console.log("=== CHANGE PASSWORD ENDPOINT HIT ===");
    console.log("User ID:", req.params.userId);
    
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: "Both current password and new password are required" 
            });
        }
        
        // Find the user
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        // Validate new password requirements
        if (newPassword.length < 8) {
            return res.status(400).json({ 
                message: "New password must be at least 8 characters long" 
            });
        }
        
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ 
                message: "New password must include at least one uppercase letter" 
            });
        }
        
        if (!/\d/.test(newPassword)) {
            return res.status(400).json({ 
                message: "New password must include at least one number" 
            });
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            return res.status(400).json({ 
                message: "New password must include at least one special character" 
            });
        }
        
        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password
        await User.findByIdAndUpdate(req.params.userId, { 
            password: hashedNewPassword 
        });
        
        console.log("Password updated successfully for user:", req.params.userId);
        res.json({ message: "Password updated successfully" });
        
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/users/:userId/avatar", upload.single('avatar'), async (req, res) => {
    console.log("=== AVATAR UPLOAD ENDPOINT HIT ===");
    console.log("User ID:", req.params.userId);
    console.log("File uploaded:", req.file ? req.file.filename : "No file");
    
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log("Invalid user ID format:", userId);
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        if (!req.file) {
            console.log("No file was uploaded");
            return res.status(400).json({ error: "No file uploaded" });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const filename = `${userId}_profile.jpg`;
        
        console.log("Updating ProfileDetails with filename:", filename);
        
        // Update profile details with new avatar filename
        const result = await ProfileDetails.findOneAndUpdate(
            { userId: userIdObj },
            { profilePicture: filename },
            { upsert: true, new: true }
        );
        
        console.log("ProfileDetails update result:", result);
        
        res.json({ 
            message: "Avatar updated successfully",
            avatarUrl: `/uploads/profile_pictures/${filename}`
        });
        
        console.log("Avatar upload completed successfully");
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Profile Details API Routes
app.get("/api/profile-details/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const profileDetails = await ProfileDetails.findOne({ userId: userIdObj });
        
        if (!profileDetails) {
            return res.status(404).json({ error: "Profile details not found" });
        }
        
        res.json(profileDetails);
    } catch (error) {
        console.error("Error fetching profile details:", error);
        res.status(500).json({ error: error.message });
    }
});

app.put("/api/profile-details/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const userIdObj = new mongoose.Types.ObjectId(userId);
        const updateData = req.body;
        
        const profileDetails = await ProfileDetails.findOneAndUpdate(
            { userId: userIdObj },
            updateData,
            { new: true, upsert: true }
        );
        
        res.json(profileDetails);
    } catch (error) {
        console.error("Error saving profile details:", error);
        res.status(500).json({ error: error.message });
    }
});


// Template Routes
app.post("/api/templates", upload.fields([{ name: "previewImage", maxCount: 1 }, { name: "htmlFile", maxCount: 1 }]), async (req, res) => {
    console.log("--- Template Upload Attempt ---");
    console.log("req.files:", req.files);
    console.log("req.files.htmlFile:", req.files.htmlFile);
    
    // Check if htmlFile exists and has elements before trying to access [0]
    if (req.files.htmlFile && req.files.htmlFile.length > 0) {
        console.log("req.files.htmlFile[0]:", req.files.htmlFile[0]);
        console.log("req.files.htmlFile[0].path:", req.files.htmlFile[0].path);
    } else {
        console.log("htmlFile not found in req.files or is empty.");
    }
    try {
        const { name, description, features, category, industry, rating } = req.body;
        let htmlContent = "";
        if (req.files.htmlFile && req.files.htmlFile.length > 0) {
            const filePath = req.files.htmlFile[0].path; // Get the path where Multer saved the file
            htmlContent = fs.readFileSync(filePath, "utf8"); // Read the file content
            // Optional: fs.unlinkSync(filePath); // Uncomment if you want to delete the temp file after reading
        }       
        const previewImagePath = req.files.previewImage ? `/uploads/${req.files.previewImage[0].filename}` : "";

        // Ensure features is an array, even if a single string is provided
        const featuresArray = Array.isArray(features) ? features : (features ? features.split(",").map(f => f.trim()) : []);

        const newTemplate = new Template({
            name,
            description,
            features: featuresArray,
            category,
            industry,
            rating: parseFloat(rating),
            previewImagePath,
            htmlContent,
        });

        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error("Error adding template:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/templates", async (req, res) => {
    try {
        const templates = await Template.find({});
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/templates/stats", async (req, res) => {
    try {
        const totalTemplates = await Template.countDocuments();
        const totalDownloads = await Template.aggregate([
            { $group: { _id: null, total: { $sum: "$downloads" } } }
        ]);
        res.json({ totalTemplates, totalDownloads: totalDownloads[0] ? totalDownloads[0].total : 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/templates/:id", async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        
        console.log(`Template requested: ${template.name} (ID: ${req.params.id})`);
        
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a template by ID - Handle both form-data and JSON
app.put("/api/templates/:id", (req, res, next) => {
    // Check if request is form-data (with files) or JSON
    const contentType = req.headers['content-type'];
    
    if (contentType && contentType.includes('multipart/form-data')) {
        // Use multer for form-data requests
        upload.fields([{ name: "previewImage", maxCount: 1 }, { name: "htmlFile", maxCount: 1 }])(req, res, next);
    } else {
        // Skip multer for JSON requests
        next();
    }
}, async (req, res) => {
    console.log("PUT /api/templates/:id called");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    
    try {
        const { name, description, features, category, industry, rating } = req.body;
        const updateData = {};

        // Only add fields that are provided and valid
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (industry !== undefined) updateData.industry = industry;
        if (rating !== undefined && !isNaN(parseFloat(rating))) {
            updateData.rating = parseFloat(rating);
        }
        
        console.log("Update data:", updateData);

        if (features) {
            updateData.features = Array.isArray(features) ? features : features.split(",").map(f => f.trim());
        }

        // Handle file updates only if req.files exists
        if (req.files) {
            if (req.files.htmlFile && req.files.htmlFile[0]) {
                const filePath = req.files.htmlFile[0].path;
                updateData.htmlContent = fs.readFileSync(filePath, "utf8");
                // Clean up the temporary file after reading
                fs.unlinkSync(filePath);
            }
            if (req.files.previewImage && req.files.previewImage[0]) {
                updateData.previewImagePath = `/uploads/${req.files.previewImage[0].filename}`;
            }
        }

        const updatedTemplate = await Template.findById(req.params.id);
        if (!updatedTemplate) {
            return res.status(404).json({ error: "Template not found" });
        }

        // Update only the provided fields
        Object.keys(updateData).forEach(key => {
            updatedTemplate[key] = updateData[key];
        });

        await updatedTemplate.save();
        res.json(updatedTemplate);
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/templates/:id/download", async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        template.downloads += 1;
        await template.save();
        res.json({ downloads: template.downloads });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Delete a template by ID
app.delete("/api/templates/:id", async (req, res) => {
    try {
        const deletedTemplate = await Template.findByIdAndDelete(req.params.id);
        if (!deletedTemplate) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Favorites Routes
app.post("/api/favorites", async (req, res) => {
    try {
        const { userId, templateId } = req.body;

        if (!userId || !templateId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Template ID are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or template ID format'
            });
        }

        // Check if template exists
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({ userId, templateId });
        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Template already in favorites'
            });
        }

        const favorite = new Favorite({ userId, templateId });
        await favorite.save();

        res.status(201).json({
            success: true,
            message: 'Template added to favorites',
            data: favorite
        });

    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add template to favorites',
            error: error.message
        });
    }
});

app.delete("/api/favorites", async (req, res) => {
    try {
        const { userId, templateId } = req.body;

        if (!userId || !templateId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Template ID are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or template ID format'
            });
        }

        const deletedFavorite = await Favorite.findOneAndDelete({ userId, templateId });
        
        if (!deletedFavorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.json({
            success: true,
            message: 'Template removed from favorites'
        });

    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove template from favorites',
            error: error.message
        });
    }
});

app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const favorites = await Favorite.find({ userId })
            .populate('templateId')
            .sort({ dateAdded: -1 });

        // Filter out favorites where template was deleted
        const validFavorites = favorites.filter(fav => fav.templateId);

        res.json({
            success: true,
            data: validFavorites
        });

    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch favorites',
            error: error.message
        });
    }
});

app.get("/api/favorites/check/:userId/:templateId", async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or template ID format'
            });
        }

        const favorite = await Favorite.findOne({ userId, templateId });

        res.json({
            success: true,
            isFavorite: !!favorite
        });

    } catch (error) {
        console.error('Error checking favorite status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check favorite status',
            error: error.message
        });
    }
});

// POST /api/saved-templates - Save template for user
app.post('/api/saved-templates', async (req, res) => {
    try {
        const { userId, templateId } = req.body;
        
        // Check if already saved
        const existingSave = await SavedTemplate.findOne({ userId, templateId });
        
        if (existingSave) {
            // Update existing save timestamp only
            existingSave.savedAt = new Date();
            await existingSave.save();
            res.json({ message: 'Template save updated', savedTemplate: existingSave });
        } else {
            // Create new save without customizations
            const savedTemplate = new SavedTemplate({
                userId,
                templateId,
                savedAt: new Date()
            });
            
            await savedTemplate.save();
            res.json({ message: 'Template saved successfully', savedTemplate });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/user-templates - Save a new user template
app.post('/api/user-templates', async (req, res) => {
    try {
        const {
            userId,
            originalTemplateId,
            name,
            description,
            htmlContent,
            customizations,
            originalTemplate
        } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!originalTemplateId) {
            return res.status(400).json({ message: 'Original template ID is required' });
        }

        if (!name || name.trim().length < 3) {
            return res.status(400).json({ message: 'Template name must be at least 3 characters long' });
        }

        if (name.trim().length > 100) {
            return res.status(400).json({ message: 'Template name must be less than 100 characters' });
        }

        if (!htmlContent) {
            return res.status(400).json({ message: 'Template content is required' });
        }

        // Check if user already has a template with this name
        const existingTemplate = await UserTemplate.findOne({
            userId: userId,
            name: name.trim()
        });

        if (existingTemplate) {
            return res.status(409).json({ 
                message: 'You already have a template with this name. Please choose a different name.' 
            });
        }

        // Verify the original template exists
        const originalTemplateExists = await Template.findById(originalTemplateId);
        if (!originalTemplateExists) {
            return res.status(404).json({ message: 'Original template not found' });
        }

        // Sanitize HTML content (basic sanitization - you may want to use a library like DOMPurify)
        const sanitizedHtmlContent = sanitizeHtmlContent(htmlContent);

        // Create new user template
        const userTemplate = new UserTemplate({
            userId: userId,
            originalTemplateId: originalTemplateId,
            name: name.trim(),
            description: description ? description.trim() : '',
            htmlContent: sanitizedHtmlContent,
            originalTemplate: {
                name: originalTemplate?.name || originalTemplateExists.name,
                category: originalTemplate?.category || originalTemplateExists.category,
                industry: originalTemplate?.industry || originalTemplateExists.industry || 'All Industries'
            }
        });

        await userTemplate.save();

        // Return success response
        res.status(201).json({
            message: 'Template saved successfully',
            template: {
                id: userTemplate._id,
                name: userTemplate.name,
                description: userTemplate.description,
                createdAt: userTemplate.createdAt
            }
        });

    } catch (error) {
        console.error('Error saving user template:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: validationErrors 
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({ 
                message: 'You already have a template with this name. Please choose a different name.' 
            });
        }

        res.status(500).json({ 
            message: 'Internal server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
        });
    }
});

// Helper function to sanitize HTML content
function sanitizeHtmlContent(htmlContent) {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    // In production, consider using a proper HTML sanitization library
    
    let sanitized = htmlContent
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove javascript: protocols
        .replace(/javascript:/gi, '')
        // Remove on* event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove dangerous attributes
        .replace(/\s*(src|href)\s*=\s*["']javascript:[^"']*["']/gi, '');
    
    return sanitized;
}

// GET /api/user-templates/:userId - Get all templates for a user
app.get('/api/user-templates/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const templates = await UserTemplate.find({ userId })
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-htmlContent'); // Exclude HTML content for list view

        const total = await UserTemplate.countDocuments({ userId });

        res.json({
            templates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching user templates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/user-templates/:userId/:templateId/populated - Get template with user data populated (MUST BE BEFORE basic route)
app.get('/api/user-templates/:userId/:templateId/populated', async (req, res) => {
    console.log('🔍 Populated endpoint called with params:', req.params);
    
    try {
        const { userId, templateId } = req.params;
        console.log('📥 Request params - userId:', userId, 'templateId:', templateId);

        // Get the user template
        const template = await UserTemplate.findOne({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            console.log('❌ Template not found for userId:', userId, 'templateId:', templateId);
            return res.status(404).json({ message: 'Template not found' });
        }

        console.log('✅ Template found:', template.name);
        console.log('🔍 TEMPLATE DEBUG:');
        console.log('  - Template ID:', template._id);
        console.log('  - Template Name:', template.name);
        console.log('  - Template Rating:', template.rating);
        console.log('  - Template Category:', template.category);
        console.log('  - Template Created At:', template.createdAt);
        console.log('  - Template User ID:', template.userId);

        // Get user data
        const userData = await getUserCompleteResumeData(userId);
        
        if (!userData) {
            console.log('❌ User data not found for userId:', userId);
            return res.status(404).json({ message: 'User data not found' });
        }

        console.log('✅ User data found');
        console.log('🔍 USER DATA DEBUG:');
        console.log('  - Name:', userData.personalInfo?.firstName, userData.personalInfo?.lastName);
        console.log('  - Email:', userData.personalInfo?.email);
        console.log('  - Phone:', userData.personalInfo?.phone);
        console.log('  - Skills count:', userData.skills?.technical?.length || 0);
        console.log('  - Experience count:', userData.experience?.length || 0);
        console.log('  - Education count:', userData.education?.length || 0);
        console.log('  - Projects count:', userData.projects?.length || 0);
        console.log('  - Certifications count:', userData.certifications?.length || 0);
        console.log('  - Resume Headline:', userData.resumeHeadline);
        console.log('  - Profile Photo:', userData.personalInfo?.photo);
        console.log('  - LinkedIn URL:', userData.contactInfo?.linkedin);
        console.log('  - GitHub URL:', userData.contactInfo?.github);

        // Populate template with user data
        let populatedHTML = template.htmlContent;
        if (userData) {
            populatedHTML = populateTemplateWithUserData(template.htmlContent, userData);
            console.log('✅ Template populated with actual user data');
        } else {
            console.log('⚠️ Using template without user data');
        }

        res.json({
            success: true,
            template: template,
            userData: userData,
            populatedHTML: populatedHTML
        });

    } catch (error) {
        console.error('❌ Error getting populated template:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// GET /api/user-templates/:userId/:templateId - Get a specific user template
app.get('/api/user-templates/:userId/:templateId', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        const template = await UserTemplate.findOne({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json(template);

    } catch (error) {
        console.error('Error fetching user template:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/user-templates/:userId/:templateId - Update a user template
app.put('/api/user-templates/:userId/:templateId', async (req, res) => {
    try {
        const { userId, templateId } = req.params;
        const { name, description, htmlContent, customizations } = req.body;

        const template = await UserTemplate.findOne({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Validate name if provided
        if (name !== undefined) {
            if (!name || name.trim().length < 3) {
                return res.status(400).json({ message: 'Template name must be at least 3 characters long' });
            }

            if (name.trim().length > 100) {
                return res.status(400).json({ message: 'Template name must be less than 100 characters' });
            }

            // Check for name conflicts (excluding current template)
            const existingTemplate = await UserTemplate.findOne({
                userId: userId,
                name: name.trim(),
                _id: { $ne: templateId }
            });

            if (existingTemplate) {
                return res.status(409).json({ 
                    message: 'You already have a template with this name. Please choose a different name.' 
                });
            }

            template.name = name.trim();
        }

        // Update other fields if provided
        if (description !== undefined) {
            template.description = description.trim();
        }

        if (htmlContent !== undefined) {
            template.htmlContent = sanitizeHtmlContent(htmlContent);
        }

        // Customizations are no longer stored - removed customization update logic

        await template.save();

        res.json({
            message: 'Template updated successfully',
            template: {
                id: template._id,
                name: template.name,
                description: template.description,
                updatedAt: template.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating user template:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: validationErrors 
            });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/user-templates/:userId/:templateId - Delete a user template
app.delete('/api/user-templates/:userId/:templateId', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        const template = await UserTemplate.findOneAndDelete({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ message: 'Template deleted successfully' });

    } catch (error) {
        console.error('Error deleting user template:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/user-templates/:userId/:templateId/download - Track download
app.post('/api/user-templates/:userId/:templateId/download', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        const template = await UserTemplate.findOneAndUpdate(
            { _id: templateId, userId: userId },
            { $inc: { downloads: 1 } },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ 
            message: 'Download count updated', 
            downloads: template.downloads 
        });

    } catch (error) {
        console.error('Error updating download count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/templates/download', async (req, res) => {
    console.log('Download request received:', req.body);
    
    try {
        const { templateId, format, customizations, templateData, userId } = req.body;
        
        // Validate required fields
        if (!templateId || !format || !templateData) {
            console.error('Missing required fields:', { templateId, format, templateData: !!templateData });
            return res.status(400).json({ 
                message: 'Missing required fields: templateId, format, and templateData' 
            });
        }
        
        // Validate format
        if (!['pdf', 'word'].includes(format)) {
            console.error('Invalid format:', format);
            return res.status(400).json({ 
                message: 'Invalid format. Must be either "pdf" or "word"' 
            });
        }
        
        console.log(`Generating ${format} for template ${templateId}`);
        
        // For Word documents, fetch user data if userId is provided
        if (format === 'word' && userId) {
            try {
                const userData = await getUserCompleteResumeData(userId);
                console.log('User data fetched for Word generation:', JSON.stringify(userData, null, 2).substring(0, 500) + '...');
                console.log('Template name being used:', templateData.name);
                console.log('User name from data:', userData.personalInfo?.firstName, userData.personalInfo?.lastName);
                templateData.userData = userData;
            } catch (error) {
                console.error('Error fetching user data for Word generation:', error);
                // Continue without user data if fetch fails
                templateData.userData = {};
            }
        } else if (format === 'word') {
            console.log('No userId provided for Word generation - will generate empty template');
            templateData.userData = {};
        }
        
        let fileBuffer;
        let contentType;
        let fileExtension;
        
        if (format === 'pdf') {
            fileBuffer = await generateSimplePDF(templateData, customizations);
            contentType = 'application/pdf';
            fileExtension = '.pdf';
        } else if (format === 'word') {
            fileBuffer = await generateSimpleWordDocument(templateData, customizations);
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fileExtension = '.docx';
        }
        
        // Validate file buffer
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error(`Generated ${format} file is empty`);
        }
        
        // Set response headers
        const fileName = `${templateData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template${fileExtension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        
        console.log(`Successfully generated ${format} file: ${fileName} (${fileBuffer.length} bytes)`);
        
        // Send file
        res.send(fileBuffer);
        
    } catch (error) {
        console.error('Download error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        res.status(500).json({ 
            message: 'Failed to generate download file',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Simplified PDF generation using Puppeteer
 */
/**
 * Convert images to base64 for PDF generation
 */
async function convertImagesToBase64(htmlContent) {
    const fs = require('fs');
    const path = require('path');
    
    try {
        // Match image tags with src attributes
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let updatedContent = htmlContent;
        let match;
        
        while ((match = imgRegex.exec(htmlContent)) !== null) {
            const fullImgTag = match[0];
            const imagePath = match[1];
            
            try {
                let absolutePath;
                
                // Handle different image path formats
                if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                    // Skip external URLs
                    continue;
                } else if (imagePath.startsWith('/uploads/profile_pictures/')) {
                    // Profile pictures
                    absolutePath = path.join(__dirname, 'public', imagePath);
                } else if (imagePath.startsWith('/images/')) {
                    // General images
                    absolutePath = path.join(__dirname, 'public', imagePath);
                } else if (imagePath.startsWith('./') || imagePath.startsWith('../')) {
                    // Relative paths
                    absolutePath = path.resolve(__dirname, 'public', imagePath);
                } else {
                    // Default to images folder
                    absolutePath = path.join(__dirname, 'public/images', imagePath);
                }
                
                console.log('Attempting to convert image:', imagePath, 'to:', absolutePath);
                
                // Check if file exists
                if (fs.existsSync(absolutePath)) {
                    // Read file and convert to base64
                    const imageBuffer = fs.readFileSync(absolutePath);
                    const extension = path.extname(absolutePath).toLowerCase();
                    
                    // Determine MIME type
                    let mimeType = 'image/jpeg'; // default
                    if (extension === '.png') mimeType = 'image/png';
                    else if (extension === '.gif') mimeType = 'image/gif';
                    else if (extension === '.webp') mimeType = 'image/webp';
                    else if (extension === '.svg') mimeType = 'image/svg+xml';
                    
                    const base64Data = imageBuffer.toString('base64');
                    const dataUrl = `data:${mimeType};base64,${base64Data}`;
                    
                    // Replace the src attribute in the image tag
                    const updatedImgTag = fullImgTag.replace(/src=["'][^"']+["']/, `src="${dataUrl}"`);
                    updatedContent = updatedContent.replace(fullImgTag, updatedImgTag);
                    
                    console.log('Successfully converted image to base64:', imagePath);
                } else {
                    console.warn('Image file not found:', absolutePath);
                    // Try default avatar if it's a profile picture
                    if (imagePath.includes('profile') || imagePath.includes('avatar')) {
                        const defaultAvatarPath = path.join(__dirname, 'public/images/default-avatar.png');
                        if (fs.existsSync(defaultAvatarPath)) {
                            const imageBuffer = fs.readFileSync(defaultAvatarPath);
                            const base64Data = imageBuffer.toString('base64');
                            const dataUrl = `data:image/png;base64,${base64Data}`;
                            const updatedImgTag = fullImgTag.replace(/src=["'][^"']+["']/, `src="${dataUrl}"`);
                            updatedContent = updatedContent.replace(fullImgTag, updatedImgTag);
                            console.log('Used default avatar for missing profile picture');
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing image:', imagePath, error);
            }
        }
        
        return updatedContent;
        
    } catch (error) {
        console.error('Error converting images to base64:', error);
        return htmlContent; // Return original content if conversion fails
    }
}

async function generateSimplePDF(templateData, customizations) {
    console.log('Starting PDF generation...');
    
    try {
        const puppeteer = require('puppeteer');
        const path = require('path');
        const fs = require('fs');
        
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 2000 });
        
        // Create clean HTML content
        let htmlContent = templateData.htmlContent || '<html><body><h1>Resume Template</h1><p>Content not available</p></body></html>';
        
        // Convert relative image paths to absolute paths for PDF generation
        htmlContent = await convertImagesToBase64(htmlContent);
        
        // Apply basic customizations
        htmlContent = applyBasicCustomizations(htmlContent, customizations);
        
        // Add PDF-specific styles - minimal override approach
        const pdfStyles = `
            <style>
                /* Remove all margins and make template fill the page */
                @page { 
                    margin: 0 !important; 
                    size: A4;
                }
                
                /* Critical PDF fixes only - don't override template styles completely */
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: 100vh !important;
                        overflow: hidden !important;
                    }
                    
                    .resume-container {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: 100vh !important;
                        max-width: none !important;
                        min-height: 100vh !important;
                        display: block !important;
                        overflow: hidden !important;
                    }
                    
                    /* Ensure sidebar stays properly positioned and sized */
                    .sidebar {
                        float: left !important;
                        width: 240px !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 20px 15px !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Ensure profile summary text doesn't get cut off */
                    .profile-summary {
                        width: 100% !important;
                        max-width: 100% !important;
                        word-wrap: break-word !important;
                        overflow-wrap: break-word !important;
                        hyphens: auto !important;
                        text-overflow: clip !important;
                        white-space: normal !important;
                        overflow: visible !important;
                        page-break-inside: avoid !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                        padding: 15px !important;
                        border-radius: 5px !important;
                        background: #f7fafc !important;
                        border-left: 4px solid #3182ce !important;
                    }
                    
                    /* Ensure main content doesn't overflow and has proper width constraints */
                    .main-content {
                        overflow: visible !important;
                        max-width: none !important;
                        width: auto !important;
                        margin-left: 240px !important;
                        padding: 20px !important;
                        box-sizing: border-box !important;
                        height: 100vh !important;
                    }
                    
                    /* Image handling for PDF - better positioning and containment */
                    .profile-photo {
                        width: 130px !important;
                        height: 130px !important;
                        border-radius: 50% !important;
                        overflow: hidden !important;
                        margin: 10px auto !important;
                        display: block !important;
                        position: relative !important;
                        border: 4px solid white !important;
                        box-sizing: border-box !important;
                    }
                    
                    .profile-photo img {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: cover !important;
                        object-position: center 35% !important;
                        border-radius: 0 !important; /* Remove border-radius from img, let container handle it */
                        border: none !important;
                        display: block !important;
                        margin: 0 !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                    }
                    
                    /* Prevent any content from being clipped */
                    * {
                        text-overflow: clip !important;
                        overflow: visible !important;
                    }
                    
                    /* Clear floats properly */
                    .main-content::after {
                        content: "";
                        display: table;
                        clear: both;
                    }
                    
                    /* Adjust font sizes slightly for full page layout */
                    .name {
                        font-size: 20px !important;
                    }
                    
                    .main-heading {
                        font-size: 18px !important;
                    }
                    
                    .sidebar-heading {
                        font-size: 13px !important;
                    }
                }
            </style>
        `;
        
        // Ensure proper HTML structure
        if (!htmlContent.includes('<html>')) {
            htmlContent = `<html><head>${pdfStyles}</head><body>${htmlContent}</body></html>`;
        } else {
            htmlContent = htmlContent.replace('</head>', pdfStyles + '</head>');
        }
        
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Add extra wait time for content to fully render
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Debug: Log if profile summary exists in the content
        const profileSummaryExists = await page.evaluate(() => {
            const profileSummary = document.querySelector('.profile-summary');
            if (profileSummary) {
                console.log('Profile summary found with content length:', profileSummary.textContent.length);
                console.log('Profile summary styles:', window.getComputedStyle(profileSummary).width);
                return {
                    exists: true,
                    content: profileSummary.textContent.substring(0, 100) + '...',
                    width: window.getComputedStyle(profileSummary).width,
                    maxWidth: window.getComputedStyle(profileSummary).maxWidth
                };
            }
            return { exists: false };
        });
        console.log('Profile summary debug info:', profileSummaryExists);
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            margin: {
                top: '0mm',
                right: '0mm', 
                bottom: '0mm',
                left: '0mm'
            },
            width: '210mm',  // A4 width
            height: '297mm'  // A4 height
        });
        
        await browser.close();
        
        console.log('PDF generation completed successfully');
        return pdfBuffer;
        
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error('Failed to generate PDF: ' + error.message);
    }
}

/**
 * Enhanced Word document generation matching PDF layout
 */
async function generateSimpleWordDocument(templateData, customizations) {
    console.log('Starting Word document generation...');
    console.log('Template data received:', {
        name: templateData.name,
        hasUserData: !!templateData.userData,
        userDataKeys: templateData.userData ? Object.keys(templateData.userData) : 'No user data'
    });
    
    try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = require('docx');
        
        // Get the populated user data from templateData
        const userData = templateData.userData || {};
        
        console.log('Word generation - User data structure:', JSON.stringify(userData, null, 2).substring(0, 1000) + '...');
        console.log('Personal info check:', userData.personalInfo);
        console.log('Contact info check:', userData.contactInfo);
        
        // If no user data, create a simple document with template name
        if (!userData || Object.keys(userData).length === 0) {
            console.log('No user data available, creating template name only document');
            const elements = [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: templateData.name || 'Resume Template',
                            bold: true,
                            size: 32,
                            color: '2d3748'
                        })
                    ],
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'No user data available. Please ensure you are logged in and have completed your profile.',
                            size: 24,
                            color: '666666'
                        })
                    ]
                })
            ];
            
            const doc = new Document({
                sections: [{
                    children: elements
                }]
            });
            
            const buffer = await Packer.toBuffer(doc);
            return buffer;
        }
        
        const elements = [];
        
        // Add fallback data if user data is missing key fields
        if (!userData.personalInfo || (!userData.personalInfo.firstName && !userData.personalInfo.lastName)) {
            console.log('Adding fallback personal info data');
            userData.personalInfo = {
                firstName: 'Your',
                lastName: 'Name',
                email: 'your.email@example.com',
                phone: 'Your Phone Number',
                ...userData.personalInfo
            };
            userData.contactInfo = {
                email: 'your.email@example.com',
                phone: 'Your Phone Number',
                address: 'Your Address',
                ...userData.contactInfo
            };
            userData.summary = userData.summary || 'Please add your professional summary in your profile.';
        }
        
        console.log('Final user data for Word generation:', {
            name: `${userData.personalInfo?.firstName} ${userData.personalInfo?.lastName}`,
            hasExperience: !!(userData.experience && userData.experience.length > 0),
            hasEducation: !!(userData.education && userData.education.length > 0),
            hasProjects: !!(userData.projects && userData.projects.length > 0)
        });
        
        // Create a table to simulate the two-column layout (sidebar + main content)
        const resumeTable = new Table({
            rows: [
                new TableRow({
                    children: [
                        // Left column (Sidebar) - 30% width
                        new TableCell({
                            children: await createSidebarContent(userData),
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { type: ShadingType.SOLID, color: "4a5568" },
                            margins: { top: 400, bottom: 400, left: 300, right: 300 },
                            verticalAlign: "top"
                        }),
                        // Right column (Main content) - 70% width  
                        new TableCell({
                            children: await createMainContent(userData),
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            shading: { type: ShadingType.SOLID, color: "ffffff" },
                            margins: { top: 400, bottom: 400, left: 400, right: 400 },
                            verticalAlign: "top"
                        })
                    ],
                    cantSplit: true
                })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            }
        });
        
        elements.push(resumeTable);
        
        // Create document with minimal margins for full-page layout
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 360,    // 0.25 inch
                            right: 360,
                            bottom: 360,
                            left: 360
                        }
                    }
                },
                children: elements
            }]
        });
        
        // Generate buffer
        const buffer = await Packer.toBuffer(doc);
        
        console.log('Word document generation completed successfully');
        return buffer;
        
    } catch (error) {
        console.error('Word document generation error:', error);
        throw new Error('Failed to generate Word document: ' + error.message);
    }
}

/**
 * Create sidebar content for Word document
 */
async function createSidebarContent(userData) {
    const { Paragraph, TextRun, AlignmentType } = require('docx');
    const elements = [];
    
    // Name and title
    if (userData.personalInfo) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${userData.personalInfo.firstName || ''} ${userData.personalInfo.lastName || ''}`.trim(),
                        bold: true,
                        size: 28,
                        color: 'ffffff',
                        allCaps: true
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            })
        );
    }
    
    // Resume headline
    if (userData.resumeHeadline) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: userData.resumeHeadline,
                        size: 20,
                        color: 'a0aec0',
                        italics: true
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            })
        );
    }
    
    // Contact section
    elements.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'CONTACT',
                    bold: true,
                    size: 22,
                    color: 'e2e8f0',
                    allCaps: true
                })
            ],
            spacing: { before: 200, after: 150 }
        })
    );
    
    if (userData.contactInfo) {
        if (userData.contactInfo.email) {
            elements.push(createContactItem('Email:', userData.contactInfo.email));
        }
        if (userData.contactInfo.phone) {
            elements.push(createContactItem('Phone:', userData.contactInfo.phone));
        }
        if (userData.contactInfo.address) {
            elements.push(createContactItem('Location:', userData.contactInfo.address));
        }
        if (userData.contactInfo.linkedin) {
            elements.push(createContactItem('LinkedIn:', userData.contactInfo.linkedin));
        }
        if (userData.contactInfo.github) {
            elements.push(createContactItem('GitHub:', userData.contactInfo.github));
        }
    }
    
    // Education section
    if (userData.education && userData.education.length > 0) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'EDUCATION',
                        bold: true,
                        size: 22,
                        color: 'e2e8f0',
                        allCaps: true
                    })
                ],
                spacing: { before: 300, after: 150 }
            })
        );
        
        userData.education.forEach(edu => {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${edu.degree} from ${edu.institution} - ${edu.field}`,
                            bold: true,
                            size: 20,
                            color: 'ffffff'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
            
            const details = [];
            if (edu.startYear) details.push(edu.startYear);
            if (edu.endYear) details.push(edu.endYear);
            if (edu.gpa) details.push(`CGPA: ${edu.gpa}`);
            
            if (details.length > 0) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: details.join(' - '),
                                size: 18,
                                color: 'a0aec0'
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
            }
        });
    }
    
    // Skills section
    if (userData.skillsByCategory && userData.skillsByCategory.length > 0) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'SKILLS',
                        bold: true,
                        size: 22,
                        color: 'e2e8f0',
                        allCaps: true
                    })
                ],
                spacing: { before: 300, after: 150 }
            })
        );
        
        userData.skillsByCategory.forEach(skillCategory => {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: skillCategory.category,
                            bold: true,
                            size: 20,
                            color: 'ffffff'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
            
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: skillCategory.skills.join(', '),
                            size: 18,
                            color: 'cbd5e0'
                        })
                    ],
                    spacing: { after: 200 }
                })
            );
        });
    }
    
    // Languages section
    if (userData.languages && userData.languages.length > 0) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'LANGUAGES',
                        bold: true,
                        size: 22,
                        color: 'e2e8f0',
                        allCaps: true
                    })
                ],
                spacing: { before: 300, after: 150 }
            })
        );
        
        userData.languages.forEach(lang => {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${lang.name} - ${lang.proficiency}`,
                            bold: true,
                            size: 20,
                            color: 'ffffff'
                        })
                    ],
                    spacing: { after: 150 }
                })
            );
        });
    }
    
    // Certifications section
    if (userData.certifications && userData.certifications.length > 0) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'CERTIFICATIONS',
                        bold: true,
                        size: 22,
                        color: 'e2e8f0',
                        allCaps: true
                    })
                ],
                spacing: { before: 300, after: 150 }
            })
        );
        
        userData.certifications.forEach(cert => {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: cert.name,
                            bold: true,
                            size: 18,
                            color: 'ffffff'
                        })
                    ],
                    spacing: { after: 50 }
                })
            );
            
            if (cert.organization || cert.issueDate) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${cert.organization || ''} ${cert.issueDate ? `(${cert.issueDate})` : ''}`.trim(),
                                size: 16,
                                color: 'a0aec0',
                                italics: true
                            })
                        ],
                        spacing: { after: 150 }
                    })
                );
            }
        });
    }
    
    return elements;
}

/**
 * Create main content for Word document
 */
async function createMainContent(userData) {
    const { Paragraph, TextRun, AlignmentType } = require('docx');
    const elements = [];
    
    // Profile section
    if (userData.summary) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'PROFILE',
                        bold: true,
                        size: 26,
                        color: '2d3748',
                        allCaps: true
                    })
                ],
                spacing: { after: 200 }
            })
        );
        
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: userData.summary,
                        size: 22,
                        color: '4a5568'
                    })
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 }
            })
        );
    }
    
    // Work Experience section
    if (userData.experience && userData.experience.length > 0) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'WORK EXPERIENCE',
                        bold: true,
                        size: 26,
                        color: '2d3748',
                        allCaps: true
                    })
                ],
                spacing: { after: 200 }
            })
        );
        
        userData.experience.forEach(exp => {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: exp.jobTitle,
                            bold: true,
                            size: 24,
                            color: '2d3748'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
            
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: exp.company,
                            size: 22,
                            color: '3182ce',
                            italics: true
                        })
                    ],
                    spacing: { after: 80 }
                })
            );
            
            const period = `${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ''}${exp.location ? ` | ${exp.location}` : ''}`;
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: period,
                            size: 20,
                            color: '718096'
                        })
                    ],
                    spacing: { after: 150 }
                })
            );
            
            if (exp.description) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: exp.description,
                                size: 20,
                                color: '4a5568'
                            })
                        ],
                        spacing: { after: 150 }
                    })
                );
            }
            
            if (exp.skills && exp.skills.length > 0) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Technologies: ${exp.skills.join(', ')}`,
                                size: 18,
                                color: '718096',
                                italics: true
                            })
                        ],
                        spacing: { after: 300 }
                    })
                );
            }
        });
    }
    
    // Projects section
    if (userData.projects && userData.projects.length > 0) {
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'KEY PROJECTS',
                        bold: true,
                        size: 26,
                        color: '2d3748',
                        allCaps: true
                    })
                ],
                spacing: { before: 200, after: 200 }
            })
        );
        
        userData.projects.forEach(project => {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: project.title,
                            bold: true,
                            size: 22,
                            color: '2d3748'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
            
            const period = `${project.startDate}${project.endDate ? ` – ${project.endDate}` : ''}${project.client ? ` | ${project.client}` : ''}`;
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: period,
                            size: 18,
                            color: '718096'
                        })
                    ],
                    spacing: { after: 150 }
                })
            );
            
            if (project.description) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: project.description,
                                size: 20,
                                color: '4a5568'
                            })
                        ],
                        spacing: { after: 150 }
                    })
                );
            }
            
            if (project.skills && project.skills.length > 0) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Technologies: ${project.skills.join(', ')}`,
                                size: 18,
                                color: '3182ce',
                                bold: true
                            })
                        ],
                        spacing: { after: 300 }
                    })
                );
            }
        });
    }
    
    return elements;
}

/**
 * Helper function to create contact items
 */
function createContactItem(label, value) {
    const { Paragraph, TextRun } = require('docx');
    
    return new Paragraph({
        children: [
            new TextRun({
                text: `${label} ${value}`,
                bold: true,
                size: 20,
                color: 'ffffff'
            })
        ],
        spacing: { after: 150 }
    });
}

/**
 * Apply basic customizations to HTML
 */
function applyBasicCustomizations(htmlContent, customizations) {
    if (!customizations) return htmlContent;
    
    try {
        const cheerio = require('cheerio');
        const $ = cheerio.load(htmlContent);
        
        // Apply color scheme
        if (customizations.colorScheme && customizations.colorScheme !== 'default') {
            $('body').addClass(`color-${customizations.colorScheme}`);
        }
        
        // Apply font family
        if (customizations.fontFamily && customizations.fontFamily !== 'default') {
            $('body').css('font-family', getFontFamilyCSS(customizations.fontFamily));
        }
        
        // Apply layout style
        if (customizations.layoutStyle && customizations.layoutStyle !== 'default') {
            if (customizations.layoutStyle === 'compact') {
                $('body').css('line-height', '1.2');
            } else if (customizations.layoutStyle === 'expanded') {
                $('body').css('line-height', '1.6');
            }
        }
        
        return $.html();
        
    } catch (error) {
        console.error('Error applying customizations:', error);
        return htmlContent;
    }
}

/**
 * Get font family CSS value
 */
function getFontFamilyCSS(fontName) {
    const fontMap = {
        'arial': 'Arial, sans-serif',
        'georgia': 'Georgia, serif',
        'roboto': 'Roboto, sans-serif',
        'montserrat': 'Montserrat, sans-serif'
    };
    
    return fontMap[fontName] || 'Arial, sans-serif';
}

/**
 * Get font family for Word documents
 */
function getFontFromCustomizations(customizations) {
    const fontMap = {
        'arial': 'Arial',
        'georgia': 'Georgia',
        'roboto': 'Roboto',
        'montserrat': 'Montserrat'
    };
    
    return fontMap[customizations?.fontFamily] || 'Arial';
}


// Place this function definition and its invocation after your imports and database connection setup
function registerHandlebarsHelpers() {
    // Helper for formatting dates (e.g., "Jan 2023")
    Handlebars.registerHelper("formatDate", function(date) {
        if (!date) return "Present"; // Handle cases where end date might be null for current jobs
        return moment(date).format("MMM YYYY");
    });
    
    // Helper for joining array elements with a separator (e.g., for skills lists)
    Handlebars.registerHelper("join", function(array, separator) {
        if (!Array.isArray(array)) return "";
        return array.join(separator || ", ");
    });
    
    // Helper for conditional rendering based on existence and non-emptiness of a value
    // This is crucial for hiding sections if no data is available
    Handlebars.registerHelper("ifExists", function(value, options) {
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
            return options.fn(this); // Render content if value exists and is not an empty array
        }
        return options.inverse(this); // Otherwise, render inverse content (e.g., empty state message)
    });
    
    // Standard 'if' helper for general conditional logic
    Handlebars.registerHelper("if", function(conditional, options) {
        if (conditional) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
}

// Call this function to register the helpers when your server starts
registerHandlebarsHelpers();

// Place this function before your API route definitions
async function getUserCompleteResumeData(userId) {
    try {
        console.log(`Fetching complete resume data for user: ${userId}`);
        
        // Use the actual models that exist in your project
        const user = await User.findById(userId) || {}; // Get user for email
        console.log('User found:', user.email || 'No email found');
        const personalDetails = await PersonalDetails.findOne({ userId: userId }) || {};
        const profileDetails = await ProfileDetails.findOne({ userId: userId }) || {};
        console.log('ProfileDetails photo:', profileDetails.profilePicture || 'No photo found');
        console.log('ProfileDetails location fields:', {
            address: profileDetails.address || 'No address',
            location: profileDetails.location || 'No location', 
            city: profileDetails.city || 'No city',
            state: profileDetails.state || 'No state',
            country: profileDetails.country || 'No country'
        });
        const profileSummary = await ProfileSummary.findOne({ userId: userId }) || {};
        const careerProfiles = await CareerProfile.find({ userId: userId }).sort({ startDate: -1 }) || []; // Get all career profiles
        const resumeHeadline = await ResumeHeadline.findOne({ userId: userId }) || {}; // Get resume headline
        
        const education = await Education.find({ userId: userId })
            .sort({ endYear: -1 }) || []; // Sort by end year descending
            
        const keySkills = await KeySkills.findOne({ userId: userId }) || {};
        const itSkills = await ITSkills.findOne({ userId: userId }) || {};
        
        const projects = await Projects.find({ userId: userId })
            .sort({ endDate: -1 }) || []; // Sort by end date descending
            
        const certifications = await Certification.find({ userId: userId })
            .sort({ year: -1 }) || []; // Sort by year descending
            
        const allOnlineProfiles = await OnlineProfile.find({ userId: userId }) || []; // Get all online profiles
        const workSamples = await WorkSample.find({ userId: userId }) || [];
        const publications = await Publication.find({ userId: userId }) || [];
        const presentations = await Presentation.find({ userId: userId }) || [];
        const patents = await Patent.find({ userId: userId }) || [];
        
        // Extract project technologies/skills to add to IT skills
        const projectSkills = [];
        projects.forEach(project => {
            if (project.skills && Array.isArray(project.skills)) {
                projectSkills.push(...project.skills);
            }
        });
        
        // Create a comprehensive, deduplicated skills array
        const allSkillsSet = new Set();
        const allSkills = [];
        
        // Add all skills from different sources with deduplication
        [...(keySkills.skills || []), ...(itSkills.skills || []), ...projectSkills].forEach(skill => {
            const cleanSkill = skill.toString().trim();
            const lowerSkill = cleanSkill.toLowerCase();
            if (!allSkillsSet.has(lowerSkill) && cleanSkill.length > 0) {
                allSkillsSet.add(lowerSkill);
                allSkills.push(cleanSkill);
            }
        });
        
        // Create categorized skills with complete deduplication
        const enhancedSkills = [];
        const processedSkillsMap = new Map(); // Track by lowercase for deduplication
        
        // Add Key Skills first
        if (keySkills && keySkills.skills) {
            keySkills.skills.forEach(skill => {
                const cleanSkill = skill.toString().trim();
                const lowerSkill = cleanSkill.toLowerCase();
                if (!processedSkillsMap.has(lowerSkill) && cleanSkill.length > 0) {
                    enhancedSkills.push({ name: cleanSkill, category: 'Key Skills' });
                    processedSkillsMap.set(lowerSkill, cleanSkill);
                }
            });
        }
        
        // Add IT Skills next
        if (itSkills && itSkills.skills) {
            itSkills.skills.forEach(skill => {
                const cleanSkill = skill.toString().trim();
                const lowerSkill = cleanSkill.toLowerCase();
                if (!processedSkillsMap.has(lowerSkill) && cleanSkill.length > 0) {
                    enhancedSkills.push({ name: cleanSkill, category: 'IT Skills' });
                    processedSkillsMap.set(lowerSkill, cleanSkill);
                }
            });
        }
        
        // Add Project Skills that aren't already included
        projectSkills.forEach(skill => {
            const cleanSkill = skill.toString().trim();
            const lowerSkill = cleanSkill.toLowerCase();
            if (!processedSkillsMap.has(lowerSkill) && cleanSkill.length > 0) {
                enhancedSkills.push({ name: cleanSkill, category: 'IT Skills' });
                processedSkillsMap.set(lowerSkill, cleanSkill);
            }
        });
        
        // Create allTechnicalSkills array from deduplicated skills for backwards compatibility
        const allTechnicalSkills = enhancedSkills.map(skill => skill.name);
        
        // Get multiple contact sources - comprehensive email search
        const mobileNumber = personalDetails.mobileNumber || personalDetails.phone || profileDetails.mobileNumber || profileDetails.phone || '';
        
        // Search for email in multiple sources - prioritize User.email
        let emailAddress = '';
        if (user.email) emailAddress = user.email; // Primary: User collection email
        else if (personalDetails.email) emailAddress = personalDetails.email;
        else if (profileDetails.email) emailAddress = profileDetails.email;
        else {
            // Check all online profiles for email-type profiles or URLs containing email
            const emailProfile = allOnlineProfiles.find(profile => 
                profile.type?.toLowerCase().includes('email') || 
                profile.url?.includes('@') ||
                profile.description?.includes('@')
            );
            if (emailProfile) {
                if (emailProfile.url?.includes('@')) emailAddress = emailProfile.url;
                else if (emailProfile.description?.includes('@')) emailAddress = emailProfile.description;
            }
        }
        
        // Get LinkedIn URL from online profiles
        const linkedinProfile = allOnlineProfiles.find(profile => 
            profile.type?.toLowerCase() === 'linkedin' || 
            profile.url?.includes('linkedin.com') ||
            profile.type?.toLowerCase().includes('linkedin') ||
            profile.otherType?.toLowerCase() === 'linkedin' ||
            profile.otherType?.toLowerCase().includes('linkedin')
        );
        const linkedinUrl = linkedinProfile?.url || '';
        
        console.log('LinkedIn search results:', {
            allOnlineProfiles: allOnlineProfiles.map(p => ({ type: p.type, otherType: p.otherType, url: p.url })),
            linkedinProfile: linkedinProfile,
            linkedinUrl: linkedinUrl
        });
        
        // Get GitHub URL from online profiles - check all profiles for GitHub
        const githubProfiles = allOnlineProfiles.filter(profile => 
            profile.type?.toLowerCase().includes('github') || 
            profile.url?.includes('github.com') ||
            profile.otherType?.toLowerCase().includes('github')
        );
        const githubUrl = githubProfiles.length > 0 ? githubProfiles[0].url : '';
        
        // Create work experience data from career profiles
        const workExperienceData = careerProfiles.map(profile => ({
            jobTitle: profile.jobTitle,
            company: profile.company,
            startDate: profile.startDate,
            endDate: profile.currentlyWorking ? 'Present' : profile.endDate,
            location: profile.location,
            employmentType: profile.employmentType,
            description: profile.description,
            skills: profile.skills || []
        }));
        
        // Fallback work experience if no career profiles exist
        if (workExperienceData.length === 0 && profileSummary.summary) {
            workExperienceData.push({
                jobTitle: "Front-End Developer",
                company: "Self-Employed / Freelance",
                startDate: "2024",
                endDate: "Present",
                location: "Remote",
                description: profileSummary.summary,
                skills: allTechnicalSkills.slice(0, 5)
            });
        }

        // Create profile picture path for debugging
        const profilePicturePath = profileDetails.profilePicture || personalDetails.photo || personalDetails.profilePicture ? 
            `/uploads/profile_pictures/${profileDetails.profilePicture || personalDetails.photo || personalDetails.profilePicture}` : '';

        // Debug: Final data before creating completeData object
        console.log('=== FINAL DEBUG BEFORE RETURN ===');
        console.log('User email from User collection:', user?.email);
        console.log('Email address variable:', emailAddress);
        console.log('Profile picture path variable:', profilePicturePath);
        console.log('Enhanced skills count:', enhancedSkills.length);
        console.log('Enhanced skills sample:', enhancedSkills.slice(0, 5).map(s => s.name));
        console.log('All skills for deduplication check:', enhancedSkills.map(s => s.name));
        console.log('=== END FINAL DEBUG ===');

        // Create a comprehensive data structure that matches template expectations
        const completeData = {
            // Personal Information
            personalInfo: {
                firstName: personalDetails.firstName || profileDetails.firstName || '',
                lastName: personalDetails.lastName || profileDetails.lastName || '',
                photo: profilePicturePath,
                phone: mobileNumber,
                email: emailAddress || 'saividyasri@example.com', // Provide fallback email
                address: profileDetails.address || profileDetails.location || personalDetails.address || '',
                city: profileDetails.city || personalDetails.city || '',
                state: profileDetails.state || personalDetails.state || '',
                country: profileDetails.country || personalDetails.country || '',
                pincode: profileDetails.pincode || personalDetails.pincode || ''
            },
            
            // Enhanced Contact Information with LinkedIn and GitHub
            contactInfo: {
                phone: mobileNumber,
                email: emailAddress || 'saividyasri@example.com', // Enhanced email search with User.email priority
                mobile: mobileNumber,
                location: profileDetails.address || profileDetails.location || personalDetails.address || '',
                address: profileDetails.address || profileDetails.location || personalDetails.address || '',
                city: profileDetails.city || personalDetails.city || '',
                state: profileDetails.state || personalDetails.state || '',
                linkedin: linkedinUrl,
                github: githubUrl, // Enhanced GitHub search from all online profiles
                website: allOnlineProfiles.find(p => p.type?.toLowerCase().includes('portfolio') || p.type?.toLowerCase().includes('website'))?.url || ''
            },
            
            // Professional Information with Resume Headline
            professionalInfo: {
                title: profileSummary.title || careerProfiles[0]?.jobTitle || 'Front-End Developer',
                summary: profileSummary.summary || careerProfiles[0]?.description || '',
                experience: profileSummary.experience || ''
            },
            
            // Resume Headline (to be displayed below name)
            resumeHeadline: resumeHeadline.headline || profileSummary.headline || '',
            
            // Languages from PersonalDetails
            languages: personalDetails.languages || [
                { name: 'Telugu', proficiency: 'Native' },
                { name: 'English', proficiency: 'Fluent' },
                { name: 'Hindi', proficiency: 'Intermediate' }
            ],
            
            // IMPORTANT: Template expects 'experience' not 'workExperience'
            experience: workExperienceData,
            workExperience: workExperienceData,
            
            // Education - Fix field mapping: template expects 'institution' but data has 'institute'
            education: education.map(edu => ({
                ...edu.toObject(),
                institution: edu.institute || edu.institution, // Map institute to institution for template
                gpa: edu.grade, // Map grade to gpa for template
            })),
            
            // Skills - Enhanced format with case-insensitive deduplication
            skills: {
                // All technical skills including project technologies (deduplicated)
                technical: allTechnicalSkills,
                // All skills grouped properly
                all: enhancedSkills,
                // Group by category
                byCategory: groupSkillsByCategory(enhancedSkills)
            },
            skillsByCategory: groupSkillsByCategory(enhancedSkills),
            
            // Projects
            projects: projects,
            
            // Certifications
            certifications: certifications,
            
            // Additional sections
            onlineProfiles: allOnlineProfiles, // All online profiles instead of just one
            workSamples: workSamples,
            publications: publications,
            presentations: presentations,
            patents: patents,
            
            // Add summary at root level for template compatibility
            summary: profileSummary.summary || careerProfiles[0]?.description || ''
        };
        
        console.log(`Successfully fetched resume data for user ${userId}`);
        return completeData;
        
    } catch (error) {
        console.error("Error fetching complete user resume data:", error);
        throw error; // Re-throw to be caught by the API endpoint error handler
    }
}

// Place this function alongside getUserCompleteResumeData
function groupSkillsByCategory(skills) {
    const grouped = {};
    
    skills.forEach(skill => {
        const category = skill.category || "General"; // Default category if not specified
        const skillName = skill.name || skill.skill || skill; // Handle different skill object structures
        const cleanSkillName = skillName.toString().trim();
        
        if (!grouped[category]) {
            grouped[category] = {
                category: category,
                skills: [],
                skillsSet: new Set() // Track unique skills in this category
            };
        }
        
        // Only add if not already in this category (case insensitive)
        const lowerSkillName = cleanSkillName.toLowerCase();
        if (!grouped[category].skillsSet.has(lowerSkillName) && cleanSkillName.length > 0) {
            grouped[category].skills.push(cleanSkillName);
            grouped[category].skillsSet.add(lowerSkillName);
        }
    });
    
    // Convert to array format and remove the temporary Set
    return Object.values(grouped).map(group => ({
        category: group.category,
        skills: group.skills
    }));
}

// Place this function alongside getUserCompleteResumeData
function populateTemplateWithUserData(templateHTML, userData, customizations = {}) {
    try {
        console.log("Populating template with user data...");
        console.log("User data structure:", JSON.stringify(userData, null, 2));
        console.log("Template HTML snippet:", templateHTML.substring(0, 500));
        
        // Compile the template using Handlebars with runtime options to handle prototype access
        const template = Handlebars.compile(templateHTML, {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
            noEscape: false,
            strict: false
        });
        
        // Prepare the context object for Handlebars. This object will be accessible within your template.
        // Convert all data to plain objects to avoid prototype access issues
        const contextWithCustomizations = JSON.parse(JSON.stringify({
            ...userData, // Spread all user data (personalInfo, workExperience, etc.)
            customizations: customizations, // Pass customizations object
            // Add computed fields that might be useful in the template
            fullName: `${userData.personalInfo?.firstName || ""} ${userData.personalInfo?.lastName || ""}`.trim(),
            currentYear: new Date().getFullYear(),
            // Add boolean flags for conditional rendering to simplify template logic
            hasWorkExperience: userData.workExperience && userData.workExperience.length > 0,
            hasExperience: userData.experience && userData.experience.length > 0,
            hasEducation: userData.education && userData.education.length > 0,
            hasSkills: userData.skills && (userData.skills.technical?.length > 0 || userData.skills.all?.length > 0),
            hasProjects: userData.projects && userData.projects.length > 0,
            hasCertifications: userData.certifications && userData.certifications.length > 0,
            hasLanguages: userData.languages && userData.languages.length > 0
        }));
        
        console.log("Context for Handlebars:", JSON.stringify(contextWithCustomizations, null, 2));
        
        // Generate the populated HTML by rendering the template with the context
        const populatedHTML = template(contextWithCustomizations, {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true
        });
        
        console.log("Populated HTML snippet:", populatedHTML.substring(0, 500));
        
        // CRITICAL: Normalize template CSS to prevent width issues
        const normalizedHTML = normalizeTemplateCSS(populatedHTML);
        
        // Apply CSS customizations (color, font, layout) directly to the generated HTML
        const finalHTML = applyCustomizationsToHTML(normalizedHTML, customizations);
        
        console.log("Template populated successfully");
        return finalHTML;
        
    } catch (error) {
        console.error("Error populating template with user data:", error);
        console.error("Error stack:", error.stack);
        throw new Error(`Failed to populate template: ${error.message}`);
    }
}

// Critical function to normalize template CSS and fix width consistency issues
function normalizeTemplateCSS(html) {
    try {
        // Fix common width-related CSS patterns that cause inconsistency
        let normalizedHTML = html;
        
        // Remove or modify problematic max-width and width constraints
        normalizedHTML = normalizedHTML.replace(/max-width:\s*[0-9.]+in/gi, 'max-width: 100%');
        normalizedHTML = normalizedHTML.replace(/width:\s*[0-9.]+in/gi, 'width: 100%');
        normalizedHTML = normalizedHTML.replace(/max-width:\s*[0-9.]+px/gi, 'max-width: 100%');
        
        // Fix margin issues that can cause centering problems
        normalizedHTML = normalizedHTML.replace(/margin:\s*[0-9.]+in\s+auto/gi, 'margin: 0 auto');
        normalizedHTML = normalizedHTML.replace(/margin:\s*[0-9.]+in/gi, 'margin: 10px');
        
        // Fix padding that might cause overflow
        normalizedHTML = normalizedHTML.replace(/padding:\s*[0-9.]+in/gi, 'padding: 15px');
        normalizedHTML = normalizedHTML.replace(/padding:\s*[0-9.]+in\s+[0-9.]+in\s+[0-9.]+in\s+[0-9.]+in/gi, 'padding: 15px');
        
        // Override body styling that commonly causes issues (preserve existing styles when possible)
        if (normalizedHTML.includes('<style>')) {
            // Add body normalization without overriding existing styles completely
            normalizedHTML = normalizedHTML.replace(
                '</style>',
                `
                body {
                    margin: 0;
                    padding: 15px;
                    max-width: 100%;
                    width: 100%;
                    box-sizing: border-box;
                }
                
                /* Preserve sidebar styling for templates */
                .sidebar, .left-section, .left-column, .resume-sidebar {
                    background: inherit !important;
                    color: inherit !important;
                }
                
                /* Ensure sidebar text visibility */
                .sidebar *, .left-section *, .left-column *, .resume-sidebar *,
                .sidebar-section, .sidebar-heading, .sidebar-section *, .sidebar-heading *,
                .sidebar-title, .sidebar-title * {
                    color: inherit !important;
                }
                
                /* Force preserve sidebar backgrounds for specific templates */
                .sidebar {
                    background: inherit !important;
                    background-color: inherit !important;
                    color: white !important;
                }
                
                /* Template 1 sidebar - Blue gradient */
                body .sidebar {
                    background: linear-gradient(135deg, #4a5568, #2d3748) !important;
                    color: white !important;
                }
                
                /* Template 3 sidebar - Dark blue */
                [class*="template3"] .sidebar,
                .sidebar[style*="#2c3e50"] {
                    background: #2c3e50 !important;
                    color: white !important;
                }
                
                /* Ensure all sidebar children maintain white text */
                .sidebar, .sidebar * {
                    color: white !important;
                }
                </style>`
            );
            
            // Add or override image styling to ensure perfect circles
            if (normalizedHTML.includes('</style>')) {
                const imageCSS = `
                /* Force all images to be perfect circles - Ultra high specificity */
                img, 
                img[src],
                *:not(i) img,
                div img,
                section img,
                body img,
                html img {
                    border-radius: 50% !important;
                    object-fit: cover !important;
                    display: block !important;
                    border: none !important;
                    outline: none !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                    clip-path: circle(50% at 50% 50%) !important;
                    background: transparent !important;
                    background-color: transparent !important;
                }
                
                /* Template 1 specific profile photo styling */
                .profile-photo {
                    width: 120px !important;
                    height: 120px !important;
                    border-radius: 50% !important;
                    border: 4px solid white !important;
                    margin: 0 auto 25px auto !important;
                    display: block !important;
                    position: relative !important;
                    overflow: hidden !important;
                }
                
                .profile-photo img {
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                    border: none !important;
                    object-fit: cover !important;
                    object-position: center 35% !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    margin: 0 !important;
                    clip-path: none !important;
                    box-shadow: none !important;
                }
                
                /* Fallback for other templates - reasonable default size */
                img:not(.profile-photo img) {
                    width: 100px !important;
                    height: 100px !important;
                    max-width: 100px !important;
                    max-height: 100px !important;
                    min-width: 100px !important;
                    min-height: 100px !important;
                    margin: 0 auto 15px !important;
                }
                
                /* Remove any backgrounds from image containers */
                img:before,
                img:after {
                    display: none !important;
                    content: none !important;
                }
                
                /* Target any parent elements that might have oval backgrounds - but preserve template-specific containers */
                *:has(img):not(.sidebar):not(.sidebar *):not(.profile-photo):not(.profile-photo *),
                div:has(img):not(.sidebar):not(.sidebar *):not(.profile-photo):not(.profile-photo *),
                section:has(img):not(.sidebar):not(.sidebar *):not(.profile-photo):not(.profile-photo *),
                .image-container:not(.sidebar):not(.sidebar *):not(.profile-photo):not(.profile-photo *),
                .photo-container:not(.sidebar):not(.sidebar *):not(.profile-photo):not(.profile-photo *),
                .profile-container:not(.sidebar):not(.sidebar *):not(.profile-photo):not(.profile-photo *) {
                    background: transparent !important;
                    background-color: transparent !important;
                    border: none !important;
                    outline: none !important;
                    border-radius: 0 !important;
                }
                
                /* Additional fallback selectors for common template patterns */
                .profile-image,
                .user-photo,
                .avatar,
                .photo,
                [alt*="photo"],
                [alt*="image"],
                [src*="profile"],
                [src*="avatar"] {
                    width: 100px !important;
                    height: 100px !important;
                    border-radius: 50% !important;
                    object-fit: cover !important;
                    border: none !important;
                    outline: none !important;
                    clip-path: circle(50% at 50% 50%) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                    background: transparent !important;
                    background-color: transparent !important;
                }
                
                /* Remove any pseudo-elements that might create oval shapes, but preserve sidebar styling */
                *:not(.sidebar):not(.sidebar *)::before,
                *:not(.sidebar):not(.sidebar *)::after {
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                }
                `;
                normalizedHTML = normalizedHTML.replace('</style>', `${imageCSS}</style>`);
            }
        }
        
        // Add viewport meta tag if missing
        if (!normalizedHTML.includes('viewport')) {
            normalizedHTML = normalizedHTML.replace(
                '<head>',
                '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
            );
        }
        
        return normalizedHTML;
        
    } catch (error) {
        console.error('Error normalizing template CSS:', error);
        return html; // Return original if normalization fails
    }
}

// Place this function alongside populateTemplateWithUserData
function applyCustomizationsToHTML(html, customizations) {
    let customizedHTML = html;
    
    // Apply color scheme by adding a class to the <body> tag
    if (customizations.colorScheme && customizations.colorScheme !== "default") {
        // Find the <body> tag and insert the color scheme class
        customizedHTML = customizedHTML.replace(
            "<body>",
            `<body class="color-scheme-${customizations.colorScheme}">`
        );
    }
    
    // Apply font family by injecting a <style> tag into the <head>
    if (customizations.fontFamily && customizations.fontFamily !== "default") {
        const fontCSS = getFontFamilyCSS(customizations.fontFamily);
        const fontStyleTag = `<style>body { font-family: ${fontCSS} !important; }</style>`;
        // Insert the font style just before the closing </head> tag
        customizedHTML = customizedHTML.replace("</head>", `${fontStyleTag}</head>`);
    }
    
    // Apply layout style by adding a class to the <body> tag
    if (customizations.layoutStyle && customizations.layoutStyle !== "default") {
        // Find the <body> tag and insert the layout style class
        // This assumes the <body> tag might already have other attributes/classes
        customizedHTML = customizedHTML.replace(
            "<body",
            `<body class="layout-${customizations.layoutStyle}"`
        );
    }
    
    return customizedHTML;
}

// Place this function alongside applyCustomizationsToHTML
function getFontFamilyCSS(fontFamily) {
    const fontFamilyMap = {
        "times": "Times New Roman, serif",
        "georgia": "Georgia, serif",
        "helvetica": "Helvetica, Arial, sans-serif",
        "calibri": "Calibri, Arial, sans-serif",
        "opensans": "Open Sans, Arial, sans-serif"
    };
    
    return fontFamilyMap[fontFamily] || "Arial, sans-serif"; // Default to Arial
}

// Place this API endpoint within your existing Express routes (e.g., after other GET routes)
app.get("/api/users/:userId/resume-data", async (req, res) => {
    console.log("=== ENDPOINT HIT ===");
    try {
        const { userId } = req.params;
        console.log(`Attempting to fetch resume data for user: ${userId}`);
        
        // Call the helper function to get all user's resume data
        const userData = await getUserCompleteResumeData(userId);
        
        if (!userData) {
            // If no data is found for the user, return a 404
            return res.status(404).json({ 
                success: false, 
                message: "User resume data not found" 
            });
        }
        
        // Send the aggregated user data as a JSON response
        res.json({
            success: true,
            data: userData
        });
        
    } catch (error) {
        console.error("Error fetching user resume data:", error); // Log the detailed error
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch user resume data",
            error: error.message // Include error message for debugging
        });
    }
});

// Place this API endpoint within your existing Express routes (e.g., after other POST routes)
app.post("/api/templates/:templateId/populate", async (req, res) => {
    try {
        const { templateId } = req.params;
        const { userId, customizations } = req.body; // Expect userId and customizations from the request body
        
        console.log(`Attempting to populate template ${templateId} for user ${userId}`);
        
        // Fetch the template from your database
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({ 
                success: false, 
                message: "Template not found" 
            });
        }
        
        // Fetch the complete user resume data
        const userData = await getUserCompleteResumeData(userId);
        if (!userData) {
            return res.status(404).json({ 
                success: false, 
                message: "User data not found" 
            });
        }
        
        // Populate the template HTML with user data and apply customizations
        const populatedHTML = populateTemplateWithUserData(
            template.htmlContent, // Assuming your template HTML is stored in 'htmlContent' field
            userData, 
            customizations || {} // Pass customizations, default to empty object if not provided
        );
        
        // Send back the populated HTML and other relevant data
        res.json({
            success: true,
            data: {
                templateId,
                templateName: template.name,
                populatedHTML, // The fully rendered HTML with user data
                userData: userData, // Optionally send back user data for frontend debugging
                customizations: customizations || {}
            }
        });
        
    } catch (error) {
        console.error("Error populating template:", error); // Log the detailed error
        res.status(500).json({ 
            success: false, 
            message: "Failed to populate template with user data",
            error: error.message // Include error message for debugging
        });
    }
});

// Add the missing /api/render-template endpoint
app.post("/api/render-template", async (req, res) => {
    try {
        const { templateId, userId, customizations } = req.body;
        
        console.log(`Rendering template ${templateId} for user ${userId}`);
        
        // Validate required parameters
        if (!templateId || !userId) {
            return res.status(400).json({
                success: false,
                message: "Template ID and User ID are required"
            });
        }
        
        // Fetch the template from database
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }
        
        console.log(`Found template: ${template.name} (ID: ${templateId})`);
        
        // Fetch user data
        const userData = await getUserCompleteResumeData(userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User data not found"
            });
        }
        
        console.log(`User data fetched for ${userData.personalInfo?.firstName || 'Unknown'} ${userData.personalInfo?.lastName || 'User'}`);
        
        // Add sample data for testing if fields are empty
        if (!userData.personalInfo.firstName) {
            userData.personalInfo.firstName = "John";
            userData.personalInfo.lastName = "Doe";
            userData.personalInfo.email = "john.doe@example.com";
            userData.personalInfo.phone = "+1 (555) 123-4567";
            userData.contactInfo.email = "john.doe@example.com";
            userData.contactInfo.phone = "+1 (555) 123-4567";
            userData.contactInfo.city = "New York";
            userData.contactInfo.state = "NY";
            console.log("Added sample data for testing");
        }
        
        // Populate template with user data
        const populatedHTML = populateTemplateWithUserData(
            template.htmlContent,
            userData,
            customizations || {}
        );
        
        res.json({
            success: true,
            html: populatedHTML,  // For the newer code that expects "html"
            data: {
                templateId,
                templateName: template.name,
                renderedHtml: populatedHTML,  // For the older code that expects "renderedHtml"
                populatedHTML,
                userData,
                customizations: customizations || {}
            }
        });
        
    } catch (error) {
        console.error("Error rendering template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to render template",
            error: error.message
        });
    }
});

// Add the missing endpoint for /api/user/:userId/template/:templateId
app.get("/api/user/:userId/template/:templateId", async (req, res) => {
    try {
        const { userId, templateId } = req.params;
        console.log(`Rendering template ${templateId} for user ${userId}`);
        
        // Fetch the template from database
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }
        
        // Fetch user data
        const userData = await getUserCompleteResumeData(userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User data not found"
            });
        }
        
        // Populate template with user data
        const populatedHTML = populateTemplateWithUserData(template.htmlContent, userData);
        
        // Return the populated template
        res.json({
            success: true,
            data: {
                templateId: template._id,
                templateName: template.name,
                userId: userId,
                populatedHTML: populatedHTML,
                userData: userData
            }
        });
        
    } catch (error) {
        console.error("Error rendering template:", error);
        res.status(500).json({
            success: false,
            message: "Failed to render template",
            error: error.message
        });
    }
});

// DELETE /api/user-templates/:userId/:templateId - Delete a user template
app.delete('/api/user-templates/:userId/:templateId', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        const template = await UserTemplate.findOne({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await UserTemplate.deleteOne({ _id: templateId, userId: userId });

        res.json({ 
            success: true, 
            message: 'Template deleted successfully' 
        });

    } catch (error) {
        console.error('Error deleting user template:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/user-templates/:userId/:templateId/share - Generate share link
app.post('/api/user-templates/:userId/:templateId/share', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        const template = await UserTemplate.findOne({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Generate unique share ID
        const shareId = crypto.randomBytes(16).toString('hex');
        
        // Update template with share info
        template.shareId = shareId;
        template.isPublic = true;
        template.sharedAt = new Date();
        await template.save();

        const shareLink = `${req.protocol}://${req.get('host')}/share/${shareId}`;

        res.json({ 
            success: true, 
            shareLink: shareLink,
            shareId: shareId
        });

    } catch (error) {
        console.error('Error generating share link:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/user-templates/:userId/:templateId/share - Deactivate share link
app.delete('/api/user-templates/:userId/:templateId/share', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        const template = await UserTemplate.findOne({
            _id: templateId,
            userId: userId
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Deactivate sharing
        template.shareId = undefined;
        template.isPublic = false;
        template.sharedAt = undefined;
        await template.save();

        res.json({ 
            success: true, 
            message: 'Share link deactivated successfully' 
        });

    } catch (error) {
        console.error('Error deactivating share link:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Test share link creation for debugging
app.get('/test-share-creation', async (req, res) => {
    try {
        // Get the first template from database for testing
        const testTemplate = await UserTemplate.findOne({});
        
        if (!testTemplate) {
            return res.json({ message: "No templates found in database for testing" });
        }

        // Generate a test share ID
        const shareId = crypto.randomBytes(16).toString('hex');
        
        // Update template with share info
        testTemplate.shareId = shareId;
        testTemplate.isPublic = true;
        testTemplate.sharedAt = new Date();
        await testTemplate.save();

        const shareLink = `${req.protocol}://${req.get('host')}/share/${shareId}`;

        res.json({ 
            success: true, 
            message: "Test share link created!",
            shareLink: shareLink,
            shareId: shareId,
            templateName: testTemplate.name,
            userId: testTemplate.userId
        });

    } catch (error) {
        console.error('Error creating test share link:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Test promotional page route
app.get('/test-promo', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NextHire - Professional Resume Builder</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #0f1c3f 0%, #311b4f 25%, #6b247f 50%, #c03bce 75%, #f356ff 100%);
            min-height: 100vh;
        }
        
        .hero-section {
            text-align: center;
            padding: 60px 20px;
            color: white;
        }
        
        .hero-section h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .hero-section p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .cta-button {
            background: #f356ff;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 1.1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            background: #c03bce;
            transform: translateY(-2px);
        }
        
        .test-message {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            margin: 40px 20px;
            border-radius: 10px;
            color: white;
            text-align: center;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="hero-section">
        <h1>🎯 TEST: NextHire Promotional Page</h1>
        <p>This is a test page to verify that our promotional content is rendering correctly with the dashboard color scheme.</p>
        <a href="/dashboard.html" class="cta-button">Go to Dashboard</a>
    </div>
    
    <div class="test-message">
        <h3>✅ Promotional Content Test</h3>
        <p>If you can see this styled page with the purple-pink gradient background, the promotional content system is working correctly!</p>
    </div>
</body>
</html>
    `);
});

// Test route to create a sample share link without database
app.get('/create-test-share', (req, res) => {
    const testShareId = 'test-share-demo-12345';
    const shareLink = `${req.protocol}://${req.get('host')}/share/${testShareId}`;
    
    res.json({
        success: true,
        message: 'Test share link created',
        shareLink: shareLink,
        shareId: testShareId,
        note: 'This is a demo link that works without database'
    });
});

// GET /share/:shareId - Public share page
app.get('/share/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        console.log('🔗 [SHARE] Requested shareId:', shareId);

        // Check if this is a test/demo share ID
        if (shareId === 'test-share-demo-12345') {
            console.log('🎯 [SHARE] Serving demo share page');
            return res.send(getDemoSharePageHTML());
        }

        let template = null;
        try {
            template = await UserTemplate.findOne({
                shareId: shareId,
                isPublic: true
            });
        } catch (dbError) {
            console.log('⚠️ [SHARE] Database error, serving demo content:', dbError.message);
            return res.send(getDemoSharePageHTML());
        }

        if (!template) {
            console.log('❌ [SHARE] No template found for shareId:', shareId);
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Resume Not Found</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: linear-gradient(135deg, #0f1c3f 0%, #311b4f 25%, #6b247f 50%, #c03bce 75%, #f356ff 100%);
                            color: white;
                            min-height: 100vh;
                            margin: 0;
                        }
                        .error { color: #ff6b6b; }
                        .demo-link { 
                            display: inline-block; 
                            margin-top: 20px; 
                            padding: 10px 20px; 
                            background: #f356ff; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 5px; 
                        }
                    </style>
                </head>
                <body>
                    <h1 class="error">Resume Not Found</h1>
                    <p>This resume is no longer available or the link has expired.</p>
                    <p>Try this demo link instead:</p>
                    <a href="/share/test-share-demo-12345" class="demo-link">View Demo Resume</a>
                </body>
                </html>
            `);
        }

        console.log('✅ [SHARE] Template found for shareId:', shareId, 'Template name:', template.name);
        console.log('🎯 [SHARE] Serving promotional page with resume content');

        // Get user data to populate the template
        const userData = await getUserCompleteResumeData(template.userId);
        if (!userData) {
            console.log('❌ [SHARE] No user data found for userId:', template.userId);
        }

        let populatedHTML = template.htmlContent;
        if (userData) {
            populatedHTML = populateTemplateWithUserData(template.htmlContent, userData);
        }

        // Apply CSS normalization to ensure consistent styling and circular images
        populatedHTML = normalizeTemplateCSS(populatedHTML);

        // Serve the complete promotional page with resume content
const sharePageHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name} - Professional Resume | NextHire</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #0f1c3f 0%, #311b4f 25%, #6b247f 50%, #c03bce 75%, #f356ff 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .main-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        /* Header Section - Brand, Quote, CTA */
        .header-section {
            background: linear-gradient(135deg, #0f1c3f 0%, #311b4f 50%, #6b247f 100%);
            color: white;
            padding: 50px 30px;
            text-align: center;
        }

        .logo {
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }

        .logo i {
            color: #f356ff;
            font-size: 3rem;
        }

        .logo-text {
            background: linear-gradient(45deg, #f356ff, #c03bce);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .quote {
            font-style: italic;
            font-size: 1.3rem;
            margin: 30px 0;
            padding: 25px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 15px;
            border-left: 5px solid #f356ff;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f356ff, #c03bce);
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(243, 86, 255, 0.4);
            margin-top: 20px;
        }

        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(243, 86, 255, 0.5);
        }

        .cta-button i {
            margin-right: 8px;
        }

        /* Resume Section */
        .resume-section {
            padding: 50px 30px;
            background: #f8f9fa;
        }

        .resume-title {
            text-align: center;
            font-size: 2.2rem;
            margin-bottom: 40px;
            color: #2c3e50;
            font-weight: 700;
        }

        .resume-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            padding: 40px;
            border: 1px solid #e9ecef;
            width: 100%;
            overflow: visible;
            position: relative;
        }

        /* CRITICAL: Template Override Styles - Force consistent width */
        .resume-content {
            font-size: 14px;
            line-height: 1.7;
            color: #333;
            width: 100%;
            overflow: visible;
            word-wrap: break-word;
            hyphens: auto;
            position: relative;
            /* Force override of any template CSS */
            transform: scale(1);
            transform-origin: top left;
        }

        /* Override any inline styles or template-specific constraints */
        .resume-content[style],
        .resume-content *[style] {
            max-width: 100% !important;
            width: auto !important;
        }

        /* Force all nested elements to respect container width */
        .resume-content > *,
        .resume-content > * > *,
        .resume-content > * > * > * {
            max-width: 100% !important;
            box-sizing: border-box !important;
        }

        /* Specific overrides for common template patterns */
        .resume-content .template-container,
        .resume-content .document,
        .resume-content .page,
        .resume-content .resume-wrapper {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .resume-content h1 {
            font-size: 1.8rem;
            text-align: center;
            color: #2c3e50;
            border-bottom: 2px solid #6b247f;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .resume-content h2 {
            font-size: 1.3rem;
            color: #6b247f;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 5px;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .resume-content h3 {
            color: #2c3e50;
            margin-top: 15px;
            margin-bottom: 8px;
        }

        .resume-content ul {
            margin-left: 20px;
            margin-bottom: 15px;
        }

        .resume-content p {
            margin-bottom: 10px;
        }

        .resume-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .resume-content td, .resume-content th {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            word-wrap: break-word;
        }

        .resume-content .section {
            margin-bottom: 20px;
        }

        .resume-content .header-info {
            text-align: center;
            margin-bottom: 20px;
        }

        .resume-content .contact-info {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        }

        .resume-content .contact-info span {
            font-size: 12px;
            color: #666;
        }

        /* Ensure all resume template content is properly contained */
        .resume-content * {
            max-width: 100% !important;
            box-sizing: border-box !important;
        }

        /* Override any template-specific width constraints */
        .resume-content html {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .resume-content body {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: transparent !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
        }

        /* Reset any template containers that might have fixed widths */
        .resume-content div,
        .resume-content section,
        .resume-content article,
        .resume-content main {
            max-width: 100% !important;
            width: auto !important;
        }

        .resume-content img {
            width: 100px !important;
            height: 100px !important;
            max-width: 100px !important;
            max-height: 100px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
            display: block !important;
            margin: 0 auto 15px !important;
            border: none !important;
            outline: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            clip-path: circle(50% at 50% 50%) !important;
            position: relative;
            left: 50%;
            transform: translateX(-50%);
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Remove any parent container backgrounds that might create oval shapes */
        .resume-content *:has(img),
        .resume-content div:has(img),
        .resume-content section:has(img),
        .resume-content .image-container,
        .resume-content .photo-container,
        .resume-content .profile-container {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            outline: none !important;
            border-radius: 0 !important;
        }

        /* Remove pseudo-elements that might create shapes */
        .resume-content *::before,
        .resume-content *::after {
            background: transparent !important;
            border: none !important;
            outline: none !important;
            content: none !important;
            display: none !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .main-container {
                border-radius: 10px;
                margin: 0 5px;
            }
            
            .header-section {
                padding: 40px 20px;
            }
            
            .logo {
                font-size: 2.5rem;
            }
            
            .logo i {
                font-size: 2.5rem;
            }
            
            .quote {
                font-size: 1.1rem;
                padding: 20px;
            }
            
            .cta-button {
                padding: 15px 30px;
                font-size: 1.1rem;
            }
            
            .resume-section {
                padding: 40px 15px;
            }
            
            .resume-title {
                font-size: 1.8rem;
            }
            
            .resume-container {
                padding: 20px;
                max-width: 100%;
                margin: 0;
            }
            
            .resume-content {
                font-size: 13px;
                overflow-wrap: break-word;
                word-break: break-word;
            }
        }

        @media (max-width: 480px) {
            .header-section {
                padding: 30px 15px;
            }
            
            .logo {
                font-size: 2rem;
            }
            
            .logo i {
                font-size: 2rem;
            }
            
            .quote {
                font-size: 1rem;
                padding: 15px;
            }
            
            .resume-container {
                padding: 15px;
                border-radius: 5px;
            }
            
            .resume-content {
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- Header Section: Brand Logo, Quote, CTA Button -->
        <section class="header-section">
            <div class="logo">
                <i class="fas fa-apple-alt"></i>
                <span class="logo-text">NextHire</span>
            </div>
            
            <div class="quote">
                "Transform your career with professional resumes that get noticed by employers and land interviews."
            </div>
            
            <a href="http://localhost:3000/#signup" class="cta-button" onclick="window.open('http://localhost:3000', '_blank'); return false;">
                <i class="fas fa-rocket"></i> Create Your Resume Now - FREE!
            </a>
        </section>
        
        <!-- Resume Preview Section -->
        <section class="resume-section">
            <h2 class="resume-title">Your Professional Resume</h2>
            <div class="resume-container">
                <div class="resume-content">
                    ${populatedHTML}
                </div>
            </div>
        </section>
    </div>
    
    <script>
        // Handle navigation to home page with signup modal
        document.addEventListener('DOMContentLoaded', function() {
            const ctaButton = document.querySelector('.cta-button');
            if (ctaButton) {
                ctaButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Open home page in new tab and focus on signup
                    const homeUrl = 'http://localhost:3000';
                    const newWindow = window.open(homeUrl, '_blank');
                    
                    // If opening in same tab is preferred, uncomment below and comment above
                    // window.location.href = homeUrl;
                });
            }
        });
    </script>
</body>
</html>
`;



        res.send(sharePageHTML);

    } catch (error) {
        console.error('❌ [SHARE] Error serving shared resume:', error);
        res.status(500).send('Internal server error');
    }
});

// Function to generate demo share page HTML
function getDemoSharePageHTML() {
    const demoResumeHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="/images/logo.jpg" alt="Profile" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
                <h1 style="margin: 0; color: #2c3e50;">John Doe</h1>
                <h3 style="margin: 5px 0; color: #7f8c8d;">Software Developer</h3>
                <p style="margin: 5px 0; color: #95a5a6;">john.doe@email.com | +1 (555) 123-4567 | LinkedIn: /in/johndoe</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="border-bottom: 2px solid #f356ff; padding-bottom: 5px; color: #2c3e50;">Professional Summary</h2>
                <p style="line-height: 1.6;">Experienced software developer with 5+ years in full-stack development. Skilled in JavaScript, React, Node.js, and cloud technologies. Passionate about creating efficient, scalable solutions.</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="border-bottom: 2px solid #f356ff; padding-bottom: 5px; color: #2c3e50;">Work Experience</h2>
                <div style="margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #2c3e50;">Senior Software Developer</h3>
                    <p style="margin: 2px 0; color: #7f8c8d; font-style: italic;">Tech Solutions Inc. | 2021 - Present</p>
                    <ul style="margin: 8px 0;">
                        <li>Led development of web applications serving 10K+ users</li>
                        <li>Reduced application load time by 40% through optimization</li>
                        <li>Mentored junior developers and conducted code reviews</li>
                    </ul>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="border-bottom: 2px solid #f356ff; padding-bottom: 5px; color: #2c3e50;">Education</h2>
                <div>
                    <h3 style="margin: 0; color: #2c3e50;">Bachelor of Science in Computer Science</h3>
                    <p style="margin: 2px 0; color: #7f8c8d; font-style: italic;">University of Technology | 2015 - 2019</p>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="border-bottom: 2px solid #f356ff; padding-bottom: 5px; color: #2c3e50;">Skills</h2>
                <p style="line-height: 1.6;">JavaScript, React, Node.js, Python, SQL, MongoDB, AWS, Docker, Git, Agile Development</p>
            </div>
        </div>
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Resume - Professional Resume | NextHire</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #0f1c3f 0%, #311b4f 25%, #6b247f 50%, #c03bce 75%, #f356ff 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .main-container {
            max-width: 900px;
            margin: 40px auto;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header-section {
            background: linear-gradient(135deg, #0f1c3f 0%, #311b4f 50%, #6b247f 100%);
            color: white;
            padding: 50px 30px 30px 30px;
            text-align: center;
        }
        .promo-logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            margin-bottom: 10px;
        }
        .promo-brand {
            font-size: 2.2rem;
            font-weight: 700;
            color: #f356ff;
            margin-bottom: 8px;
        }
        .promo-quote {
            font-size: 1.2rem;
            color: #fff;
            margin-bottom: 24px;
            font-style: italic;
        }
        .promo-signup-btn {
            display: inline-block;
            margin: 18px 0 32px 0;
            padding: 12px 32px;
            font-size: 1.1rem;
            border-radius: 50px;
            background: linear-gradient(90deg, #ff00cc, #333399);
            color: #fff;
            border: none;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
            transition: all 0.3s ease;
            text-decoration: none;
        }
        .promo-signup-btn:hover {
            background: linear-gradient(90deg, #311b4f, #f356ff);
        }
        .promo-heading {
            font-size: 1.5rem;
            margin: 32px 0 18px 0;
            color: #f356ff;
            font-weight: 600;
        }
        .promo-resume {
            background: #fff;
            color: #222;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            padding: 32px 24px;
            margin-top: 10px;
            text-align: left;
        }
        .demo-badge {
            background: #ff6b6b;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <section class="header-section">
            <img src="/images/logo.jpg" alt="NextHire Logo" class="promo-logo">
            <div class="promo-brand">NextHire <span class="demo-badge">DEMO</span></div>
            <div class="promo-quote">Empower your career journey. Create, share, and inspire with NextHire resumes!</div>
            <a href="/" class="promo-signup-btn">Sign Up &amp; Start Building Your Resume</a>
            <div class="promo-heading">View My Resume Generated Through NextHire</div>
        </section>
        <section class="promo-resume">
            ${demoResumeHTML}
        </section>
    </div>
</body>
</html>
    `;
}

// POST /api/user-templates/:userId/:templateId/download - Update download count
app.post('/api/user-templates/:userId/:templateId/download', async (req, res) => {
    try {
        const { userId, templateId } = req.params;

        await UserTemplate.updateOne(
            { _id: templateId, userId: userId },
            { $inc: { downloads: 1 } }
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error updating download count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Public resume endpoint - allows viewing shared resumes
app.get("/api/public-resume/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`Fetching public resume for user: ${userId}`);
        
        // Get the user data to populate the resume
        const userData = await getUserCompleteResumeData(userId);
        
        if (!userData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Resume data not available for this user' 
            });
        }
        
        console.log('Successfully fetched user data for public sharing');
        
        // Return the resume data for public viewing
        res.json({
            success: true,
            resume: userData
        });
        
    } catch (error) {
        console.error('Error fetching public resume:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Start the server
app.listen(port, '0.0.0.0', (req,res) => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server accessible at http://0.0.0.0:${port}`);
});

