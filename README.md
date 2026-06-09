<p align="center">
  <h1 align="center">StorySpark AI Novel Generator</h1>
  <p align="center">StorySpark AI 长篇小说生成器</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-0.1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/许可证-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/状态-alpha-orange" alt="status">
</p>

---

一款桌面端 AI 辅助长篇小说创作工具。提供 IDEA 风格的布局界面，支持大纲、角色、物品、世界观等创作要素管理，通过 LLM API 将结构化大纲转化为章节草稿，并通过分层摘要机制解决长篇小说 AI 幻觉问题。

## 已实现功能

- **小说管理** — 创建、编辑、管理多部小说，支持状态追踪
- **大纲编辑** — 层级化大纲编辑器，梳理故事结构
- **角色管理** — 管理角色名称、描述、性格特征（JSON）、角色关系（JSON）
- **物品系统** — 追踪关键物品，支持类型分类与重要性标注
- **世界观设定** — 记录地理、历史、魔法体系、政治、文化、种族等设定
- **章节写作** — 自动编号、自动计算字数、支持草稿/写作中/已完成三种状态
- **章节计划** — 规划章节范围，关联角色、物品、世界观设定
- **梗概管理** — 撰写章节区间梗概，支持手动/自动两种类型
- **AI 配置** — 配置 LLM 接口（支持 OpenAI / DeepSeek / 千问等），API Key 使用 AES-GCM 加密存储，支持一键测试连接
- **IDEA 风格布局** — 可拖拽调整宽度的侧边栏、项目树、多标签页编辑器
- **深色主题** — 全局暗色界面，自定义滚动条
- **桌面壳** — Electron 管理窗口生命周期，自动启动/关闭 Java 后端进程

## 技术栈

| 层级 | 技术 |
|---|---|
| 桌面壳 | Electron 30 |
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand 5 |
| 图标 | lucide-react |
| 后端语言 | Java 17 |
| 后端框架 | Spring Boot 3.3 |
| 持久层 | Spring Data JPA + Hibernate + SQLite |
| API Key 安全 | AES-GCM 加密存储 |
| 打包分发 | electron-builder（Windows / macOS / Linux） |

## 架构

```
┌─────────────────────────────────────────────────┐
│              Electron 应用                        │
│                                                  │
│  ┌──────────────┐      ┌────────────────────┐   │
│  │  主进程        │      │  渲染进程            │   │
│  │               │      │                     │   │
│  │ • 窗口管理     │      │  React + Zustand    │   │
│  │ • JVM 生命周期 │◄────►│  Tailwind CSS       │   │
│  │ • 进程守护     │      │  REST API + SSE     │   │
│  └──────────────┘      └────────────────────┘   │
│            │                      │              │
└────────────│──────────────────────│──────────────┘
             │                      │
      spawns │              HTTP on │ localhost:18080
             ▼                      ▼
    ┌─────────────────────────────────┐
    │      Spring Boot 后端            │
    │                                  │
    │  REST Controllers               │
    │  JPA Repositories               │
    │  SQLite 数据库                   │
    │  AES 加密 API Key                │
    │  LangChain4j（规划中）            │
    └─────────────────────────────────┘
                      │
                      ▼
              LLM 提供商 API
        (OpenAI / DeepSeek / 千问)
```

## 项目结构

```
StorySpark-AI-Novel-Generator/
├── backend/                          # Java Spring Boot 后端
│   ├── pom.xml
│   └── src/main/java/com/storyspark/
│       ├── StorySparkApplication.java  # 应用入口
│       ├── config/                   # DataSource、CORS、加密等配置
│       ├── controller/               # REST 控制器（10 个）
│       ├── model/
│       │   ├── entity/               # JPA 实体（Novel、Chapter、Character 等）
│       │   ├── dto/                  # 数据传输对象
│       │   └── enums/                # 状态与分类枚举
│       ├── repository/               # Spring Data JPA 仓库
│       └── service/                  # 业务逻辑层（10 个 Service）
├── frontend/                         # Electron + React + TypeScript 前端
│   ├── electron/
│   │   ├── main.ts                   # Electron 主进程，管理 Java 生命周期
│   │   └── preload.ts               # 上下文桥接
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # AppLayout、Toolbar
│   │   │   ├── sidebar/              # ProjectTree、TreeNode
│   │   │   ├── tabs/                 # TabBar、TabContainer
│   │   │   ├── editors/              # 8 种实体编辑器
│   │   │   └── shared/               # 可复用组件
│   │   ├── stores/                   # Zustand 状态管理（10 个 Store）
│   │   ├── types/                    # TypeScript 类型定义
│   │   └── lib/                      # API 客户端
│   ├── package.json
│   └── vite.config.ts
├── project_plan.md                   # 完整项目规划书
└── LICENSE
```

## 快速开始

### 环境要求

- **Node.js** 18+
- **Java** 17+
- **Maven** 3.8+

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd ../backend
mvn compile
```

### 开发模式运行

**1. 启动后端：**

```bash
cd backend
mvn spring-boot:run
```

API 服务运行在 `http://localhost:18080`。健康检查：`GET /actuator/health`

**2. 启动前端（仅浏览器）：**

```bash
cd frontend
npm run dev
```

浏览器打开 `http://localhost:5173`，API 请求会自动代理到后端。

**3. 启动完整 Electron 应用：**

```bash
cd frontend
npm run electron:dev
```

自动编译 Electron 主进程、启动 Vite、等待开发服务器就绪后打开 Electron 窗口，同时自动拉起 Java 后端。

### 构建安装包

```bash
cd frontend
npm run electron:build
```

打包产物输出至 `frontend/release/` 目录。

## 路线图

| 阶段 | 状态 | 说明 |
|---|---|---|
| **1. 项目骨架** | ✅ 已完成 | Spring Boot + Electron + Vite 项目骨架，SQLite + JPA，Java 进程生命周期管理 |
| **2. 数据管理与 IDE 布局** | ✅ 已完成 | 全部实体 CRUD、项目树、标签页系统、编辑器表单、AI 配置页 |
| **3. AI 生成** | 🔲 规划中 | LangChain4j 集成、SSE 流式章节生成、Markdown 渲染 |
| **4. 批量生成** | 🔲 规划中 | 批量生成面板、章节计划匹配、进度追踪 |
| **5. 上下文管理** | 🔲 规划中 | Token 计数、层级自动摘要、上下文预算分配 |
| **6. 高级交互** | 🔲 规划中 | 标签页拖拽、键盘快捷键、右键菜单 |
| **7. 导出与分发** | 🔲 规划中 | Markdown/TXT/PDF 导出、JRE 精简打包、端口冲突处理 |

## 许可证

[MIT](LICENSE) © 2026 wzxgA
