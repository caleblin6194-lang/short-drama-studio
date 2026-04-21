# 短剧制作工具 — 开发交接文档

> 版本：2026-04  
> 服务器：`118.89.95.71`  
> 线上域名：`https://shotforge.verixa.online`

---

## 一、项目简介

AI 短剧工业化制作平台。用户通过 4 个步骤完成一部短剧：

| 步骤 | 页面 | 功能 |
|---|---|---|
| 第一步 剧本 | `/project/[id]/stage1` | 标签选择、AI 写剧本、故事结构规划 |
| 第二步 选角 | `/project/[id]/stage2` | AI 生成场景/角色/道具图像并审核 |
| 第三步 拍摄 | `/project/[id]/stage3` | AI 分镜 → 逐镜生成图像/视频/配音 |
| 第四步 成片 | `/project/[id]/stage4` | FFmpeg 合成、字幕、BGM、导出 |

---

## 二、技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Next.js App Router | 16.2.3 |
| UI 框架 | React + Tailwind CSS | 19.2.4 |
| 状态管理 | Zustand | 5.0.12 |
| 数据库/认证 | Supabase (PostgreSQL) | — |
| 图像生成 | Doubao Seedream（火山引擎） | seedream-5-0 |
| 视频生成 | Doubao Seedance（火山引擎） | seedance-1-5-pro/2-0/1-0-fast |
| 文本 LLM | Doubao（火山引擎） | seed-1-6-flash |
| TTS 配音 | edge-tts（Python subprocess） | — |
| 视频合成 | FFmpeg（服务器本地） | 4.4+ |
| 图片 CDN | Cloudinary（可选） | — |
| 部署 | PM2 cluster 模式 | — |
| 测试 | Vitest + Testing Library | — |

---

## 三、必须交接的内容

### 3.1 代码仓库

源码路径：`/Users/y/Desktop/短剧制作工具/app/`

**强烈建议** 在交接前推送到 Git 仓库（GitHub / GitLab / Gitee）并给新开发者读写权限：

```bash
cd /Users/y/Desktop/短剧制作工具/app
git init
git remote add origin https://github.com/xxx/shotforge.git
git add .
git commit -m "initial"
git push -u origin main
```

---

### 3.2 环境变量

交接时需提供 `.env.production` 的**实际值**（不是 `.env.example`）：

```bash
# ── AI / LLM ──────────────────────────────────────────────
DOUBAN_SEED_API_KEY=          # 火山引擎 Volc ARK API Key（图像+视频共用）
DOUBAN_IMAGE_ENDPOINT=        # Seedream 图像接口（通常是 ark.cn-beijing.volces.com/api/v3/images/generations）
DOUBAN_MODEL=                 # 图像模型 ID（doubao-seedream-5-0-260128）
SEED_API_ENDPOINT=            # Seedance 视频接口（ark.cn-beijing.volces.com/api/v3/contents/generations/tasks）

# ── 数据库 ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=     # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=# Supabase 匿名公钥

# ── 功能开关 ──────────────────────────────────────────────
NEXT_PUBLIC_ENABLE_REAL_PIPELINE=1  # 1=真实调用AI, 0=mock演示模式

# ── 图片 CDN（可选）──────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── 腾讯 COS 对象存储（可选）─────────────────────────────
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=
```

---

### 3.3 服务器访问

| 项目 | 值 |
|---|---|
| 服务器 IP | `118.89.95.71` |
| 登录用户 | `root` |
| 登录方式 | SSH 密钥 / 密码（交接时面传） |
| 应用目录 | `/var/www/shotforge/` |
| 日志目录 | `/var/log/shotforge/` |
| 渲染文件 | `/var/www/shotforge/renders/`（需定期清理） |
| 进程管理 | PM2（`pm2 status` 查看运行状态） |

**服务器必须安装的依赖：**

```bash
node --version      # 需要 20+
ffmpeg -version     # 需要 4.4+（支持 xfade 滤镜）
python3 -m edge_tts --version   # 需要安装：pip install edge-tts
pm2 --version       # 需要 5+
```

---

