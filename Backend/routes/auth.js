const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" },
    );

    res
      .status(201)
      .json({
        message: "User registered successfully",
        token,
        username: newUser.name,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" },
    );

    res.json({ message: "Login successful", token, username: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let temporaryPassword = "";
    for (let i = 0; i < 6; i++) {
      temporaryPassword += chars.charAt(
        Math.floor(Math.random() * chars.length),
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successful", temporaryPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
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
    if (Object.keys(updateData.$set).length > 0)
      updateOperation.$set = updateData.$set;
    if (Object.keys(unsetData).length > 0) updateOperation.$unset = unsetData;

    const user = await User.findByIdAndUpdate(req.userId, updateOperation, {
      returnDocument: "after",
    }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/signup", (req, res) => {
  // Forward to register
  res.redirect(307, "/api/auth/register");
});

module.exports = router;
