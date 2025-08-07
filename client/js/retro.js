// 复古风格聊天室的WebSocket处理逻辑
let ws;
let username = '';
let title = document.title

// 连接到WebSocket服务器
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = function (event) {
        title = "Connected"
        addSystemMessage('Successfully connected to the server');
    };

    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };

    ws.onclose = function (event) {
        title = "Connection closed"
        addSystemMessage('Disconnected from the server. Reconnecting...');
        setTimeout(connect, 3000); // 3秒后重连
    };

    ws.onerror = function (error) {
        title = "Connection error"
        addSystemMessage('Connection error.');
    };
}

// 处理接收到的消息
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

// 添加系统消息
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

// 添加用户消息
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

// 设置用户名
function setUserName() {
    const nameInput = document.getElementById('nameInput');
    
    if (!nameInput.value.trim()) {
        addSystemMessage('Please enter a name.');
        return;
    }
    
    username = nameInput.value.trim();
    addSystemMessage(`Username set to: ${username}`);
}

// 发送消息
function sendMessage() {
    const messageInput = document.getElementById('messageInput');

    if (!username) {
        addSystemMessage('Please set a username first.');
        return;
    }

    if (!messageInput.value.trim()) {
        addSystemMessage('Please enter a message.');
        return;
    }

    // 发送聊天消息
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    connect();

    const setNameButton = document.getElementById('setNameButton');
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    const nameInput = document.getElementById('nameInput');

    setNameButton.addEventListener('click', setUserName);
    sendButton.addEventListener('click', sendMessage);

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