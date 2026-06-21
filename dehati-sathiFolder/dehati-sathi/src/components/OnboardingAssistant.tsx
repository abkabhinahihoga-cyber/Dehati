'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, HelpCircle, MapPin, Mic2, Sparkles, Volume2, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'

type SupportedLocale = 'hi' | 'en'
type GuideKey = 'landing' | 'login' | 'register' | 'forgot-password' | 'welcome-intro' | 'welcome-mobile' | 'welcome-location'

type GuideCopy = {
  title: string
  body: string
  steps: string[]
  listen: string
  collapse: string
  open: string
}

const GUIDE_COPY: Record<SupportedLocale, Record<GuideKey, GuideCopy>> = {
  hi: {
    landing: {
      title: 'नमस्ते, मैं आपकी मदद करूंगा',
      body: 'पहले भाषा चुनें, फिर हरे बटन पर दबाएं। मैं हर कदम पर साथ रहूंगा।',
      steps: ['हिंदी चुनें', 'शुरू करें दबाएं', 'खाता बनाएं'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'मदद चाहिए?',
    },
    login: {
      title: 'लॉग इन करना आसान है',
      body: 'अपना मोबाइल नंबर और पासवर्ड डालें। अगर खाता नहीं है तो नीचे रजिस्टर पर दबाएं।',
      steps: ['मोबाइल नंबर डालें', 'पासवर्ड डालें', 'लॉग इन दबाएं'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'लॉग इन मदद',
    },
    register: {
      title: 'नया खाता बनाएं',
      body: 'नाम, मोबाइल नंबर और आसान पासवर्ड डालें। फिर रजिस्टर दबाएं।',
      steps: ['अपना नाम लिखें', '10 अंक का मोबाइल डालें', 'पासवर्ड बनाकर रजिस्टर करें'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'रजिस्टर मदद',
    },
    'forgot-password': {
      title: 'पासवर्ड भूल गए?',
      body: 'अपना मोबाइल नंबर डालें और नया पासवर्ड बनाने के निर्देश पूरे करें।',
      steps: ['मोबाइल नंबर डालें', 'ओटीपी या निर्देश पूरा करें', 'नया पासवर्ड रखें'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'पासवर्ड मदद',
    },
    'welcome-intro': {
      title: 'प्रोफाइल सेटअप शुरू करें',
      body: 'यह आखिरी सेटअप है। आगे बढ़ें, फिर मोबाइल और स्थान पूरा करें ताकि पास की दुकानें दिखें।',
      steps: ['फायदे देखें', 'शुरू करें दबाएं', 'अगले कदम पूरे करें'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'सेटअप मदद',
    },
    'welcome-mobile': {
      title: 'मोबाइल नंबर जोड़ें',
      body: 'डिलीवरी वाले आपसे संपर्क कर सकें, इसलिए सही मोबाइल नंबर डालें।',
      steps: ['10 अंक का नंबर डालें', 'रेफरल हो तो डालें', 'आगे बढ़ें'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'मोबाइल मदद',
    },
    'welcome-location': {
      title: 'स्थान चुनना सबसे जरूरी है',
      body: 'हरे “वर्तमान स्थान उपयोग करें” बटन पर दबाएं। अनुमति मांगे तो Allow दबाएं। इससे पास का हब और सामान मिलेगा।',
      steps: ['वर्तमान स्थान दबाएं', 'Allow करें', 'पता देखकर पुष्टि करें'],
      listen: 'सुनें',
      collapse: 'छोटा करें',
      open: 'स्थान मदद',
    },
  },
  en: {
    landing: {
      title: 'Hi, I will guide you',
      body: 'Choose your language first, then tap the green start button. I will stay with you step by step.',
      steps: ['Choose language', 'Tap Get Started', 'Create your account'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Need help?',
    },
    login: {
      title: 'Login is simple',
      body: 'Enter your mobile number and password. If you do not have an account, tap Register below.',
      steps: ['Enter mobile number', 'Enter password', 'Tap Login'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Login help',
    },
    register: {
      title: 'Create your account',
      body: 'Enter your name, mobile number, and an easy password. Then tap Register.',
      steps: ['Write your name', 'Enter 10 digit mobile', 'Create password and register'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Register help',
    },
    'forgot-password': {
      title: 'Forgot password?',
      body: 'Enter your mobile number and follow the steps to create a new password.',
      steps: ['Enter mobile number', 'Complete OTP or instructions', 'Set a new password'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Password help',
    },
    'welcome-intro': {
      title: 'Start profile setup',
      body: 'This is the final setup. Continue, then complete mobile and location so nearby shops can appear.',
      steps: ['See the benefits', 'Tap Get Started', 'Complete the next steps'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Setup help',
    },
    'welcome-mobile': {
      title: 'Add mobile number',
      body: 'Enter the correct mobile number so delivery partners can contact you.',
      steps: ['Enter 10 digit number', 'Add referral if you have one', 'Continue'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Mobile help',
    },
    'welcome-location': {
      title: 'Location is important',
      body: 'Tap the green “Use Current Location” button. If the browser asks, press Allow. This helps us show nearby hubs and products.',
      steps: ['Tap current location', 'Press Allow', 'Confirm your address'],
      listen: 'Listen',
      collapse: 'Minimize',
      open: 'Location help',
    },
  },
}

const ASSISTED_ROUTES = new Set(['landing', 'login', 'register', 'forgot-password', 'welcome'])

function stripLocale(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'hi' || parts[0] === 'en') parts.shift()
  return parts
}

function selectVoice(locale: SupportedLocale) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (locale === 'hi') {
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('hi')) || voices.find((voice) => voice.lang.toLowerCase().includes('in')) || null
  }
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('en-in')) || voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) || null
}

export default function OnboardingAssistant() {
  const pathname = usePathname()
  const appLocale = (useLocale() === 'en' ? 'en' : 'hi') as SupportedLocale
  const [expanded, setExpanded] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [welcomeStep, setWelcomeStep] = useState(1)
  const [welcomeLocale, setWelcomeLocale] = useState<SupportedLocale | null>(null)

  const routeParts = useMemo(() => stripLocale(pathname || '/'), [pathname])
  const route = routeParts[0] || 'home'
  const isAssistedRoute = ASSISTED_ROUTES.has(route)
  const guideLocale = route === 'welcome' && welcomeLocale ? welcomeLocale : appLocale

  useEffect(() => {
    const handleStep = (event: Event) => {
      const detail = (event as CustomEvent<{ step?: number; language?: SupportedLocale }>).detail
      if (detail?.step) setWelcomeStep(detail.step)
      if (detail?.language === 'hi' || detail?.language === 'en') setWelcomeLocale(detail.language)
    }
    window.addEventListener('dehati:onboarding-step', handleStep)
    return () => window.removeEventListener('dehati:onboarding-step', handleStep)
  }, [])

  useEffect(() => {
    if (!isAssistedRoute) {
      window.speechSynthesis?.cancel()
    }
  }, [isAssistedRoute, pathname])

  const guideKey: GuideKey | null = useMemo(() => {
    if (!isAssistedRoute) return null
    if (route === 'welcome') {
      if (welcomeStep >= 4) return 'welcome-location'
      if (welcomeStep >= 3) return 'welcome-mobile'
      return 'welcome-intro'
    }
    return route as GuideKey
  }, [isAssistedRoute, route, welcomeStep])

  const copy = guideKey ? GUIDE_COPY[guideLocale][guideKey] : null

  const speak = () => {
    if (!copy || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(`${copy.title}. ${copy.body}. ${copy.steps.join('. ')}`)
    utterance.lang = guideLocale === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = guideLocale === 'hi' ? 0.9 : 0.95
    utterance.pitch = 1
    const voice = selectVoice(guideLocale)
    if (voice) utterance.voice = voice
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }

  if (!copy) return null

  return (
    <div className="fixed bottom-5 right-4 z-[80] w-[calc(100vw-2rem)] max-w-[360px] sm:bottom-6 sm:right-6 pointer-events-none">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="pointer-events-auto overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/92 shadow-[0_20px_60px_rgba(20,83,45,0.22)] backdrop-blur-xl"
          >
            <div className="relative bg-[linear-gradient(135deg,#0f7a3e_0%,#10562f_58%,#f59e0b_150%)] px-4 py-4 text-white">
              <div className="absolute inset-0 opacity-15 onboarding-assistant-grid" />
              <div className="relative flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-white/18 p-2 shadow-inner">
                  <div className="absolute inset-0 rounded-2xl onboarding-assistant-pulse" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-white text-green-700 shadow-lg">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">
                    <Mic2 className="h-3.5 w-3.5" />
                    Dehati Guide
                  </div>
                  <h2 className="text-lg font-black leading-tight">{copy.title}</h2>
                  <p className="mt-1 text-sm font-medium leading-snug text-white/88">{copy.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="rounded-full bg-white/12 p-2 text-white transition hover:bg-white/22"
                  aria-label={copy.collapse}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="grid gap-2">
                {copy.steps.map((step) => (
                  <div key={step} className="flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-bold text-green-950">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isSpeaking ? stopSpeaking : speak}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 py-3 text-sm font-black text-white shadow-[0_10px_22px_rgba(21,128,61,0.28)] transition active:scale-[0.98] hover:bg-green-800"
                >
                  <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  {isSpeaking ? (guideLocale === 'hi' ? 'रुकें' : 'Stop') : copy.listen}
                </button>
                {guideKey === 'welcome-location' && (
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition hover:bg-gray-200"
                  aria-label={copy.collapse}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="bubble"
            type="button"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto ml-auto flex items-center gap-2 rounded-full bg-green-700 px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(20,83,45,0.28)]"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700">
              <span className="absolute inset-0 rounded-full onboarding-assistant-ping" />
              <HelpCircle className="relative h-5 w-5" />
            </span>
            {copy.open}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
