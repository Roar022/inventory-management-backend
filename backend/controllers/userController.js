const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate Token
const generateToken = (id) => {
  // Three Argument :- JSON Object, Secret Key, Expiration Options
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
// const bcrypt = require('bcrypt');
// const { Routes } = require("../Routes/userRoutes");

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  //   Validation
  if (!email || !password || !name) {
    res.status(400);
    // Express error handler
    throw new Error("Please fill the requierd details ");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be greater than 6 characters");
  }

  // check if user alrady exists or not
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("Email already exists");
  }

  //   Create new User
  const user = await User.create({
    name,
    password,
    email,
  });
  // Generate token
  const token = generateToken(user._id);

  res.cookie("token", token, {
    // path where the cookie is valid
    path: "/",
    // preventjs from accessing the cookie
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Enter all required details");
  }
  // Getting User
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User Does not exist");
  }

  //   User exists, check if password is correct or not
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  // Generate token
  const token = generateToken(user._id);

  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Logged out Successfully" });
});

// Get User
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("User not find");
  }
});

// get login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, phone, bio, photo } = user;
    (user.email = email),
      (user.name = req.body.name || name),
      (user.photo = req.body.photo || photo),
      (user.bio = req.body.bio || bio),
      (user.phone = req.body.phone || phone);

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      phone: updatedUser.phone,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(404);
    throw new Error("user not found, Please Sign Up");
  }

  // Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("enter old and new password");
  }

  //   check id old password matches password in DB
  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new Password
  if (user && isPasswordCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password changed");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exists");
  }

  //   Create Reset token
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  // console.log(resetToken);

  //   Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
  <h2>Hello ${user.name} </h2>
  <p>Please use the url below to reset your password</p>
  <p>This reset Link is valid for only 30 minutes</p>
  <a href=${resetUrl} clicktracking=off >${resetUrl}</a>
  `;

  const subject = "Password reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
  // res.send("forgot password");
});

// const resetPassword = asyncHandler(async (req, res) => {
//   const { password } = req.body;
//   const { resetToken } = req.params;

//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//     // find token in DB
//   const userToken = await Token.findOne({
//     token:hashedToken,
//     expiresAt:{gt:Date.now()}
//   });

//   if(!userToken){
//     res.status(404);
//     throw new Error("Invalid or Expired Token")
//   }

//   // Find user
//   const user = await User.findOne({_id:userToken.userId});
//   user.password=password;
//   await user.save()
//   res.status(200).json({
//   message:"Password Reset Successful, Please Login"
//   })
// });

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check password
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Invalid password");
  }

  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
