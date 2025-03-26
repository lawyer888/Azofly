// scripts/dev.js
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 确保输出目录存在
if (!fs.existsSync(path.resolve(__dirname, '../static/js'))) {
  fs.mkdirSync(path.resolve(__dirname, '../static/js'), { recursive: true });
}

// 启动 esbuild 监视模式
const clientContext = esbuild.context({
  entryPoints: [path.resolve(__dirname, '../packages/core/js/src/client.js')],
  bundle: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2018'],
  outfile: path.resolve(__dirname, '../static/js/client.js'),
  define: {
    'process.env.NODE_ENV': '"development"'
  }
}).catch(() => process.exit(1));

const bridgeContext = esbuild.context({
  entryPoints: [path.resolve(__dirname, '../packages/core/js/src/bridge.js')],
  bundle: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2018'],
  outfile: path.resolve(__dirname, '../static/js/bridge.js'),
  define: {
    'process.env.NODE_ENV': '"development"'
  }
}).catch(() => process.exit(1));

// 启动 Go 服务器
const goServer = spawn('go', ['run', 'packages/core/go/main.go'], {
  stdio: 'inherit',
  shell: true
});

// 监听 CTRL+C 信号
process.on('SIGINT', async () => {
  console.log('正在关闭开发服务器...');
  
  // 关闭 esbuild 上下文
  (await clientContext).dispose();
  (await bridgeContext).dispose();
  
  // 终止 Go 服务器
  goServer.kill();
  
  process.exit(0);
});

console.log('开发服务器已启动，按 CTRL+C 停止');