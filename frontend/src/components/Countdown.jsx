import React, { useState, useEffect } from 'react';

const Countdown = ({ startTime }) => {
    const [timeLeft, setTimeLeft] = useState(startTime - Date.now());

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(startTime - Date.now()), 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    if (timeLeft <= 0) {
        return <h2 className="text-3xl text-center font-semibold text-green-400 animate-pulse">Quiz is about to start!</h2>;
    }

    const seconds = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');
    const minutes = String(Math.floor((timeLeft / (1000 * 60)) % 60)).padStart(2, '0');
    const hours = String(Math.floor((timeLeft / (1000 * 60 * 60)) % 24)).padStart(2, '0');

    return (
        <div className="text-center">
            <h2 className="text-2xl text-gray-400 mb-4">Quiz Starts In</h2>
            <p className="text-6xl font-mono tracking-widest">{hours}:{minutes}:{seconds}</p>
        </div>
    );
};

export default Countdown;