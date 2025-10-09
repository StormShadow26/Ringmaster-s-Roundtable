import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';

// We will create these components next
import Countdown from './Countdown';
import Question from './Question';
import Leaderboard from './Leaderboard';

const QuizPage = () => {
    const [quizState, setQuizState] = useState('loading');
    const [quizInfo, setQuizInfo] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [answerResult, setAnswerResult] = useState(null);
    const [myScore, setMyScore] = useState(0);

    useEffect(() => {
        // Fetch initial quiz status on component mount
        const fetchQuizStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/v1/quiz/active');
                if (response.ok) {
                    const data = await response.json();
                    setQuizInfo(data);
                    setQuizState(data.status); // Status will be 'scheduled' or 'live'
                } else {
                    setQuizState('no_quiz');
                }
            } catch (error) {
                console.error("Failed to fetch quiz status:", error);
                setQuizState('error');
            }
        };

        fetchQuizStatus();
        socket.connect();

        // Centralized socket event listeners
        socket.on('quiz_start', () => setQuizState('live'));
        socket.on('new_question', (question) => {
            setCurrentQuestion(question);
            setAnswerResult(null); // Reset answer result for new question
        });
        socket.on('quiz_end', () => setQuizState('finished'));
        socket.on('answer_result', (result) => {
            setAnswerResult(result);
            if (result.correct) {
                setMyScore(prevScore => prevScore + (currentQuestion?.marks || 0));
            }
        });
        socket.on('leaderboard_update', (data) => setLeaderboard(data));

        // Cleanup on unmount
        return () => socket.disconnect();
    }, []);

    const handleAnswerSubmit = (questionIndex, optionIndex) => {
        if (answerResult) return; // Prevent re-submission
        const userId = "68dcc35823b9650c78a9fbff"; // IMPORTANT: Replace with actual user ID
        socket.emit('submit_answer', { quizId: quizInfo._id, questionIndex, selectedOptionIndex: optionIndex, userId });
    };
    
    // Helper function to decide which component to render
    const renderContent = () => {
        switch (quizState) {
            case 'loading':
                return <p className="text-center text-gray-400">Loading Quiz...</p>;
            case 'scheduled':
                return <Countdown startTime={new Date(quizInfo.startTime).getTime()} />;
            case 'live':
                return currentQuestion ? (
                    <Question
                        question={currentQuestion}
                        onAnswerSubmit={handleAnswerSubmit}
                        answerResult={answerResult}
                    />
                ) : (
                    <p className="text-center text-gray-400">Waiting for the next question...</p>
                );
            case 'finished':
                return <Leaderboard finalScore={myScore} leaderboardData={leaderboard} />;
            case 'no_quiz':
                return <p className="text-center text-gray-400">No upcoming quiz. Please check back later!</p>;
            default:
                return <p className="text-center text-red-500">Error connecting to the server.</p>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
            <div className="w-full max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">{quizInfo?.title || 'Quiz Time!'}</h1>
                {renderContent()}
            </div>
        </div>
    );
};

export default QuizPage;