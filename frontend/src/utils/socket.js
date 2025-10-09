// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

// The URL of your backend server
const SERVER_URL = 'http://localhost:5000';

const socket = io(SERVER_URL, {
    autoConnect: false // We will connect manually from our component
});

export default socket;