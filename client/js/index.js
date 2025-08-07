// WebSocket handling logic for retro-style chat room
let ws;
let username = '';
let title = document.title;
let currentTheme = 'retro';

// Connect to WebSocket server
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = function (event) {
        title = "Connected";
        addSystemMessage('Successfully connected to the server');
    };

    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };

    ws.onclose = function (event) {
        title = "Connection closed";
        addSystemMessage('Disconnected from the server. Reconnecting...');
        setTimeout(connect, 3000); // Reconnect after 3 seconds
    };

    ws.onerror = function (error) {
        title = "Connection error";
        addSystemMessage('Connection error');
    };
}

// Handle received messages
function handleMessage(message) {
    switch (message.event) {
        case 'online_count':
            document.getElementById('onlineCount').textContent = message.data.data;
            break;
        case 'enter_room':
        case 'leave_room':
        case 'chat_text':
        case 'chat_photo':
            addUserMessage(message);
            break;
        default:
            title = 'unknown message type:';
    }
}

// Add system message
function addSystemMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';

    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    messageElement.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="content">${text}</span>
    `;

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add user message
function addUserMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    messageElement.innerHTML = `
        <div class="message-header">
            <span class="username">${message.data.name}</span>
            <span class="timestamp">${timestamp}</span>
        </div>
        <div class="content">${message.data.data}</div>
    `;

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Set username
function setUserName() {
    const nameInput = document.getElementById('nameInput');

    if (!nameInput.value.trim()) {
        addSystemMessage('Please enter a username');
        return;
    }

    username = nameInput.value.trim();
    addSystemMessage(`Username set to: ${username}`);
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');

    if (!username) {
        addSystemMessage('Please set a username first');
        return;
    }

    if (!messageInput.value.trim()) {
        addSystemMessage('Please enter a message');
        return;
    }

    // Send chat message
    const chatMessage = {
        event: 'chat_text',
        data: {
            name: username,
            data: messageInput.value.trim()
        }
    };

    ws.send(JSON.stringify(chatMessage));
    messageInput.value = '';
}

// Switch theme
function switchTheme(theme) {
    const themeStyle = document.getElementById('theme-style');

    switch (theme) {
        case 'modern':
            themeStyle.href = './styles/modern.css';
            break;
        case 'chinese':
            themeStyle.href = './styles/chinese.css';
            break;
        default:
            themeStyle.href = './styles/retro.css';
    }

    currentTheme = theme;
    localStorage.setItem('chatDaoTheme', theme);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('chatDaoTheme') || 'retro';
    if (savedTheme !== currentTheme) {
        switchTheme(savedTheme);
        document.getElementById('themeSelect').value = savedTheme;
    }

    connect();

    const setNameButton = document.getElementById('setNameButton');
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    const nameInput = document.getElementById('nameInput');
    const themeSelect = document.getElementById('themeSelect');

    setNameButton.addEventListener('click', setUserName);
    sendButton.addEventListener('click', sendMessage);
    themeSelect.addEventListener('change', function () {
        switchTheme(this.value);
    });

    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    nameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            setUserName();
        }
    });
});