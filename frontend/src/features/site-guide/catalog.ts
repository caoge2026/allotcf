// Recovered from the deployed feature guide; keep planned features non-navigable.
export type FeatureStatus = 'available' | 'preview' | 'planned'
export interface Feature {
  id: string
  title: string
  status: FeatureStatus
  aliases: string[]
  summary: string
  actions: { label: string; path: string }[]
}
export const statusLabels: Record<FeatureStatus, string> = {
  available: `已可用`,
  preview: `可预览`,
  planned: `规划中`,
}
export const quickQuestions: string[] = [
  `网站有什么功能？`,
  `错题本在哪里？`,
  `收藏练习怎么用？`,
  `看图说话是什么？`,
]
export const features: Feature[] = [
  {
    id: `exam-sets`,
    title: `阅读套题`,
    status: `available`,
    aliases: [`阅读`, `阅读练习`, `套题`, `题库`, `阅读套题`, `TCF 阅读真题`],
    summary: `完整进入 42 套阅读练习，适合按套题节奏进行训练。`,
    actions: [
      {
        label: `去阅读套题`,
        path: `/exam-sets`,
      },
    ],
  },
  {
    id: `wrong-questions`,
    title: `错题复习`,
    status: `available`,
    aliases: [
      `错题本`,
      `错题`,
      `错题复习`,
      `今日复习`,
      `艾宾浩斯`,
      `错误次数`,
      `掌握状态`,
    ],
    summary: `按今日复习、错误次数、难度、关键词和掌握状态复习阅读错题。`,
    actions: [
      {
        label: `去错题复习`,
        path: `/wrong-questions`,
      },
    ],
  },
  {
    id: `bookmarked-questions`,
    title: `收藏练习`,
    status: `available`,
    aliases: [`收藏`, `收藏夹`, `收藏题目`, `重要题`, `易错题`],
    summary: `集中练习自己标记的重要题，适合复习容易混淆或需要记忆的题目。`,
    actions: [
      {
        label: `去收藏练习`,
        path: `/bookmarked-questions`,
      },
    ],
  },
  {
    id: `word-match`,
    title: `单词连连看`,
    status: `available`,
    aliases: [`单词`, `连连看`, `小游戏`, `图片配对`, `法语单词`],
    summary: `通过图片和法语单词配对消除，帮助记忆基础词汇。`,
    actions: [
      {
        label: `去单词连连看`,
        path: `/word-match`,
      },
    ],
  },
  {
    id: `picture-speaking`,
    title: `看图说话`,
    status: `preview`,
    aliases: [`看图说话`, `图片口语`, `场景表达`, `口语反馈`, `AI 对比`],
    summary: `观察真实场景图片，输入法语表达，并获得参考答案与对比反馈。`,
    actions: [],
  },
  {
    id: `listening`,
    title: `听力练习`,
    status: `planned`,
    aliases: [`听力`, `听力练习`, `听力题库`, `听力套题`],
    summary: `听力入口已预留，后续会接入听力题库和完整练习流程。`,
    actions: [],
  },
  {
    id: `speaking`,
    title: `口语练习`,
    status: `preview`,
    aliases: [`口语`, `口语练习`, `说话`, `表达`, `看图说话`],
    summary: `口语方向已经通过看图说话做预览，后续会扩展更多口语任务。`,
    actions: [],
  },
  {
    id: `results`,
    title: `结果记录`,
    status: `available`,
    aliases: [`结果`, `成绩`, `分数`, `CLB`, `NCLC`, `复盘记录`, `查看复盘`],
    summary: `查看最近提交结果、分数、CLB/NCLC 等级和复盘状态。`,
    actions: [
      {
        label: `去结果记录`,
        path: `/exam-sets`,
      },
    ],
  },
  {
    id: `guest-preview`,
    title: `访客预览`,
    status: `available`,
    aliases: [`访客`, `访客模式`, `访客预览`, `试用`, `不用注册`],
    summary: `无需注册即可预览完整功能结构，并有限度试用关键学习动作。`,
    actions: [],
  },
  {
    id: `account`,
    title: `注册 / 登录`,
    status: `available`,
    aliases: [
      `注册`,
      `登录`,
      `账号`,
      `邮箱`,
      `密码`,
      `support`,
      `客服`,
      `支持`,
    ],
    summary: `使用邮箱注册或登录账号。需要帮助时可以联系 support@allotcf.com。`,
    actions: [
      {
        label: `去注册账号`,
        path: `/register`,
      },
    ],
  },
]
export const overviewKeywords: string[] = [
  `有什么功能`,
  `功能列表`,
  `有哪些功能`,
  `菜单在哪里`,
  `功能区`,
  `能做什么`,
]

export function getFeatureStatusLabel(status: FeatureStatus) { return statusLabels[status] }
