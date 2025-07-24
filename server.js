const express = require('express');
const app = express();
const port = 3000;
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
const Template = require('./models/Template');
const Favorite = require('./models/Favorite');
const UserTemplate = require('./models/UserTemplate');

const cors = require('cors');
app.use(cors({
  origin: '*', // Allow all origins for better compatibility
  credentials: true
}));

// MongoDB connection using the provided URI
mongoose.connect('mongodb+srv://vidyadonthagani:Vidya28@cluster0.wixjktf.mongodb.net/resume?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log("✅ MongoDB connected to database:", mongoose.connection.db.databaseName);
    
    mongoose.connection.db.collection('resumeheadlines').countDocuments({})
      .then(count => console.log(`Current resume headlines count: ${count}`))
      .catch(err => console.error("Count error:", err));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const ADMIN_EMAIL = "hirewithnexthire@gmail.com"; 
const ADMIN_PASSWORD = "azqsxwdcefv@011"; // Your specific admin password

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api', router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts',express.static(path.join(__dirname, 'scripts')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use('/templateimages', express.static(path.join(__dirname, 'images', 'templateimages')));
app.use('/api/resume-headline', headlineRoutes);

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
    user: 'hirewithnexthire@gmail.com',      
    pass: 'leey xxvf akda pjxe'         
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
      user: 'hirewithnexthire@gmail.com',
      pass: 'leey xxvf akda pjxe'
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
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/api/templates/:id", upload.fields([{ name: "previewImage", maxCount: 1 }, { name: "htmlFile", maxCount: 1 }]), async (req, res) => {
    try {
        const { name, description, features, category, industry, rating } = req.body;
        const updateData = { name, description, category, industry, rating: parseFloat(rating) };

        if (features) {
            updateData.features = Array.isArray(features) ? features : features.split(",").map(f => f.trim());
        }

        if (req.files.htmlFile) {
            updateData.htmlContent = req.files.htmlFile[0].buffer.toString();
        }
        if (req.files.previewImage) {
            updateData.previewImagePath = `/uploads/${req.files.previewImage[0].filename}`;
        }

        const updatedTemplate = await Template.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedTemplate) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.json(updatedTemplate);
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ error: error.message });
    }
});

