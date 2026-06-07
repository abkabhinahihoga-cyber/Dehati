'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { 
    ArrowLeft, Send, Loader2, Phone, Video, Check, CheckCheck, MoreVertical, 
    Mic, Paperclip, Smile, Image as ImageIcon, FileText, ChevronDown, Trash2, 
    Ban, PhoneOff, MicOff, VideoOff, AlertCircle, X, Download
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { io, Socket } from "socket.io-client"
import { useSession } from 'next-auth/react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

// --- TYPES ---
interface IUser {
    _id: string;
    name: string;
    image: string;
}

interface IMessage {
    _id: string;
    conversationId: string;
    sender: IUser | string | any;
    text: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    fileUrl?: string;
    status: 'sent' | 'delivered' | 'seen';
    createdAt: string;
    isDeleted?: boolean;
    deletedFor?: string[];
}

// --- CONFIG ---
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
    ]
};

export default function ChatPage() {
    const router = useRouter();
    const { id: conversationId } = useParams();
    const { data: session } = useSession();
    
    // --- STATE ---
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatPartner, setChatPartner] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // UI State
    const [isSending, setIsSending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    // Call State
    const [isInCall, setIsInCall] = useState(false);
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [callerSignal, setCallerSignal] = useState<any>(null);
    const [callType, setCallType] = useState<'audio' | 'video'>('video');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [callStatus, setCallStatus] = useState<string>("Idle");
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // --- REFS ---
    const socket = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    
    // WebRTC Refs
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const candidatesQueue = useRef<RTCIceCandidateInit[]>([]);

    // --- 1. SOCKET INIT ---
    useEffect(() => {
        if (!session?.user) return;
        socket.current = io(SOCKET_URL, { transports: ['websocket'] });
        socket.current.emit("join-chat", conversationId);

        const s = socket.current;

        // Chat Events
        s.on("receive-message", (msg: IMessage) => {
            setMessages(prev => [...prev, { ...msg, status: 'delivered' }]);
            s.emit("mark-as-seen", { conversationId, messageIds: [msg._id], seenBy: session.user.id });
        });
        s.on("messages-seen", ({ messageIds }: { messageIds: string[] }) => {
            setMessages(prev => prev.map(msg => (messageIds.includes(msg._id) || msg.status !== 'seen') ? { ...msg, status: 'seen' } : msg));
        });
        s.on("message-deleted", ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isDeleted: true, text: "This message was deleted", type: 'text', fileUrl: undefined } : msg));
        });

        // Call Events
        s.on("incoming-call", (data: any) => {
            if (isInCall) {
                // Busy: Auto reject
                s.emit("call-rejected", { conversationId });
                return;
            }
            setIsIncomingCall(true);
            setCallerSignal(data.offer);
            setCallType(data.type || 'video');
            playRingtone();
        });

        s.on("call-accepted", async (data: any) => {
            if (peerConnection.current && data.answer) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                setCallStatus("Connected");
                processCandidateQueue();
            }
        });

        s.on("call-rejected", () => {
            showError("Call Declined");
            endCallCleanup();
        });

        s.on("new-ice-candidate", async (data: any) => {
            if (data.candidate) {
                if (peerConnection.current?.remoteDescription) {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    candidatesQueue.current.push(data.candidate);
                }
            }
        });

        s.on("call-ended", () => endCallCleanup());

        // Initial Data
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`/api/chat/${conversationId}`);
                if (res.data.success) { setMessages(res.data.messages); setChatPartner(res.data.chatPartner); }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchHistory();

        return () => { s.disconnect(); endCallCleanup(); };
    }, [conversationId, session]);

    // Attach Streams to DOM (Crucial for Audio/Video to play)
    useEffect(() => {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    }, [localStream, isInCall]);

    // Auto Scroll
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping, isSending]);

    // --- 2. CALL FUNCTIONS ---

    const playRingtone = () => {
        try {
            ringtoneRef.current = new Audio("/assets/ringtone.mp3");
            ringtoneRef.current.loop = true;
            // Play promise to handle browser blocking
            const playPromise = ringtoneRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.log("Audio autoplay prevented:", error));
            }
        } catch (e) { console.warn("Ringtone error", e); }
    };

    const initializePeerConnection = () => {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pc.onicecandidate = (e) => { if (e.candidate && socket.current) socket.current.emit("ice-candidate", { conversationId, candidate: e.candidate }); };
        pc.ontrack = (e) => { 
            // Attach remote stream to video element
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };
        pc.onconnectionstatechange = () => { if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') endCallCleanup(); };
        peerConnection.current = pc;
        return pc;
    };

    const startCall = async (isVideo: boolean) => {
        setIsInCall(true); setCallStatus("Calling..."); setCallType(isVideo ? 'video' : 'audio'); setIsVideoOff(!isVideo);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
            setLocalStream(stream);
            const pc = initializePeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
            socket.current?.emit("call-start", { conversationId, offer, callerName: session?.user?.name, type: isVideo ? 'video' : 'audio' });
        } catch (err) { showError("Device access denied"); endCallCleanup(); }
    };

    const acceptCall = async () => {
        setIsIncomingCall(false); setIsInCall(true); setCallStatus("Connecting..."); 
        if (ringtoneRef.current) { ringtoneRef.current.pause(); }

        const isVideo = callType === 'video'; setIsVideoOff(!isVideo);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
            setLocalStream(stream);
            const pc = initializePeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            if (callerSignal) {
                await pc.setRemoteDescription(new RTCSessionDescription(callerSignal));
                const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
                socket.current?.emit("call-answer", { conversationId, answer });
                setCallStatus("Connected");
                processCandidateQueue();
            }
        } catch (err) { showError("Failed to accept"); endCallCleanup(); }
    };

    const rejectCall = () => {
        socket.current?.emit("call-rejected", { conversationId }); // New Event
        endCallCleanup();
    };

    const endCallCleanup = useCallback(() => {
        setIsInCall(false); setIsIncomingCall(false); setCallStatus("Idle"); setIsMicMuted(false); setIsVideoOff(false);
        if (localStream) { localStream.getTracks().forEach(track => track.stop()); setLocalStream(null); }
        if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
        if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
        candidatesQueue.current = [];
    }, [localStream]);

    const endCall = () => { socket.current?.emit("end-call", { conversationId }); endCallCleanup(); };
    const toggleMic = () => { if (localStream) { localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled); setIsMicMuted(!isMicMuted); } };
    const toggleVideo = () => { if (localStream) { const v = localStream.getVideoTracks()[0]; if (v) { v.enabled = !v.enabled; setIsVideoOff(!v.enabled); } } };
    const processCandidateQueue = async () => { if (!peerConnection.current) return; for (const c of candidatesQueue.current) { await peerConnection.current.addIceCandidate(new RTCIceCandidate(c)); } candidatesQueue.current = []; };

    // --- 3. CHAT LOGIC ---
    const handleSendClick = () => { newMessage.trim() ? sendMessage() : (isRecording ? stopRecording() : startRecording()); };
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        socket.current?.emit("typing", { conversationId, userId: session?.user?.id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => socket.current?.emit("stop-typing", { conversationId, userId: session?.user?.id }), 1500);
    };

    const uploadFile = async (file: File) => {
        setIsSending(true); setUploadProgress(0);
        try {
            const timestamp = Math.round((new Date()).getTime() / 1000);
            const { data } = await axios.post("/api/auth/cloudinary-sign", { paramsToSign: { timestamp, folder: 'chat_media' } });
            const formData = new FormData();
            formData.append("file", file); formData.append("api_key", data.apiKey); formData.append("timestamp", timestamp.toString()); formData.append("signature", data.signature); formData.append("folder", "chat_media");
            const type = file.type.startsWith('image') ? 'image' : 'video';
            const url = `https://api.cloudinary.com/v1_1/${data.cloudName}/${type}/upload`;
            const res = await axios.post(url, formData, { onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / (p.total || 1))) });
            return res.data.secure_url;
        } catch (e) { return null; } finally { setIsSending(false); setUploadProgress(0); }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        let type: 'image'|'video'|'file' = 'file';
        if (file.type.startsWith('image')) type = 'image'; else if (file.type.startsWith('video')) type = 'video';
        const url = await uploadFile(file);
        if (url) await sendMessage(null, type, url, file.name);
    };

    const sendMessage = async (e?: any, type: 'text'|'image'|'video'|'audio'|'file' = 'text', fileUrl?: string, fileName?: string) => {
        if (type === 'text' && !newMessage.trim()) return;
        const msgData: IMessage = {
            _id: Date.now().toString(), conversationId: conversationId as string,
            sender: { _id: session?.user?.id || 'me', name: session?.user?.name || 'Me', image: session?.user?.image || '' },
            text: type === 'text' ? newMessage : (fileName || type), type, fileUrl, status: 'sent', createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, msgData]);
        socket.current?.emit("send-message", msgData);
        if (type === 'text') setNewMessage(""); setShowEmoji(false);
    };

    const deleteMessage = async (messageId: string, type: 'me' | 'everyone') => {
        setActiveMenuId(null);
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: "This message was deleted", type: 'text', fileUrl: undefined } : m));
        try {
            await axios.post('/api/chat/message/delete', { messageId, type });
            if (type === 'everyone') socket.current?.emit("delete-message", { conversationId, messageId });
        } catch (e) { showError("Delete failed"); }
    };

    // Helpers
    const startRecording = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(s); const c: BlobPart[] = []; r.ondataavailable = e => c.push(e.data); r.onstop = async () => { const b = new Blob(c, { type: 'audio/webm' }); const f = new File([b], "voice.webm", { type: "audio/webm" }); const u = await uploadFile(f); if (u) await sendMessage(null, 'audio', u); }; r.start(); mediaRecorder.current = r; setIsRecording(true); } catch (e) { alert("Mic denied"); } };
    const stopRecording = () => { if (mediaRecorder.current && isRecording) { mediaRecorder.current.stop(); setIsRecording(false); } };
    const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 4000); };

    // --- RENDERERS ---
    const renderMessageContent = (msg: IMessage) => {
        if (msg.isDeleted) return <div className="flex items-center gap-1 text-gray-500 italic text-[13px] py-1"><Ban size={14}/> This message was deleted</div>;
        if (msg.type === 'image' && msg.fileUrl) return <div className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition" onClick={() => setViewImage(msg.fileUrl || null)}><img src={msg.fileUrl} alt="img" className="w-full h-auto max-h-[400px] max-w-[320px] object-cover rounded-lg" /></div>;
        if (msg.type === 'video' && msg.fileUrl) return <div className="mb-1 rounded-lg overflow-hidden max-w-[320px]"><video src={msg.fileUrl} controls className="w-full max-h-[400px] bg-black" /></div>;
        if (msg.type === 'audio' && msg.fileUrl) return <div className="flex items-center gap-2 min-w-[240px] mt-2 mb-2 pr-2"><div className="bg-gray-200 p-2 rounded-full"><Mic size={20} className="text-gray-600"/></div><audio controls src={msg.fileUrl} className="h-10 w-full" /></div>;
        if (msg.type === 'file' && msg.fileUrl) return <a href={msg.fileUrl} target="_blank" className="flex items-center gap-3 bg-black/5 p-3 rounded-lg mb-1 hover:bg-black/10 transition max-w-[300px]"><div className="bg-red-100 p-2 rounded-full"><FileText size={20} className="text-red-500" /></div><span className="text-sm font-medium text-gray-700 truncate">{msg.text}</span></a>;
        return <span className="text-gray-900 pb-1 pt-0.5 px-1 break-words whitespace-pre-wrap">{msg.text}</span>;
    };

    if (loading) return <div className="h-[100dvh] flex items-center justify-center bg-[#E5DDD5]"><Loader2 className="animate-spin text-[#008069]" /></div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-[#E5DDD5] relative overflow-hidden" onClick={() => setActiveMenuId(null)}> 
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: "url('/assets/chat-bg-village.png')", backgroundSize: 'cover' }} />

            {errorMsg && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[70] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><AlertCircle size={18} /> {errorMsg}</div>}

            {/* LIGHTBOX */}
            {viewImage && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
                    <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50"><X size={30}/></button>
                    <a href={viewImage} download className="absolute top-4 right-16 text-white hover:text-gray-300 p-2 rounded-full bg-black/50"><Download size={24}/></a>
                    <img src={viewImage} alt="Full view" className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
                </div>
            )}

            {/* INCOMING CALL */}
            {isIncomingCall && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-md">
                    <div className="w-24 h-24 rounded-full bg-gray-600 overflow-hidden mb-4 border-4 border-white/20"><Image src={chatPartner?.image || "/avatar.png"} fill alt="Caller" className="object-cover"/></div>
                    <h2 className="text-2xl font-bold mb-1">{chatPartner?.name}</h2>
                    <p className="text-green-400 mb-10 animate-pulse font-medium">Incoming {callType} Call...</p>
                    <div className="flex gap-12">
                        <button onClick={rejectCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-transform hover:scale-110"><PhoneOff size={32}/></button>
                        <button onClick={acceptCall} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 shadow-lg animate-bounce"><Phone size={32}/></button>
                    </div>
                </div>
            )}

            {/* ACTIVE CALL */}
            {isInCall && (
                <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col">
                    <div className="flex-1 relative bg-black flex items-center justify-center">
                        {/* Remote Video or Avatar */}
                        {callType === 'video' ? (
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4 relative"><Image src={chatPartner?.image || "/avatar.png"} fill alt="Partner" className="object-cover"/></div>
                                <h2 className="text-2xl font-bold text-white">{chatPartner?.name}</h2><p className="text-white/60">Audio Call • {callStatus}</p>
                                {/* IMPORTANT: Hidden Video element to ensure Audio plays via WebRTC */}
                                <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                            </div>
                        )}
                    </div>
                    {callType === 'video' && !isVideoOff && <div className="absolute top-4 right-4 w-32 h-44 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/30 shadow-xl"><video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" /></div>}
                    <div className="bg-gray-900/90 backdrop-blur-md p-6 flex justify-center gap-8 pb-10 items-center">
                        <button onClick={toggleMic} className={`p-4 rounded-full text-white transition-all ${isMicMuted ? 'bg-white text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>{isMicMuted ? <MicOff size={24}/> : <Mic size={24}/>}</button>
                        <button onClick={endCall} className="p-5 bg-red-600 rounded-full text-white hover:bg-red-700 shadow-lg transform hover:scale-105 transition-all"><PhoneOff size={32}/></button>
                        {callType === 'video' && <button onClick={toggleVideo} className={`p-4 rounded-full text-white transition-all ${isVideoOff ? 'bg-white text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>{isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>}</button>}
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-[#075E54] text-white p-2 px-3 flex items-center justify-between shadow-md z-20 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-white/10"><ArrowLeft size={22} /></button>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-300 border border-white/10"><Image src={chatPartner?.image || "/avatar.png"} fill alt="User" className="object-cover" /></div>
                        <div><h2 className="font-bold text-[16px] leading-tight">{chatPartner?.name || "User"}</h2><p className="text-[11px] text-white/80 mt-0.5">{isTyping ? "typing..." : "Online"}</p></div>
                    </div>
                </div>
                <div className="flex gap-5 pr-2 items-center">
                    <Video size={22} className="cursor-pointer hover:opacity-80" onClick={() => startCall(true)} />
                    <Phone size={20} className="cursor-pointer hover:opacity-80" onClick={() => startCall(false)} />
                    <MoreVertical size={20} className="cursor-pointer hover:opacity-80" />
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-2 px-3 space-y-1 z-10 scrollbar-hide">
                {messages.map((msg, index) => {
                    if (msg.deletedFor?.includes(session?.user?.id || '')) return null;
                    const isMe = typeof msg.sender === 'string' ? msg.sender === session?.user?.id : msg.sender._id === session?.user?.id;
                    const isMedia = ['image', 'video'].includes(msg.type);
                    return (
                        <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-1 group relative`}>
                            <div className={`relative max-w-[85%] sm:max-w-[70%] min-w-[100px] rounded-lg shadow-sm flex flex-col ${isMe ? 'bg-[#E7FFDB] rounded-tr-none' : 'bg-white rounded-tl-none'} ${isMedia ? 'p-1' : 'px-2 pt-1.5 pb-1'}`}>
                                {renderMessageContent(msg)}
                                {!msg.isDeleted && <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(msg._id === activeMenuId ? null : msg._id); }} className="absolute top-0 right-0 p-1 bg-gradient-to-l from-white/80 via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tr-lg"><ChevronDown size={16} className="text-gray-500" /></button>}
                                {activeMenuId === msg._id && <div className="absolute top-6 right-2 z-50 bg-white shadow-xl rounded-md py-1 min-w-[160px] border border-gray-100 animate-in fade-in zoom-in-95">{isMe && <button onClick={() => deleteMessage(msg._id, 'everyone')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"><Trash2 size={14}/> Delete for everyone</button>}<button onClick={() => deleteMessage(msg._id, 'me')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"><Trash2 size={14}/> Delete for me</button></div>}
                                <div className={`flex items-center gap-0.5 select-none h-4 ml-auto ${isMedia && !msg.isDeleted ? 'absolute bottom-2 right-2 bg-gradient-to-t from-black/60 to-transparent px-1.5 rounded-full' : 'text-[#667781]'}`}><span className={`text-[10px] min-w-fit ${isMedia && !msg.isDeleted ? 'text-white' : ''}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>{isMe && !msg.isDeleted && <span className={isMedia ? 'text-white' : ''}>{msg.status === 'seen' ? <CheckCheck size={16} className="text-[#53bdeb]" /> : <CheckCheck size={16} className="text-[#8696a0]" />}</span>}</div>
                            </div>
                        </div>
                    )
                })}
                {isSending && <div className="flex justify-end mb-2"><div className="bg-[#E7FFDB] rounded-lg p-2 pr-4 shadow-sm flex items-center gap-3"><Loader2 className="animate-spin w-4 h-4 text-[#008069]"/> <span className="text-xs font-bold text-[#008069]">Sending... {uploadProgress}%</span></div></div>}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="bg-[#F0F2F5] px-2 py-1.5 flex items-end gap-2 z-20 shrink-0 pb-safe min-h-[60px] relative">
                {showEmoji && <div className="absolute bottom-16 left-0 z-30 shadow-xl rounded-xl overflow-hidden"><EmojiPicker onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)} /></div>}
                <div className="flex gap-1 mb-3 text-[#54656f] px-1"><button onClick={() => setShowEmoji(!showEmoji)} className="hover:text-gray-800 transition"><Smile size={26} /></button><button onClick={() => fileInputRef.current?.click()} className="hover:text-gray-800 transition"><Paperclip size={24} className="-rotate-45" /></button><input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" /></div>
                <div className="flex-1 bg-white rounded-2xl flex items-center px-4 py-2 shadow-sm mb-1.5"><input value={newMessage} onChange={handleTyping} onKeyDown={(e) => e.key === 'Enter' && handleSendClick()} placeholder="Message" className="flex-1 bg-transparent text-gray-800 text-[15px] outline-none placeholder:text-[#54656f]" /><ImageIcon size={22} className="text-[#54656f] cursor-pointer ml-2 hover:text-[#008069]" onClick={() => fileInputRef.current?.click()}/></div>
                <button onClick={handleSendClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md mb-1.5 active:scale-95 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#008069]'} text-white`}>{newMessage.trim() ? <Send size={20} className="ml-0.5" /> : (isRecording ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Mic size={24} />)}</button>
            </div>
        </div>
    )
}