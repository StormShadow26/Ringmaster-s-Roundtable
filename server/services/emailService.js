import nodemailer from 'nodemailer';

// Configure the email transporter using your .env credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a congratulatory email to a quiz winner.
 * @param {object} user - The user object (containing email).
 * @param {object} quiz - The quiz object (containing title).
 * @param {string} referralCode - The unique referral code.
 */
export const sendCongratulationEmail = async (user, quiz, referralCode) => {
    const mailOptions = {
        from: `"Ringmaster's Roundtable" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🏆 Congratulations on your performance in ${quiz.title}!`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hello ${user.email},</h2>
                <p>Congratulations! You placed in the top 3 for the quiz: <strong>${quiz.title}</strong>.</p>
                <p>As a reward for your excellent performance, here is a unique referral code you can share:</p>
                <div style="background-color: #f2f2f2; padding: 10px 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <strong style="font-size: 1.2em; letter-spacing: 2px;">${referralCode}</strong>
                </div>
                <p>Thank you for participating, and we hope to see you at the next event!</p>
                <br>
                <p>Best regards,</p>
                <p>The Ringmaster's Roundtable Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Congratulatory email sent to ${user.email}`);
    } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
    }
};