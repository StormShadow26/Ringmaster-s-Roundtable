import React, { useState, useEffect } from 'react';

const Question = ({ question, onAnswerSubmit, answerResult }) => {
    const [timeLeft, setTimeLeft] = useState(question.timeLimit);
    const [selectedOption, setSelectedOption] = useState(null);
    
    // --- NEW ANTI-CHEAT STATE ---
    const [tabSwitched, setTabSwitched] = useState(false);

    

    // Effect for the per-question countdown timer
    useEffect(() => {
        setTimeLeft(question.timeLimit);
        setSelectedOption(null); 
        // Reset the anti-cheat flag for the new question
        setTabSwitched(false); 
        
        const timer = setInterval(() => {
            setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [question]);

    // --- NEW ANTI-CHEAT useEffect for tab switching ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            // document.hidden is true when the user switches tabs
            if (document.hidden) {
                setTabSwitched(true);
            }
        };

        // Listen for the browser's visibilitychange event
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup the listener when the component unmounts
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); // The empty array ensures this effect runs only once

    const handleSelectOption = (index) => {
        // Prevent answering if tab was switched, time is up, or already answered
        if (tabSwitched || answerResult || timeLeft === 0) return; 
        setSelectedOption(index);
        onAnswerSubmit(question.index, index);
    };

    const getButtonClasses = (index) => {
        const baseClasses = "w-full text-left p-4 rounded-lg border-2 transition-transform transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed";
        
        if (answerResult) {
            if (index === answerResult.correctOptionIndex) return `${baseClasses} bg-green-500 border-green-400`;
            if (index === selectedOption && !answerResult.correct) return `${baseClasses} bg-red-500 border-red-400`;
        } else if (selectedOption === index) {
            return `${baseClasses} bg-blue-500 border-blue-400`;
        }
        return `${baseClasses} bg-gray-700 border-gray-600 hover:bg-gray-600`;
    };

    // --- NEW ANTI-CHEAT function to handle copy events ---
    const handleCopy = (event) => {
        // Prevent the default copy action
        event.preventDefault();
        // Set the clipboard text to our warning message
        event.clipboardData.setData('text/plain', 'Cheating is not allowed! 😉');
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                {/* Add the onCopy event handler to the question text */}
                <h3 onCopy={handleCopy} className="text-2xl font-semibold select-none">
                    Q{question.index + 1}: {question.questionText}
                </h3>
                <div className="text-2xl font-mono bg-gray-900 px-3 py-1 rounded-md">{timeLeft}s</div>
            </div>
            <ul className="space-y-4">
                {question.options.map((option, index) => (
                    <li key={index}>
                        <button
                            onClick={() => handleSelectOption(index)}
                            className={getButtonClasses(index)}
                            // UPDATED: Disable buttons if tab was switched
                            disabled={!!answerResult || timeLeft === 0 || tabSwitched}
                        >
                            {option}
                        </button>
                    </li>
                ))}
            </ul>

            {/* NEW: Show a "Time's Up" or "Tab Switched" message */}
            {timeLeft === 0 && !answerResult && (
                <p className="text-center text-yellow-400 mt-4">
                    Time's up! Waiting for the next question...
                </p>
            )}
            {tabSwitched && (
                 <p className="text-center text-red-500 font-semibold mt-4">
                    You switched tabs. The options for this question have been disabled.
                </p>
            )}
        </div>
    );
};

export default Question;