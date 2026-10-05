import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) return NextResponse.json({ text: 'Neural core is in demo mode. Add GEMINI_API_KEY to enable live responses.' })

    const google = createGoogleGenerativeAI({ apiKey })
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: 'You are JARVIS, a concise, sophisticated AI assistant. Respond directly in 3 to 6 sentences. Do not use markdown.',
      prompt: message,
    })
    return NextResponse.json({ text: result.text })
  } catch (error) {
    console.error('AI service error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}

