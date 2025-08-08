// 主应用程序入口文件 - 统一版本
let ws;
let username = "";
let onlineUsers = new Map();
let charCount = 0;
let maxChars = 500;
let isMinimized = false;
let isMaximized = false;
let isResizing = false;
const USER_NAME_KEY = "qq_user_name";

// 怀旧风格表情包数组
const RETRO_EMOJIS = [
  "😊",
  "😂",
  "😍",
  "🤔",
  "😎",
  "😢",
  "😡",
  "👍",
  "👎",
  "👌",
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😋",
  "😘",
  "😗",
  "😙",
  "😚",
  "🙂",
  "🤗",
  "🤩",
  "🤔",
  "🤨",
  "😐",
  "😑",
  "😶",
  "🙄",
  "😏",
  "😣",
  "😥",
  "😮",
  "🤐",
  "😯",
  "😪",
  "😫",
  "😴",
  "😌",
  "😛",
  "😜",
  "😝",
  "🤤",
  "😒",
  "😓",
  "😔",
  "😕",
  "🙃",
  "🤑",
  "😲",
  "☹️",
  "🙁",
  "😖",
  "😞",
  "😟",
  "😤",
  "😭",
  "😦",
  "😧",
  "😨",
  "😩",
  "🤯",
  "😬",
  "😰",
  "😱",
  "🥵",
  "🥶",
  "😳",
  "🤪",
  "😵",
  "🥴",
  "😠",
  "😈",
  "👿",
  "💀",
  "☠️",
  "💩",
  "🤡",
  "👹",
  "👺",
  "👻",
  "👽",
  "👾",
  "🤖",
  "🎭",
];

