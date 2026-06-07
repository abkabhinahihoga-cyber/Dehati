'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Maximize2, Minimize2, Bot } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export default function GawarAiWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: "Ram Ram! 🙏 I am Gawar Ai. Ask me anything about Dehati Sathi!" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isFullScreen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await axios.post('/api/gawar-ai', { 
                messages: [...messages, userMsg] 
            });
            setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Network issue! Please check your internet." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Image Path (Ensure this file exists in /public/assets/)
    const AI_AVATAR = "/assets/gawar-ai.png";

    return (
        <div className={`fixed z-[100] transition-all duration-300 font-sans ${
            isFullScreen ? "inset-0 w-full h-full bg-white" : "bottom-6 right-6 flex flex-col items-end"
        }`}>
            
            {/* CHAT CONTAINER */}
            {isOpen && (
                <div className={`bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
                    isFullScreen ? "w-full h-full rounded-none" : "w-[360px] h-[550px] rounded-2xl mb-4"
                }`}>
                    
                    {/* HEADER */}
                    <div className="bg-[#008069] p-4 text-white flex justify-between items-center shadow-md shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 border border-white/30">
                                <Image 
                                    src={AI_AVATAR} 
                                    alt="Bot" 
                                    fill 
                                    className="object-cover"
                                    onError={(e) => {
                                        // Fallback if image missing
                                        e.currentTarget.style.display = 'none'; 
                                        e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Gawar Ai</h3>
                                <p className="text-xs text-white/80 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"/> Online
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Full Screen Toggle */}
                            <button onClick={() => setIsFullScreen(!isFullScreen)} className="hover:bg-white/10 p-2 rounded-full transition">
                                {isFullScreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                            </button>
                            {/* Close Button */}
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] space-y-4">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                    {!isUser && (
                                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-1 border border-gray-300">
                                            <Image src={AI_AVATAR} alt="AI" width={24} height={24} className="object-cover"/>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-[15px] leading-snug shadow-sm ${
                                        isUser 
                                        ? 'bg-[#008069] text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            )
                        })}
                        {isLoading && (
                            <div className="flex justify-start items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-gray-200"></div>
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center text-gray-500 text-sm border border-gray-100">
                                    <Loader2 className="animate-spin w-4 h-4" /> Typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div className="p-3 bg-white border-t flex items-center gap-2 shrink-0">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#008069] transition-all"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-[#008069] hover:bg-[#006a56] text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:scale-95 shadow-md flex items-center justify-center"
                        >
                            <Send size={20} className="ml-0.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* FLOATING TOGGLE BUTTON */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center justify-center bg-[#008069] hover:bg-[#006a56] text-white w-16 h-16 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 relative overflow-hidden"
                >
                    {/* Bot Profile Pic on Button */}
                    <Image 
                        src={AI_AVATAR} 
                        alt="Chat" 
                        fill 
                        className="object-cover scale-110 group-hover:scale-125 transition-transform"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            // Fallback Icon
                            e.currentTarget.parentElement!.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
                        }}
                    />
                </button>
            )}
        </div>
    )
}