# GTC-AI Dashboard

海关查扣案件智能处理平台 - 前端控制台

## 功能特性

- 🔐 用户认证（登录/注册）
- 📁 案件管理（创建/查看/编辑）
- 📄 文件上传与管理
- 🤖 AI 智能分析（Gemini + Claude 双引擎）
- 📊 数据统计与可视化

## 技术栈

- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios
- Lucide Icons

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env`，配置：

```
VITE_API_URL=https://gtc-ai-platform.onrender.com
```

## 部署到 Render

1. 在 Render 创建 Static Site
2. 连接 GitHub 仓库
3. 设置 Build Command: `npm run build`
4. 设置 Publish Directory: `dist`
5. 添加环境变量 `VITE_API_URL`

## 目录结构

```
src/
├── components/     # 通用组件
├── context/        # React Context
├── pages/          # 页面组件
├── services/       # API 服务
├── hooks/          # 自定义 Hooks
└── assets/         # 静态资源
```

## API 后端

后端 API 地址: https://gtc-ai-platform.onrender.com

API 文档: https://gtc-ai-platform.onrender.com/docs