// ========================================
// 弹窗管理模块
// ========================================
class ModalManager {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    this.createModal();
  }

  createModal() {
    this.modal = document.createElement("div");
    this.modal.id = "win98Modal";
    this.modal.className = "win98-modal";
    this.modal.innerHTML = `
      <div class="win98-modal-dialog">
        <div class="win98-modal-title-bar">
          <div class="win98-modal-title">
            <div class="win98-modal-icon">!</div>
            <span id="modalTitle">QQ2000</span>
          </div>
          <button class="win98-modal-close" onclick="window.modalManager.hide()">×</button>
        </div>
        <div class="win98-modal-content">
          <div class="win98-modal-system-icon">⚠️</div>
          <div class="win98-modal-message" id="modalMessage"></div>
        </div>
        <div class="win98-modal-buttons" id="modalButtons">
          <button class="win98-modal-button" onclick="window.modalManager.hide()">确定</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);

    // 绑定ESC键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible()) {
        this.hide();
      }
    });

    // 点击遮罩关闭
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  show(message, title = "QQ2000", icon = "⚠️", buttons = null) {
    const titleElement = document.getElementById("modalTitle");
    const messageElement = document.getElementById("modalMessage");
    const iconElement = this.modal.querySelector(".win98-modal-system-icon");
    const buttonsContainer = document.getElementById("modalButtons");

    titleElement.textContent = title;
    messageElement.textContent = message;
    iconElement.textContent = icon;

    if (buttons && Array.isArray(buttons)) {
      buttonsContainer.innerHTML = "";
      buttons.forEach((button) => {
        const btn = document.createElement("button");
        btn.className = "win98-modal-button";
        btn.textContent = button.text;
        btn.addEventListener("click", button.action);
        buttonsContainer.appendChild(btn);
      });
    } else {
      buttonsContainer.innerHTML =
        '<button class="win98-modal-button" onclick="window.modalManager.hide()">确定</button>';
    }

    this.modal.classList.add("show");

    setTimeout(() => {
      const firstButton = buttonsContainer.querySelector(".win98-modal-button");
      if (firstButton) {
        firstButton.focus();
      }
    }, 100);
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove("show");
    }
  }

  isVisible() {
    return this.modal && this.modal.classList.contains("show");
  }

  confirm(message, title = "确认", onConfirm = null, onCancel = null) {
    const buttons = [
      {
        text: "确定",
        action: () => {
          this.hide();
          if (onConfirm) onConfirm();
        },
      },
      {
        text: "取消",
        action: () => {
          this.hide();
          if (onCancel) onCancel();
        },
      },
    ];
    this.show(message, title, "❓", buttons);
  }

  info(message, title = "信息") {
    this.show(message, title, "ℹ️");
  }

  warning(message, title = "警告") {
    this.show(message, title, "⚠️");
  }

  error(message, title = "错误") {
    this.show(message, title, "❌");
  }

  success(message, title = "成功") {
    this.show(message, title, "✅");
  }
}

// ========================================
// 主题管理模块
// ========================================
class ThemeManager {
  constructor() {
    this.THEME_KEY = "qq_theme";
    this.currentTheme = "default";
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) || "default";
    this.switchTheme(savedTheme);
    this.initThemeSelector();
  }

  switchTheme(theme) {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem(this.THEME_KEY, theme);
    this.currentTheme = theme;
  }

  initThemeSelector() {
    const themeSelector = document.getElementById("themeSelector");
    if (themeSelector) {
      themeSelector.value = this.currentTheme;
      themeSelector.addEventListener("change", (e) => {
        this.switchTheme(e.target.value);
      });
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// ========================================
// 消息管理模块
// ========================================
class MessageManager {
  constructor() {
    this.messagesContainer = null;
    this.messageIdCounter = 0;
    this.userMessages = new Map();
    this.init();
  }

  init() {
    this.messagesContainer = document.getElementById("messages");
    if (this.messagesContainer) {
      this.initContextMenu();
    }
  }

  generateMessageId() {
    return `msg_${Date.now()}_${++this.messageIdCounter}`;
  }

  formatFullTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  addSystemMessage(text) {
    const messageElement = document.createElement("div");
    messageElement.className = "system-message";

    const now = new Date();
    const timestamp = this.formatFullTime(now);

    messageElement.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="content">${text}</span>
    `;

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  addUserMessage(message) {
    const welcomeMsg = this.messagesContainer.querySelector(".welcome-message");
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    // 使用消息中的ID，如果没有则生成新的
    const messageId = message.data.messageId || this.generateMessageId();
    const messageElement = document.createElement("div");
    messageElement.className = "message";
    messageElement.dataset.messageId = messageId;
    messageElement.dataset.username = message.data.name;

    const now = new Date();
    const timestamp = this.formatFullTime(now);

    let contentHtml = "";
    if (message.data.type === "image") {
      contentHtml = `<img src="${message.data.data}" alt="图片" class="message-image" />`;
    } else {
      // 检查marked是否可用
      if (typeof marked !== "undefined") {
        const renderedContent = marked.parse(message.data.data);
        contentHtml = renderedContent;
      } else {
        // 如果marked不可用，直接显示文本
        contentHtml = message.data.data.replace(/\n/g, "<br>");
      }
    }

    messageElement.innerHTML = `
      <div class="message-header">
        <span class="username">${message.data.name}</span>
        <span class="timestamp">${timestamp}</span>
        ${window.username === message.data.name ? '<span class="message-actions"><button class="recall-btn" title="撤回">↶</button></span>' : ""}
      </div>
      <div class="content">${contentHtml}</div>
    `;

    if (window.username === message.data.name) {
      this.userMessages.set(messageId, {
        element: messageElement,
        message: message,
        timestamp: now,
      });

      const recallBtn = messageElement.querySelector(".recall-btn");
      if (recallBtn) {
        recallBtn.addEventListener("click", () => {
          this.recallMessage(messageId);
        });
      }

      setTimeout(() => {
        if (recallBtn) {
          recallBtn.disabled = true;
          recallBtn.style.opacity = "0.3";
          recallBtn.title = "撤回时间已过";
        }
      }, 120000);
    }

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();

    messageElement.querySelectorAll("pre code").forEach((block) => {
      if (typeof hljs !== "undefined") {
        hljs.highlightElement(block);
      }
    });

    const images = messageElement.querySelectorAll(".message-image");
    images.forEach((img) => {
      img.addEventListener("click", () => {
        this.showImagePreview(img.src);
      });
    });
  }

  recallMessage(messageId) {
    const messageData = this.userMessages.get(messageId);
    if (!messageData) return;

    const now = new Date();
    const timeDiff = now - messageData.timestamp;

    if (timeDiff > 120000) {
      window.modalManager.show(
        "撤回时间已过，无法撤回此消息",
        "撤回失败",
        "⚠️",
      );
      return;
    }

    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      const recallMessage = {
        event: "recall_message",
        data: {
          name: window.username,
          messageId: messageId,
          data: "撤回了一条消息",
        },
      };
      window.ws.send(JSON.stringify(recallMessage));
    }

    // Don't remove message immediately - wait for server confirmation
    // The message will be removed when we receive the recall_message event from server
  }

  removeMessage(messageId) {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (messageElement) {
      messageElement.remove();
    }
  }

  initContextMenu() {
    if (!this.messagesContainer) return;

    let contextMenu = null;

    const createContextMenu = () => {
      if (contextMenu) {
        contextMenu.remove();
      }

      const contextMenu = document.createElement("div");
      contextMenu.className = "context-menu";
      contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="copy">复制</div>
        <div class="context-menu-item" data-action="recall">撤回</div>
        <div class="context-menu-item" data-action="save-image">保存图片</div>
      `;
      document.body.appendChild(contextMenu);

      contextMenu.addEventListener("click", (e) => {
        const action = e.target.dataset.action;
        if (action) {
          this.handleContextMenuAction(action, currentTarget);
        }
        this.hideContextMenu();
      });
    };

    let currentTarget = null;

    this.messagesContainer.addEventListener("contextmenu", (e) => {
      const messageElement = e.target.closest(".message");
      if (!messageElement) return;

      e.preventDefault();
      currentTarget = messageElement;

      createContextMenu();
      this.showContextMenu(e.pageX, e.pageY, messageElement);
    });

    document.addEventListener("click", () => {
      this.hideContextMenu();
    });
  }

  showContextMenu(x, y, messageElement) {
    const contextMenu = document.querySelector(".context-menu");
    if (!contextMenu) return;

    const isOwnMessage = messageElement.dataset.username === window.username;
    const hasImage = messageElement.querySelector(".message-image");

    const copyItem = contextMenu.querySelector('[data-action="copy"]');
    const recallItem = contextMenu.querySelector('[data-action="recall"]');
    const saveImageItem = contextMenu.querySelector(
      '[data-action="save-image"]',
    );

    copyItem.style.display = "block";
    recallItem.style.display = isOwnMessage ? "block" : "none";
    saveImageItem.style.display = hasImage ? "block" : "none";

    if (isOwnMessage && recallItem) {
      const messageId = messageElement.dataset.messageId;
      const messageData = this.userMessages.get(messageId);
      if (messageData) {
        const timeDiff = new Date() - messageData.timestamp;
        if (timeDiff > 120000) {
          recallItem.style.opacity = "0.5";
          recallItem.style.pointerEvents = "none";
        }
      }
    }

    contextMenu.style.display = "block";
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = `${y - rect.height}px`;
    }
  }

  hideContextMenu() {
    const contextMenu = document.querySelector(".context-menu");
    if (contextMenu) {
      contextMenu.style.display = "none";
    }
  }

  handleContextMenuAction(action, messageElement) {
    const messageId = messageElement.dataset.messageId;
    const contentElement = messageElement.querySelector(".content");

    switch (action) {
      case "copy":
        this.copyMessageContent(contentElement);
        break;
      case "recall":
        this.recallMessage(messageId);
        break;
      case "save-image":
        this.saveImage(messageElement);
        break;
    }
  }

  copyMessageContent(contentElement) {
    const text = contentElement.textContent || contentElement.innerText;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        window.modalManager.show("消息已复制到剪贴板", "复制成功", "✅");
      })
      .catch(() => {
        window.modalManager.show("复制失败", "错误", "❌");
      });
  }

  saveImage(messageElement) {
    const img = messageElement.querySelector(".message-image");
    if (!img) return;

    const link = document.createElement("a");
    link.href = img.src;
    link.download = `image_${Date.now()}.png`;
    link.click();
  }

  showImagePreview(src) {
    const modal = document.createElement("div");
    modal.className = "image-preview-modal";
    modal.innerHTML = `
      <div class="image-preview-content">
        <img src="${src}" alt="图片预览" />
        <button class="image-preview-close">×</button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector(".image-preview-close");
    const closePreview = () => {
      modal.remove();
    };

    closeBtn.addEventListener("click", closePreview);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closePreview();
      }
    });

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closePreview();
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  clear() {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = "";
    }
    this.userMessages.clear();
  }
}

