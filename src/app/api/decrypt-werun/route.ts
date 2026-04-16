import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'
import * as https from 'https'

// 小程序 AppID 和 AppSecret（开发阶段用，正式上线建议放环境变量）
const WX_APP_ID = process.env.WX_APP_ID || ''
const WX_APP_SECRET = process.env.WX_APP_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const { code, encryptedData, iv } = await req.json()

    if (!code || !encryptedData || !iv) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    // 第一步：用 code 换 session_key
    const sessionKey = await getSessionKey(code)
    if (!sessionKey) {
      return NextResponse.json({ success: false, error: 'code 无效或已过期' }, { status: 400 })
    }

    // 第二步：解密微信运动数据
    const decrypted = decrypt(encryptedData, sessionKey, iv)
    const dataObj = JSON.parse(decrypted)

    // 第三步：提取今日步数
    const stepInfoList = dataObj.stepInfoList || []
    let todaySteps = 0

    if (stepInfoList.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0]
      const todayData = stepInfoList.find((s: any) => {
        const stepDate = new Date(s.timestamp * 1000).toISOString().split('T')[0]
        return stepDate === todayStr
      })
      todaySteps = todayData
        ? todayData.step
        : (stepInfoList[stepInfoList.length - 1]?.step || 0)
    }

    return NextResponse.json({
      success: true,
      steps: todaySteps,
      date: new Date().toISOString().split('T')[0],
    })
  } catch (err: any) {
    console.error('[/api/decrypt-werun]', err)
    return NextResponse.json({ success: false, error: err.message || '解密失败' }, { status: 500 })
  }
}

function getSessionKey(code: string): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APP_ID}&secret=${WX_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).session_key || null)
        } catch {
          resolve(null)
        }
      })
    }).on('error', () => resolve(null))
  })
}

function decrypt(encryptedDataBase64: string, sessionKeyBase64: string, ivBase64: string): string {
  const key = Buffer.from(sessionKeyBase64, 'utf8')
  const iv = Buffer.from(ivBase64, 'base64')
  const encrypted = Buffer.from(encryptedDataBase64, 'base64')

  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')

  // 去掉 PKCS7 padding
  const pad = decrypted.charCodeAt(decrypted.length - 1)
  if (pad < 1 || pad > 16) throw new Error('Invalid padding')
  return decrypted.slice(0, -pad)
}