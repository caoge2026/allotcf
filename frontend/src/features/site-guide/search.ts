import { features, overviewKeywords, type Feature } from './catalog'
export interface SearchAnswer {
  mode: 'empty' | 'overview' | 'fallback' | 'results'
  message: string
  results: Feature[]
}
function normalizeQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/[，。！？、,.!?;；:："'“”‘’（）()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function scoreFeature(feature: Feature, query: string) {
  return [feature.title, feature.summary, ...feature.aliases].reduce(
    (score, value) => {
      const normalized = normalizeQuery(value)
      return normalized
        ? query.includes(normalized)
          ? score + 3
          : normalized.includes(query)
            ? score + 2
            : score
        : score
    },
    0,
  )
}
export function searchFeatures(input: string): SearchAnswer {
  const query = normalizeQuery(input)
  if (!query)
    return {
      mode: 'empty',
      message: '请输入你想了解的功能，例如：错题本在哪里？',
      results: [],
    }
  if (
    overviewKeywords.some((keyword) => query.includes(normalizeQuery(keyword)))
  )
    return {
      mode: 'overview',
      message:
        'AllôTCF 当前提供阅读套题、错题复习、收藏练习、单词连连看、看图说话等功能。',
      results: features,
    }
  const results = features
    .map((feature) => ({ feature, score: scoreFeature(feature, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.feature)
  return results.length === 0
    ? {
        mode: 'fallback',
        message:
          '我暂时没有找到对应功能。你可以试试输入：错题本、收藏练习、阅读套题、看图说话。',
        results: [],
      }
    : {
        mode: 'results',
        message:
          results.length === 1
            ? `你可以使用「${results[0].title}」。`
            : '我找到了这些相关功能：',
        results,
      }
}
