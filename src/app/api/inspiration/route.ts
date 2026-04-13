import { NextResponse } from 'next/server'

const MOCK_INSPIRATION = {
  creativeBriefs: [
    {
      id: 'b1',
      title: '离婚女人逆袭霸道总裁',
      genre: '现代言情',
      hooks: ['开局被净身出户', '三年后惊艳回归', '前夫追妻火葬场'],
      keyScenes: ['被婆婆赶出家门', '医院独自产检', '公司入职新起点', '宴会上光彩照人'],
      tone: '虐中带甜',
      emoji: '💎',
    },
    {
      id: 'b2',
      title: '穿越女如何用现代知识在古代风生水起',
      genre: '古风穿越',
      hooks: ['穿越即遇难', '用诗词震惊全场', '发明火锅赚第一桶金'],
      keyScenes: ['醒来在陌生朝代', '诗词大会一战成名', '开设第一家现代商铺'],
      tone: '爽文轻松',
      emoji: '🏯',
    },
    {
      id: 'b3',
      title: '神豪系统：给不完的钱',
      genre: '都市神豪',
      hooks: ['突然获得无限额度黑卡', '花钱还能赚钱', '身份成谜的大佬暗中相助'],
      keyScenes: ['被嫌弃穷酸', '黑卡震惊柜姐', '低调炫富打脸'],
      tone: '爽文解压',
      emoji: '💳',
    },
  ],
  moodBoards: [
    {
      id: 'mb1',
      title: '豪门恩怨',
      palette: ['#1a1a2e', '#6c5ce7', '#ffd700', '#8b0000'],
      keywords: ['奢华', '暗涌', '冲突', '精致'],
      desc: '适合总裁文、豪门狗血剧，高对比度色调',
    },
    {
      id: 'mb2',
      title: '治愈系生活',
      palette: ['#fef9ef', '#f5e6d3', '#7fb069', '#e8c39e'],
      keywords: ['温暖', '清新', '自然', '舒适'],
      desc: '适合甜宠、日常、田园风格，暖色调为主',
    },
    {
      id: 'mb3',
      title: '赛博朋克未来',
      palette: ['#0a0a0f', '#00f5ff', '#ff00ff', '#6c5ce7'],
      keywords: ['科技', '冷酷', '迷幻', '未来'],
      desc: '适合科幻、穿越、星际题材，霓虹暗调',
    },
  ],
  successfulExamples: [
    {
      id: 'e1',
      title: '《重生之我是首富》',
      platform: 'WeChat Channels',
      views: '2.3亿',
      likes: '1800万',
      keyFactor: '节奏快、反转密集、情绪刺激',
      tags: ['重生', '神豪', '爽文'],
    },
    {
      id: 'e2',
      title: '《穿越后我嫁给了皇子》',
      platform: 'Douyin',
      views: '1.8亿',
      likes: '1200万',
      keyFactor: '人物设定讨喜，服化道精致',
      tags: ['穿越', '古风', '甜宠'],
    },
    {
      id: 'e3',
      title: '《离婚后我成了大佬》',
      platform: 'Kuaishou',
      views: '9800万',
      likes: '780万',
      keyFactor: '强共鸣，婆媳/婚姻话题引发讨论',
      tags: ['现代', '逆袭', '女性成长'],
    },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK_INSPIRATION)
}
