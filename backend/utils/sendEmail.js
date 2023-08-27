const nodemailer = require("nodemailer");
const User = require("../models/userModel");

const sendEmail = async (subject, message, sent_to, sent_from, reply_to) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Option for sending email
  const options = {
    from: sent_from,
    to: sent_to,
    replyTo: reply_to,
    subject: subject,
    html: message,
  };

  // send email
  transporter.sendMail(options, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(info);
    }
  });
};

module.exports = sendEmail;
