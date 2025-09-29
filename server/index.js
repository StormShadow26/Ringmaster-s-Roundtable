//import express from "express"; // if "type": "module" in package.json
const express = require("express"); // if using CommonJS

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Simple route
app.get("/", (req, res) => {
  res.send("Hello, Node + Express + Nodemon!");
});

// Example API route
app.get("/", (req, res) => {
  res.json({ message: `Hello, ${req.params.name}!` });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
