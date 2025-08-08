package main

import (
	"net/http"

	"github.com/gorilla/websocket"
)

type Event string

const (
	OnlineCount   Event = "online_count"
	OnlineUsers   Event = "online_users"
	EnterRoom     Event = "enter_room"
	LeaveRoom     Event = "leave_room"
	ChatText      Event = "chat_text"
	ChatPhoto     Event = "chat_photo"
	ChatImage     Event = "chat_image"     // 新增图片消息事件
	RecallMessage Event = "recall_message" // 新增撤回消息事件
	GetHistory    Event = "get_history"    // 新增获取历史消息事件
)

type UserData struct {
	Name      string      `json:"name"`
	Data      interface{} `json:"data"`
	Type      string      `json:"type,omitempty"`      // 消息类型：text, image等
	MessageID string      `json:"messageId,omitempty"` // 消息ID，用于撤回
	FileName  string      `json:"fileName,omitempty"`  // 文件名，用于图片等
}

type Message struct {
	Event    Event    `json:"event"`
	UserData UserData `json:"data"`
}

var (
	Up = websocket.Upgrader{
		ReadBufferSize:  1024 * 1024 * 10,
		WriteBufferSize: 1024 * 1024 * 10,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	conns       = make(map[*websocket.Conn]bool)
	userConns   = make(map[*websocket.Conn]string) // 连接到用户名的映射
	onlineUsers = make(map[string]bool)            // 在线用户集合
)
