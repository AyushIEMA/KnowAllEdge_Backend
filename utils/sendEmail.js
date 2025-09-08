
const nodemailer = require("nodemailer")
//email verification during signup
exports.sendEmail = async (identifier, otpCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      auth: {
        user: process.env.NODEMAILER_GMAIL,
        pass: process.env.NODEMAILER_GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_GMAIL,
      to: identifier,
      subject: "IELTS : OTP for Password Reset",
      text: `Dear User,

To reset your password, please use this validation OTP (valid for 3 minutes).

Your OTP is: ${otpCode}
      
Please keep this information confidential and do not share it with anyone. If you did not request this OTP, please ignore this email.
      
If you have any questions or concerns, please don't hesitate to contact us.

Thank you for using our service. 
      
Best regards,
[IELTS English Learning App]`,
    };

    await transporter.sendMail(mailOptions);
    return true; // ✅ success
  } catch (err) {
    console.error("Error sending OTP via email:", err.message);
    return false; // ✅ failure
  }
};

//forget password otp send
exports.sendForgetPasswordOTP = async (identifier, otpCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      auth: {
        user: process.env.NODEMAILER_GMAIL,
        pass: process.env.NODEMAILER_GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_GMAIL,
      to: identifier,
      subject: "IELTS : OTP for Password Reset",
      text: `Dear User,

To reset your password, please use this validation OTP (valid for 3 minutes).

Your OTP is: ${otpCode}
      
Please keep this information confidential and do not share it with anyone. If you did not request this OTP, please ignore this email.
      
If you have any questions or concerns, please don't hesitate to contact us.

Thank you for using our service. 
      
Best regards,
[IELTS English Learning App]`,
    };

    await transporter.sendMail(mailOptions);
    return true; // ✅ success
  } catch (err) {
    console.error("Error sending OTP via email:", err.message);
    return false; // ✅ failure
  }
};
