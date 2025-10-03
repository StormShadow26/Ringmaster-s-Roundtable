import { useSelector } from "react-redux";
import Home from "./components/Home";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import NotFound from "./components/NotFound";
import { Routes, Route, Navigate } from "react-router";

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
      <Route path="/" element={<Home />} />
      <Route path="/authmodal" element={<AuthModal />} />

      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />

      <Route path="/chat" element={
        <PrivateRoute>
          <Chat />
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}

export default App;
