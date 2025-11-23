"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeedbackMarker {
    timestamp: number; // in seconds
    type: "positive" | "negative" | "neutral";
    message: string;
}

interface TimelinePlayerProps {
    mediaUrl: string;
    transcript?: string;
    feedbackMarkers?: FeedbackMarker[];
}

export function TimelinePlayer({ mediaUrl, transcript, feedbackMarkers = [] }: TimelinePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const jumpToTime = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            if (!isPlaying) {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player Section */}
            <div className="lg:col-span-2 space-y-4">
                <Card className="overflow-hidden bg-black border-slate-800">
                    <div className="relative aspect-video">
                        <video
                            ref={videoRef}
                            src={mediaUrl}
                            className="w-full h-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                        />
                        {/* Overlay Controls (optional, can be improved) */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4 text-white">
                                <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                                </Button>
                                <span className="text-sm font-mono">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    value={currentTime}
                                    onChange={(e) => jumpToTime(parseFloat(e.target.value))}
                                    className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Timeline Markers */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Feedback Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative h-12 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 cursor-pointer"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percentage = x / rect.width;
                                jumpToTime(percentage * duration);
                            }}>
                            {/* Progress Bar */}
                            <div
                                className="absolute top-0 left-0 h-full bg-blue-100 dark:bg-blue-900/30 rounded-l-lg transition-all duration-100 pointer-events-none"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />

                            {/* Markers */}
                            {feedbackMarkers.map((marker, idx) => (
                                <div
                                    key={idx}
                                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform
                    ${marker.type === 'positive' ? 'bg-green-500' : marker.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                    style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                                    title={`${formatTime(marker.timestamp)}: ${marker.message}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        jumpToTime(marker.timestamp);
                                    }}
                                />
                            ))}
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {feedbackMarkers.map((marker, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${Math.abs(currentTime - marker.timestamp) < 2 ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200' : ''}`}
                                    onClick={() => jumpToTime(marker.timestamp)}
                                >
                                    <Badge variant="outline" className="font-mono shrink-0">{formatTime(marker.timestamp)}</Badge>
                                    <div className="text-sm">
                                        <p className={`font-medium ${marker.type === 'positive' ? 'text-green-600' : marker.type === 'negative' ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {marker.type === 'positive' ? 'Strength' : marker.type === 'negative' ? 'Improvement' : 'Note'}
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-300">{marker.message}</p>
                                    </div>
                                </div>
                            ))}
                            {feedbackMarkers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No specific timeline feedback available.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transcript Section */}
            <div className="lg:col-span-1 h-full">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Transcript
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {transcript ? (
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {transcript}
                            </p>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                                <p>Transcript not available.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
