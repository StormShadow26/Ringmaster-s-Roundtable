import cron from 'node-cron';
import Quiz from '../models/quiz.model.js';
import quizService from '../services/quizService.js';

const initializeQuizScheduler = () => {
    console.log('🕒 Robust quiz scheduler initialized. Checking every 15 seconds.');
    
    // UPDATED: Run the task every 15 seconds for better precision.
    cron.schedule('*/15 * * * * *', async () => {
        try {
            const now = new Date();
            
            // --- UPDATED & SIMPLIFIED LOGIC ---
            // Find any quiz that is still 'scheduled' but its start time has already passed.
            const quizzesToStart = await Quiz.find({
                startTime: { $lte: now }, // Start time is now or in the past
                status: 'scheduled'      // But its status is still 'scheduled'
            });

            if (quizzesToStart.length > 0) {
                console.log(`Found ${quizzesToStart.length} quiz(zes) to start.`);
                
                // Use Promise.all to start all of them concurrently
                await Promise.all(quizzesToStart.map(quiz => 
                    quizService.startQuiz(quiz._id)
                ));
            }
        } catch (error) {
            console.error('Error in robust quiz scheduler:', error);
        }
    });
};

export default initializeQuizScheduler;