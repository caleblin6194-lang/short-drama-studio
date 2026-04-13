import type { Project, TagSet, SceneAsset, CharacterAsset, PropAsset, Shot, PipelineStage, Opening } from '@/types'
import { inferConfig } from '@/lib/inferConfig'
import { v4 as uuid } from 'uuid'

const pending: PipelineStage = { status: 'pending', attemptCount: 0 }

const defaultTagSet: TagSet = {
  type: '逆袭', setting: '赘婿逆袭', world: '都市', region: '国内', audience: 'male',
}

function ph(w: number, h: number, text: string, bg = '1a1a26', fg = '6c5ce7') {
  return `https://placehold.co/${w}x${h}/${bg}/${fg}?text=${encodeURIComponent(text)}`
}

export function createEmptyProject(overrides?: Partial<Project>): Project {
  const id = uuid()
  const tagSet = overrides?.tagSet ?? { ...defaultTagSet }
  return {
    id,
    title: '未命名短剧',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastEnteredStage: 1,
    tagSet,
    inferredConfig: inferConfig(tagSet),
    script: { id: uuid(), rawText: '', estimatedDurationSec: 0, characterCount: 0, wordLimit: 10000, history: [] },
    assetLibrary: { scenes: [], characters: [], props: [] },
    shots: [],
    masterCut: null,
    variants: [],
    storyStructure: null,
    costSpent: 0,
    estimatedCostRemaining: 500,
    ...overrides,
  }
}

// Pre-built demo scenes
export const DEMO_SCENES: SceneAsset[] = [
  { id: 's1', kind: 'scene', name: '豪华婚宴大厅', description: '金碧辉煌的五星级酒店宴会厅，水晶吊灯下宾客满座', imageUrl: ph(400, 300, '婚宴大厅'), status: 'ready', approvedByUser: false, timeOfDay: 'night', mood: 'tense' },
  { id: 's2', kind: 'scene', name: '雨夜天桥', description: '大雨倾盆的城市天桥，霓虹灯倒映在积水中', imageUrl: ph(400, 300, '雨夜天桥'), status: 'ready', approvedByUser: false, timeOfDay: 'night', mood: 'melancholic' },
  { id: 's3', kind: 'scene', name: '总裁办公室', description: '顶层落地窗办公室，夜景尽收眼底', imageUrl: ph(400, 300, '总裁办公室'), status: 'ready', approvedByUser: false, timeOfDay: 'day', mood: 'powerful' },
  { id: 's4', kind: 'scene', name: '老旧出租屋', description: '狭小昏暗的地下室出租屋，墙壁斑驳', imageUrl: ph(400, 300, '出租屋'), status: 'ready', approvedByUser: false, timeOfDay: 'night', mood: 'gloomy' },
]

export const DEMO_CHARACTERS: CharacterAsset[] = [
  { id: 'c1', kind: 'character', name: '陈默', description: '28岁，曾经的天才少年，如今落魄入赘', tier: 'lead', age: '20s', gender: 'male', imageUrl: ph(300, 400, '陈默', '1a1a26', '00cec9'), status: 'ready', approvedByUser: false },
  { id: 'c2', kind: 'character', name: '林婉清', description: '26岁，豪门千金，性格高傲但内心善良', tier: 'lead', age: '20s', gender: 'female', imageUrl: ph(300, 400, '林婉清', '1a1a26', 'fd79a8'), status: 'ready', approvedByUser: false },
  { id: 'c3', kind: 'character', name: '林父', description: '55岁，林氏集团董事长，看不起女婿', tier: 'antagonist', age: 'middle-aged', gender: 'male', imageUrl: ph(300, 400, '林父', '1a1a26', 'ff6b6b'), status: 'ready', approvedByUser: false },
]

