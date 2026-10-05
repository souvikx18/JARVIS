import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') return NextResponse.json({ error: 'Message required' }, { status: 400 })
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ text: 'Neural core is in demo mode. Add OPENAI_API_KEY to enable live responses.' })
    const result = await generateText({ model: openai('gpt-4o-mini'), system: 'You are JARVIS, a concise, sophisticated AI assistant. Respond directly in 3 to 6 sentences. Do not use markdown.', prompt: message })
    return NextResponse.json({ text: result.text })
  } catch { return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 }) }
}
