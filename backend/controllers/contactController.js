const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  if (!subject || !message) {
    res.status(400);
    throw new Error("Please add subject and message");
  }
  const send_to = process.env.EMAIL_USER;
  // console.log(send_to);
  const sent_from = process.env.EMAIL_USER;
  // console.log(sent_from);
  const reply_to = user.email;
  // console.log(reply_to);

  // console.log(message);
  // console.log(subject);
  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

module.exports = { contactUs };
