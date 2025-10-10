import jwt from 'jsonwebtoken';

/**
 * Generates a unique referral code (JWT) for a user.
 * @param {string} userId - The user's MongoDB ObjectId.
 * @param {Date} quizDate - The date of the quiz.
 * @returns {string} The generated referral code.
 */
export const generateReferralCode = (userId, quizDate) => {
    // The data we want to encode in our referral code
    const payload = {
        userId: userId,
        quizDate: quizDate.toISOString(), // Store date in a standard format
    };

    // Sign the payload with our secret key to create the token
    // It will be valid for 90 days
    const referralCode = jwt.sign(payload, process.env.REFERRAL_SECRET, {
        expiresIn: '90d',
    });

    return referralCode;
};