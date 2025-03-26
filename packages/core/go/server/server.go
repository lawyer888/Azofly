package server

/*import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"html/template"
	"github.com/gin-contrib/multitemplate"
	"github.com/gin-gonic/gin"
)*/
import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
)

// RequestMessage 表示从 JavaScript 客户端接收的请求
type RequestMessage struct {
	ID        string          `json:"id"`
	Path      string          `json:"path"`
	Method    string          `json:"method"`
	Headers   map[string]string `json:"headers"`
	Body      json.RawMessage `json:"body"`
	Timestamp int64           `json:"timestamp"`
}

// ResponseMessage 表示发送回 JavaScript 客户端的响应
type ResponseMessage struct {
	RequestID string          `json:"requestId"`
	HTML      string          `json:"html"`
	State     json.RawMessage `json:"state"`
	Status    int             `json:"status"`
	Headers   map[string]string `json:"headers"`
	Error     string          `json:"error,omitempty"`
	Timestamp int64           `json:"timestamp"`
}

// Server 表示 Azofly Go 服务器
type Server struct {
	port        string
	kafkaClient *KafkaClient
	renderer    *Renderer
	engine      *gin.Engine
	templates   map[string]string // 路径到模板的映射
	config      *Config           // 服务器配置
	mu          sync.RWMutex
}

// 基于 Gin 的页面渲染器
type Renderer struct {
	engine    *gin.Engine
	templates map[string]string
}

// NewRenderer 创建一个新的渲染器实例
func NewRenderer(engine *gin.Engine, templatesDir string) (*Renderer, error) {
    // 检查模板目录是否存在
    if _, err := os.Stat(templatesDir); os.IsNotExist(err) {
        return nil, fmt.Errorf("模板目录不存在: %s", templatesDir)
    }
    
    // 加载模板文件
    templatePattern := filepath.Join(templatesDir, "*.tmpl")
    engine.LoadHTMLGlob(templatePattern)
    
    // 初始化模板映射
    templateMap := make(map[string]string)
    
    // 添加路径到模板名称的映射
    templateMap["/"] = "index.tmpl"
    templateMap["/about"] = "about.tmpl"
    templateMap["/products"] = "products.tmpl"
    templateMap["/products/:id"] = "product-detail.tmpl"
    templateMap["default"] = "default.tmpl"
    
    return &Renderer{
        engine:    engine,
        templates: templateMap,
    }, nil
}

// RenderPage 使用 Gin 渲染页面内容
func (r *Renderer) RenderPage(path string, context json.RawMessage) (string, json.RawMessage, error) {
    // 查找对应的模板
    templateName, exists := r.templates[path]
    if !exists {
        // 如果没有精确匹配，尝试查找带参数的路由模板
        for route, tmpl := range r.templates {
            if isRouteMatch(route, path) {
                templateName = tmpl
                exists = true
                break
            }
        }
        
        if !exists {
            // 如果仍然没有找到，使用默认模板
            templateName = "default.tmpl"
        }
    }
    
    // 解析上下文数据
    var contextData map[string]interface{}
    if context != nil {
        if err := json.Unmarshal(context, &contextData); err != nil {
            return "", nil, fmt.Errorf("解析上下文数据失败: %w", err)
        }
    } else {
        contextData = make(map[string]interface{})
    }
    
    // 添加路径信息
    contextData["path"] = path
    
    // 使用 Gin 的 HTML 渲染
    w := NewCaptureResponseWriter()
    c, _ := gin.CreateTestContext(w)
     

    // 设置路径参数（如果有）
    params := extractRouteParams(path)
    for key, value := range params {
        c.Params = append(c.Params, gin.Param{Key: key, Value: value})
    }
    
    // 渲染模板
    c.HTML(http.StatusOK, templateName, contextData)
    
    // 获取渲染后的 HTML
    html := w.Body.String()
    
    // 创建状态数据
    state := map[string]interface{}{
        "rendered": true,
        "path":     path,
        "data":     contextData,
    }
    
    // 序列化状态数据
    stateJSON, err := json.Marshal(state)
    if err != nil {
        return html, nil, fmt.Errorf("序列化状态数据失败: %w", err)
    }
    
    return html, stateJSON, nil
}
// 修改 NewServer 函数
func NewServer(port string, kafkaURL string, templatesDir string) (*Server, error) {
    // 创建配置
    config := DefaultConfig()
    if port != "" {
        config.Port = port
    }
    if kafkaURL != "" {
        config.KafkaURL = kafkaURL
    }
    if templatesDir != "" {
        config.TemplatesDir = templatesDir
    }
    
    // 创建 Kafka 客户端
    kc, err := NewKafkaClient(config.KafkaURL)
    if err != nil {
        return nil, fmt.Errorf("创建 Kafka 客户端失败: %w", err)
    }
    
    // 创建 Gin 引擎
    gin.SetMode(gin.ReleaseMode)
    engine := gin.New()
    engine.Use(gin.Recovery())
    
    // 创建渲染器
    renderer, err := NewRenderer(engine, config.TemplatesDir)
    if err != nil {
        return nil, fmt.Errorf("创建渲染器失败: %w", err)
    }
    
    return &Server{
        port:        config.Port,
        kafkaClient: kc,
        renderer:    renderer,
        engine:      engine,
        templates:   renderer.templates,
    }, nil
}

// 添加到 server.go 文件中

