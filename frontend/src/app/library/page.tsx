"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Search, Star, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface SavedAnswer {
    id: string;
    question: string;
    answer: string;
    category: string;
    created_at: string;
}

export default function AnswerLibraryPage() {
    const [answers, setAnswers] = useState<SavedAnswer[]>([]);
    const [filteredAnswers, setFilteredAnswers] = useState<SavedAnswer[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isAddingNew, setIsAddingNew] = useState(false);

    // New answer form
    const [newQuestion, setNewQuestion] = useState("");
    const [newAnswer, setNewAnswer] = useState("");
    const [newCategory, setNewCategory] = useState("behavioral");

    useEffect(() => {
        fetchAnswers();
    }, []);

    useEffect(() => {
        filterAnswers();
    }, [answers, searchQuery, selectedCategory]);

    const fetchAnswers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/copilot/answers`);
            setAnswers(res.data);
        } catch (err) {
            console.error("Failed to fetch answers", err);
        }
    };

    const filterAnswers = () => {
        let filtered = answers;

        if (selectedCategory !== "all") {
            filtered = filtered.filter(a => a.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(a =>
                a.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.answer.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredAnswers(filtered);
    };

    const saveAnswer = async () => {
        if (!newQuestion.trim() || !newAnswer.trim()) return;

        try {
            await axios.post(`${API_BASE_URL}/copilot/answers`, {
                question: newQuestion,
                answer: newAnswer,
                category: newCategory
            });

            setNewQuestion("");
            setNewAnswer("");
            setIsAddingNew(false);
            fetchAnswers();
        } catch (err) {
            console.error("Failed to save answer", err);
        }
    };

    const deleteAnswer = async (id: string) => {
        // Note: Delete endpoint not implemented in backend yet
        // For now, just filter locally
        setAnswers(prev => prev.filter(a => a.id !== id));
    };

    const categories = ["all", "behavioral", "technical", "company-specific", "other"];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-blue-400" />
                                Answer Library
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Your personal repository of interview answers
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsAddingNew(!isAddingNew)}
                            className="bg-blue-600 hover:bg-blue-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Answer
                        </Button>
                    </div>
                </motion.div>

                {/* Add New Answer Form */}
                {isAddingNew && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                    >
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Add New Answer</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Question</label>
                                    <Input
                                        placeholder="e.g., Tell me about yourself"
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        className="bg-slate-900 border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Your Answer (STAR format recommended)</label>
                                    <Textarea
                                        placeholder="Situation: ...\nTask: ...\nAction: ...\nResult: ..."
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        className="min-h-[200px] bg-slate-900 border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Category</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                                    >
                                        <option value="behavioral">Behavioral</option>
                                        <option value="technical">Technical</option>
                                        <option value="company-specific">Company-Specific</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={saveAnswer} className="bg-green-600 hover:bg-green-500">
                                        Save Answer
                                    </Button>
                                    <Button onClick={() => setIsAddingNew(false)} variant="outline">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Search & Filter */}
                <GlassCard className="p-4 mb-6">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Search questions or answers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900 border-slate-700"
                            />
                        </div>
                        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
                            <TabsList className="bg-slate-900">
                                {categories.map(cat => (
                                    <TabsTrigger key={cat} value={cat} className="capitalize">
                                        {cat}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </GlassCard>

                {/* Answers List */}
                <ScrollArea className="h-[600px]">
                    {filteredAnswers.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-slate-500 text-lg">No answers yet</p>
                            <p className="text-slate-600 text-sm mt-2">
                                {searchQuery || selectedCategory !== "all"
                                    ? "Try adjusting your filters"
                                    : "Start building your library by adding your first answer"}
                            </p>
                        </GlassCard>
                    ) : (
                        <div className="space-y-4">
                            {filteredAnswers.map((answer, idx) => (
                                <motion.div
                                    key={answer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <GlassCard className="p-6 hover:border-blue-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-200 mb-2">
                                                    {answer.question}
                                                </h3>
                                                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                                                    {answer.category}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteAnswer(answer.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                                            {answer.answer}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-4">
                                            Added {new Date(answer.created_at).toLocaleDateString()}
                                        </p>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
