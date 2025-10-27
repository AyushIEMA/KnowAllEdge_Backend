
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
  subject: "KnowAllEdge - Email Verification",
  text: `Dear User, Thanks for registering with us.

Your OTP code is: ${otpCode}

Use this code to complete your verification. It will expire shortly.

Thanks,
KnowAllEdge Team`,
  html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
    <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 10px; padding: 30px 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
      
      <h2 style="color: #e60000; font-size: 22px; margin-bottom: 6px;">KnowAllEdge</h2>
      <h4 style="color: #000000; font-size: 16px; margin-top: 0;">OTP Verification</h4>

      <p style="color: #333333; font-size: 15px; margin-top: 25px; margin-bottom: 8px;">Dear User, Thanks for registering with us.</p>
      <p style="color: #333333; font-size: 14px; margin-top: 0;">Your OTP code is:</p>

      <div style="background-color: #f2f2f2; border-radius: 6px; padding: 15px 0; margin: 15px 0 20px;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #111111;">${otpCode}</span>
      </div>

      <p style="color: #555555; font-size: 13px; margin: 10px 0 25px;">
        Use this code to complete your verification. This code will expire in <b>3 minutes</b>.
      </p>

      <p style="color: #555555; font-size: 13px; margin: 0;">
        Thanks,<br/>
        <strong>KnowAllEdge Team</strong>
      </p>
    </div>

    <p style="text-align: center; color: #999999; font-size: 11px; margin-top: 20px;">
      © ${new Date().getFullYear()} KnowAllEdge. All rights reserved.
    </p>
  </div>
  `,
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
      subject: "KnowAllEdge - Password Reset OTP",
      text: `Dear User,

We received a request to reset your password.

Your OTP code is: ${otpCode}

Use this code to reset your password. It will expire in 3 minutes.

If you did not request a password reset, please ignore this email.

Thanks,
KnowAllEdge Team`,
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
        <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 10px; padding: 30px 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
          
          <h2 style="color: #e60000; font-size: 22px; margin-bottom: 6px;">KnowAllEdge</h2>
          <h4 style="color: #000000; font-size: 16px; margin-top: 0;">Password Reset OTP</h4>

          <p style="color: #333333; font-size: 15px; margin-top: 25px; margin-bottom: 8px;">Dear User,</p>
          <p style="color: #333333; font-size: 14px; margin-top: 0;">
            We received a request to reset your password. Please use the OTP below to proceed:
          </p>

          <div style="background-color: #f2f2f2; border-radius: 6px; padding: 15px 0; margin: 20px 0 25px;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #111111;">${otpCode}</span>
          </div>

          <p style="color: #555555; font-size: 13px; margin: 10px 0 25px;">
            Use this code to reset your password. It will expire in <b>3 minutes</b>.
            <br/>If you did not request a password reset, please ignore this email.
          </p>

          <p style="color: #555555; font-size: 13px; margin: 0;">
            Thanks,<br/>
            <strong>KnowAllEdge Team</strong>
          </p>
        </div>

        <p style="text-align: center; color: #999999; font-size: 11px; margin-top: 20px;">
          © ${new Date().getFullYear()} KnowAllEdge. All rights reserved.
        </p>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true; // ✅ success
  } catch (err) {
    console.error("Error sending OTP via email:", err.message);
    return false; // ✅ failure
  }
};
