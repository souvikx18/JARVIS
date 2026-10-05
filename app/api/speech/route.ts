import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 501 })
    }

    // Default to George (British, Butler/Jarvis style)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'

    // Clean text: strip markdown characters or links before feeding to TTS
    const cleanText = text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*_`#>\[\]()~]/g, '')
      .trim()
      .slice(0, 1000)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('ElevenLabs TTS error:', response.status, errText)
      return NextResponse.json({ error: 'TTS conversion failed' }, { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Speech route error:', error)
    return NextResponse.json({ error: 'Internal speech synthesis error' }, { status: 500 })
  }
}