app.delete("/api/templates/:id", async (req, res) => {
    try {
        const deletedTemplate = await Template.findByIdAndDelete(req.params.id);
        if (!deletedTemplate) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.status(204).send();
    } catch (error) {
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
// Get a single template by ID
app.get("/api/templates/:id", async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update a template by ID
app.put("/api/templates/:id", upload.fields([{ name: "previewImage", maxCount: 1 }, { name: "htmlFile", maxCount: 1 }]), async (req, res) => {
    try {
        const { name, description, features, category, industry, rating } = req.body;
        const templateId = req.params.id;

        // Fetch the existing template first to get current file paths for cleanup and to retain existing data
        const existingTemplate = await Template.findById(templateId);
        if (!existingTemplate) {
            return res.status(404).json({ error: "Template not found" });
        }

        const updateData = {
            name: name || existingTemplate.name,
            description: description || existingTemplate.description,
            features: Array.isArray(features) ? features : (features ? features.split(",").map(f => f.trim()) : existingTemplate.features),
            category: category || existingTemplate.category,
            industry: industry !== undefined ? industry : existingTemplate.industry,
            rating: rating !== undefined ? parseFloat(rating) : existingTemplate.rating,
            // Retain existing file paths by default
            previewImagePath: existingTemplate.previewImagePath,
            htmlContent: existingTemplate.htmlContent,
        };

        // Handle file updates only if req.files exists and files are actually uploaded
        if (req.files) {
            // Handle HTML file update
            if (req.files.htmlFile && req.files.htmlFile.length > 0) {
                const filePath = req.files.htmlFile[0].path;
                updateData.htmlContent = fs.readFileSync(filePath, "utf8");
                fs.unlinkSync(filePath); // Delete the temporary uploaded HTML file after reading
            }

            // Handle preview image update
            if (req.files.previewImage && req.files.previewImage.length > 0) {
                // Delete old image if a new one is uploaded
                if (existingTemplate.previewImagePath) {
                    const oldImagePath = path.join(__dirname, '../public', existingTemplate.previewImagePath);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                updateData.previewImagePath = `/uploads/${req.files.previewImage[0].filename}`;
                // Multer handles temporary file deletion for images after upload
            }
        }

        // Apply updates to the existing template document
        Object.assign(existingTemplate, updateData);
        const updatedTemplate = await existingTemplate.save();

        res.json(updatedTemplate);
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ error: "Internal server error" });
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

// GET /api/templates/:id - Fetch single template by ID
app.get('/api/templates/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/templates/:id/download - Update download count
app.post('/api/templates/:id/download', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloads: 1 } },
            { new: true }
        );
        
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        
        res.json({ message: 'Download count updated', downloads: template.downloads });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/saved-templates - Save template for user
app.post('/api/saved-templates', async (req, res) => {
    try {
        const { userId, templateId, customizations } = req.body;
        
        // Check if already saved
        const existingSave = await SavedTemplate.findOne({ userId, templateId });
        
        if (existingSave) {
            // Update existing save with new customizations
            existingSave.customizations = customizations;
            existingSave.savedAt = new Date();
            await existingSave.save();
            res.json({ message: 'Template save updated', savedTemplate: existingSave });
        } else {
            // Create new save
            const savedTemplate = new SavedTemplate({
                userId,
                templateId,
                customizations,
                savedAt: new Date()
            });
            
            await savedTemplate.save();
            res.json({ message: 'Template saved successfully', savedTemplate });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/favorites/check/:userId/:templateId - Check favorite status
app.get('/api/favorites/check/:userId/:templateId', async (req, res) => {
    try {
        const { userId, templateId } = req.params;
        const favorite = await Favorite.findOne({ userId, templateId });
        res.json({ isFavorite: !!favorite });
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
            customizations: {
                colorScheme: customizations?.colorScheme || 'default',
                fontFamily: customizations?.fontFamily || 'default',
                layoutStyle: customizations?.layoutStyle || 'default'
            },
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
                customizations: userTemplate.customizations,
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

        if (customizations !== undefined) {
            template.customizations = {
                colorScheme: customizations.colorScheme || template.customizations.colorScheme,
                fontFamily: customizations.fontFamily || template.customizations.fontFamily,
                layoutStyle: customizations.layoutStyle || template.customizations.layoutStyle
            };
        }

        await template.save();

        res.json({
            message: 'Template updated successfully',
            template: {
                id: template._id,
                name: template.name,
                description: template.description,
                customizations: template.customizations,
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
        const { templateId, format, customizations, templateData } = req.body;
        
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
async function generateSimplePDF(templateData, customizations) {
    console.log('Starting PDF generation...');
    
    try {
        const puppeteer = require('puppeteer');
        
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
        await page.setViewport({ width: 1200, height: 1600 });
        
        // Create clean HTML content
        let htmlContent = templateData.htmlContent || '<html><body><h1>Resume Template</h1><p>Content not available</p></body></html>';
        
        // Apply basic customizations
        htmlContent = applyBasicCustomizations(htmlContent, customizations);
        
        // Add PDF-specific styles
        const pdfStyles = `
            <style>
                @page { 
                    margin: 0.5in; 
                    size: A4;
                }
                body { 
                    font-family: Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.4;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                h1, h2, h3 { 
                    color: #2c3e50;
                    margin-top: 0;
                }
                .no-print { display: none !important; }
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
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            }
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
 * Simplified Word document generation
 */
async function generateSimpleWordDocument(templateData, customizations) {
    console.log('Starting Word document generation...');
    
    try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
        const cheerio = require('cheerio');
        
        // Parse HTML content safely
        let htmlContent = templateData.htmlContent || '<h1>Resume Template</h1><p>Content not available</p>';
        
        // Clean up HTML
        htmlContent = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        htmlContent = htmlContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        
        const $ = cheerio.load(htmlContent);
        
        // Extract text content and create Word elements
        const elements = [];
        
        // Add title
        elements.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: templateData.name || 'Resume Template',
                        bold: true,
                        size: 32,
                        color: '2c3e50'
                    })
                ],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
        
        // Process headings
        $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text) {
                const level = parseInt(elem.tagName.charAt(1));
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: text,
                                bold: true,
                                size: level <= 2 ? 24 : 20,
                                color: '2c3e50'
                            })
                        ],
                        heading: level <= 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 200 }
                    })
                );
            }
        });
        
        // Process paragraphs
        $('p').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 0) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: text,
                                size: 22,
                                font: getFontFromCustomizations(customizations)
                            })
                        ],
                        spacing: { after: 120 }
                    })
                );
            }
        });
        
        // Process lists
        $('ul li, ol li').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '• ' + text,
                                size: 22,
                                font: getFontFromCustomizations(customizations)
                            })
                        ],
                        spacing: { after: 80 }
                    })
                );
            }
        });
        
        // If no content was extracted, add default content
        if (elements.length <= 1) {
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Resume content will appear here. Please customize your template and try again.',
                            size: 22,
                            italics: true,
                            color: '6c757d'
                        })
                    ]
                })
            );
        }
        
        // Create document
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 720,    // 0.5 inch
                            right: 720,
                            bottom: 720,
                            left: 720
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
        
        // IMPORTANT: Adjust these collection/model names based on your actual database schema.
        // If you're using Mongoose models, ensure they are imported and used here.
        // Example: const PersonalInfo = mongoose.model("PersonalInfo");
        
        const personalInfo = await PersonalInfo.findOne({ userId: userId }) || {};
        const contactInfo = await ContactInfo.findOne({ userId: userId }) || {};
        const professionalInfo = await ProfessionalInfo.findOne({ userId: userId }) || {};
        
        const workExperience = await WorkExperience.find({ userId: userId })
            .sort({ startDate: -1 }) || []; // Sort by start date descending
            
        const education = await Education.find({ userId: userId })
            .sort({ endYear: -1 }) || []; // Sort by end year descending
            
        const skills = await Skills.find({ userId: userId }) || [];
        
        const projects = await Projects.find({ userId: userId })
            .sort({ endDate: -1 }) || []; // Sort by end date descending
            
        const certifications = await Certifications.find({ userId: userId })
            .sort({ year: -1 }) || []; // Sort by year descending
            
        const languages = await Languages.find({ userId: userId }) || [];
        
        const socialProfiles = await SocialProfiles.findOne({ userId: userId }) || {};
        
        // Group skills by category for better template rendering (e.g., "Technical Skills", "Soft Skills")
        const skillsByCategory = groupSkillsByCategory(skills);
        
        const completeData = {
            personalInfo: personalInfo,
            contactInfo: contactInfo,
            professionalInfo: professionalInfo,
            workExperience: workExperience,
            education: education,
            skills: skills,
            skillsByCategory: skillsByCategory,
            projects: projects,
            certifications: certifications,
            languages: languages,
            socialProfiles: socialProfiles
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
        if (!grouped[category]) {
            grouped[category] = {
                category: category,
                skills: []
            };
        }
        grouped[category].skills.push(skill.name || skill.skill); // Use 'name' or 'skill' property
    });
    
    return Object.values(grouped); // Convert the object of grouped skills into an array
}

// Place this function alongside getUserCompleteResumeData
function populateTemplateWithUserData(templateHTML, userData, customizations = {}) {
    try {
        console.log("Populating template with user data...");
        
        // Compile the template using Handlebars
        const template = Handlebars.compile(templateHTML);
        
        // Prepare the context object for Handlebars. This object will be accessible within your template.
        const contextWithCustomizations = {
            ...userData, // Spread all user data (personalInfo, workExperience, etc.)
            customizations: customizations, // Pass customizations object
            // Add computed fields that might be useful in the template
            fullName: `${userData.personalInfo?.firstName || ""} ${userData.personalInfo?.lastName || ""}`.trim(),
            currentYear: new Date().getFullYear(),
            // Add boolean flags for conditional rendering to simplify template logic
            hasWorkExperience: userData.workExperience && userData.workExperience.length > 0,
            hasEducation: userData.education && userData.education.length > 0,
            hasSkills: userData.skills && userData.skills.length > 0,
            hasProjects: userData.projects && userData.projects.length > 0,
            hasCertifications: userData.certifications && userData.certifications.length > 0,
            hasLanguages: userData.languages && userData.languages.length > 0
        };
        
        // Generate the populated HTML by rendering the template with the context
        const populatedHTML = template(contextWithCustomizations);
        
        // Apply CSS customizations (color, font, layout) directly to the generated HTML
        const finalHTML = applyCustomizationsToHTML(populatedHTML, customizations);
        
        console.log("Template populated successfully");
        return finalHTML;
        
    } catch (error) {
        console.error("Error populating template with user data:", error);
        throw new Error(`Failed to populate template: ${error.message}`);
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
        
        // Fetch the template from your database (assuming ResumeTemplate is your Mongoose model for templates)
        const template = await ResumeTemplate.findById(templateId);
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
// Start the server
app.listen(port, '0.0.0.0', (req,res) => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server accessible at http://0.0.0.0:${port}`);
});