// NewServerWithConfig 使用配置创建一个新的 Azofly 服务器实例
func NewServerWithConfig(config *Config) (*Server, error) {
	// 创建 Kafka 客户端
	kc, err := NewKafkaClient(config.KafkaURL)
	if err != nil {
		return nil, fmt.Errorf("创建 Kafka 客户端失败: %w", err)
	}
	
	// 设置 Gin 模式
	if config.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}
	
	// 创建 Gin 引擎
	engine := gin.New()
	// 添加中间件
	engine.Use(gin.Recovery())
	if config.LogLevel == "debug" {
		engine.Use(gin.Logger())
	}
	
	// 创建渲染器
	renderer, err := NewRenderer(engine, config.TemplatesDir)
	if err != nil {
		return nil, fmt.Errorf("创建渲染器失败: %w", err)
	}
	
	return &Server{
		port:        config.Port,
		kafkaClient: kc,
		renderer:    renderer,
		engine:      engine,
		templates:   renderer.templates,
		config:      config,
	}, nil
}

// Shutdown 优雅地关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	// 关闭 Kafka 客户端
	if err := s.kafkaClient.Close(); err != nil {
		log.Printf("关闭 Kafka 客户端错误: %v", err)
	}
	
	// 这里可以添加其他清理工作
	return nil
}

// 启动服务器
func (s *Server) Start(ctx context.Context) error {
	// 设置静态文件服务
	s.engine.Static("/static", "./static")
	
	// 设置 API 路由
	s.engine.GET("/api/*path", func(c *gin.Context) {
		path := c.Param("path")
		c.JSON(http.StatusOK, gin.H{
			"path": path,
			"time": time.Now().Format(time.RFC3339),
		})
	})
	
	// 设置所有其他路由，用于直接 HTTP 访问（非 Kafka 方式）
    s.engine.NoRoute(func(c *gin.Context) {
    path := c.Request.URL.Path
    
    // 解析请求体
    var body json.RawMessage
    if c.Request.Body != nil {
        if err := c.ShouldBindJSON(&body); err != nil {
            // 忽略错误，使用空的请求体
            body = json.RawMessage("{}")
        }
    }
    
    // 渲染页面
    html, state, err := s.renderer.RenderPage(path, body)
    if err != nil {
        c.String(http.StatusInternalServerError, "渲染错误: %v", err)
        return
    }
    
    // 根据 Accept 头返回 HTML 或 JSON
    if c.GetHeader("Accept") == "application/json" {
        c.JSON(http.StatusOK, gin.H{
            "html":  html,
            "state": json.RawMessage(state),
        })
      } else {
        c.Header("Content-Type", "text/html")
        c.String(http.StatusOK, html)
      }
    })
	
	// 启动 Kafka 消费者
	go s.kafkaClient.ConsumeMessages(ctx, "azofly-ssr-requests", s.handleKafkaMessage)
	// 启动 HTTP 服务器
	log.Printf("Azofly 服务器在端口 %s 上启动", s.port)
	return s.engine.Run(":" + s.port)
}

//处理来自 Kafka 的消息
func (s *Server) handleKafkaMessage(msg []byte) error {
	var request RequestMessage
	if err := json.Unmarshal(msg, &request); err != nil {
		return fmt.Errorf("解析请求失败: %w", err)
	}
	
	// 处理请求
	html, state, err := s.renderer.RenderPage(request.Path, request.Body)
	
	// 创建响应
	response := ResponseMessage{
		RequestID: request.ID,
		Timestamp: time.Now().UnixMilli(),
		Headers:   make(map[string]string),
	}
	
	if err != nil {
		response.Error = err.Error()
		response.Status = 500
	} else {
		response.HTML = html
		response.State = state
		response.Status = 200
	}
	
	// 序列化响应
	responseBytes, err := json.Marshal(response)
	if err != nil {
		return fmt.Errorf("序列化响应失败: %w", err)
	}
	
	// 发送响应
	return s.kafkaClient.SendMessage(context.Background(), "azofly-ssr-responses", request.ID, responseBytes)
}

// 辅助函数

// 一个自定义的 ResponseWriter，用于捕获 HTML 输出
type CaptureResponseWriter struct {
	gin.ResponseWriter
	Body *bytes.Buffer
}

// 创建一个新的 CaptureResponseWriter
func NewCaptureResponseWriter() *CaptureResponseWriter {
	return &CaptureResponseWriter{
		Body: new(bytes.Buffer),
		ResponseWriter: nil, // 这是可以的，因为我们只使用 Body
	}
}

// 实现 ResponseWriter 接口
func (w *CaptureResponseWriter) Write(b []byte) (int, error) {
	return w.Body.Write(b)
}

// 实现 ResponseWriter 接口
func (w *CaptureResponseWriter) WriteString(s string) (int, error) {
	return w.Body.WriteString(s)
}

// 实现 gin.ResponseWriter 接口
func (w *CaptureResponseWriter) Status() int {
	return http.StatusOK
}

// 实现 gin.ResponseWriter 接口
func (w *CaptureResponseWriter) Size() int {
	return w.Body.Len()
}

// 实现 http.ResponseWriter 接口
func (w *CaptureResponseWriter) WriteHeader(code int) {
}

func (w *CaptureResponseWriter) Header() http.Header {
    return make(http.Header)
}

// 检查路径是否匹配路由模式
func isRouteMatch(route, path string) bool {
	routeParts := strings.Split(route, "/")
	pathParts := strings.Split(path, "/")
	
	if len(routeParts) != len(pathParts) {
		return false
	}
	
	for i, routePart := range routeParts {
		if strings.HasPrefix(routePart, ":") {
			// 跳过匹配
			continue
		}
		
		if routePart != pathParts[i] {
			return false
		}
	}
	
	return true
}

// extractRouteParams 从路径中提取路由参数
func extractRouteParams(path string) map[string]string {
	params := make(map[string]string)
	// 示例：从 /products/123 提取 id=123
	parts := strings.Split(path, "/")
	if len(parts) >= 3 && parts[1] == "products" {
		params["id"] = parts[2]
	}
	return params
}