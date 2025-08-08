let ws;
let username = '';
let currentTheme = 'retro';

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
        document.title = "已连接";
        addSystemMessage('成功连接到服务器');

        requestHistory();
    };

    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };

    ws.onclose = function (event) {
        document.title = "连接已关闭";
        addSystemMessage('与服务器断开连接。正在重新连接...');
        setTimeout(connect, 3000); // 3秒后重新连接
    };

    ws.onerror = function (error) {
        document.title = "连接错误";
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

// 添加用户消息
function addUserMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    const now = new Date();
    const timestamp = now.toLocaleTimeString();

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

function switchTheme(theme) {
    const themeStyle = document.getElementById('theme-style');
    const highlightStyle = document.getElementById('highlight-style');

    switch (theme) {
        case 'chinese':
            themeStyle.href = './styles/chinese.css';
            // 根据主题切换代码高亮样式
            highlightStyle.href = 'https://cdn.jsdelivr.net/npm/highlight.js/styles/monokai.css';
            break;
        default:
            themeStyle.href = './styles/retro.css';
            // 根据主题切换代码高亮样式
            highlightStyle.href = 'https://cdn.jsdelivr.net/npm/highlight.js/styles/default.css';
    }

    currentTheme = theme;
    localStorage.setItem('chatDaoTheme', theme);
}

document.addEventListener('DOMContentLoaded', function () {
    const savedTheme = localStorage.getItem('chatDaoTheme') || 'retro';
    if (savedTheme !== currentTheme) {
        switchTheme(savedTheme);
        document.getElementById('themeSelect').value = savedTheme;
    }

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
});