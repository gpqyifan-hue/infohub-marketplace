# InfoHub Market

InfoHub Market 是一个面向社交信息和商户交易的全栈应用 MVP。它结合了：
- 个人/商家信息发布
- 文本、图片、视频内容展示
- 评论、点赞、互动社交机制
- 商户交易与订单管理

## 技术栈

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (开发中先提供 API 骨架)

## 目录结构

- `frontend/`：前端应用
- `backend/`：后端 API
- `.env.example`：环境变量示例

## 启动步骤

1. 复制 `.env.example` 为 `.env`
2. 安装依赖：
   ```bash
   npm install
   npm install --workspace backend
   npm install --workspace frontend
   ```
3. 启动应用：
   ```bash
   npm run dev
   ```

## 当前状态

当前项目已经具备：
- 基础前端页面
- 后端 API 路由示例
- 商户与内容数据模型入口
- 订单提交接口

后续规划：
- 用户认证与角色系统
- 图片/视频上传
- 评论点赞与消息通知
- 真正的支付与订单结算
- 商家后台和审核中心

## 说明

这是一个合规场景的应用框架，适合演示和二次开发。所有发布内容必须遵守当地法律和平台规范，真实上生产前需要加入内容审核、风控、支付、用户验证等机制。
