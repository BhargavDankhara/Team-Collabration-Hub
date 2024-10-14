import bcrypt from "bcryptjs";

import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signUp = async (req, res) => {
  try {
    const { name, username, password, confirmPassword, gender } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password using bcryptjs
    const salt = await bcrypt.genSalt(15);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a user profile pic
    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
      gender,
      profilePic: gender === "male" ? boyProfilePic : girProfilePic,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(404).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("error in signup controller", error.message);
    res.status(500).json({ error: "internal error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("error in login controller", error.message);
    res.status(500).json({ error: "internal error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt-tch", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("error in logout controller", error.message);
    res.status(500).json({ error: "internal error" });
  }
};