// ========================================
// 图片处理模块
// ========================================
class ImageManager {
  constructor() {
    this.maxFileSize = 2 * 1024 * 1024; // 2MB
    this.allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    this.init();
  }

  init() {
    this.createFileInput();
    this.bindEvents();
  }

  createFileInput() {
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.style.display = "none";
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener("change", (e) => {
      this.handleFileSelect(e);
    });
  }

  bindEvents() {
    const messagesContainer = document.getElementById("messages");
    if (messagesContainer) {
      messagesContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        messagesContainer.classList.add("drag-over");
      });

      messagesContainer.addEventListener("dragleave", (e) => {
        e.preventDefault();
        messagesContainer.classList.remove("drag-over");
      });

      messagesContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        messagesContainer.classList.remove("drag-over");
        this.handleFileDrop(e);
      });
    }
  }

  selectImage() {
    if (!window.username) {
      if (window.modalManager) {
        window.modalManager.show("请先登录！", "提示", "⚠️");
      }
      return;
    }
    this.fileInput.click();
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processImage(file);
    }
    this.fileInput.value = "";
  }

  handleFileDrop(e) {
    if (!window.username) {
      window.modalManager.show("请先登录！", "提示", "⚠️");
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processImage(files[0]);
    }
  }

  processImage(file) {
    if (!this.allowedTypes.includes(file.type)) {
      window.modalManager.show(
        "不支持的图片格式！\n支持的格式：JPG、PNG、GIF、WebP",
        "格式错误",
        "❌",
      );
      return;
    }

    if (file.size > this.maxFileSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      window.modalManager.show(
        `图片太大了！\n当前大小：${sizeMB}MB\n最大允许：2MB`,
        "文件过大",
        "❌",
      );
      return;
    }

    this.showUploadProgress();

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      this.sendImage(imageData, file.name);
    };

    reader.onerror = () => {
      this.hideUploadProgress();
      window.modalManager.show("读取图片失败！", "错误", "❌");
    };

    reader.readAsDataURL(file);
  }

  sendImage(imageData, fileName) {
    if (!window.ws || window.ws.readyState !== WebSocket.OPEN) {
      this.hideUploadProgress();
      window.modalManager.show("连接已断开，无法发送图片！", "连接错误", "❌");
      return;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imageMessage = {
      event: "chat_image",
      data: {
        name: window.username,
        type: "image",
        data: imageData,
        fileName: fileName,
        messageId: messageId,
      },
    };

    try {
      window.ws.send(JSON.stringify(imageMessage));
      this.hideUploadProgress();
      window.messageManager.addUserMessage(imageMessage);
    } catch (error) {
      this.hideUploadProgress();
      window.modalManager.show("发送图片失败！", "发送错误", "❌");
      console.error("发送图片错误:", error);
    }
  }

  showUploadProgress() {
    const progressDiv = document.createElement("div");
    progressDiv.id = "uploadProgress";
    progressDiv.className = "upload-progress";
    progressDiv.innerHTML = `
      <div class="progress-content">
        <div class="progress-icon">📤</div>
        <div class="progress-text">正在上传图片...</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    `;

    document.body.appendChild(progressDiv);

    const progressFill = progressDiv.querySelector(".progress-fill");
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      progressFill.style.width = progress + "%";
    }, 100);
  }

  hideUploadProgress() {
    const progressDiv = document.getElementById("uploadProgress");
    if (progressDiv) {
      progressDiv.remove();
    }
  }

  cleanup() {
    if (this.fileInput) {
      this.fileInput.remove();
    }
    this.hideUploadProgress();
  }
}

