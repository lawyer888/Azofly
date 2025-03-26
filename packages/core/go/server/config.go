package server

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// Config 表示 Azofly 服务器的配置
type Config struct {
	Port         string            `json:"port"`
	KafkaURL     string            `json:"kafkaURL"`
	TemplatesDir string            `json:"templatesDir"`
	StaticDir    string            `json:"staticDir"`
	LogLevel     string            `json:"logLevel"`
	Environment  string            `json:"environment"`
	Routes       map[string]string `json:"routes"`      // 路径到模板的映射
	APIEndpoints map[string]string `json:"apiEndpoints"` // API 端点配置
}

// DefaultConfig 返回默认配置
func DefaultConfig() *Config {
	return &Config{
		Port:         "3000",
		KafkaURL:     "localhost:9092",
		TemplatesDir: "./templates",
		StaticDir:    "./static",
		LogLevel:     "info",
		Environment:  "development",
		Routes: map[string]string{
			"/":             "index.tmpl",
			"/about":        "about.tmpl",
			"/products":     "products.tmpl",
			"/products/:id": "product-detail.tmpl",
		},
		APIEndpoints: map[string]string{
			"/api/products":     "getProducts",
			"/api/products/:id": "getProductById",
		},
	}
}

// LoadConfig 从文件加载配置
func LoadConfig(configPath string) (*Config, error) {
	// 如果配置路径为空，返回默认配置
	if configPath == "" {
		return DefaultConfig(), nil
	}

	// 读取配置文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	// 解析 JSON 配置
	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	// 合并默认值
	defaultConfig := DefaultConfig()
	if config.Port == "" {
		config.Port = defaultConfig.Port
	}
	if config.KafkaURL == "" {
		config.KafkaURL = defaultConfig.KafkaURL
	}
	if config.TemplatesDir == "" {
		config.TemplatesDir = defaultConfig.TemplatesDir
	}
	if config.StaticDir == "" {
		config.StaticDir = defaultConfig.StaticDir
	}
	if config.LogLevel == "" {
		config.LogLevel = defaultConfig.LogLevel
	}
	if config.Environment == "" {
		config.Environment = defaultConfig.Environment
	}
	if len(config.Routes) == 0 {
		config.Routes = defaultConfig.Routes
	}
	if len(config.APIEndpoints) == 0 {
		config.APIEndpoints = defaultConfig.APIEndpoints
	}

	return &config, nil
}

// ConfigManager 管理配置的单例
type ConfigManager struct {
	config *Config
	mu     sync.RWMutex
}

var (
	configManager *ConfigManager
	once          sync.Once
)

// GetConfigManager 返回配置管理器的单例实例
func GetConfigManager() *ConfigManager {
	once.Do(func() {
		configManager = &ConfigManager{
			config: DefaultConfig(),
		}
	})
	return configManager
}

// LoadConfigFile 加载配置文件
func (cm *ConfigManager) LoadConfigFile(configPath string) error {
	config, err := LoadConfig(configPath)
	if err != nil {
		return err
	}

	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.config = config
	return nil
}

// GetConfig 返回当前配置
func (cm *ConfigManager) GetConfig() *Config {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.config
}

// UpdateConfig 更新配置
func (cm *ConfigManager) UpdateConfig(updater func(*Config)) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	updater(cm.config)
}

// SaveConfig 保存配置到文件
func (cm *ConfigManager) SaveConfig(configPath string) error {
	cm.mu.RLock()
	config := cm.config
	cm.mu.RUnlock()

	// 创建目录（如果不存在）
	dir := filepath.Dir(configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建配置目录失败: %w", err)
	}

	// 序列化配置
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化配置失败: %w", err)
	}

	// 写入文件
	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %w", err)
	}

	return nil
}