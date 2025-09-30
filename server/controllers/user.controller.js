const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    user.jwtToken = token;
    await user.save();
    res.status(201).json({ token, user: { email: user.email, id: user._id } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });
    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid credentials." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    user.jwtToken = token;
    await user.save();
    res.json({ token, user: { email: user.email, id: user._id } });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// Google OAuth (expects googleId, email)
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email } = req.body;
    if (!googleId || !email)
      return res.status(400).json({ message: "Google ID and email required." });
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, googleId, isGoogleUser: true });
    } else if (!user.isGoogleUser) {
      return res
        .status(409)
        .json({ message: "Email already registered with password." });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    user.jwtToken = token;
    await user.save();
    res.json({ token, user: { email: user.email, id: user._id } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Google authentication failed", error: err.message });
  }
};