export const DEMO_PROPS: PropAsset[] = [
  { id: 'p1', kind: 'prop', name: '撕碎的喜帖', description: '被泼了茶水、撕成两半的红色请帖', imageUrl: ph(160, 100, '喜帖'), status: 'ready', approvedByUser: false },
  { id: 'p2', kind: 'prop', name: '黑卡', description: '神秘的无限额黑金信用卡', imageUrl: ph(160, 100, '黑卡'), status: 'ready', approvedByUser: false },
]

export function createDemoShots(n: number): Shot[] {
  const descriptions = [
    { desc: '婚宴大厅内，宾客窃窃私语，陈默独自坐在角落低头不语', dial: '（旁白）三年前，他是最年轻的商业天才。三年后，他是林家最不起眼的赘婿。', scene: 's1', chars: ['c1'] },
    { desc: '林父端着茶杯走到陈默面前，居高临下地看着他', dial: '"陈默，今天是你岳母生日，你就不能穿得体面一点？"', scene: 's1', chars: ['c1', 'c3'] },
    { desc: '林婉清匆匆走来，拉住陈默的手臂', dial: '"爸，他已经很努力了。"', scene: 's1', chars: ['c1', 'c2', 'c3'] },
    { desc: '陈默的手机突然响起，一个神秘来电', dial: '"陈少，您的资产已全部解冻。您名下的 300 亿，随时可以调用。"', scene: 's1', chars: ['c1'] },
    { desc: '陈默缓缓抬头，眼神从隐忍变为锐利', dial: '"三年了，够了。"', scene: 's1', chars: ['c1'] },
    { desc: '特写：陈默放下电话，嘴角微微上扬', dial: '', scene: 's1', chars: ['c1'] },
    { desc: '林父正在主桌上敬酒，陈默大步走来', dial: '"岳父，我有个消息要当着所有人的面说。"', scene: 's1', chars: ['c1', 'c3'] },
    { desc: '全场安静，所有目光聚焦在陈默身上', dial: '"从今天起，林氏集团的第一大股东，是我。"', scene: 's1', chars: ['c1'] },
    { desc: '雨夜天桥上，林婉清追出来，泪流满面', dial: '"陈默！你为什么不早告诉我？"', scene: 's2', chars: ['c1', 'c2'] },
    { desc: '陈默转身，雨水模糊了他的表情', dial: '"因为我想知道，在我什么都没有的时候，还有谁会站在我身边。"', scene: 's2', chars: ['c1', 'c2'] },
    { desc: '（钩子镜头）总裁办公室，陈默的手机再次响起', dial: '"陈少，有人正在暗中收购林氏的股份……"', scene: 's3', chars: ['c1'] },
  ]

  return Array.from({ length: Math.min(n, descriptions.length) }, (_, i) => {
    const d = descriptions[i]
    return {
      id: `shot-${i + 1}`,
      number: `S${String(i + 1).padStart(2, '0')}`,
      order: i,
      sceneRef: d.scene,
      characterRefs: d.chars,
      propRefs: i === 3 ? ['p2'] : [],
      description: d.desc,
      dialogue: d.dial,
      cameraDirection: i === 5 ? 'close-up' : i === 0 ? 'wide' : 'medium',
      durationSec: 7,
      pipeline: { image: { ...pending }, video: { ...pending }, audio: { ...pending } },
    }
  })
}

export const DEMO_OPENINGS: Opening[] = [
  {
    title: '婚宴惊变',
    body: '五星级酒店的婚宴大厅内，林家上下觥筹交错。角落里，穿着廉价西装的陈默正被几个亲戚嘲笑——"废物赘婿也配上主桌？"就在他低头忍辱的瞬间，一通神秘电话打来。',
    line: '"陈少，您名下的300亿资产已全部解冻。"',
  },
  {
    title: '街头重逢',
    body: '暴雨中的天桥下，陈默蹲在地上吃着泡面。一辆迈巴赫停在他面前，车窗缓缓降下，露出一张他三年来只在噩梦里见过的脸——他的前商业对手。',
    line: '"陈默，你居然沦落到这种地步？不过我来，是请你回去的。"',
  },
  {
    title: '敬茶受辱',
    body: '林家祠堂内，陈默跪在地上给岳父敬茶。林父接过茶杯，看都不看一眼就泼在了地上："你一个吃软饭的，也配给我敬茶？"全场哄笑。陈默攥紧了拳头。',
    line: '"岳父，这杯茶，您迟早会亲自端给我喝。"',
  },
]