// ========================================
// 主应用程序逻辑
// ========================================

// 工具函数
function getEnv(key, defaultValue) {
  return defaultValue;
}

function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const timeElement = document.getElementById("currentTime");
  if (timeElement) {
    timeElement.textContent = timeString;
  }
}

function updateConnectionStatus(status) {
  const statusElement = document.getElementById("connectionStatus");
  if (statusElement) {
    statusElement.textContent = status;
  }
}

function updateCharCount() {
  const messageInput = document.getElementById("messageInput");
  const charCountElement = document.querySelector(".char-count");
  if (messageInput && charCountElement) {
    charCount = messageInput.value.length;
    charCountElement.textContent = `${charCount}/${maxChars}`;

    if (charCount > maxChars) {
      charCountElement.style.color = "#ff6b6b";
      messageInput.style.borderColor = "#ff6b6b";
    } else {
      charCountElement.style.color = "";
      messageInput.style.borderColor = "";
    }
  }
}

// WebSocket连接
function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  ws = new WebSocket(`${protocol}//${host}/ws`);

  ws.onopen = function (event) {
    document.title = "已连接 - 唠嗑岛 QQ2000";
    updateConnectionStatus("已连接");

    if (window.messageManager) {
      messageManager.addSystemMessage("成功连接到服务器");
    }

    // 如果已有用户名，请求历史消息
    if (username) {
      setTimeout(() => {
        requestHistory();
      }, 500);
    }

    if (username) {
      const enterMessage = {
        event: "enter_room",
        data: {
          name: username,
          data: "进入了聊天室",
        },
      };
      ws.send(JSON.stringify(enterMessage));
    }
  };

  ws.onmessage = function (event) {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };

  ws.onclose = function (event) {
    document.title = "连接断开 - 唠嗑岛 QQ2000";
    updateConnectionStatus("连接断开");
    if (window.messageManager) {
      messageManager.addSystemMessage("连接已断开，正在重连...");
    }

    setTimeout(() => {
      connect();
    }, 3000);
  };

  ws.onerror = function (error) {
    console.error("WebSocket错误:", error);
    document.title = "连接错误 - 唠嗑岛 QQ2000";
    updateConnectionStatus("连接错误");
    if (window.messageManager) {
      messageManager.addSystemMessage("连接发生错误");
    }
  };
}

