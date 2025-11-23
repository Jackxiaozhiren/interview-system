"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api, { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, VideoIcon, Mic2, HardDrive, Play, Square, Mic, VideoOff, AlertTriangle, ArrowRight } from "lucide-react";
import { JobCategorySelector } from "@/components/job-category-selector";
import { useAuth } from "@/context/AuthContext";

// ... (Keep interfaces)
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

interface AudioFeatures {
  speech_rate?: number;
  pause_ratio?: number;
  filler_word_ratio?: number;
  pitch_variance?: number;
  emotion?: string;
}

interface VideoFeatures {
  eye_contact_score?: number;
  smile_ratio?: number;
  posture_score?: number;
  head_movement_score?: number;
  dominant_emotion?: string;
  emotion_distribution?: Record<string, number>;
}

interface MediaEvaluationResponse {
  media_id: string;
  feedback: string;
  audio_features?: AudioFeatures;
  video_features?: VideoFeatures;
}

import { Suspense } from "react";

function AvInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");

  const [session, setSession] = useState<InterviewSessionDto | null>(null);
  const [mediaList, setMediaList] = useState<InterviewMediaDto[]>([]);

  const [file, setFile] = useState<File | null>(null);

  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, MediaEvaluationResponse>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);

  // Live Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [interviewMode, setInterviewMode] = useState<"training" | "exam">("training");
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Real-time Nudges State (WebSocket-based)
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [nudge, setNudge] = useState<string | null>(null);
  const [isSpeakingLive, setIsSpeakingLive] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isFetchingQuestion, setIsFetchingQuestion] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/av-interview");
    }
  }, [isAuthenticated, authLoading, router]);

  // Load session from URL if present
  useEffect(() => {
    if (sessionIdParam && isAuthenticated) {
      const fetchSession = async () => {
        try {
          const res = await api.get<InterviewSessionDto>(`/interview/sessions/${sessionIdParam}`);
          setSession(res.data);
          if (res.data.job_title) setJobTitle(res.data.job_title);
          if (res.data.job_description) setJobDescription(res.data.job_description);
          loadMedia(sessionIdParam);
          setIsLiveMode(true); // Auto-enter live mode if session loaded
        } catch (err) {
          console.error("Failed to load session", err);
          setError("无法加载指定的会话，请重试。");
        }
      };
      fetchSession();
    }
  }, [sessionIdParam, isAuthenticated]);

  const loadMedia = async (sessionId: string) => {
    try {
      const res = await api.get<InterviewMediaDto[]>(
        `/interview/sessions/${sessionId}/media`
      );
      setMediaList(res.data || []);
    } catch (err) {
      console.error(err);
      setError("加载媒体列表失败。");
    }
  };

  const handleStartSession = async () => {
    if (!jobTitle.trim() && !jobDescription.trim()) {
      setError("请至少填写职位名称或岗位描述");
      return;
    }

    setStarting(true);
    setError(null);
    setSession(null);
    setMediaList([]);

    try {
      const createRes = await api.post<InterviewSessionDto>(
        "/interview/sessions",
        {
          job_title: jobTitle || null,
          job_description: jobDescription || null,
          interviewer_type: "Tech",
          duration_minutes: 45,
        }
      );
      const created = createRes.data;

      const startRes = await api.post<InterviewSessionDto>(
        `/interview/sessions/${created.id}/start`
      );
      setSession(startRes.data);
      setIsLiveMode(true);
    } catch (err) {
      console.error(err);
      setError("创建/启动会话失败，请检查后端服务。");
    } finally {
      setStarting(false);
    }
  };

  const handleUpload = async (fileToUpload?: File) => {
    const targetFile = fileToUpload || file;
    if (!session || !targetFile) return;

    setUploading(true);
    setError(null);

    try {
      const mediaType = targetFile.type.startsWith("video/") ? "video" : "audio";
      const formData = new FormData();
      formData.append("file", targetFile);

      await api.post(
        `/interview/sessions/${session.id}/media?media_type=${mediaType}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setFile(null);
      await loadMedia(session.id);
    } catch (err) {
      console.error(err);
      setError("上传媒体文件失败，请稍后重试。");
    } finally {
      setUploading(false);
    }
  };

  const handleTranscribe = async (mediaId: string) => {
    setTranscribingId(mediaId);
    setError(null);

    try {
      const res = await api.post<{ media_id: string; transcript: string }>(
        `/interview/media/${mediaId}/transcribe`
      );
      setTranscripts((prev) => ({ ...prev, [mediaId]: res.data.transcript }));
    } catch (err) {
      console.error(err);
      setError("获取转写结果失败，请稍后重试。");
    } finally {
      setTranscribingId(null);
    }
  };

  const handleReport = async (mediaId: string) => {
    setReportingId(mediaId);
    setError(null);

    try {
      const res = await api.post<MediaEvaluationResponse>(
        `/interview/media/${mediaId}/report`
      );
      setReports((prev) => ({ ...prev, [mediaId]: res.data }));
    } catch (err) {
      console.error(err);
      setError("生成报告失败，请稍后重试。");
    } finally {
      setReportingId(null);
    }
  };

  // Adaptive Questioning
  const fetchNextQuestion = async () => {
    if (!session) return;
    setIsFetchingQuestion(true);
    try {
      const res = await api.post<{ id: string; content: string; type: string }>(
        `/interview/sessions/${session.id}/next-question`
      );
      setCurrentQuestion(res.data.content);
      // Speak the question (TTS placeholder)
      const utterance = new SpeechSynthesisUtterance(res.data.content);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Failed to fetch next question", err);
    } finally {
      setIsFetchingQuestion(false);
    }
  };

  // Live Mode Functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Setup WebSocket for real-time analysis
      if (session?.id) {
        const wsUrl = `ws://localhost:8000/ws/analysis/${session.id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected for real-time analysis");
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "nudge") {
            setNudge(data.message);
            setVolumeLevel(data.data?.volume || 0);
            setIsSpeakingLive(Boolean(data.data?.is_speaking));
            // Auto-clear nudge after 3s
            setTimeout(() => setNudge(null), 3000);
          } else if (data.type === "metrics") {
            setVolumeLevel(data.data?.volume || 0);
            setIsSpeakingLive(Boolean(data.data?.is_speaking));
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
        };
      }

      // Setup Audio Context to stream audio chunks to WebSocket
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(mediaStream);

      // Use ScriptProcessorNode to capture audio chunks (deprecated but widely supported)
      // For production, consider using AudioWorklet
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Send Float32Array to backend
          wsRef.current.send(inputData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      audioContextRef.current = audioCtx;

    } catch (err) {
      console.error("Failed to access camera", err);
      setError("无法访问摄像头或麦克风");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], "interview_recording.webm", { type: "video/webm" });
      setFile(file); // Set for fallback
      // Auto upload
      await handleUpload(file);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isLiveMode && !stream) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isLiveMode, session]);


  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }



  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <VideoIcon className="h-7 w-7 text-blue-600" />
              {isLiveMode
                ? interviewMode === "training"
                  ? "Training Camp Interview"
                  : "Exam Simulation Interview"
                : "Interview Setup"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isLiveMode
                ? interviewMode === "training"
                  ? "Training mode: you will see more guidance and gentle nudges while you answer."
                  : "Exam mode: fewer on-screen hints, focus on simulating a real interview."
                : "Configure your session or upload past recordings."}
            </p>
          </div>
          {session && (
            <div className="flex items-center gap-4">
              {isLiveMode && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Mode:</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={interviewMode === "training" ? "default" : "outline"}
                      onClick={() => setInterviewMode("training")}
                    >
                      Training
                    </Button>
                    <Button
                      size="sm"
                      variant={interviewMode === "exam" ? "default" : "outline"}
                      onClick={() => setInterviewMode("exam")}
                    >
                      Exam
                    </Button>
                  </div>
                </div>
              )}
              <Badge variant="outline" className="font-mono">Session ID: {session.id.slice(0, 8)}...</Badge>
              {isLiveMode && (
                <Button
                  onClick={() => router.push(`/interview/review/${session.id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  End & Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Live Mode Interface */}
        {isLiveMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Main Stage: Avatar & User */}
            <div className="lg:col-span-2 space-y-4 flex flex-col">
              <Card className="flex-1 bg-black relative overflow-hidden border-0 shadow-2xl">
                {/* Avatar Placeholder (Top Half) */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-800 flex items-center justify-center border-b border-slate-700 relative">
                  <div className="text-center space-y-2 z-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto animate-pulse"></div>
                    <p className="text-slate-300 font-medium">AI Interviewer</p>
                    <p className="text-xs text-slate-500">Listening...</p>
                  </div>

                  {/* Question Overlay */}
                  {currentQuestion && (
                    <div className="absolute bottom-4 left-0 w-full px-6 text-center">
                      <div className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-lg text-sm font-medium animate-in slide-in-from-bottom-2">
                        "{currentQuestion}"
                      </div>
                    </div>
                  )}
                </div>

                {/* User Camera (Bottom Half) */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-900 relative">
                  {stream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <VideoOff className="h-10 w-10 mb-2" />
                      <p>Camera Off</p>
                    </div>
                  )}

                  {/* HUD Overlay */}
                  <div className="absolute top-4 right-4 space-y-2">
                    {nudge && interviewMode === "training" && (
                      <div className="bg-black/60 backdrop-blur text-yellow-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 animate-bounce">
                        <AlertTriangle className="h-3 w-3" />
                        {nudge}
                      </div>
                    )}
                    <div className="bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-mono">
                      Vol: {volumeLevel.toFixed(0)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <div className="flex gap-2">
                    <Button onClick={fetchNextQuestion} disabled={isFetchingQuestion} variant="outline" className="rounded-full">
                      {isFetchingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next Question"}
                    </Button>
                    <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8">
                      <Mic className="h-4 w-4 mr-2" /> Start Answer
                    </Button>
                  </div>
                ) : (
                  <Button onClick={stopRecording} variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-full px-8 animate-pulse">
                    <Square className="h-4 w-4 mr-2" /> Stop & Submit
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar: Context & Chat */}
            <div className="space-y-4 flex flex-col h-full">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Interview Context</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Role</h3>
                    <p className="font-medium">{jobTitle || "Not specified"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Description</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-6">{jobDescription || "No description provided."}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Session History</h3>
                    <div className="space-y-2">
                      {mediaList.map(m => (
                        <div key={m.id} className="text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded flex justify-between items-center">
                          <span className="truncate max-w-[120px]">{m.filename}</span>
                          <Badge variant="outline" className="text-[10px]">{m.media_type}</Badge>
                        </div>
                      ))}
                      {mediaList.length === 0 && <p className="text-xs text-slate-400">No recordings yet.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Live Coach</CardTitle>
                  <CardDescription className="text-xs">
                    Simple real-time guidance based on your current speaking volume.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {isSpeakingLive ? "Speaking" : "Silent"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Volume</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {volumeLevel.toFixed(3)}
                    </span>
                  </div>
                  {nudge && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-amber-800 dark:text-amber-100 text-[11px]">
                      {nudge}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Upload Fallback */}
              {file && !isRecording && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Recording ready: {file.name}</p>
                    <Button size="sm" onClick={() => handleUpload()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Upload & Analyze
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Setup / Fallback Mode (Original UI) */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Configure Session</CardTitle>
                <CardDescription>Set job details to start.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ... (Simplified for brevity, relying on Setup Page mostly now) ... */}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Job Title</label>
                  <JobCategorySelector value={jobTitle} onChange={setJobTitle} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Job Description</label>
                  <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste JD here" />
                </div>
                <Button onClick={handleStartSession} disabled={starting}>
                  {starting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create & Start Live Session
                </Button>
              </CardContent>
            </Card>

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AvInterviewPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <AvInterviewContent />
    </Suspense>
  );
}
