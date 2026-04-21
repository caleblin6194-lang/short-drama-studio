# ShotForge App

> 这是交接包里的主应用目录。
> 如果你是新开发者，请优先先看上一级目录的 `README.md` 和 `HANDOVER.md`。

## 目录作用

`app/` 是实际运行在服务器上的 Next.js 项目，包含：

- 前端页面
- 所有 `src/app/api/*` 接口
- Zustand 状态管理
- AI 图像、视频、TTS、渲染链路
- Supabase schema 与迁移

## 快速开始

```bash
cp .env.example .env.local
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## 关键目录

```text
app/
├── src/app/                 # 页面与 API
├── src/components/          # 业务组件
├── src/store/               # Zustand stores
├── src/lib/                 # 第三方能力与工具函数
├── src/types/               # TypeScript 类型
├── supabase/                # 迁移
└── supabase-schema.sql      # 当前 schema
```

## 新开发者建议先看

1. `src/store/useProjectStore.ts`
2. `src/app/api/shots/generate/route.ts`
3. `src/app/api/shoot/image/route.ts`
4. `src/app/api/shoot/video/route.ts`
5. `src/app/api/render/master-cut/route.ts`
6. `src/app/api/export/route.ts`

## 环境变量

主要看：

- `DOUBAN_SEED_API_KEY`
- `DOUBAN_IMAGE_ENDPOINT`
- `DOUBAN_MODEL`
- `SEED_API_ENDPOINT`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENABLE_REAL_PIPELINE`

## 当前要优先注意的已知问题

1. 登录接口保留了 demo/admin 直登逻辑
2. `render/serve` 目前存在路径校验风险
3. 图片异步任务轮询链路未完成
4. 渲染混流可能截短视频
5. 横版导出参数目前不正确

详细说明见上一级目录的 `HANDOVER.md` 和 `docs/常见问题排查.md`。
