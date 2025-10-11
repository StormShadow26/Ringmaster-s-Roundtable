import React, { useState, useEffect } from 'react';

const Leaderboard = ({ finalScore, leaderboardData }) => {
    const [countdown, setCountdown] = useState(30); // 30 second countdown
    const [showResults, setShowResults] = useState(false);

    const token = localStorage.getItem("jwtToken"); // Replace "token" with your key
let myUserId = null;

if (token) {
  try {
    const payloadBase64 = token.split(".")[1]; // JWT payload
    const decodedPayload = JSON.parse(atob(payloadBase64));
    myUserId = decodedPayload.userId || decodedPayload.id; // Adjust based on your token's payload
  } catch (err) {
    console.error("Error decoding JWT token:", err);
  }
}

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setShowResults(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const MyRank = () => {
        // const myUserId = "68dcc35823b9650c78a9fbff"; 
        const myRankIndex = leaderboardData.findIndex(entry => entry.userId._id === myUserId);

        if (myRankIndex === -1) {
            return <div className="mt-8 p-4 bg-blue-900 rounded-lg text-center"><p className="text-xl">Your Final Score: {finalScore}</p></div>;
        }
        return (
            <div className="mt-8 p-4 bg-blue-900 rounded-lg text-center">
                <p className="text-2xl font-bold">Your Rank: #{myRankIndex + 1}</p>
                <p className="text-lg">{leaderboardData[myRankIndex].score} Points</p>
            </div>
        );
    };

    if (!showResults) {
        return (
            <div className="text-center">
                <h2 className="text-3xl mb-4">Quiz Finished!</h2>
                <p className="text-xl text-gray-400">Leaderboard will be revealed in <span className="text-2xl font-mono text-white">{countdown}</span> seconds...</p>
            </div>
        );
    }

    return (
        <div className="w-full animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-4">Final Leaderboard</h2>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <ol>
                    {leaderboardData.slice(0, 10).map((entry, index) => (
                        <li key={index} className="flex justify-between items-center text-lg p-3 border-b border-gray-700">
                            <span>#{index + 1} {entry.userId.email}</span>
                            <span className="font-semibold">{entry.score} pts</span>
                        </li>
                    ))}
                </ol>
            </div>
            <MyRank />
        </div>
    );
};

export default Leaderboard;