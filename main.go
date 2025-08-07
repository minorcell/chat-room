package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Event string

const (
	OnlineCount Event = "online_count"
	EnterRoom   Event = "enter_room"
	LeaveRoom   Event = "leave_room"
	ChatText    Event = "chat_text"
	ChatPhoto   Event = "chat_photo"
)

var (
	Up = websocket.Upgrader{
		ReadBufferSize:  1024 * 1024 * 10,
		WriteBufferSize: 1024 * 1024 * 10,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	conns = make(map[*websocket.Conn]bool)
)

type UserData struct {
	Name string      `json:"name"`
	Data interface{} `json:"data"`
}

type Message struct {
	Event    Event    `json:"event"`
	UserData UserData `json:"data"`
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	http.Handle("/", http.FileServer(http.Dir("./client")))

	log.Println("服务器启动在 :8080 端口")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, e := Up.Upgrade(w, r, nil)
	if e != nil {
		log.Printf("升级连接失败: %v", e)
		return
	}
	conns[conn] = true

	// 发送当前在线人数
	broadcastOnlineCount()

	defer func() {
		delete(conns, conn)
		broadcastOnlineCount()
	}()

	for {
		var message Message
		e := conn.ReadJSON(&message)
		if e != nil {
			log.Printf("读取错误: %v", e)
			return
		}

		log.Printf("收到来自 %s 的消息: %+v\n", conn.RemoteAddr(), message)

		switch message.Event {
		case EnterRoom:
			// 广播用户进入房间的消息
			broadcastMessage(message)
		case LeaveRoom:
			// 广播用户离开房间的消息
			broadcastMessage(message)
		case ChatText:
			// 广播文本聊天消息
			broadcastMessage(message)
		case ChatPhoto:
			// 广播图片聊天消息
			broadcastMessage(message)
		default:
			// 默认处理
			broadcastMessage(message)
		}
	}
}

func broadcastMessage(message Message) {
	for c := range conns {
		if e := c.WriteJSON(message); e != nil {
			log.Printf("写入错误: %v", e)
			c.Close()
			delete(conns, c)
		}
	}
}

func broadcastOnlineCount() {
	message := Message{
		Event: OnlineCount,
		UserData: UserData{
			Data: len(conns),
			Name: "system",
		},
	}
	for c := range conns {
		if e := c.WriteJSON(message); e != nil {
			log.Printf("写入错误: %v", e)
			c.Close()
			delete(conns, c)
		}
	}
}
