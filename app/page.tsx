'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Activity, Command, Mic, Power, Send, Square, Volume2, Wifi, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Message = { role: 'user' | 'assistant'; content: string }

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

type WindowWithSpeech = Window & typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

const initialMessages: Message[] = [
  { role: 'assistant', content: 'Good evening. All systems are online. How may I assist you?' },
]

export default function Page() {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isWakeWordListening, setIsWakeWordListening] = useState(false)
  const [isWebSearching, setIsWebSearching] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [status, setStatus] = useState('STANDBY')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const fallbackSpeak = (text: string) => {
    const clean = text.replace(/https?:\/\/\S+/g, '').replace(/[*_`#>\[\]()]/g, '').slice(0, 500)
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 0.98
    utterance.pitch = 0.85
    utterance.onstart = () => { setIsSpeaking(true); setStatus('SPEAKING') }
    utterance.onend = () => { setIsSpeaking(false); setStatus(isActive ? 'LISTENING' : 'STANDBY') }
    window.speechSynthesis.speak(utterance)
  }

  const speak = async (text: string) => {
    stopSpeaking()
    setIsSpeaking(true)
    setStatus('SPEAKING')

    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (response.ok && response.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setIsSpeaking(false)
          setStatus(isActive ? 'LISTENING' : 'STANDBY')
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          fallbackSpeak(text)
        }

        await audio.play()
        return
      }
    } catch (err) {
      console.warn('ElevenLabs unavailable, using browser speech fallback:', err)
    }

    fallbackSpeak(text)
  }

  const submit = async (event?: FormEvent, promptOverride?: string) => {
    event?.preventDefault()
    const prompt = (promptOverride ?? input).trim()
    if (!prompt) return
    setInput('')
    setMessages((current) => [...current, { role: 'user', content: prompt }])
    setStatus('PROCESSING')

    const looksLikeSearch = /\b(news|latest|today|current|breaking|update|weather|score|price)\b/i.test(prompt)
    if (looksLikeSearch) setIsWebSearching(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      })
      const data = await response.json()
      const answer = data.text || 'I am unable to reach my neural core right now.'
      if (data.usedSearch) {
        setIsWebSearching(true)
      } else {
        setIsWebSearching(false)
      }
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      void speak(answer)
    } catch {
      setIsWebSearching(false)
      const answer = 'Connection interrupted. Please verify the system link and try again.'
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      setStatus('OFFLINE')
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setStatus(isActive ? 'ONLINE' : 'STANDBY')
      return
    }
    const speechWindow = window as WindowWithSpeech
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) { setStatus('VOICE UNAVAILABLE'); return }
    const recognition = new Recognition()
    recognition.continuous = isWakeWordListening
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join('').trim()
      const lower = transcript.toLowerCase()
      const command = isWakeWordListening ? lower.replace(/^.*?jarvis[,:]?\s*/, '') : transcript
      if (!isWakeWordListening || lower.includes('jarvis')) {
        setInput(command)
        if (command) void submit(undefined, command)
      }
    }
    recognition.onend = () => { if (isActive && isWakeWordListening) recognition.start(); else setIsListening(false) }
    recognition.onerror = () => { setIsListening(false); setStatus('VOICE ERROR') }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setStatus('LISTENING')
  }

  useEffect(() => () => {
    recognitionRef.current?.stop()
    stopSpeaking()
  }, [])

  return (
    <main className="jarvis-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Zap /></div><div><p className="eyebrow">STARK INDUSTRIES // OS</p><h1>JARVIS<span>_</span></h1></div></div>
        <div className="connection"><span className="pulse-dot" /> <span>SECURE LINK</span><Wifi /></div>
      </header>

      <section className="dashboard">
        <aside className="side-panel left-panel">
          <div className="panel-label">SYSTEM TELEMETRY</div>
          <div className="metric"><span>CORE TEMP</span><strong>34.8°<small>C</small></strong><div className="metric-bar"><i style={{ width: '42%' }} /></div></div>
          <div className="metric"><span>MEMORY LOAD</span><strong>18.2<small>%</small></strong><div className="metric-bar"><i style={{ width: '18%' }} /></div></div>
          <div className="metric"><span>NEURAL LATENCY</span><strong>12<small>ms</small></strong><div className="metric-bar"><i style={{ width: '31%' }} /></div></div>
          <div className="mini-graph"><div className="graph-line" /><span>UPTIME 04:18:52:09</span></div>
        </aside>

        <div className={`core-stage ${isListening || isSpeaking ? 'is-engaged' : ''}`}>
          <div className="core-orbit orbit-outer" /><div className="core-orbit orbit-mid" /><div className="core-orbit orbit-inner" />
          <div className="holo-face"><div className="face-grid" /><div className="eye eye-left"><i /><b /></div><div className="eye eye-right"><i /><b /></div><div className="face-nose" /><div className="face-mouth" /></div>
          <div className="scan-line" /><div className="core-caption"><span className="caption-line" /> {status} <span className="caption-line" /></div>
        </div>

        <aside className="side-panel right-panel">
          <div className="panel-label">ACTIVE PROTOCOLS</div>
          {['VOICE RECOGNITION', 'CONTEXT ENGINE', 'WEB INTELLIGENCE', 'SECURE CHANNEL'].map((item, index) => (
            <div className="protocol" key={item}>
              <span className="protocol-icon"><Activity /></span>
              <div>
                <span>{item}</span>
                <small>{index === 2 ? (isWebSearching ? 'LIVE SYNC' : 'ONLINE') : (index === 0 && isListening ? 'LISTENING' : 'ACTIVE')}</small>
              </div>
              <i />
            </div>
          ))}
          <div className="command-hint"><Command /><span>Say <b>“Hey Jarvis”</b><br />to activate voice mode</span></div>
        </aside>
      </section>

      <section className="console">
        <div className="console-head"><div><span className="live-indicator" /> LIVE CONSOLE</div><span>{messages.length.toString().padStart(2, '0')} EVENTS</span></div>
        <div className="transcript" aria-live="polite">{messages.slice(-3).map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}-${message.content.slice(0, 8)}`}><span className="message-role">{message.role === 'assistant' ? 'JARVIS' : 'YOU'}</span><p>{message.content}</p></div>)}</div>
        <form className="command-input" onSubmit={submit}><span className="prompt-mark">›</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Enter a command or ask me anything..." aria-label="Command input" /><Button type="submit" size="icon" aria-label="Send command"><Send /></Button></form>
      </section>

      <nav className="control-deck" aria-label="Assistant controls"><Button variant="outline" className={isActive ? 'control active' : 'control'} onClick={() => { setIsActive(!isActive); setStatus(!isActive ? 'ONLINE' : 'STANDBY') }}><Power /> <span>POWER</span></Button><Button variant="outline" className={isWakeWordListening ? 'control active' : 'control'} onClick={() => setIsWakeWordListening(!isWakeWordListening)}><Command /> <span>WAKE WORD</span></Button><Button variant="outline" className={isListening ? 'control active' : 'control'} onClick={toggleListening}><Mic /> <span>VOICE</span></Button><Button variant="outline" className="control" onClick={() => { stopSpeaking(); setStatus(isActive ? 'ONLINE' : 'STANDBY') }}><Square /> <span>STOP</span></Button><div className="status-readout"><span className="pulse-dot" /> SYSTEM {status}<Volume2 /></div></nav>
      <footer><span>JARVIS INTELLIGENCE CORE v4.2.1</span><span>ALL SYSTEMS NOMINAL <i /></span></footer>
    </main>
  )
}

