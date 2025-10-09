import  Quiz  from '../models/quiz.model.js';
import { sendCongratulationEmail } from './emailService.js';
import { generateReferralCode } from '../helpers/referralHelper.js';

let io = null;
// --- NEW: A variable to store the timestamp of when the current question was sent ---
let currentQuestionSentAt = 0;

const quizService = {
    init: (socketIoInstance) => {
        io = socketIoInstance;
    },

    startQuiz: async (quizId) => {
        try {
            const quiz = await Quiz.findById(quizId).populate('questions');
            if (!quiz || quiz.status !== 'scheduled') return;

            quiz.status = 'live';
            await quiz.save();
            io.emit('quiz_start', { quizId: quiz._id, title: quiz.title });

            let currentQuestionIndex = 0;
            let questionTimerHandle = null;

            const sendNextQuestion = () => {
                if (currentQuestionIndex >= quiz.questions.length) {
                    clearTimeout(questionTimerHandle);
                    quizService.endQuiz(quizId);
                    return;
                }

                const question = quiz.questions[currentQuestionIndex];
                const questionData = {
                    index: currentQuestionIndex,
                    questionText: question.questionText,
                    options: question.options,
                    timeLimit: question.timeLimit,
                    marks: question.marks,
                };

                console.log(`Sending question ${currentQuestionIndex + 1} for quiz ${quizId}`);
                io.emit('new_question', questionData);
                
                // --- NEW: Record the timestamp when the question is sent ---
                currentQuestionSentAt = Date.now();

                currentQuestionIndex++;
                questionTimerHandle = setTimeout(sendNextQuestion, question.timeLimit * 1000);
            };

            sendNextQuestion();

        } catch (error) {
            console.error(`Error starting quiz ${quizId}:`, error);
        }
    },

    handleAnswer: async (socket, data) => {
        const { quizId, questionIndex, selectedOptionIndex, userId } = data;
        const quiz = await Quiz.findById(quizId);
        if (!quiz || quiz.status !== 'live' || !socket) return;

        const question = quiz.questions[questionIndex];
        const isCorrect = question.correctOptionIndex === selectedOptionIndex;

        if (isCorrect) {
            // --- NEW: Time-based score calculation ---
            const timeTakenMs = Date.now() - currentQuestionSentAt;
            const timeTakenSec = timeTakenMs / 1000;
            const timeLimitSec = question.timeLimit;
            
            // Formula: 50% of points for correctness, 50% for speed.
            const correctnessPoints = question.marks * 0.5;
            const speedBonus = (question.marks * 0.5) * (1 - (timeTakenSec / timeLimitSec));
            
            // Ensure bonus is not negative if user is slow
            const finalSpeedBonus = Math.max(0, speedBonus); 
            
            const totalScore = Math.round(correctnessPoints + finalSpeedBonus);
            console.log(`User ${userId} answered correctly in ${timeTakenSec.toFixed(2)}s, scoring ${totalScore} points.`);

            let userScore = quiz.scores.find(s => s.userId.toString() === userId);
            if (userScore) {
                userScore.score += totalScore;
            } else {
                quiz.scores.push({ userId, score: totalScore });
            }
            await quiz.save();
        }

        socket.emit('answer_result', {
            correct: isCorrect,
            correctOptionIndex: question.correctOptionIndex
        });
    },

    endQuiz: async (quizId) => {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || quiz.status === 'finished') return;

        quiz.status = 'finished';
        await quiz.save();
        console.log(`Quiz "${quiz.title}" has ended.`);
        io.emit('quiz_end', { message: "The quiz has finished! Calculating results..." });

        setTimeout(() => {
            quizService.generateLeaderboard(quizId);
        }, 30 * 1000);
    },

   generateLeaderboard: async (quizId) => {
        const quiz = await Quiz.findById(quizId).populate('scores.userId', 'email');
        if (!quiz) return;

        const leaderboard = quiz.scores.sort((a, b) => b.score - a.score);
        console.log('Leaderboard generated.');
        io.emit('leaderboard_update', leaderboard);

        // --- NEW LOGIC TO SEND EMAILS ---
        const topPerformers = leaderboard.slice(0, 3); // Get the top 3
        
        console.log(`Sending emails to top ${topPerformers.length} performers...`);
        for (const performer of topPerformers) {
            const user = performer.userId;
            
            // 1. Generate the unique referral code
            const referralCode = generateReferralCode(user._id, quiz.createdAt);
            
            // 2. Send the email
            await sendCongratulationEmail(user, quiz, referralCode);
        }
    }
};

export default quizService;