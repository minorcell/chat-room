package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, e := Up.Upgrade(w, r, nil)
	if e != nil {
		log.Printf("升级连接失败: %v", e)
		return
	}
	conns[conn] = true

	defer func() {
		// 如果用户已登录，从在线用户列表中移除
		if username, exists := userConns[conn]; exists {
			delete(onlineUsers, username)
			delete(userConns, conn)
			// 广播用户离开消息
			leaveMessage := Message{
				Event: LeaveRoom,
				UserData: UserData{
					Name: username,
					Data: "离开了聊天室",
				},
			}
			broadcastMessage(leaveMessage)
		}
		delete(conns, conn)
		broadcastOnlineUsers()
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
			// 记录用户连接和在线状态
			username := message.UserData.Name
			userConns[conn] = username
			onlineUsers[username] = true
			// 广播用户进入房间的消息
			broadcastMessage(message)
			// 广播更新的在线用户列表
			broadcastOnlineUsers()
		case LeaveRoom:
			// 广播用户离开房间的消息
			broadcastMessage(message)
		case ChatText:
			// 广播文本聊天消息并缓存
			cacheMessage(message)
			broadcastMessage(message)
		case ChatPhoto:
			// 广播图片聊天消息并缓存
			cacheMessage(message)
			broadcastMessage(message)
		case ChatImage:
			// 广播图片消息并缓存
			cacheMessage(message)
			broadcastMessage(message)
		case RecallMessage:
			// 从缓存中移除被撤回的消息
			log.Printf("撤回消息请求，MessageID: %s", message.UserData.MessageID)
			removeMessageFromCache(message.UserData.MessageID)
			// 广播撤回消息（但不缓存）
			broadcastMessage(message)
		case GetHistory:
			// 发送历史消息
			sendHistory(conn)
		default:
			// 默认处理
			broadcastMessage(message)
		}
	}
}

// 缓存消息到Redis
func cacheMessage(message Message) {
	// 将消息序列化为JSON
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("消息序列化失败: %v", err)
		return
	}

	// 使用LPush将消息添加到列表的开头
	// 然后使用LTrim保持列表长度为maxHistory
	err = redisClient.LPush(ctx, historyKey, messageBytes).Err()
	if err != nil {
		log.Printf("消息缓存失败: %v", err)
		return
	}

	// 保持列表长度为maxHistory
	err = redisClient.LTrim(ctx, historyKey, 0, int64(maxHistory-1)).Err()
	if err != nil {
		log.Printf("列表修剪失败: %v", err)
		return
	}

	log.Printf("消息已缓存: %s", messageBytes)
}

// 发送历史消息给指定连接
func sendHistory(conn *websocket.Conn) {
	// 从Redis获取历史消息
	history, err := redisClient.LRange(ctx, historyKey, 0, -1).Result()
	if err != nil {
		log.Printf("获取历史消息失败: %v", err)
		return
	}

	// 反向发送历史消息（从旧到新）
	for i := len(history) - 1; i >= 0; i-- {
		var message Message
		err := json.Unmarshal([]byte(history[i]), &message)
		if err != nil {
			log.Printf("历史消息反序列化失败: %v", err)
			continue
		}

		// 发送历史消息给客户端
		if e := conn.WriteJSON(message); e != nil {
			log.Printf("发送历史消息失败: %v", e)
			return
		}
	}

	log.Printf("已发送 %d 条历史消息给客户端", len(history))
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

// 广播在线用户列表
func broadcastOnlineUsers() {
	userList := make([]string, 0, len(onlineUsers))
	for username := range onlineUsers {
		userList = append(userList, username)
	}

	message := Message{
		Event: OnlineUsers,
		UserData: UserData{
			Data: userList,
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

// 从缓存中移除消息
func removeMessageFromCache(messageID string) {
	if messageID == "" {
		log.Printf("撤回消息失败：messageID为空")
		return
	}

	log.Printf("开始从缓存中移除消息，ID: %s", messageID)

	// 获取所有历史消息
	history, err := redisClient.LRange(ctx, historyKey, 0, -1).Result()
	if err != nil {
		log.Printf("获取历史消息失败: %v", err)
		return
	}

	// 重建消息列表，排除要删除的消息
	var filteredMessages []string
	for _, msgStr := range history {
		var message Message
		err := json.Unmarshal([]byte(msgStr), &message)
		if err != nil {
			continue
		}

		// 如果不是要删除的消息，保留它
		if message.UserData.MessageID != messageID {
			filteredMessages = append(filteredMessages, msgStr)
		} else {
			log.Printf("找到要删除的消息，ID: %s", messageID)
		}
	}

	// 清空原有列表
	redisClient.Del(ctx, historyKey)

	// 重新添加过滤后的消息
	if len(filteredMessages) > 0 {
		// 反转数组，因为要用LPush
		for i := len(filteredMessages) - 1; i >= 0; i-- {
			redisClient.LPush(ctx, historyKey, filteredMessages[i])
		}
	}

	log.Printf("已从缓存中移除消息: %s，原消息数: %d，过滤后消息数: %d", messageID, len(history), len(filteredMessages))
}
