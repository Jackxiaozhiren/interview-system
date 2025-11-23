import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
    audioUrl: string;
    autoPlay?: boolean;
    onEnded?: () => void;
    className?: string;
}

export function AudioPlayer({ audioUrl, autoPlay = false, onEnded, className }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            if (onEnded) onEnded();
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("ended", handleEnded);

        if (autoPlay) {
            audio.play().then(() => setIsPlaying(true)).catch(console.error);
        }

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [audioUrl, autoPlay, onEnded]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().then(() => setIsPlaying(true)).catch(console.error);
        }
    };

    const handleRestart = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
    };

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className={`flex items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Play/Pause Button */}
            <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayPause}
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            {/* Restart Button */}
            <Button
                size="icon"
                variant="ghost"
                onClick={handleRestart}
                className="h-8 w-8 text-slate-400 hover:text-white"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Progress Display */}
            <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-24">
                <Volume2 className="h-4 w-4 text-slate-400" />
                <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                />
            </div>
        </div>
    );
}
