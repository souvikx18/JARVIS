import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { analyzeSearchIntent, executeSearchApi } from '@/lib/search'

const MODEL_CANDIDATES = [
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
]

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        text: 'Neural core is in demo mode. Add GEMINI_API_KEY to enable live responses.',
      })
    }

    // Check if SearchAPI should be engaged for real-time news or live web knowledge
    const searchIntent = analyzeSearchIntent(message)
    let searchIntelligence = ''
    let usedSearch = false

    if (searchIntent.shouldSearch && process.env.SEARCHAPI_API_KEY) {
      const searchResult = await executeSearchApi(searchIntent.query, searchIntent.engine)
      if (searchResult && searchResult.formattedContext) {
        usedSearch = true
        searchIntelligence = `\n\n[REAL-TIME LIVE INTELLIGENCE FEED via ${searchResult.engine.toUpperCase()}]\nQuery: "${searchResult.query}"\n${searchResult.formattedContext}\n[END LIVE FEED]\nUse this real-time news/intelligence to answer accurately. Reference dates and sources naturally.`
      }
    }

    const systemPrompt = `You are JARVIS, Tony Stark's sophisticated, highly intelligent AI assistant. 
Respond concisely, directly, and elegantly in 2 to 4 sentences. 
Do not use markdown formatting, asterisks, bullet points, or emoji. Speak naturally as if conversing vocally.
Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`

    const google = createGoogleGenerativeAI({ apiKey })

    // Generate response with automatic failover between available Gemini models
    let textResponse = ''
    let lastError: unknown = null

    for (const modelId of MODEL_CANDIDATES) {
      try {
        const result = await generateText({
          model: google(modelId),
          system: systemPrompt,
          prompt: message + searchIntelligence,
          maxRetries: 0,
        })
        textResponse = result.text
        if (textResponse) break
      } catch (err: any) {
        lastError = err
        const status = err?.statusCode || err?.status
        if (status === 429 || status === 404) {
          console.warn(`Model ${modelId} returned ${status}, switching to backup model...`)
          continue
        }
        break
      }
    }

    if (!textResponse) {
      console.error('All model attempts failed:', lastError)
      return NextResponse.json({
        text: 'Neural core encountered a momentary bottleneck. All backup models reported rate limits. Please try again shortly.',
      })
    }

    return NextResponse.json({
      text: textResponse,
      usedSearch,
      searchEngine: searchIntent.engine,
    })
  } catch (error) {
    console.error('AI service error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}