### 3.4 第三方平台账号

| 平台 | 用途 | 如何获取 |
|---|---|---|
| 火山引擎控制台 | Seedance 视频 + Seedream 图像 + LLM | 查 `DOUBAN_SEED_API_KEY` 对应账号 |
| Supabase | 数据库 + 用户认证 | 查 `NEXT_PUBLIC_SUPABASE_URL` 对应项目 |
| Cloudinary（可选） | 图片 CDN | 查 `CLOUDINARY_API_KEY` |

---

## 四、项目结构

```
app/
├── src/
│   ├── app/
│   │   ├── api/                  # 37 个服务端 API 路由
│   │   │   ├── auth/             # 登录/注册/登出/当前用户
│   │   │   ├── projects/         # 项目 CRUD
│   │   │   ├── assets/           # 资产（场景/角色/道具）CRUD
│   │   │   ├── shoot/            # 图像生成、视频生成、状态轮询
│   │   │   ├── shots/generate/   # LLM 分镜生成
│   │   │   ├── render/           # FFmpeg 合成 + 视频文件服务
│   │   │   ├── tts/              # TTS 配音（edge-tts）
│   │   │   ├── export/           # 导出（竖版/横版/封面）
│   │   │   ├── membership/       # 积分余额、充值、账单
│   │   │   ├── ai/               # cliffhanger、chat-edit 等 AI 辅助
│   │   │   └── health/           # 健康检查
│   │   ├── project/[id]/         # 4 个制作步骤页面
│   │   └── dashboard/            # 项目列表、订阅、设置
│   ├── components/               # 70+ React 组件（按 stage1-4 分目录）
│   ├── store/                    # 6 个 Zustand 状态仓库（见下）
│   ├── types/index.ts            # 所有 TypeScript 类型定义
│   └── lib/
│       ├── api/
│       │   ├── doubao-image.ts   # 图像生成封装
│       │   ├── doubao-text.ts    # LLM 文本生成封装
│       │   ├── seed-video.ts     # 视频生成封装（含 fallback chain）
│       │   └── shoot-pipeline.ts # 拍摄流水线客户端编排
│       ├── supabase.ts           # 数据库客户端（含文件存储回退）
│       ├── inferConfig.ts        # 根据标签推断制作配置
│       ├── creditCosts.ts        # 积分消耗配置表
│       └── storyStructure.ts     # 故事结构工具
├── supabase/migrations/          # 数据库迁移脚本
├── ecosystem.config.js           # PM2 生产配置
├── next.config.ts                # Next.js 配置
└── .env.example                  # 环境变量模板
```

---

## 五、状态管理（Zustand Stores）

| Store 文件 | 管理内容 |
|---|---|
| `useProjectStore.ts` | 核心：整个项目生命周期（4步制作流水线所有状态） |
| `useProjectListStore.ts` | 项目列表（Dashboard 侧边栏数据） |
| `useAuthStore.ts` | 用户认证（登录态、Token，localStorage 持久化） |
| `useCreditsStore.ts` | 积分余额、消费记录、月度预算 |
| `useSubscriptionStore.ts` | 订阅方案（free/pro/enterprise） |
| `useAdminStore.ts` | 管理员后台（用户管理、内容审核、积分调整、功能开关） |

---

## 六、核心 API 一览

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/health` | GET | 健康检查，返回各依赖状态 |
| `/api/auth/login` | POST | 登录（支持 demo@example.com:123456 演示账号） |
| `/api/projects` | GET/POST/DELETE | 项目管理 |
| `/api/assets` | GET/POST/PATCH/DELETE | 资产（场景/角色/道具）管理 |
| `/api/shoot/image` | POST | Seedream 图像生成 |
| `/api/shoot/video` | POST | Seedance 视频生成（异步任务） |
| `/api/shoot/video-status/[taskId]` | GET | 轮询视频任务状态 |
| `/api/shots/generate` | POST | LLM 分镜拆解 |
| `/api/tts` | POST | TTS 配音（edge-tts） |
| `/api/render/master-cut` | POST | FFmpeg 合成成片（含TTS混音+转场） |
| `/api/render/serve` | GET | 服务渲染后的视频文件 |
| `/api/export` | POST | 导出（竖版/横版/封面图） |

---

## 七、部署流程

### 本地开发

```bash
cd app
npm install
cp .env.example .env.local   # 填入实际值
npm run dev                   # http://localhost:3000
```

`NEXT_PUBLIC_ENABLE_REAL_PIPELINE=0` 时全程使用 mock 数据，无需 API Key。

### 发布到生产服务器

```bash
# 1. 本地同步代码（排除无关目录）
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.git' \
  app/ root@118.89.95.71:/var/www/shotforge/

