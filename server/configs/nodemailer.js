import nodemailer from "nodemailer";

let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
        transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } catch (e) {
        console.warn("Failed to initialize nodemailer transporter:", e.message);
    }
}

const sendEmail = async ({ to, subject, body }) => {
    console.log("Email dispatch:", { to, subject, body });
    if (!transporter || !process.env.SENDER_EMAIL) {
        console.log(`[SMTP Not Configured] Skipped actual email dispatch to: ${to}`);
        return { success: true, simulated: true };
    }
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: body,
        });
        return response;
    } catch (error) {
        console.warn("Email sending failed:", error.message);
        return { success: false, error: error.message };
    }
};

export default sendEmail;
