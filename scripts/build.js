// scripts/build.js
const esbuild = require('esbuild');
const { rimraf } = require('rimraf');
const path = require('path');
const fs = require('fs');

// 清理输出目录
console.log('清理输出目录...');
rimraf.sync(path.resolve(__dirname, '../static/js'));
fs.mkdirSync(path.resolve(__dirname, '../static/js'), { recursive: true });

// 构建客户端 JavaScript
console.log('构建客户端 JavaScript...');
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../packages/core/js/src/client.js')],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2018'],
  outfile: path.resolve(__dirname, '../static/js/client.js'),
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

// 构建 bridge.js
console.log('构建 bridge.js...');
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../packages/core/js/src/bridge.js')],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2018'],
  outfile: path.resolve(__dirname, '../static/js/bridge.js'),
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

// 复制 CSS 文件
console.log('复制 CSS 文件...');
if (!fs.existsSync(path.resolve(__dirname, '../static/css'))) {
  fs.mkdirSync(path.resolve(__dirname, '../static/css'), { recursive: true });
}

// 如果 CSS 文件不存在，创建一个基本的 CSS 文件
const cssFilePath = path.resolve(__dirname, '../static/css/main.css');
if (!fs.existsSync(cssFilePath)) {
  console.log('创建基本 CSS 文件...');
  fs.writeFileSync(cssFilePath, `
/* 基本样式 */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --text-color: #333;
  --light-bg: #f5f5f5;
  --dark-bg: #333;
  --border-color: #ddd;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--light-bg);
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 30px;
}

header h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

nav {
  display: flex;
  gap: 20px;
}

nav a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

main {
  min-height: 60vh;
  padding: 20px 0;
}

footer {
  text-align: center;
  padding: 20px 0;
  margin-top: 50px;
  border-top: 1px solid var(--border-color);
  color: #777;
}
  `);
}

