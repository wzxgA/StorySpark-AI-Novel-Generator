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
- **章节计划** — 规划章节范围，关联角色、物品、世界观设定；弹窗多选组件
- **摘要管理** — 三层自动摘要（L1/L2/L3），支持手动+自动两种类型
- **AI 单章生成** — LangChain4j 流式生成，SSE 逐字推送，Markdown 实时渲染 + 打字机效果
- **AI 批量生成** — 1-20 章批量生成，进度追踪，每章状态独立展示（pending/generating/done/error）
- **智能上下文管理** — Token 预算动态分配（6 段优先级算法），75% 窗口安全余量，启发式 Token 估算
- **AI 配置** — 配置 LLM 接口（支持 OpenAI / DeepSeek / 千问 / Ollama），API Key AES 加密存储，一键测试连接
- **IDEA 风格布局** — 可拖拽调整宽度的侧边栏、项目树、可拖拽排序的多标签页编辑器
- **高级交互** — Tab 拖拽排序（@dnd-kit）、键盘快捷键（Ctrl+N/G/S/Enter）、右键菜单（重命名/删除/新建）
- **中英双语** — i18next 国际化，界面语言一键切换
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
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable |
| 国际化 | i18next + react-i18next |
| 后端语言 | Java 17 |
| 后端框架 | Spring Boot 3.3 |
| 持久层 | Spring Data JPA + Hibernate + SQLite |
| AI 框架 | LangChain4j（OpenAiStreamingChatModel + OpenAiChatModel） |
| 流式通信 | SSE (SseEmitter) |
| API Key 安全 | AES 加密存储 |
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
    │  LangChain4j（流式 + 同步）       │
    │  TokenCounter / ContextManager   │
    │  Summarizer（三层自动摘要）       │
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
│       └── service/                  # 业务逻辑层（13 个 Service，含 AIGeneration、ContextManager、Summarizer、TokenCounter）
├── frontend/                         # Electron + React + TypeScript 前端
│   ├── electron/
│   │   ├── main.ts                   # Electron 主进程，管理 Java 生命周期
│   │   └── preload.ts               # 上下文桥接
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # AppLayout、Toolbar
│   │   │   ├── sidebar/              # ProjectTree、TreeNode
│   │   │   ├── tabs/                 # TabBar（DnD 拖拽）、TabContainer、TabContent
│   │   │   ├── editors/              # 8 种实体编辑器
│   │   │   ├── generation/           # BatchGenerationPanel
│   │   │   ├── settings/             # SettingsPage
│   │   │   └── shared/               # EntityFormWrapper、SelectionModal、ContextMenu
│   │   ├── hooks/                    # useKeyboardShortcuts 等
│   │   ├── stores/                   # Zustand 状态管理（11 个 Store）
│   │   ├── types/                    # TypeScript 类型定义
│   │   ├── i18n/                     # i18next 国际化（中/英）
│   │   └── lib/                      # API 客户端（REST + SSE）
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
| **3. AI 单章生成** | ✅ 已完成 | LangChain4j 集成、SSE 流式章节生成、Markdown 渲染 + 打字机效果、中英双语 |
| **4. 批量生成与章节计划** | ✅ 已完成 | 批量生成面板、章节计划匹配、进度追踪、弹窗多选组件 |
| **5. 智能上下文管理** | ✅ 已完成 | Token 计数、三层自动摘要、上下文预算分配、System Prompt 增强 |
| **6. 高级交互体验** | ✅ 已完成 | @dnd-kit 标签页拖拽排序、键盘快捷键（Ctrl+N/G/S/Enter）、右键菜单 |
| **7. 导出与分发** | ✅ 已完成 | Markdown/TXT/PDF 导出、动态端口 fallback、jlink 精简 JRE、electron-builder 打包就绪 |

## 许可证

[MIT](LICENSE) © 2026 wzxgA
