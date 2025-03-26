// azofly/packages/core/js/src/client.js

/**
 * client.js
 * Azofly 的客户端运行时
 */

import GoBridge from './bridge';

class AzoflyClient {
	constructor(options = {}) {
		this.options = {
			kafka: {
				brokers: options.kafka?.brokers || ['localhost:9092'],
				clientId: options.kafka?.clientId || 'azofly-client',
			},
			hydration: options.hydration !== false,
			...options,
		};

		this.bridge = new GoBridge(this.options.kafka);
		this.cache = new Map();

		// 初始化客户端
		this.init();
	}

	/**
	 * 初始化客户端
	 */
	init() {
		// 如果启用了水合，则执行水合
		if (this.options.hydration && typeof window !== 'undefined') {
			this.hydrate();
		}

		// 注册事件监听器
		this.registerEventListeners();

		console.log('Azofly 客户端初始化完成');
	}

	/**
	 * 从服务器渲染的 HTML 水合应用
	 */
	hydrate() {
		// 从 window 对象获取初始状态
		const initialState = window.__AZOFLY_INITIAL_STATE__ || {};

		// 将初始数据存储在缓存中
		Object.entries(initialState).forEach(([key, value]) => {
			this.cache.set(key, value);
		});

		console.log('Azofly 客户端已使用初始状态水合');
	}

	/**
	 * 注册导航等事件监听器
	 */
	registerEventListeners() {
		if (typeof window !== 'undefined') {
			// 处理客户端导航
			document.addEventListener('click', (event) => {
				// 查找最近的锚标签
				const anchor = event.target.closest('a');

				if (
					anchor &&
					anchor.href &&
					anchor.href.startsWith(window.location.origin) &&
					!anchor.hasAttribute('target') &&
					!anchor.hasAttribute('download') &&
					event.button === 0 && // 左键点击
					!event.metaKey &&
					!event.ctrlKey
				) {
					event.preventDefault();

					const url = new URL(anchor.href);
					this.navigate(url.pathname + url.search);
				}
			});

			// 处理浏览器后退/前进
			window.addEventListener('popstate', (event) => {
				const { pathname, search } = window.location;
				this.navigate(pathname + search, { updateHistory: false });
			});
		}
	}

	/**
	 * 导航到新页面
	 * @param {string} path - 要导航到的路径
	 * @param {object} options - 导航选项
	 */
	async navigate(path, options = {}) {
		try {
			console.log(`导航到: ${path}`);

			// 默认选项
			const navOptions = {
				updateHistory: true,
				...options,
			};

			// 从 Go 后端请求页面
			const response = await this.bridge.sendRequest(path, {
				method: 'GET',
				headers: {
					'Accept': 'text/html',
					'X-Requested-With': 'XMLHttpRequest',
				},
			});

			// 用新内容更新 DOM
			if (response.html) {
				// 这是一个简化版本 - 在实际实现中，
				// 你需要处理部分更新、状态管理等。
				document.getElementById('app').innerHTML = response.html;

				// 如果需要，更新浏览器历史
				if (navOptions.updateHistory) {
					window.history.pushState({}, '', path);
				}

				// 更新缓存
				this.cache.set(path, response.html);

				// 分发导航事件
				window.dispatchEvent(
					new CustomEvent('azofly:navigation', {
						detail: { path },
					}),
				);
			}
		} catch (error) {
			console.error('导航错误:', error);

			// 分发错误事件
			window.dispatchEvent(
				new CustomEvent('azofly:error', {
					detail: { error, path },
				}),
			);
		}
	}

	/**
	 * 从 Go 后端获取数据
	 * @param {string} path - API 路径
	 * @param {object} options - 获取选项
	 * @returns {Promise<any>} - 响应数据
	 */
	async fetchData(path, options = {}) {
		try {
			const response = await this.bridge.sendRequest(path, {
				method: options.method || 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					...(options.headers || {}),
				},
				body: options.body,
			});

			return response.state ? JSON.parse(response.state) : null;
		} catch (error) {
			console.error('数据获取错误:', error);
			throw error;
		}
	}
}

// 导出客户端类
export default AzoflyClient;

// 导出一个创建应用的辅助函数
export function createSSRApp(options) {
	return new AzoflyClient(options);
}