// 处理接收到的消息
function handleMessage(message) {
  switch (message.event) {
    case "online_users":
      updateOnlineUsersList(message.data.data);
      break;
    case "enter_room":
    case "leave_room":
    case "chat_text":
    case "chat_photo":
    case "chat_image":
      if (window.messageManager) {
        messageManager.addUserMessage(message);
      }
      break;
    case "recall_message":
      handleRecallMessage(message);
      break;
    case "get_history":
      // 历史消息直接显示，不需要特殊处理
      break;
    default:
      if (window.messageManager) {
        messageManager.addUserMessage(message);
      }
  }
}

// 请求历史消息
function requestHistory() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (window.messageManager) {
      messageManager.addSystemMessage("正在加载历史消息...");
    }
    const historyMessage = {
      event: "get_history",
      data: {
        name: "system",
        data: "request_history",
      },
    };
    ws.send(JSON.stringify(historyMessage));
  }
}

// 处理撤回消息
function handleRecallMessage(message) {
  // 从界面移除被撤回的消息
  if (message.data.messageId && window.messageManager) {
    messageManager.removeMessage(message.data.messageId);
    // 如果是自己的消息，也从本地存储中移除
    if (message.data.name === window.username) {
      messageManager.userMessages.delete(message.data.messageId);
    }
  }

  if (window.messageManager) {
    messageManager.addSystemMessage(`${message.data.name} 撤回了一条消息`);
  }
}

