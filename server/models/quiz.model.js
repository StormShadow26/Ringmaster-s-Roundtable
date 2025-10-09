import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    marks: { type: Number, default: 10 },
    timeLimit: { type: Number, default: 30 }, // Time in seconds for this question
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    questions: [questionSchema],
    status: {
        type: String,
        enum: ['scheduled', 'live', 'finished'],
        default: 'scheduled',
    },
    // To store user scores
    scores: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, default: 0 },
    }],
}, { timestamps: true });

// Create the model from the schema
const Quiz = mongoose.model('Quiz', quizSchema);

// Export the model as the default export
export default Quiz;