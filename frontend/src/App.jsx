
import { useState, useRef, useEffect } from "react";
import Home from "./components/Home";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import { Routes, Route } from "react-router";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/authmodal" element={<AuthModal />} />
      <Route path="/dashboard" element={<Dashboard />} />
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
      <Route path="/chat" element={<Chat/>} />
>>>>>>> Stashed changes
=======
      <Route path="/chat" element={<Chat/>} />
>>>>>>> Stashed changes
    </Routes>
  );
}

export default App;
