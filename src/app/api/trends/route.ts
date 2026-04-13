import { NextResponse } from 'next/server'

// Mock trending data — in production, scrape/receive from analytics APIs
const MOCK_TRENDS = {
  trendingTags: [
    { tag: '穿越逆袭', count: 284700, trend: '+12%', platform: 'Douyin' },
    { tag: '甜宠日常', count: 198300, trend: '+8%', platform: 'Kuaishou' },
    { tag: '豪门恩怨', count: 156400, trend: '+5%', platform: 'WeChat' },
    { tag: '重生打脸', count: 143200, trend: '+15%', platform: 'Douyin' },
    { tag: '都市修仙', count: 98700, trend: '+22%', platform: 'Douyin' },
    { tag: '先婚后爱', count: 87600, trend: '+3%', platform: 'WeChat' },
    { tag: '神豪系统', count: 76500, trend: '-2%', platform: 'Kuaishou' },
    { tag: '萌宝来袭', count: 65400, trend: '+6%', platform: 'WeChat' },
  ],
  popularStyles: [
    { style: '快节奏爆点', desc: '每3秒一个反转，情绪强刺激', emoji: '💥', usage: 340000 },
    { style: '强共鸣剧情', desc: '家庭/爱情/职场共鸣话题', emoji: '💕', usage: 280000 },
    { style: '悬念铺垫型', desc: '开头留悬念，中段埋伏笔，结尾爆点', emoji: '🔮', usage: 210000 },
    { style: '情绪过山车', desc: '笑点泪点火点紧凑交替', emoji: '🎢', usage: 195000 },
    { style: '金句台词型', desc: '台词有传播性，适合截图传播', emoji: '💬', usage: 178000 },
    { style: '视觉冲击型', desc: '画面精美，服化道考究', emoji: '👗', usage: 156000 },
  ],
  viralTemplates: [
    {
      id: 'v1',
      title: '开场三连爆',
      desc: '开头3秒用冲突/反转/悬念吸引注意力',
      tags: ['开篇抓人', '留存率+40%'],
      successRate: '89%',
      emoji: '🎬',
    },
    {
      id: 'v2',
      title: '身份反转',
      desc: '前期展示弱势/被欺形象，后期身份揭露打脸',
      tags: ['逆袭', '打脸', '爽文'],
      successRate: '82%',
      emoji: '🔄',
    },
    {
      id: 'v3',
      title: '情感共鸣',
      desc: '家庭/婚姻/职场痛点切入，引发评论互动',
      tags: ['共鸣', '评论率+35%'],
      successRate: '76%',
      emoji: '💔',
    },
    {
      id: 'v4',
      title: '台词金句',
      desc: '精选台词适合截图传播，引发模仿',
      tags: ['金句', '二创率+50%'],
      successRate: '71%',
      emoji: '💎',
    },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK_TRENDS)
}
