
import  Quiz  from '../models/quiz.model.js';


export const createQuiz = async (req, res) => {
    try {
        const { title, startTime, questions } = req.body;

        // Basic validation
        if (!title || !startTime || !questions || questions.length === 0) {
            return res.status(400).json({ message: 'Missing required fields: title, startTime, questions.' });
        }

        const newQuiz = new Quiz({
            title,
            startTime,
            questions,
            status: 'scheduled' // Quizzes are always 'scheduled' on creation
        });

        const savedQuiz = await newQuiz.save();
        res.status(201).json(savedQuiz); // Respond with the created quiz

    } catch (error) {
        console.error("Error creating quiz:", error);
        res.status(500).json({ message: 'Server error while creating quiz.', error });
    }
};

/**
 * Finds the next quiz that is either 'live' or 'scheduled' for the future.
 * This is used by the frontend to know what to display on page load.
 */
export const getActiveQuiz = async (req, res) => {
    try {
        // Find the first quiz that is either 'live' or the next one 'scheduled'
        const quiz = await Quiz.findOne({
            status: { $in: ['scheduled', 'live'] }
        }).sort({ startTime: 1 }); // Sorts to get the one with the nearest start time

        if (!quiz) {
            return res.status(404).json({ message: 'No active or scheduled quiz found.' });
        }

        res.status(200).json(quiz);

    } catch (error) {
        console.error("Error fetching active quiz:", error);
        res.status(500).json({ message: 'Server error while fetching active quiz.', error });
    }
};