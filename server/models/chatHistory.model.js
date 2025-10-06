import mongoose from "mongoose";

// Individual message schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai'],
  },
  text: {
    type: String,
    required: true,
  },
  travelData: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for travel data
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, { _id: false }); // Disable _id for subdocuments

// Chat session schema
const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster queries
  },
  chatId: {
    type: String,
    required: true,
    unique: true, // Ensure unique chat IDs
  },
  title: {
    type: String,
    default: 'New Chat',
    maxlength: 100,
  },
  preview: {
    type: String,
    default: 'Start a new conversation...',
    maxlength: 200,
  },
  messages: [messageSchema],
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Compound index for efficient user chat queries
chatHistorySchema.index({ userId: 1, lastActivityAt: -1 });

// Pre-save middleware to update lastActivityAt when messages are added
chatHistorySchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Instance method to add a message
chatHistorySchema.methods.addMessage = function(sender, text, travelData = null) {
  this.messages.push({
    sender,
    text,
    travelData,
    timestamp: new Date()
  });
  
  // Update title and preview if this is the first user message
  if (sender === 'user' && this.messages.filter(m => m.sender === 'user').length === 1) {
    this.title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
    this.preview = text.slice(0, 100) + (text.length > 100 ? '...' : '');
  }
  
  return this.save();
};

// Static method to get user's chat history
chatHistorySchema.statics.getUserChats = function(userId, limit = 20) {
  return this.find({ 
    userId, 
    isActive: true 
  })
  .sort({ lastActivityAt: -1 })
  .limit(limit)
  .select('-messages') // Exclude messages for list view (performance)
  .lean();
};

// Static method to get a specific chat with all messages
chatHistorySchema.statics.getChatWithMessages = function(userId, chatId) {
  return this.findOne({ 
    userId, 
    chatId, 
    isActive: true 
  }).lean();
};

// Static method to create a new chat session
chatHistorySchema.statics.createNewChat = function(userId, chatId) {
  return this.create({
    userId,
    chatId,
    title: 'New Chat',
    preview: 'Start a new conversation...',
    messages: []
  });
};

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;