// 更新在线用户列表
function updateOnlineUsersList(userList) {
  const groupUsers = document.getElementById("groupUsers");

  groupUsers.innerHTML = "";
  onlineUsers.clear();

  userList.forEach((username) => {
    onlineUsers.set(username, { joinTime: new Date() });

    const userDiv = document.createElement("div");
    userDiv.className = "user-item";
    userDiv.innerHTML = `
      <div class="user-avatar">👤</div>
      <div class="user-info">
        <div class="user-name">${username}</div>
        <div class="user-status">在线</div>
      </div>
    `;

    groupUsers.appendChild(userDiv);
  });

  updateGroupCount();
  document.getElementById("onlineCount").textContent = userList.length;
}

// 设置用户名
function setUserName() {
  const nameInput = document.getElementById("nameInput");
  const newUsername = nameInput.value.trim();

  if (!newUsername) {
    if (window.modalManager) {
      modalManager.show("请输入用户名！");
    }
    return;
  }

  if (newUsername.length > 20) {
    if (window.modalManager) {
      modalManager.show("用户名不能超过20个字符！");
    }
    return;
  }

  username = newUsername;
  window.username = username;
  localStorage.setItem(USER_NAME_KEY, username);

  const userInputArea = document.getElementById("userInputArea");
  const logoutBtn = document.getElementById("logoutBtn");
  userInputArea.style.display = "none";
  if (logoutBtn) {
    logoutBtn.style.display = "block";
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    const enterMessage = {
      event: "enter_room",
      data: {
        name: username,
        data: "进入了聊天室",
      },
    };
    ws.send(JSON.stringify(enterMessage));
  }

  if (window.messageManager) {
    messageManager.addSystemMessage(`欢迎 ${username} 进入聊天室！`);
  }

  // 登录后请求历史消息
  setTimeout(() => {
    requestHistory();
  }, 500);
}

// 发送消息
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const messageText = messageInput.value.trim();

  if (!username) {
    if (window.modalManager) {
      modalManager.show("请先设置用户名！");
    }
    return;
  }

  if (!messageText) {
    if (window.modalManager) {
      modalManager.show("请输入消息内容！");
    }
    return;
  }

  if (messageText.length > maxChars) {
    if (window.modalManager) {
      modalManager.show(`消息长度不能超过${maxChars}个字符！`);
    }
    return;
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const chatMessage = {
    event: "chat_text",
    data: {
      name: username,
      data: messageText,
      messageId: messageId,
    },
  };

  ws.send(JSON.stringify(chatMessage));
  messageInput.value = "";
  updateCharCount();
}

// 更新群组用户计数
function updateGroupCount() {
  const groupCountElement = document.getElementById("groupCount");
  if (groupCountElement) {
    groupCountElement.textContent = onlineUsers.size;
  }
}

// 切换群组折叠状态
function toggleGroup(header) {
  const groupUsers = header.nextElementSibling;
  const icon = header.querySelector(".group-icon");

  if (groupUsers.style.display === "none") {
    groupUsers.style.display = "block";
    icon.textContent = "-";
  } else {
    groupUsers.style.display = "none";
    icon.textContent = "+";
  }
}

// 开始私聊（占位功能）
function startPrivateChat(targetUsername) {
  if (window.modalManager) {
    modalManager.show(`私聊功能暂未实现！\n目标用户: ${targetUsername}`);
  }
}

// 最小化窗口
function minimizeWindow() {
  const qqWindow = document.querySelector(".qq-window");
  if (!isMinimized) {
    qqWindow.classList.add("minimized");
    isMinimized = true;
    setTimeout(() => {
      qqWindow.style.display = "none";
      if (window.modalManager) {
        modalManager.show("窗口已最小化到任务栏", "QQ2000", "ℹ️");
        setTimeout(() => {
          modalManager.hide();
          qqWindow.style.display = "flex";
          qqWindow.classList.remove("minimized");
          isMinimized = false;
        }, 2000);
      }
    }, 200);
  }
}

