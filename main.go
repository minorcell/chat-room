package main

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
)

var (
	// Redis客户端
	redisClient *redis.Client
	ctx         = context.Background()

	// 历史消息缓存键名
	historyKey = "chat_history"

	// 最大缓存消息数
	maxHistory = 200
)

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
