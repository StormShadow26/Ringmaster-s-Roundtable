import { useState } from "react";
import axios from "axios";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const res = await axios.post("http://localhost:5000/api/v1/mcp/chat", {
        message: input,
      });

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: res.data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Server error, try again." },
      ]);
    }

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-xl mx-auto border p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-1 p-2 rounded ${
              m.sender === "user" ? "bg-blue-200 self-end" : "bg-gray-200 self-start"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
