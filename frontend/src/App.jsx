
import { useState, useRef, useEffect } from "react";
import Home from "./components/Home";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import Explore from "./components/Explore"
import { Routes, Route } from "react-router";
import Chat from "./components/Chat";
import PhotoGallery from "./components/PhotoGallery";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/authmodal" element={<AuthModal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat/>} />
        <Route path="/explore" element={<Explore/>}/>
        <Route path="/photos" element={<PhotoGallery/>}/>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
