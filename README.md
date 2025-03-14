# Azofly
Azofly，基于 Go 和 JavaScript 构建的下一代 SSR 框架。凭借 Go 的强大并发处理能力和 JavaScript 的丰富生态，实现超低延迟的极速渲染，轻松应对高并发场景，是构建高性能 Web 应用的理想选择。
# Introduce
<p align="center">
  <img src="https://via.placeholder.com/200x200?text=Azofly" alt="Azofly Logo" width="200" height="200">
</p>

<p align="center">
  Next-generation SSR framework combining Go's concurrency with JavaScript's ecosystem
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#examples">Examples</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

## Overview

Azofly is a high-performance server-side rendering (SSR) framework that leverages Go's powerful concurrency capabilities with JavaScript's rich ecosystem. The framework is designed for JavaScript developers who want to benefit from Go's performance without having to learn Go.

By using Kafka as a message queue, Azofly enables asynchronous request processing, improving system reliability and scalability. The frontend sends requests to the message queue, which are then processed by the Go backend. The results are sent back to the frontend for rendering.

## Features

- **High Performance**: Leverage Go's concurrency for ultra-fast rendering
- **JavaScript API**: Use a familiar JavaScript API without learning Go
- **Asynchronous Processing**: Handle high-concurrency scenarios with Kafka
- **Seamless Hydration**: Client-side hydration for interactive applications
- **Modular Architecture**: Easily extend and customize the framework
- **Developer Experience**: Hot reloading, detailed error messages, and debugging tools

## Architecture

High-level architecture showing the interaction between JavaScript, Go, and Kafka。
![signimg](https://github.com/lawyer888/IMG/blob/main/reaaaddd.png?raw=true)

