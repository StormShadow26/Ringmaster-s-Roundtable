import express from "express";
import ChatHistory from "../models/chatHistory.model.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get user's chat history (list view without messages)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const chatHistory = await ChatHistory.getUserChats(userId, limit);
    
    res.status(200).json({
      success: true,
      data: chatHistory,
      message: "Chat history retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: error.message
    });
  }
});

// Get a specific chat with all messages
router.get("/:chatId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    
    const chat = await ChatHistory.getChatWithMessages(userId, chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: chat,
      message: "Chat retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat",
      error: error.message
    });
  }
});

// Create a new chat session
router.post("/new", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = Date.now().toString(); // Generate unique chat ID
    
    const newChat = await ChatHistory.createNewChat(userId, chatId);
    
    res.status(201).json({
      success: true,
      data: newChat,
      message: "New chat created successfully"
    });
  } catch (error) {
    console.error("Error creating new chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create new chat",
      error: error.message
    });
  }
});

// Add message to a chat
router.post("/:chatId/messages", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { sender, text, travelData } = req.body;
    
    // Validate input
    if (!sender || !text) {
      return res.status(400).json({
        success: false,
        message: "Sender and text are required"
      });
    }
    
    if (!['user', 'ai'].includes(sender)) {
      return res.status(400).json({
        success: false,
        message: "Sender must be 'user' or 'ai'"
      });
    }
    
    // Find or create chat
    let chat = await ChatHistory.findOne({ userId, chatId, isActive: true });
    
    if (!chat) {
      // Create new chat if it doesn't exist
      chat = await ChatHistory.createNewChat(userId, chatId);
    }
    
    // Add message
    await chat.addMessage(sender, text, travelData);
    
    res.status(200).json({
      success: true,
      data: chat,
      message: "Message added successfully"
    });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add message",
      error: error.message
    });
  }
});

// Delete/Archive a chat
router.delete("/:chatId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    
    const chat = await ChatHistory.findOneAndUpdate(
      { userId, chatId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Chat deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete chat",
      error: error.message
    });
  }
});

// Update chat title
router.patch("/:chatId/title", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }
    
    const chat = await ChatHistory.findOneAndUpdate(
      { userId, chatId, isActive: true },
      { title: title.trim().slice(0, 100) },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: chat,
      message: "Chat title updated successfully"
    });
  } catch (error) {
    console.error("Error updating chat title:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update chat title",
      error: error.message
    });
  }
});

export default router;