import axios from "axios";

export const verifyEmail = async (token, email) => {
  try {
    const verifyLink = `${process.env.CLIENT_URL}/verify/${token}`;

    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ElectraZone Support",
          email: process.env.MAIL_USER,
        },
        to: [{ email }],
        subject: "ElectraZone email verification",
        htmlContent: `
          <p>Hello,</p>
          <p>Please confirm your email address by clicking the link below:</p>
          <p><a href="${verifyLink}">Verify email</a></p>
          <p>If you did not create this account, you can ignore this email.</p>
          <p>Thanks,<br/>ElectraZone Team</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    console.log("Email sent:", res.data);
  } catch (error) {
    console.error("Email error:", error.response?.data || error.message);
  }
};
