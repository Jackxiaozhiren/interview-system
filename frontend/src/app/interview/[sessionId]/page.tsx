"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PulseButton } from "@/components/ui/pulse-button";
import { Badge } from "@/components/ui/badge";
import { Loader2, VideoIcon, Mic, VideoOff, Square, ArrowRight, Layout, MessageSquare, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { HUDOverlay } from "@/components/interview/HUDOverlay";
import { Avatar, AvatarState } from "@/components/interview/Avatar";
import { BackgroundSwitcher, BackgroundType } from "@/components/interview/BackgroundSwitcher";
import { motion, AnimatePresence } from "framer-motion";

// Interfaces
interface InterviewSessionDto {
    id: string;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    job_title?: string | null;
    job_description?: string | null;
    interviewer_type?: string | null;
    duration_minutes?: number | null;
}

interface InterviewMediaDto {
    id: string;
    session_id: string;
    media_type: string;
    filename: string;
    created_at: string;
}

function InterviewSessionContent() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params.sessionId as string;
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [session, setSession] = useState<InterviewSessionDto | null>(null);
    const [mediaList, setMediaList] = useState<InterviewMediaDto[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // HUD State
    const [wpm, setWpm] = useState(0);
    const [fillerCount, setFillerCount] = useState(0);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [nudge, setNudge] = useState<string | null>(null);
    const [isSpeakingLive, setIsSpeakingLive] = useState(false);
    const [interviewMode, setInterviewMode] = useState<"training" | "exam">("training");

    // Immersive State
    const [background, setBackground] = useState<BackgroundType>("office");
    const [showSidebar, setShowSidebar] = useState(true);

    // Avatar State
    const [avatarState, setAvatarState] = useState<AvatarState>("idle");

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Auth Check
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push(`/login?redirect=/interview/${sessionId}`);
        }
    }, [isAuthenticated, authLoading, router, sessionId]);

    // Load Session
    useEffect(() => {
        if (sessionId && isAuthenticated) {
            const fetchSession = async () => {
                try {
                    const res = await api.get<InterviewSessionDto>(`/interview/sessions/${sessionId}`);
                    setSession(res.data);
                    loadMedia(sessionId);
                } catch (err) {
                    console.error("Failed to load session", err);
                    setError("无法加载会话，请检查 ID 是否正确。");
                }
            };
            fetchSession();
        }
    }, [sessionId, isAuthenticated]);

    const loadMedia = async (sid: string) => {
        try {
            const res = await api.get<InterviewMediaDto[]>(`/interview/sessions/${sid}/media`);
            setMediaList(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    // Start Camera & WebSocket
    useEffect(() => {
        if (session && !streamRef.current) {
            startCamera();
        }
        return () => {
            cleanupMedia();
        };
    }, [session]);

    const cleanupMedia = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // WebSocket Setup
            const wsUrl = `ws://localhost:8000/ws/analysis/${sessionId}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => console.log("WS Connected");

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const metrics = data.data || {};

                if (data.type === "nudge") {
                    setNudge(data.message);
                    setTimeout(() => setNudge(null), 3000);
                }

                // Handle Avatar Reactions
                if (data.type === "reaction") {
                    const reaction = data.reaction;
                    if (reaction === "nod") {
                        setAvatarState("nodding");
                        setTimeout(() => setAvatarState("listening"), 1500);
                    } else if (reaction === "take_notes") {
                        setAvatarState("taking_notes");
                        setTimeout(() => setAvatarState("listening"), 2000);
                    }
                }

                // Update Metrics
                if (metrics.volume !== undefined) {
                    setVolumeLevel(metrics.volume);
                    if (metrics.volume > 0.01 && avatarState !== "nodding" && avatarState !== "taking_notes") {
                        setAvatarState("listening");
                    } else if (metrics.volume <= 0.01 && avatarState === "listening") {
                        setAvatarState("idle");
                    }
                }
                if (metrics.is_speaking !== undefined) setIsSpeakingLive(metrics.is_speaking);
                if (metrics.wpm !== undefined) setWpm(metrics.wpm);
                if (metrics.filler_detected) setFillerCount(prev => prev + 1);
            };

            // Audio Streaming
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(mediaStream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    wsRef.current.send(inputData.buffer);
                }
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
            audioContextRef.current = audioCtx;

        } catch (err) {
            console.error("Camera access failed", err);
            setError("无法访问摄像头或麦克风。");
        }
    };

    const handleStartRecording = () => {
        if (!streamRef.current) return;
        const mediaRecorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            const file = new File([blob], "interview_recording.webm", { type: "video/webm" });
            await handleUpload(file);
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!session) return;
        try {
            const formData = new FormData();
            formData.append("file", file);
            await api.post(`/interview/sessions/${session.id}/media?media_type=video`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            loadMedia(session.id);
        } catch (err) {
            console.error("Upload failed", err);
            setError("上传录音失败。");
        }
    };

    // Background Styles
    const getBackgroundStyle = () => {
        switch (background) {
            case "office": return "bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')]";
            case "tech_lab": return "bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80')]";
            case "executive": return "bg-[url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80')]";
            default: return "bg-slate-950";
        }
    };

    if (authLoading || !session) {
        return <div className="flex justify-center items-center min-h-screen bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <main className={`min-h-screen relative overflow-hidden transition-all duration-1000 bg-cover bg-center ${getBackgroundStyle()}`}>
            {/* Overlay for readability */}
            <div className={`absolute inset-0 ${background === "minimal" ? "bg-slate-950" : "bg-black/40 backdrop-blur-sm"}`} />

            <div className="relative z-10 h-screen flex flex-col p-4 md:p-6">

                {/* Top Bar */}
                <header className="flex justify-between items-center mb-4">
                    <GlassCard className="px-4 py-2 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full">
                            <VideoIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-100 text-sm md:text-base">{session.job_title || "Interview Session"}</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-slate-400">Live Connection</span>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="flex gap-2">
                        <BackgroundSwitcher currentBg={background} onSelect={setBackground} />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10"
                            onClick={() => setShowSidebar(!showSidebar)}
                        >
                            {showSidebar ? <Layout className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
                            onClick={() => router.push(`/interview/review/${sessionId}`)}
                        >
                            End
                        </Button>
                    </div>
                </header>

                {/* Main Arena */}
                <div className="flex-1 flex gap-6 min-h-0">

                    {/* Stage (Avatar + User) */}
                    <div className="flex-1 relative flex flex-col gap-4">

                        {/* Interviewer (Avatar) - Takes up most space */}
                        <GlassCard className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/40 border-white/10">
                            <Avatar state={avatarState} />

                            {/* Floating HUD for Training Mode */}
                            {interviewMode === "training" && (
                                <div className="absolute top-4 right-4 z-20">
                                    <HUDOverlay
                                        wpm={wpm}
                                        fillerCount={fillerCount}
                                        volume={volumeLevel}
                                        nudge={nudge}
                                        isSpeaking={isSpeakingLive}
                                    />
                                </div>
                            )}
                        </GlassCard>

                        {/* User Video - PIP Style */}
                        <motion.div
                            className="absolute bottom-4 right-4 w-48 md:w-64 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black"
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                            <div className="absolute bottom-2 left-2 flex gap-1">
                                <div className={`p-1.5 rounded-full backdrop-blur-md ${isSpeakingLive ? "bg-green-500/80" : "bg-black/50"}`}>
                                    <Mic className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar (Collapsible) */}
                    <AnimatePresence>
                        {showSidebar && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 320, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="h-full flex flex-col gap-4"
                            >
                                {/* Question Card */}
                                <GlassCard className="p-4 bg-slate-900/80">
                                    <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">Current Question</h3>
                                    <p className="text-slate-100 font-medium leading-relaxed">
                                        "Tell me about a time you faced a technical challenge and how you solved it."
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                                            Skip <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                </GlassCard>

                                {/* Controls */}
                                <GlassCard className="p-4 flex-1 bg-slate-900/80 flex flex-col">
                                    <div className="flex gap-2 mb-4 p-1 bg-slate-800/50 rounded-lg">
                                        <Button
                                            size="sm"
                                            variant={interviewMode === "training" ? "secondary" : "ghost"}
                                            onClick={() => setInterviewMode("training")}
                                            className="flex-1 text-xs"
                                        >
                                            Training
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={interviewMode === "exam" ? "secondary" : "ghost"}
                                            onClick={() => setInterviewMode("exam")}
                                            className="flex-1 text-xs"
                                        >
                                            Exam
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {!isRecording ? (
                                            <PulseButton
                                                className="w-full bg-blue-600 hover:bg-blue-500 h-12 text-lg shadow-lg shadow-blue-900/20"
                                                onClick={handleStartRecording}
                                                pulse={true}
                                            >
                                                <Mic className="mr-2 h-5 w-5" /> Start Answer
                                            </PulseButton>
                                        ) : (
                                            <Button
                                                className="w-full bg-red-500 hover:bg-red-600 h-12 text-lg animate-pulse"
                                                onClick={handleStopRecording}
                                            >
                                                <Square className="mr-2 h-5 w-5" /> Stop Recording
                                            </Button>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/10">
                                        <h3 className="text-xs font-medium text-slate-500 mb-2">Session History</h3>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {mediaList.map(m => (
                                                <div key={m.id} className="flex justify-between items-center p-2 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer group">
                                                    <span className="text-xs text-slate-300 truncate max-w-[150px]">{m.filename}</span>
                                                    <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400 group-hover:border-white/30">{m.media_type}</Badge>
                                                </div>
                                            ))}
                                            {mediaList.length === 0 && <p className="text-xs text-slate-600 text-center py-4">No recordings yet.</p>}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}

export default function InterviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <InterviewSessionContent />
        </Suspense>
    );
}
