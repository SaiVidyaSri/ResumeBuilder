const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require("multer");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require("fs");
const headlineRoutes = require('./models/resumeheadline');
const ResumeHeadline = require('./models/resumeheadline');

const KeySkills = require('./models/KeySkills');
const Education = require('./models/Education');
const ITSkills = require('./models/ITskills'); // Fixed: Uncommented this line
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
app.get('/admin', (req,res) => {
    res.sendFile(path.join(__dirname,'public' ,'admin-index.html'));
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

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isVerified: true });
  if (!user) return res.status(400).json({ message: 'User not found or not verified' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

  res.json({ 
    message: 'Sign in successful',
    userId: user._id 
  });
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
    try {
        const { name, description, features, category, industry, rating } = req.body;
        const htmlContent = req.files.htmlFile ? req.files.htmlFile[0].buffer.toString() : "";
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


// Start the server
app.listen(port, '0.0.0.0', (req,res) => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server accessible at http://0.0.0.0:${port}`);
});

