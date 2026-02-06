import nodemailer from "nodemailer";

export const sendOTPEmail = (otp, email) => {
  let sender = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  let mail = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    // text: `Hi! There, You have recently visitied our website and you need to verify your email address. Please click the link below to verify your email address. http://localhost:3000/verify/${token}`,
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p>`, 
    // attachments: [
    //   {
    //     filename: "mailtrap.png",
    //     path: __dirname + "/mailtrap.png",
    //     cid: "uniq-mailtrap.png",
    //   },
    // ],
  };

  sender.sendMail(mail, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("OTP sent successfully: " + info.response);
    }
  });
};