// 最大化/还原窗口
function toggleMaximize() {
  const qqWindow = document.querySelector(".qq-window");
  if (!isMaximized) {
    qqWindow.classList.add("maximized");
    isMaximized = true;
  } else {
    qqWindow.classList.remove("maximized");
    isMaximized = false;
  }
}

// 处理工具栏按钮点击
function handleToolbarAction(action) {
  switch (action) {
    case "emoji":
      toggleEmojiDialog();
      break;
    case "image":
      if (!window.username) {
        if (window.modalManager) {
          modalManager.show("请先登录！", "提示", "⚠️");
        }
        return;
      }
      if (
        window.imageManager &&
        typeof window.imageManager.selectImage === "function"
      ) {
        window.imageManager.selectImage();
      } else {
        if (window.modalManager) {
          modalManager.show(
            "图片功能暂时不可用，请刷新页面重试",
            "功能错误",
            "❌",
          );
        }
      }
      break;
    default:
      console.log("未知的工具栏操作:", action);
  }
}

// 切换表情对话框
function toggleEmojiDialog() {
  const dialog = document.getElementById("emojiDialog");
  if (dialog.style.display === "none") {
    dialog.style.display = "block";
  } else {
    dialog.style.display = "none";
  }
}

// 插入表情到输入框
function insertEmoji(emoji) {
  const messageInput = document.getElementById("messageInput");
  const cursorPos = messageInput.selectionStart;
  const textBefore = messageInput.value.substring(0, cursorPos);
  const textAfter = messageInput.value.substring(messageInput.selectionEnd);

  messageInput.value = textBefore + emoji + textAfter;
  messageInput.focus();
  messageInput.setSelectionRange(
    cursorPos + emoji.length,
    cursorPos + emoji.length,
  );

  updateCharCount();
  toggleEmojiDialog();
}

// 初始化拖拽调整输入框高度功能
function initializeResize() {
  const resizeHandle = document.getElementById("resizeHandle");
  const messageInput = document.getElementById("messageInput");
  let startY = 0;
  let startHeight = 0;

  resizeHandle.addEventListener("mousedown", function (e) {
    isResizing = true;
    startY = e.clientY;
    startHeight = parseInt(window.getComputedStyle(messageInput).height, 10);

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    e.preventDefault();
  });

  function doDrag(e) {
    if (!isResizing) return;

    const deltaY = startY - e.clientY;
    const newHeight = startHeight + deltaY;

    const minHeight = 40;
    const maxHeight = 200;
    const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    messageInput.style.height = clampedHeight + "px";
  }

  function stopDrag() {
    isResizing = false;
    document.removeEventListener("mousemove", doDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }
}

// 退出登录
function logout() {
  localStorage.removeItem(USER_NAME_KEY);
  if (window.modalManager) {
    modalManager.show("已退出登录，页面将刷新", "退出成功", "✅");
  }
  setTimeout(() => {
    location.reload();
  }, 1500);
}

// 初始化表情面板
function initializeEmojiPanel() {
  const emojiGrid = document.querySelector(".emoji-grid");
  if (emojiGrid) {
    emojiGrid.innerHTML = "";
    RETRO_EMOJIS.forEach((emoji) => {
      const emojiItem = document.createElement("span");
      emojiItem.className = "emoji-item";
      emojiItem.textContent = emoji;
      emojiItem.addEventListener("click", function () {
        insertEmoji(emoji);
      });
      emojiGrid.appendChild(emojiItem);
    });
  }
}

// 初始化用户名
function initializeUsername() {
  const savedUsername = localStorage.getItem(USER_NAME_KEY);
  if (savedUsername) {
    username = savedUsername;
    window.username = username;

    const userInputArea = document.getElementById("userInputArea");
    const logoutBtn = document.getElementById("logoutBtn");
    userInputArea.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "block";
    }

    if (window.messageManager) {
      messageManager.addSystemMessage(`使用已保存的用户名: ${username}`);
    }
  } else {
    const userInputArea = document.getElementById("userInputArea");
    const logoutBtn = document.getElementById("logoutBtn");
    userInputArea.style.display = "block";
    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
  }
}

