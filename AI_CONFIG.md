# 短剧制作工具 - AI 模型接入配置

## 📍 配置位置

所有 AI API 密钥通过 **环境变量** 配置，不硬编码在代码中。

### 本地开发
复制 `.env.example` → `.env.local`，填入真实密钥：
```bash
cp .env.example .env.local
```

### 生产环境（Vercel）
在 Vercel 控制台配置环境变量：
```
Settings → Environment Variables → Add
```

---

## 🔑 API 密钥获取

### 1. 火山引擎（Seed 2.0 视频 + 豆包图像）

**注册地址：** https://www.volcengine.com

**获取 Access Key / Secret Key：**
1. 登录火山引擎控制台
2. 右上角头像 → 「访问密钥」→「创建密钥」
3. 开通服务：
   - Seed 2.0（视频生成）： https://www.volcengine.com/product/seed
   - 豆包（图像生成）

**环境变量：**
```env
VOLC_ACCESS_KEY=AKxxxxxxx
VOLC_SECRET_KEY=xxxxxxxx
VOLC_REGION=volc-cn-beijing
```

**Region 选择：**
- `volc-cn-beijing`（北京）
- `volc-cn-shanghai`（上海）

---

### 2. OpenAI（Whisper 字幕 / GPT 剧本）

**注册地址：** https://platform.openai.com

**获取 API Key：**
1. 登录 OpenAI 控制台
2. 右上角头像 → 「API Keys」→ 「Create new secret key」

**环境变量：**
```env
OPENAI_API_KEY=sk-xxxxxxxx
```

---

## 📁 项目中的 AI 配置文件

| 文件 | 用途 |
|------|------|
| `src/lib/api/seed-video.ts` | Seed 2.0 视频生成 |
| `src/lib/api/doubao-image.ts` | 豆包图像生成 |
| `src/app/api/subtitle-sync/route.ts` | Whisper 字幕（需 OpenAI） |
| `src/app/api/script-continue/route.ts` | GPT 剧本续写（需 OpenAI） |
| `src/app/api/bgm/route.ts` | BGM 生成（需 Suno） |
| `src/app/api/talking-avatar/route.ts` | Talking Avatar（需 D-ID） |

---

## 🚀 切换到真实 API

当 `.env.local` 中配置了真实密钥后：
- ✅ 豆包图像生成自动切换为真实 API
- ✅ Seed 2.0 视频生成自动切换为真实 API
- ✅ 字幕同步自动使用 OpenAI Whisper
- ✅ 剧本续写自动使用 GPT

Mock 模式仅在未配置密钥时生效。

---

## ⚠️ 安全注意

- **不要**将 `.env.local` 提交到 Git！
- `VOLC_SECRET_KEY` 是服务器端密钥，**禁止**暴露到浏览器！
- Next.js 中 `NEXT_PUBLIC_` 前缀的变量会暴露给浏览器端
- 当前设计中：`VOLC_ACCESS_KEY` 和 `VOLC_SECRET_KEY` 只在后端 API Route 中使用（安全）
