const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// /send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { email, isLogin } = req.body;

        if (!isLogin) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.create({ email, otp });

        const mailOptions = {
            from: '"The Arena - AI Snake & Ladder" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: 'Your Verification Code - The Arena',
            html: `
<div style="font-family: Arial, sans-serif; background-color: #111827; color: #fff; padding: 20px; border-radius: 8px; max-width: 500px; margin: auto;">
  <h2 style="color: #3b82f6;">Welcome to The Arena!</h2>
  <p>Here is your secret access code to create your account or login:</p>
  <div style="background-color: #1f2937; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #10b981; border-radius: 4px; margin: 20px 0;">
    ${otp}
  </div>
  <p style="color: #9ca3af; font-size: 12px;">This code is valid for 5 minutes. Do not share it with anyone.</p>
</div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email", error);
            }
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// /verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
        if (!otpRecord) return res.status(400).json({ error: 'OTP expired or invalid' });
        if (otpRecord.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// /register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

        res.status(201).json({ message: 'User registered successfully', token, username: newUser.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// /login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

        res.json({ message: 'Login successful', token, username: user.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// /reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Auth Middleware for profile routes
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// GET /profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { profileImage, name } = req.body;
        
        let updateData = { $set: {} };
        let unsetData = {};

        if (profileImage !== undefined) {
            if (profileImage === "") {
                unsetData.profileImage = "";
            } else {
                updateData.$set.profileImage = profileImage;
            }
        }
        if (name !== undefined) updateData.$set.name = name;

        const updateOperation = {};
        if (Object.keys(updateData.$set).length > 0) updateOperation.$set = updateData.$set;
        if (Object.keys(unsetData).length > 0) updateOperation.$unset = unsetData;

        const user = await User.findByIdAndUpdate(req.userId, updateOperation, { returnDocument: 'after' }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Note: Ensure /signup is either aliased to /register or removed if no longer used by frontend.
router.post('/signup', (req, res) => {
    // Forward to register
    res.redirect(307, '/api/auth/register');
});

module.exports = router;