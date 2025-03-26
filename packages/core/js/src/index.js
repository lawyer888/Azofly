/**
 * Azofly 框架的主入口点
 */
import AzoflyClient, { createSSRApp } from './client';
import GoBridge from './bridge';

// 导出主要 API
export { AzoflyClient, createSSRApp, GoBridge };

// 导出一个定义组件的辅助函数
export function defineComponent(options) {
	return {
		...options,
		// 添加一些框架特定的属性
		__azofly: true,
	};
}

// 导出一个数据获取钩子
export function useData(fetcher) {
	return {
		type: 'data',
		fetcher,
	};
}

// 导出版本信息
export const version = '0.1.0';

// 如果在浏览器中，自动初始化
if (typeof window !== 'undefined') {
	// 检查是否有自动初始化标志
	const autoInit = window.__AZOFLY_AUTO_INIT__ !== false;

	if (autoInit) {
		// 从 window 获取配置
		const config = window.__AZOFLY_CONFIG__ || {};

		// 创建客户端实例
		window.__AZOFLY_CLIENT__ = createSSRApp(config);

		console.log('Azofly 已自动初始化');
	}
}
