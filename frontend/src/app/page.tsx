"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PulseButton } from "@/components/ui/pulse-button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Play, Layout, Settings, LogOut, Plus, History } from "lucide-react";
import { SkillTreeWidget } from "@/components/dashboard/SkillTreeWidget";
import { DailyDrillCard } from "@/components/dashboard/DailyDrillCard";
import { API_BASE_URL } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";

export default function DashboardPage() {
  const router = useRouter();
  const [showNewSession, setShowNewSession] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleStartSession = () => {
    // In a real app, we'd save the resume context here or pass it via query params
    // For now, we'll just redirect to the setup page which we built in Phase 2
    router.push("/interview/setup");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 flex">

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 hidden md:flex flex-col p-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white">
            AI
          </div>
          <span className="font-bold text-lg tracking-tight">Interview.ai</span>
        </div>

        <nav className="space-y-2 flex-1">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/5">
            <Layout className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/5">
            <History className="mr-2 h-4 w-4" /> History
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/5">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">The Locker Room</h1>
            <p className="text-slate-400 text-sm">Welcome back, Candidate. Ready to train?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">System Online</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="font-bold text-sm">JD</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Main Actions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero / Start New Session */}
            <GlassCard className="p-8 bg-gradient-to-r from-blue-900/40 to-slate-900/40 border-blue-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-4">Start New Interview</h2>
                <p className="text-slate-300 mb-8 max-w-lg">
                  Upload your resume and job description to generate a personalized, AI-driven mock interview session.
                </p>
                <div className="flex gap-4">
                  <PulseButton
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-lg shadow-xl shadow-blue-900/20"
                    onClick={handleStartSession}
                    pulse={true}
                  >
                    <Plus className="mr-2 h-5 w-5" /> New Session
                  </PulseButton>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:bg-white/5 py-6">
                    Upload Resume
                  </Button>
                </div>
              </div>
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            </GlassCard>

            {/* Daily Drill */}
            <DailyDrillCard />

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Recent Matches</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <GlassCard key={i} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200">Software Engineer Interview</h4>
                        <p className="text-xs text-slate-500">2 days ago • 15 mins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">85/100</div>
                        <div className="text-xs text-green-400">+5% vs avg</div>
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400">Review</Badge>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Progress */}
          <div className="space-y-6">
            <SkillTreeWidget />

            {/* Streak Widget */}
            <GlassCard className="p-6 bg-slate-900/50 border-slate-800 text-center">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Current Streak</h3>
              <div className="text-4xl font-bold text-white mb-1">3 Days</div>
              <p className="text-xs text-slate-500">Keep it up! 4 more days to a weekly badge.</p>
              <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={`w-2 h-2 rounded-full ${day <= 3 ? "bg-green-500" : "bg-slate-800"}`}
                  />
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
