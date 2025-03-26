// azofly/packages/core/js/src/bridge.js

/**
 * bridge.js
 * 提供 JavaScript 和 Go 之间的通信层
 */

import { v4 as uuidv4 } from 'uuid';

class GoBridge {
	constructor(kafkaConfig) {
		this.kafkaConfig = kafkaConfig || {
			brokers: ['localhost:9092'],
			clientId: 'azofly-client',
		};

		this.pendingRequests = new Map();
		this.responseHandlers = new Map();

		// 初始化 Kafka 客户端
		this.initKafkaClient();

		// 开始监听响应
		this.startResponseListener();
	}

	/**
	 * 初始化 Kafka 客户端
	 * 注意：这是一个简化的实现，实际应用中会使用真正的 Kafka 客户端库
	 */
	initKafkaClient() {
		// 在实际实现中，这里会初始化 Kafka 客户端
		// 为了简化，我们使用模拟实现
		this.kafkaClient = {
			sendMessage: async (topic, key, value) => {
				console.log(`[Kafka] 发送消息到主题 ${topic}，键: ${key}`);

				// 模拟网络延迟
				await new Promise((resolve) => setTimeout(resolve, 100));

				// 在实际实现中，这里会发送消息到 Kafka
				return true;
			},

			consumeMessages: (topic, handler) => {
				console.log(`[Kafka] 开始从主题 ${topic} 消费消息`);

				// 在实际实现中，这里会从 Kafka 消费消息
				// 为了简化，我们不做任何事情
			},
		};
	}

	/**
	 * 发送请求到 Go 后端
	 * @param {string} path - API 路径
	 * @param {object} options - 请求选项
	 * @returns {Promise<any>} - Go 的响应
	 */
	async sendRequest(path, options = {}) {
		const requestId = uuidv4();

		const request = {
			id: requestId,
			path,
			method: options.method || 'GET',
			headers: options.headers || {},
			body: options.body ? JSON.stringify(options.body) : null,
			timestamp: Date.now(),
		};

		// 创建一个在收到响应时会被解决的 Promise
		const responsePromise = new Promise((resolve, reject) => {
			// 存储 resolve/reject 函数，在响应到达时调用
			this.pendingRequests.set(requestId, { resolve, reject });

			// 设置超时，如果没有收到响应则拒绝 Promise
			setTimeout(() => {
				if (this.pendingRequests.has(requestId)) {
					const { reject } = this.pendingRequests.get(requestId);
					reject(new Error('请求超时'));
					this.pendingRequests.delete(requestId);
				}
			}, options.timeout || 30000); // 默认 30 秒超时
		});

		// 发送请求到 Kafka
		await this.kafkaClient.sendMessage(
			'azofly-ssr-requests',
			requestId,
			JSON.stringify(request),
		);

		return responsePromise;
	}

	/**
	 * 注册特定响应类型的处理器
	 * @param {string} type - 响应类型
	 * @param {Function} handler - 处理函数
	 */
	registerResponseHandler(type, handler) {
		this.responseHandlers.set(type, handler);
	}

	/**
	 * 开始监听来自 Go 后端的响应
	 */
	startResponseListener() {
		this.kafkaClient.consumeMessages('azofly-ssr-responses', (message) => {
			try {
				const response = JSON.parse(message);

				// 如果这是对待处理请求的响应，解决 Promise
				if (
					response.requestId &&
					this.pendingRequests.has(response.requestId)
				) {
					const { resolve, reject } = this.pendingRequests.get(
						response.requestId,
					);

					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response);
					}

					this.pendingRequests.delete(response.requestId);
				}
				// 否则，用注册的响应处理器处理
				else if (response.type && this.responseHandlers.has(response.type)) {
					const handler = this.responseHandlers.get(response.type);
					handler(response);
				}
			} catch (err) {
				console.error('处理响应错误:', err);
			}
		});
	}
}

export default GoBridge;
