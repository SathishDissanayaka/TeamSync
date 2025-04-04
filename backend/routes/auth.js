const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpGenerator = require('otp-generator');
const OTP = require('../models/otp');
const nodemailer = require('nodemailer');

// NodeMailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Signup Route
router.post('/signup', async (req, res) => {
  const { fullName, companyID, dob, email, gender, role, password, contactNumber } = req.body;

  if (!fullName || !companyID || !dob || !email || !gender || !role || !password || !contactNumber) {
    return res.status(400).json({ msg: 'Please fill all fields' });
  }

  // Age Validation (must be above 18)
  const birthDate = new Date(dob);
  let age = new Date().getFullYear() - birthDate.getFullYear();
  const month = new Date().getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && new Date().getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return res.status(400).json({ msg: 'You must be at least 18 years old to sign up.' });
  }

  // Contact Number Validation (must have exactly 10 digits)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(contactNumber)) {
    return res.status(400).json({ msg: 'Contact number must have exactly 10 digits.' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { companyID }] });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with Email or CompanyID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      companyID,
      dob,
      email,
      gender,
      role,
      password: hashedPassword,
      contactNumber
    });

    await newUser.save();
    res.status(201).json({ msg: 'Signup Complete' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, companyID, password } = req.body;

  if ((!email && !companyID) || !password) {
    return res.status(400).json({ msg: 'Please enter CompanyID/Email and Password.' });
  }

  try {
    const user = await User.findOne({ $or: [{ email }, { companyID }] });
    if (!user) {
      return res.status(400).json({ msg: 'CompanyID/Email or Password incorrect!' });
    }

    // Check if the account is locked
    if (user.locked) {
      return res.status(403).json({ msg: 'Your account has been locked. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'CompanyID/Email or Password incorrect!' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return token and role along with profile details
    res.json({ 
      msg: 'Login successful!', 
      token, 
      role: user.role,
      fullName: user.fullName,
      companyID: user.companyID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Debugging Route
router.get('/test', (req, res) => {
  res.json({ msg: 'Auth route working!' });
});

// Forgot Password (Generate OTP and send via Email)
router.post('/forgot-password', async (req, res) => {
  const { email, companyID } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email }, { companyID }] });

    if (!user) {
      return res.status(404).json({ msg: 'User not found!' });
    }

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    const newOtp = new OTP({ email: user.email, otp });
    await newOtp.save();

    // Send OTP via Email (NodeMailer)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP is ${otp}. It expires in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Email sending error:', err);
        return res.status(500).json({ msg: 'Error sending OTP via email' });
      } else {
        console.log('OTP sent via Email:', info.response);
        res.json({ msg: 'OTP sent successfully to your email!' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// OTP verification and password reset
router.post('/verify-otp', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ msg: 'Please provide email, OTP, and new password.' });
  }

  try {
    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired OTP.' });
    }

    // OTP is valid: Hash new password and update user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    // Delete used OTP
    await OTP.deleteOne({ email, otp });

    // Send confirmation email after successful password reset
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: updatedUser.email,
      subject: 'Password Reset Confirmation',
      text: `Hello ${updatedUser.fullName},\n\n` +
            `You have successfully reset your password for your TeamSync account.\n` +
            `If you did not perform this action, please contact support immediately.\n\n` +
            `Best regards,\nTeamSync`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending confirmation email:', err);
      } else {
        console.log('Confirmation email sent:', info.response);
      }
    });

    res.json({ msg: 'Password successfully reset!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ----- Protected route: Fetch user profile -----
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msg: "No authorization header found" });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: ... }
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ----- Terminate/Unlock Routes -----
// Lock (terminate) a user account
router.put('/users/:id/terminate', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { locked: true }, { new: true });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User account locked', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Unlock a user account
router.put('/users/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { locked: false }, { new: true });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User account unlocked', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
