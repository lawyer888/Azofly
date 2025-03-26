package server

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

// 处理 Kafka 消息队列操作
type KafkaClient struct {
	writer *kafka.Writer
	reader *kafka.Reader
	brokers []string
}

// 创建一个新的 Kafka 客户端
func NewKafkaClient(brokerURL string) (*KafkaClient, error) {
	brokers := []string{brokerURL}
	
	writer := &kafka.Writer{
		Addr:     kafka.TCP(brokerURL),
		Balancer: &kafka.LeastBytes{},
	}

	return &KafkaClient{
		writer:  writer,
		brokers: brokers,
	}, nil
}

//发送消息到 Kafka 主题
func (k *KafkaClient) SendMessage(ctx context.Context, topic string, key string, value []byte) error {
	// 设置超时上下文
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	
	return k.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: value,
	})
}

//从 Kafka 主题消费消息
func (k *KafkaClient) ConsumeMessages(ctx context.Context, topic string, handler func([]byte) error) {
	// 创建一个新的读取器
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   k.brokers,
		Topic:     topic,
		GroupID:   "azofly-server",
		MinBytes:  10e3, // 10KB
		MaxBytes:  10e6, // 10MB
	})
	
	go func() {
		defer reader.Close()
		
		for {
			select {
			case <-ctx.Done():
				log.Println("Kafka 消费者关闭")
				return
			default:
				msg, err := reader.ReadMessage(ctx)
				if err != nil {
					log.Printf("读取消息错误: %v", err)
					continue
				}

				if err := handler(msg.Value); err != nil {
					log.Printf("处理消息错误: %v", err)
				}
			}
		}
	}()
}

// 关闭 Kafka 连接
func (k *KafkaClient) Close() error {
	if err := k.writer.Close(); err != nil {
		return fmt.Errorf("关闭写入器错误: %w", err)
	}
	
	return nil
}