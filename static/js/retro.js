// 复古风格聊天室的WebSocket处理逻辑
let ws;
let username = '';

// 连接到WebSocket服务器
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = function(event) {
        console.log('[ retro ] 连接已建立');
        addSystemMessage('连接到服务器成功');
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };

    ws.onclose = function(event) {
        console.log('[ retro ] 连接已断开');
        addSystemMessage('与服务器连接断开，尝试重新连接...');
        setTimeout(connect, 3000); // 3秒后重连
    };

    ws.onerror = function(error) {
        console.log('[ retro ] 连接错误:', error);
        addSystemMessage('连接发生错误');
    };
}

// 处理接收到的消息
function handleMessage(message) {
    switch(message.event) {
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
            console.log('[ retro ] 未知消息类型:', message);
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

// 发送消息
function sendMessage() {
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');
    
    if (!nameInput.value.trim()) {
        addSystemMessage('请输入昵称');
        return;
    }
    
    username = nameInput.value.trim();
    
    if (!messageInput.value.trim()) {
        addSystemMessage('请输入消息内容');
        return;
    }
    
    // 如果是第一次发送消息，发送进入房间消息
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
document.addEventListener('DOMContentLoaded', function() {
    connect();
    
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 添加一些复古风格的提示
    addSystemMessage('按 Enter 发送消息');
    addSystemMessage('支持复古终端风格聊天');
});