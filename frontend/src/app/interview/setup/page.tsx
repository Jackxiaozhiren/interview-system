"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PulseButton } from "@/components/ui/pulse-button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CheckCircle, AlertCircle, FileText, Briefcase, Camera, Mic, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ResumeItem {
    id: string;
    filename: string;
    created_at: string;
    summary: string;
    top_skills: string[];
}

interface MatchReport {
    score: number;
    matching_keywords: string[];
    missing_keywords: string[];
    strengths: string[];
    gaps: string[];
    summary: string;
}

export default function InterviewSetupPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [resumes, setResumes] = useState<ResumeItem[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Media Check State
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            // router.push("/login"); 
        }
        fetchResumes();
    }, [isAuthenticated]);

    useEffect(() => {
        // Initialize camera when reaching step 3
        if (step === 3) {
            initMedia();
        }
        return () => {
            stopMedia();
        };
    }, [step]);

    const initMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
            setHasMicPermission(true);
        } catch (err) {
            console.error("Media access denied", err);
            setHasCameraPermission(false);
            setHasMicPermission(false);
        }
    };

    const stopMedia = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const fetchResumes = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/interview/resumes`);
            setResumes(res.data);
        } catch (err) {
            console.error("Failed to fetch resumes", err);
            setError("无法加载简历列表，请检查后端服务。");
        }
    };

    const handleAnalyzeMatch = async () => {
        if (!selectedResumeId || !jobDescription.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/interview/resumes/${selectedResumeId}/match-report`, {
                resume_text: "", // Backend uses stored text
                job_description: jobDescription
            });
            setMatchReport(res.data);
            setStep(3);
        } catch (err) {
            console.error("Match analysis failed", err);
            setError("岗位匹配分析失败，请稍后重试。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartInterview = async () => {
        if (!selectedResumeId) return;

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/interview/sessions`, {
                job_title: "Target Role",
                job_description: jobDescription,
                interviewer_type: "HR",
                duration_minutes: 30
            });

            const sessionId = res.data.id;
            await axios.post(`${API_BASE_URL}/interview/sessions/${sessionId}/start`);

            // Stop media before navigating
            stopMedia();

            router.push(`/interview/${sessionId}`);
        } catch (err) {
            console.error("Failed to start interview", err);
            setError("创建面试会话失败。");
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-8 flex items-center justify-center">
            <div className="max-w-5xl w-full space-y-8 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        The Green Room
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Prepare for your interview in a calm, professional environment.
                        {step === 1 && " Select your resume to begin."}
                        {step === 2 && " Provide the job description."}
                        {step === 3 && " Review your match and check your equipment."}
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="flex justify-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex items-center gap-2 ${step >= s ? "text-blue-400" : "text-slate-600"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? "border-blue-400 bg-blue-400/10" : "border-slate-700"}`}>
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            <span className="hidden md:inline text-sm font-medium">
                                {s === 1 ? "Resume" : s === 2 ? "Job Description" : "System Check"}
                            </span>
                            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-400" : "bg-slate-700"}`} />}
                        </div>
                    ))}
                </div>

                {error && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <AnimatePresence mode="wait">
                    {/* Step 1: Select Resume */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-semibold mb-6">Select Your Resume</h2>
                                {resumes.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                                        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-400 mb-6">No resumes found.</p>
                                        <Button onClick={() => router.push("/")} variant="outline">Upload Resume</Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {resumes.map((resume) => (
                                            <div
                                                key={resume.id}
                                                className={`p-6 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${selectedResumeId === resume.id
                                                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                                        : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
                                                    }`}
                                                onClick={() => setSelectedResumeId(resume.id)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <FileText className={`h-8 w-8 ${selectedResumeId === resume.id ? "text-blue-400" : "text-slate-500"}`} />
                                                    {selectedResumeId === resume.id && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                            <CheckCircle className="h-6 w-6 text-blue-400" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-lg mb-1 text-slate-200">{resume.filename}</h3>
                                                <p className="text-sm text-slate-500 mb-4">{new Date(resume.created_at).toLocaleDateString()}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {resume.top_skills.slice(0, 3).map(skill => (
                                                        <Badge key={skill} variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">{skill}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-end mt-8">
                                    <PulseButton
                                        onClick={() => setStep(2)}
                                        disabled={!selectedResumeId}
                                        className="w-full md:w-auto"
                                    >
                                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                    </PulseButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* Step 2: Job Description */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <GlassCard className="p-8">
                                <h2 className="text-2xl font-semibold mb-2">Target Job Description</h2>
                                <p className="text-slate-400 mb-6">Paste the JD below. Our AI will analyze your fit and tailor the interview questions.</p>

                                <Textarea
                                    placeholder="Paste Job Description here..."
                                    className="min-h-[300px] bg-slate-950/50 border-slate-800 focus:border-blue-500 text-slate-200 font-mono text-sm resize-none p-6 rounded-xl"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />

                                <div className="flex justify-between items-center mt-8">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-200">
                                        Back
                                    </Button>
                                    <PulseButton
                                        onClick={handleAnalyzeMatch}
                                        disabled={!jobDescription.trim() || isLoading}
                                        pulse={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing Match...
                                            </>
                                        ) : (
                                            <>
                                                Analyze & Continue <Briefcase className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </PulseButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* Step 3: Match Report & System Check */}
                    {step === 3 && matchReport && (
                        <motion.div
                            key="step3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="grid lg:grid-cols-2 gap-8"
                        >
                            {/* Left: Match Report */}
                            <GlassCard className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-200">Match Analysis</h2>
                                        <p className="text-sm text-slate-400">Based on your resume & JD</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-4xl font-bold ${matchReport.score >= 80 ? "text-green-400" : matchReport.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                            {matchReport.score.toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Match Score</div>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                        <p className="text-slate-300 text-sm leading-relaxed">{matchReport.summary}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-3">Key Matches</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {matchReport.matching_keywords.map(k => (
                                                <Badge key={k} className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20">
                                                    {k}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-3">Missing / To Improve</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {matchReport.missing_keywords.map(k => (
                                                <Badge key={k} variant="outline" className="text-red-400 border-red-500/20 bg-red-500/5">
                                                    {k}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-800">
                                    <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-300 p-0 h-auto">
                                        Edit Job Description
                                    </Button>
                                </div>
                            </GlassCard>

                            {/* Right: Mirror Check */}
                            <div className="space-y-6">
                                <GlassCard className="p-6">
                                    <h2 className="text-xl font-semibold text-slate-200 mb-4">Mirror Check</h2>

                                    {/* Video Preview */}
                                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 mb-4 group">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover transform scale-x-[-1]"
                                        />

                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <div className={`p-2 rounded-full backdrop-blur-md ${hasCameraPermission ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                                    <Camera className="h-4 w-4" />
                                                </div>
                                                <div className={`p-2 rounded-full backdrop-blur-md ${hasMicPermission ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                                    <Mic className="h-4 w-4" />
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs text-slate-300">
                                                HD 1080p
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-slate-400">
                                            <span className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Audio Level</span>
                                            <span className="text-green-400">Good</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-green-500"
                                                animate={{ width: ["40%", "60%", "45%", "70%"] }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            />
                                        </div>
                                    </div>
                                </GlassCard>

                                <PulseButton
                                    size="lg"
                                    className="w-full h-16 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20"
                                    onClick={handleStartInterview}
                                    disabled={isLoading}
                                    pulse={!isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Preparing Room...
                                        </>
                                    ) : (
                                        <>
                                            Enter Interview Room <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </PulseButton>

                                <p className="text-center text-xs text-slate-500">
                                    By entering, you agree to be recorded for analysis purposes.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
