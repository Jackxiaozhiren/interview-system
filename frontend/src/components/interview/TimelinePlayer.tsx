"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export interface TimelineEvent {
    id: string;
    timestamp: number; // seconds
    type: "positive" | "negative" | "neutral";
    label: string;
    description?: string;
}

interface TimelinePlayerProps {
    videoUrl: string;
    events: TimelineEvent[];
}

export function TimelinePlayer({ videoUrl, events }: TimelinePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const onEnded = () => setIsPlaying(false);

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);
        video.addEventListener("ended", onEnded);

        return () => {
            video.removeEventListener("timeupdate", updateTime);
            video.removeEventListener("loadedmetadata", updateDuration);
            video.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.volume = value[0];
            setVolume(value[0]);
            setIsMuted(value[0] === 0);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const getEventColor = (type: TimelineEvent["type"]) => {
        switch (type) {
            case "positive": return "bg-green-500";
            case "negative": return "bg-red-500";
            default: return "bg-blue-500";
        }
    };

    return (
        <div className="space-y-4">
            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl group">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onClick={togglePlay}
                />

                {/* Overlay Controls (Visible on Hover) */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {!isPlaying && <div className="p-4 bg-white/10 backdrop-blur-md rounded-full"><Play className="w-8 h-8 text-white fill-current" /></div>}
                </div>
            </div>

            {/* Controls & Timeline */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">

                {/* Timeline Slider with Markers */}
                <div className="relative mb-4 h-8 flex items-center">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="z-10"
                    />

                    {/* Event Markers */}
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-900 cursor-pointer hover:scale-150 transition-transform z-20 ${getEventColor(event.type)}`}
                            style={{ left: `${(event.timestamp / duration) * 100}%` }}
                            title={`${formatTime(event.timestamp)} - ${event.label}`}
                            onClick={() => handleSeek([event.timestamp])}
                        />
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={togglePlay} className="text-slate-300 hover:text-white">
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSeek([0])} className="text-slate-300 hover:text-white">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 ml-2 group relative">
                            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-slate-300 hover:text-white">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </Button>
                            <div className="w-24 hidden group-hover:block absolute left-full ml-2">
                                <Slider value={[isMuted ? 0 : volume]} max={1} step={0.1} onValueChange={handleVolumeChange} />
                            </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400 ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Event Legend */}
                    <div className="flex gap-2 text-xs">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Strength</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Improvement</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