// 创建模板目录和基本模板
console.log('检查模板目录...');
if (!fs.existsSync(path.resolve(__dirname, '../templates'))) {
  console.log('创建模板目录和基本模板...');
  fs.mkdirSync(path.resolve(__dirname, '../templates'), { recursive: true });
  
  // 创建基本模板文件
  const templates = [
    {
      name: 'index.tmpl',
      content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azofly - 首页</title>
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>欢迎使用 Azofly</h1>
            <nav>
                <a href="/">首页</a>
                <a href="/about">关于</a>
                <a href="/products">产品</a>
            </nav>
        </header>
        
        <main>
            <h2>下一代 SSR 框架</h2>
            <p>Azofly 是一个基于 Go 和 JavaScript 构建的高性能服务端渲染框架。</p>
            <p>凭借 Go 的强大并发处理能力和 JavaScript 的丰富生态，实现超低延迟的极速渲染，轻松应对高并发场景。</p>
            
            <div class="features">
                <div class="feature">
                    <h3>高性能</h3>
                    <p>利用 Go 的并发能力实现超快速渲染</p>
                </div>
                <div class="feature">
                    <h3>易用性</h3>
                    <p>使用熟悉的 JavaScript API，无需学习 Go</p>
                </div>
                <div class="feature">
                    <h3>可扩展</h3>
                    <p>模块化架构，轻松扩展和定制</p>
                </div>
            </div>
        </main>
        
        <footer>
            <p>&copy; 2023 Azofly 团队</p>
        </footer>
    </div>
    
    <script>
        // 初始状态数据
        window.__AZOFLY_INITIAL_STATE__ = {
            "path": "/",
            "rendered": true
        };
    </script>
    <script src="/static/js/client.js"></script>
</body>
</html>`
    },
    {
      name: 'about.tmpl',
      content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azofly - 关于我们</title>
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>关于 Azofly</h1>
            <nav>
                <a href="/">首页</a>
                <a href="/about">关于</a>
                <a href="/products">产品</a>
            </nav>
        </header>
        
        <main>
            <h2>我们的故事</h2>
            <p>Azofly 是一个创新的 SSR 框架，旨在结合 Go 和 JavaScript 的优势。</p>
            <p>我们的团队由一群热爱技术的开发者组成，致力于创造更好的 Web 开发体验。</p>
            
            <h2>技术架构</h2>
            <p>Azofly 使用 Kafka 作为消息队列，实现前端和 Go 后端之间的通信。</p>
            <p>前端将请求发送到消息队列，Go 服务器从消息队列中获取请求并处理，处理结果再返回给前端。</p>
            <p>这种架构可以实现请求的异步处理，提高系统的并发能力和可靠性。</p>
        </main>
        
        <footer>
            <p>&copy; 2023 Azofly 团队</p>
        </footer>
    </div>
    
    <script>
        // 初始状态数据
        window.__AZOFLY_INITIAL_STATE__ = {
            "path": "/about",
            "rendered": true
        };
    </script>
    <script src="/static/js/client.js"></script>
</body>
</html>`
    },
    {
      name: 'products.tmpl',
      content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azofly - 产品列表</title>
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>产品列表</h1>
            <nav>
                <a href="/">首页</a>
                <a href="/about">关于</a>
                <a href="/products">产品</a>
            </nav>
        </header>
        
        <main>
            <div class="products">
                {{range .products}}
                <div class="product-card">
                    <h3>{{.name}}</h3>
                    <p>{{.description}}</p>
                    <p class="price">¥{{.price}}</p>
                    <a href="/products/{{.id}}" class="btn">查看详情</a>
                </div>
                {{else}}
                <p>暂无产品</p>
                {{end}}
            </div>
        </main>
        
        <footer>
            <p>&copy; 2023 Azofly 团队</p>
        </footer>
    </div>
    
    <script>
        // 初始状态数据
        window.__AZOFLY_INITIAL_STATE__ = {
            "path": "/products",
            "rendered": true
        };
    </script>
    <script src="/static/js/client.js"></script>
</body>
</html>`
    },
    {
      name: 'product-detail.tmpl',
      content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azofly - 产品详情</title>
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>产品详情</h1>
            <nav>
                <a href="/">首页</a>
                <a href="/about">关于</a>
                <a href="/products">产品</a>
            </nav>
        </header>
        
        <main>
            {{if .product}}
            <div class="product-detail">
                <h2>{{.product.name}}</h2>
                <div class="product-image">
                    <img src="{{.product.image}}" alt="{{.product.name}}">
                </div>
                <div class="product-info">
                    <p class="description">{{.product.description}}</p>
                    <p class="price">¥{{.product.price}}</p>
                    <button class="btn add-to-cart" data-id="{{.product.id}}">加入购物车</button>
                </div>
            </div>
            {{else}}
            <p>产品不存在</p>
            <a href="/products" class="btn">返回产品列表</a>
            {{end}}
        </main>
        
        <footer>
            <p>&copy; 2023 Azofly 团队</p>
        </footer>
    </div>
    
    <script>
        // 初始状态数据
        window.__AZOFLY_INITIAL_STATE__ = {
            "path": "/products/{{if .product}}{{.product.id}}{{end}}",
            "rendered": true
        };
        
        // 客户端交互
        document.addEventListener('DOMContentLoaded', function() {
            const addToCartBtn = document.querySelector('.add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', function() {
                    const productId = this.getAttribute('data-id');
                    console.log('添加产品到购物车:', productId);
                    // 这里可以添加购物车逻辑
                });
            }
        });
    </script>
    <script src="/static/js/client.js"></script>
</body>
</html>`
    },
    {
      name: 'default.tmpl',
      content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azofly</title>
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>Azofly</h1>
            <nav>
                <a href="/">首页</a>
                <a href="/about">关于</a>
                <a href="/products">产品</a>
            </nav>
        </header>
        
        <main>
            <h2>页面不存在</h2>
            <p>您请求的页面 "{{.path}}" 不存在。</p>
            <a href="/" class="btn">返回首页</a>
        </main>
        
        <footer>
            <p>&copy; 2023 Azofly 团队</p>
        </footer>
    </div>
    
    <script>
        // 初始状态数据
        window.__AZOFLY_INITIAL_STATE__ = {
            "path": "{{.path}}",
            "rendered": true
        };
    </script>
    <script src="/static/js/client.js"></script>
</body>
</html>`
    }
  ];
  
  templates.forEach(template => {
    fs.writeFileSync(path.resolve(__dirname, `../templates/${template.name}`), template.content);
  });
}

console.log('构建完成！');