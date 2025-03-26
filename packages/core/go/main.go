// packages/core/go/main.go

package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/azofly/azofly/packages/core/go/server"
)

func main() {
	// 解析命令行参数
	port := flag.String("port", "", "服务器端口")
	kafkaURL := flag.String("kafka", "", "Kafka 代理 URL")
	templatesDir := flag.String("templates", "", "模板目录")
	staticDir := flag.String("static", "", "静态文件目录")
	configFile := flag.String("config", "", "配置文件路径")
	logLevel := flag.String("log-level", "", "日志级别 (debug, info, warn, error)")
	env := flag.String("env", "", "运行环境 (development, production)")
	flag.Parse()

	// 加载配置
	var config *server.Config
	var err error
	if *configFile != "" {
		log.Printf("从文件加载配置: %s", *configFile)
		config, err = server.LoadConfig(*configFile)
		if err != nil {
			log.Fatalf("加载配置失败: %v", err)
		}
	} else {
		log.Println("使用默认配置")
		config = server.DefaultConfig()
	}

	// 使用命令行参数覆盖配置
	if *port != "" {
		config.Port = *port
	}
	if *kafkaURL != "" {
		config.KafkaURL = *kafkaURL
	}
	if *templatesDir != "" {
		config.TemplatesDir = *templatesDir
	}
	if *staticDir != "" {
		config.StaticDir = *staticDir
	}
	if *logLevel != "" {
		config.LogLevel = *logLevel
	}
	if *env != "" {
		config.Environment = *env
	}

	// 打印配置信息
	log.Printf("服务器配置:")
	log.Printf("  端口: %s", config.Port)
	log.Printf("  Kafka URL: %s", config.KafkaURL)
	log.Printf("  模板目录: %s", config.TemplatesDir)
	log.Printf("  静态文件目录: %s", config.StaticDir)
	log.Printf("  日志级别: %s", config.LogLevel)
	log.Printf("  运行环境: %s", config.Environment)

	// 创建服务器
	srv, err := server.NewServerWithConfig(config)
	if err != nil {
		log.Fatalf("创建服务器失败: %v", err)
	}

	// 创建一个可取消的上下文
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 处理优雅关闭
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		
		log.Printf("接收到信号 %v，正在优雅关闭...", sig)
		
		// 创建一个带超时的上下文用于关闭
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()
		
		// 关闭服务器
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("服务器关闭错误: %v", err)
		}
		
		// 取消主上下文
		cancel()
		
		log.Println("服务器已关闭")
		os.Exit(0)
	}()

	// 启动服务器
	log.Printf("启动 Azofly 服务器在端口 %s", config.Port)
	if err := srv.Start(ctx); err != nil {
		log.Fatalf("服务器错误: %v", err)
	}
}