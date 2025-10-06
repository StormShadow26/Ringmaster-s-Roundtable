import mongoose from 'mongoose';
import ChatHistory from './models/chatHistory.model.js';
import database from './database/database.js';

const testChatSave = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await database.connect();
    
    console.log('✅ Database connected');
    
    // Test creating a new chat
    const testUserId = new mongoose.Types.ObjectId();
    const testChatId = `test-${Date.now()}`;
    
    console.log('🔍 Creating new chat...');
    const newChat = await ChatHistory.createNewChat(testUserId, testChatId);
    console.log('✅ New chat created:', newChat._id);
    
    // Test adding messages
    console.log('🔍 Adding user message...');
    await newChat.addMessage('user', 'Hello, plan a trip to Paris');
    console.log('✅ User message added');
    
    console.log('🔍 Adding AI message...');
    await newChat.addMessage('ai', 'I can help you plan a great trip to Paris!', {
      city: 'Paris',
      attractions: ['Eiffel Tower', 'Louvre Museum']
    });
    console.log('✅ AI message added');
    
    // Verify the chat was saved
    console.log('🔍 Retrieving chat from database...');
    const savedChat = await ChatHistory.getChatWithMessages(testUserId, testChatId);
    
    if (savedChat) {
      console.log('✅ Chat retrieved successfully!');
      console.log('📄 Chat details:', {
        id: savedChat._id,
        title: savedChat.title,
        messageCount: savedChat.messages.length,
        messages: savedChat.messages.map(m => ({
          sender: m.sender,
          text: m.text.slice(0, 50) + '...'
        }))
      });
    } else {
      console.log('❌ Chat not found in database');
    }
    
    // Clean up test data
    console.log('🔍 Cleaning up test data...');
    await ChatHistory.findByIdAndDelete(newChat._id);
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database disconnected');
    process.exit(0);
  }
};

testChatSave();