// 关闭Win98弹窗（全局函数）
function closeWin98Modal() {
  if (window.modalManager) {
    modalManager.hide();
  }
}

// 绑定所有事件
function bindEvents() {
  const setNameButton = document.getElementById("setNameButton");
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("messageInput");
  const nameInput = document.getElementById("nameInput");
  const logoutBtn = document.getElementById("logoutBtn");

  setNameButton.addEventListener("click", setUserName);
  sendButton.addEventListener("click", sendMessage);

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // 输入框事件
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && e.ctrlKey) {
      sendMessage();
    }
  });

  messageInput.addEventListener("input", function () {
    updateCharCount();
  });

  nameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      setUserName();
    }
  });

  // 工具栏按钮点击事件
  document.querySelectorAll(".toolbar-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const action = this.getAttribute("data-action");
      if (action) {
        handleToolbarAction(action);
      }
    });
  });

  // 窗口控制按钮事件
  document.querySelectorAll(".title-bar-control").forEach((btn) => {
    btn.addEventListener("click", function () {
      const label = this.getAttribute("aria-label");
      if (label === "最小化") {
        minimizeWindow();
      } else if (label === "最大化") {
        toggleMaximize();
      } else if (label === "关闭") {
        if (window.modalManager) {
          modalManager.confirm("确定要关闭QQ聊天窗口吗？", "QQ2000", () => {
            window.close();
          });
        }
      }
    });
  });

  // 菜单栏点击事件
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      if (e.target.tagName === "SELECT" || e.target.tagName === "OPTION") {
        return;
      }

      const menuText = this.textContent.trim();
      if (menuText === "Github") {
        window.open("https://github.com/minorcell/chat-room", "_blank");
      } else if (menuText === "退出登录") {
        logout();
      } else if (menuText.startsWith("主题：")) {
        return;
      }
    });
  });

  // 点击对话框外部关闭对话框
  document.addEventListener("click", function (e) {
    const emojiDialog = document.getElementById("emojiDialog");
    const emojiBtn = document.querySelector('[data-action="emoji"]');

    if (
      emojiDialog &&
      !emojiDialog.contains(e.target) &&
      e.target !== emojiBtn
    ) {
      emojiDialog.style.display = "none";
    }
  });

  // ESC键关闭弹窗
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const emojiDialog = document.getElementById("emojiDialog");
      if (emojiDialog) {
        emojiDialog.style.display = "none";
      }
    }
  });

  // 初始化字符计数
  updateCharCount();

  // 设置初始焦点
  nameInput.focus();
}

// ========================================
// 应用程序初始化
// ========================================

// Markdown配置
if (typeof marked !== "undefined") {
  marked.setOptions({
    highlight: function (code, lang) {
      if (typeof hljs !== "undefined") {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        try {
          return hljs.highlight(code, { language }).value;
        } catch (err) {
          console.error("高亮错误:", err);
          return code;
        }
      }
      return code;
    },
    langPrefix: "hljs language-",
    gfm: true,
    tables: true,
  });
} else {
  console.warn("marked.js 未加载，Markdown功能将不可用");
}

// 初始化全局管理器实例
window.modalManager = new ModalManager();
window.themeManager = new ThemeManager();
window.messageManager = new MessageManager();
window.imageManager = new ImageManager();

// 暴露全局变量和函数
window.username = username;
window.ws = ws;
window.toggleGroup = toggleGroup;
window.closeWin98Modal = closeWin98Modal;

// DOM加载完成后初始化
document.addEventListener("DOMContentLoaded", function () {
  // 初始化用户名
  initializeUsername();

  // 初始化表情面板
  initializeEmojiPanel();

  // 绑定事件
  bindEvents();

  // 开始时间更新
  updateTime();
  setInterval(updateTime, 1000);

  // 初始化拖拽功能
  initializeResize();

  // 连接WebSocket
  setTimeout(() => {
    connect();
  }, 100);
});
