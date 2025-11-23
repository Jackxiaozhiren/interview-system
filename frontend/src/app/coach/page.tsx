"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Lightbulb, TrendingUp, BookOpen, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface Suggestion {
  weak_areas: string[];
  strong_areas: string[];
  recommendations: string[];
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Fetch personalized suggestions on load
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/copilot/suggestions`);
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/copilot/chat`, {
        message: input,
        conversation_id: conversationId
      });

      const aiMessage: Message = {
        role: "assistant",
        content: res.data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationId(res.data.conversation_id);
    } catch (err) {
      console.error("Chat failed", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_350px] gap-8">

        {/* Main Chat Area */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-400" />
              AI Interview Coach
            </h1>
            <p className="text-slate-400 mt-2">
              Your 24/7 personal interview mentor. Ask anything!
            </p>
          </motion.div>

          <GlassCard className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Start a conversation to get personalized coaching!</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-xl mx-auto">
                    {[
                      "How do I answer 'Tell me about yourself'?",
                      "What's the STAR method?",
                      "Tips for technical interviews?",
                      "How to handle salary questions?"
                    ].map(q => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(q)}
                        className="text-xs text-left h-auto py-3 px-4 border-slate-700 hover:border-blue-500 hover:bg-blue-500/10"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-200 border border-slate-700"
                        }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-4"
                >
                  <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-slate-400 text-sm">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Ask me anything about interviews..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="min-h-[60px] bg-slate-900 border-slate-700 focus:border-blue-500 resize-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-500 px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar: Suggestions & Actions */}
        <div className="space-y-6">
          {/* Personalized Suggestions */}
          {suggestions && (
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">Your Focus Areas</h3>
              </div>

              {suggestions.weak_areas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase mb-2">Improve</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.weak_areas.map(area => (
                      <Badge key={area} variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.strong_areas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.strong_areas.map(area => (
                      <Badge key={area} variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Tips</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  {suggestions.recommendations.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          )}

          {/* Quick Actions */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction("Generate practice questions for Software Engineer at Google")}
              >
                Generate Practice Questions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction("Help me draft an answer using STAR method")}
              >
                Draft STAR Answer
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction("Review my past interviews and suggest improvements")}
              >
                Analyze My History
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
