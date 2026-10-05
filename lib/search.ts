export interface SearchResultItem {
  title: string
  snippet?: string
  source?: string
  date?: string
  link?: string
}

export interface SearchResponse {
  engine: 'google_news' | 'google'
  query: string
  results: SearchResultItem[]
  formattedContext: string
}

/**
 * Intelligently analyzes a prompt to determine whether SearchAPI should be invoked,
 * and if so, whether to use 'google_news' or 'google' organic search.
 */
export function analyzeSearchIntent(message: string): {
  shouldSearch: boolean
  engine: 'google_news' | 'google'
  query: string
} {
  const clean = message.trim().toLowerCase()

  // News intent keywords
  const newsRegex = /\b(news|headline|headlines|breaking|update|updates|happened today|what happened with|latest on|latest about)\b/i
  // Real-time factual intent keywords
  const realTimeRegex = /\b(today|yesterday|tomorrow|current|currently|now|price of|score|scores|weather|stock|market|who won|who is the current)\b/i

  const isNews = newsRegex.test(clean)
  const isRealTime = realTimeRegex.test(clean)

  if (!isNews && !isRealTime) {
    return { shouldSearch: false, engine: 'google', query: '' }
  }

  // Sanitize search query: strip Jarvis call-outs
  const sanitizedQuery = message
    .replace(/^(hey\s+)?jarvis[,:]?\s*/i, '')
    .replace(/(please\s+)?(tell me|give me|what is|what's|search for)\s+/i, '')
    .trim()

  return {
    shouldSearch: true,
    engine: isNews ? 'google_news' : 'google',
    query: sanitizedQuery || message,
  }
}

/**
 * Executes a targeted search on SearchApi.io and returns structured intelligence.
 */
export async function executeSearchApi(
  query: string,
  engine: 'google_news' | 'google' = 'google_news',
  apiKey?: string
): Promise<SearchResponse | null> {
  const key = apiKey || process.env.SEARCHAPI_API_KEY
  if (!key) return null

  try {
    const url = new URL('https://www.searchapi.io/api/v1/search')
    url.searchParams.set('engine', engine)
    url.searchParams.set('q', query)
    url.searchParams.set('api_key', key)
    url.searchParams.set('num', '5')

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 }, // 5 min cache
    })

    if (!response.ok) {
      console.warn(`SearchAPI returned status ${response.status} for query "${query}"`)
      return null
    }

    const data = await response.json()
    const items: SearchResultItem[] = []

    if (engine === 'google_news') {
      const news = data.organic_results || data.news_results || []
      for (const item of news.slice(0, 5)) {
        items.push({
          title: item.title,
          snippet: item.snippet,
          source: item.source,
          date: item.date || item.iso_date,
          link: item.link,
        })
      }
    } else {
      if (data.answer_box?.answer || data.answer_box?.snippet) {
        items.push({
          title: data.answer_box.title || 'Direct Answer',
          snippet: data.answer_box.answer || data.answer_box.snippet,
        })
      }
      if (data.knowledge_graph?.description) {
        items.push({
          title: data.knowledge_graph.title || 'Knowledge Graph',
          snippet: data.knowledge_graph.description,
        })
      }
      const organic = data.organic_results || []
      for (const item of organic.slice(0, 4)) {
        items.push({
          title: item.title,
          snippet: item.snippet,
          date: item.date,
          link: item.link,
        })
      }
    }

    if (items.length === 0) return null

    const formattedContext = items
      .map((item, idx) => {
        const meta = [item.source ? `Source: ${item.source}` : '', item.date ? `Date: ${item.date}` : '']
          .filter(Boolean)
          .join(' | ')
        return `[${idx + 1}] ${item.title}${meta ? `\n(${meta})` : ''}\n${item.snippet || 'No excerpt available'}`
      })
      .join('\n\n')

    return {
      engine,
      query,
      results: items,
      formattedContext,
    }
  } catch (error) {
    console.error('SearchAPI execution error:', error)
    return null
  }
}