# 2. 登录服务器构建
ssh root@118.89.95.71
cd /var/www/shotforge
npm install          # 仅依赖变化时需要
npm run build
pm2 restart shotforge

# 3. 验证
curl -s http://localhost:3000/api/health
```

### 首次部署（新服务器）

```bash
# 安装依赖
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs ffmpeg python3-pip
pip install edge-tts
npm install -g pm2

# 创建目录
mkdir -p /var/www/shotforge/renders
mkdir -p /var/www/shotforge/data
mkdir -p /var/log/shotforge

# 上传代码、安装依赖、构建
# ...（同上）

# 用 ecosystem.config.js 启动
pm2 start ecosystem.config.js
pm2 save                   # 保存进程列表，开机自启
pm2 startup                # 配置开机自启
```

---

## 八、SSL 证书配置

当前报错 `ERR_CERT_AUTHORITY_INVALID`，需要配置 Let's Encrypt 免费证书。

```bash
# 安装 certbot（服务器上执行）
apt install certbot python3-certbot-nginx -y

# 申请证书（先确认 DNS 已指向此服务器）
certbot --nginx -d shotforge.verixa.online

# 验证自动续期
certbot renew --dry-run
```

如服务器没有 nginx，先安装并配置反代：

```bash
apt install nginx -y
```

`/etc/nginx/sites-available/shotforge`：

```nginx
server {
    listen 80;
    server_name shotforge.verixa.online;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name shotforge.verixa.online;

    ssl_certificate     /etc/letsencrypt/live/shotforge.verixa.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shotforge.verixa.online/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    client_max_body_size 100M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/shotforge /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 九、已知问题 & 注意事项

| 问题 | 说明 |
|---|---|
| Seedance 2.0 / 1.5-pro 偶发 400 | 已有自动 fallback 到 `1-0-pro-fast`，无需手动处理 |
| 渲染目录不清理 | `/var/www/shotforge/renders/` 会持续积累，建议每周 cron 清理 7 天前的文件 |
| TTS 需要 Python | 服务器必须 `pip install edge-tts`，否则成片无配音 |
| BGM 是 mock 数据 | 当前用 SoundHelix 测试链接，上线前需接真实版权音乐库 |
| 积分系统 | 目前以 localStorage 为主，Supabase 同步为辅，刷新 localStorage 会丢失余额 |
| 管理后台 | 需要 `role='admin'` 字段，在 Supabase `users` 表手动设置 |
| 演示账号 | `demo@example.com` / `123456` 会绕过 Supabase 认证，**上线前删除此逻辑** |

---

## 十、交接验收标准

新开发者完成以下检查即可视为交接成功：

- [ ] `npm run dev` 本地启动，mock 模式下可完整走完 4 步流程
- [ ] `npm test` 全部通过
- [ ] SSH 登录服务器，`pm2 status` 显示 `shotforge` 为 `online`
- [ ] `https://shotforge.verixa.online` 可用，无 SSL 警告
- [ ] `/api/health` 返回 `{ status: 'ok' }`
- [ ] Supabase 控制台能看到 `projects`、`assets`、`users` 表
- [ ] 使用真实 API Key 生成一张图像（Stage 2）
- [ ] 渲染一条成片，视频有配音（Stage 4）
- [ ] 管理后台 `/dashboard/admin` 可以正常访问

---

## 十一、联系方式

> 在此填写原开发者联系方式，供交接后答疑使用。