export const DEMO_SCRIPT = `【第一集：赘婿觉醒】

场景一：豪华婚宴大厅 · 夜

（旁白）三年前，他是最年轻的商业天才，手握百亿资产。三年后，他是林家最不起眼的赘婿。

宴会厅内灯火通明，宾客满座。陈默穿着一身不合身的旧西装，独自坐在最偏僻的角落。几个林家亲戚路过时投来鄙夷的目光。

林父（端着茶杯，居高临下）："陈默，今天是你岳母生日，你就不能穿得体面一点？整个林家的脸都被你丢尽了。"

林婉清（匆匆跑来，拉住陈默手臂）："爸，他已经很努力了……"

林父（冷哼）："努力？一个月三千块工资，连件像样的西装都买不起，你嫁给他就是我这辈子最大的失误。"

陈默低头不语，攥紧了拳头。

就在此时——他的手机响了。一个隐藏号码。

神秘来电："陈少，三年期限已到。您名下的 300 亿资产已全部解冻，随时可以调用。另外，您要求的那件事……已经办妥了。"

陈默缓缓抬起头，眼神从隐忍变为锐利。

陈默（低声）："三年了……够了。"

场景二：婚宴大厅主桌

林父正在主桌上与合作伙伴觥筹交错。陈默大步走到主桌前。

陈默："岳父，我有个消息，要当着所有人的面说。"

全场安静。

陈默（微笑）："从今天起，林氏集团第一大股东——是我。"

（全场哗然）

场景三：雨夜天桥

大雨倾盆。林婉清追了出来，泪流满面。

林婉清："陈默！你为什么不早告诉我？三年……你骗了我三年！"

陈默（转身，雨水模糊了他的表情）："因为我想知道，在我什么都没有的时候，还有谁……会站在我身边。"

（钩子）陈默的手机再次响起。

神秘来电："陈少，紧急情况。有人正在暗中收购林氏的股份，对方来头不小……"

陈默（眼神一凝）："有意思。"

——未完待续——`

// Create initial demo projects
export function createInitialProjects(): Project[] {
  return [
    createEmptyProject({
      id: 'demo-1',
      title: '赘婿逆袭：三年隐忍',
      status: 'published',
      lastEnteredStage: 4,
      script: { id: 'sc1', rawText: DEMO_SCRIPT, estimatedDurationSec: 75, characterCount: DEMO_SCRIPT.length, wordLimit: 10000, history: [] },
      assetLibrary: { scenes: DEMO_SCENES, characters: DEMO_CHARACTERS, props: DEMO_PROPS },
      shots: createDemoShots(11),
      masterCut: { id: 'mc1', projectId: 'demo-1', subtitlesEnabled: true, subtitleStyle: { animation: 'fade', position: 'bottom', fontSize: 'md', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', backgroundEnabled: true }, bgmEnabled: true, bgmTrack: 'epic_tension', renderedUrl: '#', durationSec: 77 },
      costSpent: 420,
    }),
    createEmptyProject({
      id: 'demo-2',
      title: '穿越大唐：女将军',
      status: 'casting',
      lastEnteredStage: 2,
      tagSet: { type: '穿越', setting: '大女主', world: '古风', region: '国内', audience: 'female' },
      costSpent: 35,
    }),
    createEmptyProject({
      id: 'demo-3',
      title: '都市修仙日记',
      status: 'draft',
      lastEnteredStage: 1,
      tagSet: { type: '玄幻', setting: '都市修仙', world: '都市', region: '国内', audience: 'male' },
    }),
  ]
}
