let ws;
let username = '';
let onlineUsers = new Set();

marked.setOptions({
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        try {
            return hljs.highlight(code, { language }).value;
        } catch (err) {
            console.error('高亮错误:', err);
            return code;
        }
    },
    langPrefix: 'hljs language-',
    gfm: true,
    tables: true
});

function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = function (event) {
        document.title = "已连接 - 唠嗑岛 QQ2000";
        updateConnectionStatus('已连接');
        addSystemMessage('成功连接到服务器');

        requestHistory();
    };

    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };

    ws.onclose = function (event) {
        document.title = "连接已关闭 - 唠嗑岛 QQ2000";
        updateConnectionStatus('连接已断开');
        addSystemMessage('与服务器断开连接。正在重新连接...');
        setTimeout(connect, 3000);
    };

    ws.onerror = function (error) {
        document.title = "连接错误 - 唠嗑岛 QQ2000";
        updateConnectionStatus('连接错误');
        addSystemMessage('连接发生错误');
    };
}

function requestHistory() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const historyMessage = {
            event: 'get_history',
            data: {
                name: 'system',
                data: 'request_history'
            }
        };
        ws.send(JSON.stringify(historyMessage));
    }
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
            title = '未知消息类型:';
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

// 添加用户到用户列表
function addUserToList(username) {
    if (onlineUsers.has(username)) return;

    onlineUsers.add(username);
    const groupUsers = document.getElementById('groupUsers');
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.dataset.username = username;
    userItem.innerHTML = `
        <div class="user-avatar">🐧</div>
        <span class="user-name">${username}</span>
    `;
    groupUsers.appendChild(userItem);
}

// 从用户列表移除用户
function removeUserFromList(username) {
    onlineUsers.delete(username);
    const userItem = document.querySelector(`[data-username="${username}"]`);
    if (userItem) {
        userItem.remove();
    }
}

// 添加用户消息
function addUserMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    // 添加用户到用户列表（如果是聊天消息）
    if (message.event === 'chat_text' || message.event === 'enter_room') {
        addUserToList(message.data.name);
    } else if (message.event === 'leave_room') {
        removeUserFromList(message.data.name);
    }

    // 使用marked.js渲染Markdown内容
    const renderedContent = marked.parse(message.data.data);

    messageElement.innerHTML = `
        <div class="message-header">
            <span class="username">${message.data.name}</span>
            <span class="timestamp">${timestamp}</span>
        </div>
        <div class="content">${renderedContent}</div>
    `;

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    messageElement.querySelectorAll('pre code').forEach((block) => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
        }
    });
}

function setUserName() {
    const nameInput = document.getElementById('nameInput');

    if (!nameInput.value.trim()) {
        addSystemMessage('请输入用户名');
        return;
    }

    username = nameInput.value.trim();
    addSystemMessage(`用户名已设置为: ${username}`);

    if (ws && ws.readyState === WebSocket.OPEN) {
        const enterMessage = {
            event: 'enter_room',
            data: {
                name: username,
                data: '进入了聊天室'
            }
        };
        ws.send(JSON.stringify(enterMessage));
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');

    if (!username) {
        addSystemMessage('请先设置用户名');
        return;
    }

    if (!messageInput.value.trim()) {
        addSystemMessage('请输入消息内容');
        return;
    }

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

// 更新时间显示
function updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString();
    }
}

// 更新连接状态
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // 开始时间更新
    updateTime();
    setInterval(updateTime, 1000);

    setTimeout(() => {
        connect();
    }, 100);

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
        if (e.key === 'Enter' && e.ctrlKey) {
            sendMessage();
        }
    });

    nameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            setUserName();
        }
    });

    // 工具栏按钮点击事件
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const title = this.getAttribute('title');
            if (title) {
                addSystemMessage(`${title}功能暂未实现`);
            }
        });
    });

    // 窗口控制按钮事件
    document.querySelectorAll('.title-bar-control').forEach(btn => {
        btn.addEventListener('click', function () {
            const label = this.getAttribute('aria-label');
            if (label === '关闭') {
                if (confirm('确定要关闭聊天窗口吗？')) {
                    window.close();
                }
            } else {
                addSystemMessage(`${label}功能暂未实现`);
            }
        });
    });
});