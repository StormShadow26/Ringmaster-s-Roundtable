import { useSelector } from "react-redux";
import { Routes, Route } from "react-router";

import Home from "./components/Home";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import NotFound from "./components/NotFound";
// import WeatherChecker from "./components/WeatherChecker"; // ✅ optional weather route

// 🔒 Private Route wrapper
function PrivateRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  if (!token) {
    return <NotFound />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/authmodal" element={<AuthModal />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />

      {/* Optional feature */}
      {/* <Route path="/weather" element={<WeatherChecker />} /> */}

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
