package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type Event string

const (
	OnlineCount Event = "online_count"
	EnterRoom   Event = "enter_room"
	LeaveRoom   Event = "leave_room"
	ChatText    Event = "chat_text"
	ChatPhoto   Event = "chat_photo"
	GetHistory  Event = "get_history" // 新增获取历史消息事件
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
	
	// Redis客户端
	redisClient *redis.Client
	ctx = context.Background()
	
	// 历史消息缓存键名
	historyKey = "chat_history"
	
	// 最大缓存消息数
	maxHistory = 200
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
	// 加载环境变量
	err := godotenv.Load()
	if err != nil {
		log.Printf("警告: 未能加载 .env 文件: %v", err)
	}
	
	// 从环境变量获取Redis配置
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")
	redisDBStr := getEnv("REDIS_DB", "0")
	redisDB, err := strconv.Atoi(redisDBStr)
	if err != nil {
		log.Printf("警告: REDIS_DB 不是有效的整数，使用默认值0: %v", err)
		redisDB = 0
	}
	
	// 初始化Redis客户端
	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPassword,
		DB:       redisDB,
	})
	
	// 测试Redis连接
	pong, err := redisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Redis连接失败: %v", err)
	} else {
		log.Printf("Redis连接成功: %s", pong)
	}
	
	http.HandleFunc("/ws", wsHandler)
	http.Handle("/", http.FileServer(http.Dir("./client")))

	log.Println("服务器启动在 :8080 端口")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, e := Up.Upgrade(w, r, nil)
	if e != nil {
		log.Printf("升级连接失败: %v", e)
		return
	}
	conns[conn] = true

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
			// 广播文本聊天消息并缓存
			cacheMessage(message)
			broadcastMessage(message)
		case ChatPhoto:
			// 广播图片聊天消息并缓存
			cacheMessage(message)
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