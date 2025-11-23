"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Loader2, MessageCircle, History, ClipboardList } from "lucide-react";
import { JobCategorySelector } from "@/components/job-category-selector";
import { getAbilityMetaByDimensionName, getAbilityMetaByTag } from "@/lib/abilities";
import { useAuth } from "@/context/AuthContext";

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

interface QuestionDto {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  expected_keywords: string[];
}

interface ScoreDimensionDto {
  name: string;
  score: number;
  comment?: string | null;
}

interface SuggestedTaskDto {
  type: string;
  focus: string;
  suggested_duration_min: number;
}

interface InterviewReportDto {
  session_id: string;
  feedback: string;
  overall_score?: number | null;
  score?: number | null;
  dimensions?: ScoreDimensionDto[] | null;
  strength_tags?: string[] | null;
  risk_tags?: string[] | null;
  suggested_next_tasks?: SuggestedTaskDto[] | null;
}

import { Suspense } from "react";

function TextInterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");

  const [session, setSession] = useState<InterviewSessionDto | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "idle" | "created" | "ongoing" | "finished"
  >("idle");

  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answersCount, setAnswersCount] = useState(0);

  const [report, setReport] = useState<InterviewReportDto | null>(null);
  const [history, setHistory] = useState<InterviewSessionDto[]>([]);

  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMoreQuestions = currentIndex < questions.length;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/text-interview");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const jt = searchParams.get("jobTitle");
    const jd = searchParams.get("jobDescription");
    const rt = searchParams.get("resumeText");

    if (!jobTitle && jt) {
      setJobTitle(jt);
    }
    if (!jobDescription && jd) {
      setJobDescription(jd);
    }
    if (!resumeText && rt) {
      setResumeText(rt);
    }
  }, [searchParams, jobTitle, jobDescription, resumeText]);

  const loadHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<InterviewSessionDto[]>("/interview/sessions");
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load sessions history", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadHistory();
    }
  }, [isAuthenticated]);

  const handleStartInterview = async () => {
    if (!jobTitle.trim() && !jobDescription.trim()) {
      setError("请至少填写职位名称或岗位描述");
      return;
    }
    if (!resumeText.trim()) {
      setError("请提供简历摘要或自我介绍，用于生成面试问题");
      return;
    }

    setIsStarting(true);
    setError(null);
    setSession(null);
    setReport(null);
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setAnswersCount(0);

    try {
      // 1) 创建会话
      const createRes = await api.post<InterviewSessionDto>(
        "/interview/sessions",
        {
          job_title: jobTitle || null,
          job_description: jobDescription || null,
          interviewer_type: "Tech",
          duration_minutes: 30,
        }
      );
      const created = createRes.data;
      setSession(created);
      setSessionStatus("created");

      // 2) 开始会话
      const startRes = await api.post<InterviewSessionDto>(
        `/interview/sessions/${created.id}/start`
      );
      const started = startRes.data;
      setSession(started);
      setSessionStatus("ongoing");

      // 3) 生成问题
      const qRes = await api.post<QuestionDto[]>(
        "/interview/generate-questions",
        {
          resume_text: resumeText,
          job_description: jobDescription || jobTitle || "General software role",
          focus_area: "General interview",
        }
      );
      setQuestions(qRes.data || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
      setError("启动面试失败，请检查后端是否运行，或稍后重试。");
      setSessionStatus("idle");
    } finally {
      setIsStarting(false);
      void loadHistory();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !currentAnswer.trim() || !hasMoreQuestions) return;

    setIsSubmittingAnswer(true);
    setError(null);

    try {
      const q = questions[currentIndex];
      await api.post(
        `/interview/sessions/${session.id}/answers`,
        {
          question_id: q?.id,
          answer_text: currentAnswer,
        }
      );

      setAnswersCount((n) => n + 1);
      setCurrentAnswer("");
      setCurrentIndex((idx) => idx + 1);
    } catch (err) {
      console.error(err);
      setError("提交回答失败，请稍后重试。");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleFinishAndReport = async () => {
    if (!session) return;

    setIsFinishing(true);
    setError(null);

    try {
      // 结束会话
      const endRes = await api.post<InterviewSessionDto>(
        `/interview/sessions/${session.id}/end`
      );
      setSession(endRes.data);
      setSessionStatus("finished");

      // 获取报告
      const repRes = await api.get<InterviewReportDto>(
        `/interview/sessions/${session.id}/report`
      );
      setReport(repRes.data);
    } catch (err) {
      console.error(err);
      setError("生成面试报告失败，请稍后重试。");
    } finally {
      setIsFinishing(false);
      void loadHistory();
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-blue-600" />
              文字版模拟面试房间
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              填写目标岗位与简历摘要，系统会为你生成一轮结构化的文字面试问题，并在结束后给出 AI 面试报告。
            </p>
          </div>

          {/* 基本信息与启动区 */}
          <Card>
            <CardHeader>
              <CardTitle>1. 面试配置</CardTitle>
              <CardDescription>配置本次模拟面试的目标岗位与简历摘要。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  目标职位名称
                </label>
                <JobCategorySelector
                  value={jobTitle}
                  onChange={(title: string) => setJobTitle(title)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  岗位描述 / JD（可粘贴招聘信息）
                </label>
                <Textarea
                  className="min-h-[80px] text-sm"
                  placeholder="粘贴职位 JD 或简要描述岗位职责与要求"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  简历摘要 / 自我介绍（用于生成问题）
                </label>
                <Textarea
                  className="min-h-[120px] text-sm font-mono"
                  placeholder="概括你的教育、项目经历、实习或竞赛情况；也可以直接粘贴简历正文。"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                <div className="text-xs text-slate-500">
                  后端地址：<span className="font-mono">{API_BASE_URL}</span>
                </div>
                <Button
                  onClick={handleStartInterview}
                  disabled={isStarting}
                  className="w-full sm:w-auto"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      正在启动面试...
                    </>
                  ) : (
                    <>开始文字面试</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>操作失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 问题与作答区 */}
          <Card className="mt-2">
            <CardHeader>
              <CardTitle>2. 实时问答</CardTitle>
              <CardDescription>
                系统将按顺序展示问题，请用文字作答。你可以在任意时刻结束本轮面试并生成报告。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionStatus === "ongoing" && questions.length > 0 && hasMoreQuestions && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      当前进度：第 {currentIndex + 1} / {questions.length} 题，已提交 {answersCount} 个回答
                    </span>
                    <Badge variant="outline">会话 ID: {session?.id.slice(0, 8)}...</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      当前问题
                    </div>
                    <Card className="border-blue-100 bg-blue-50/40 dark:bg-blue-950/10 dark:border-blue-900">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            Question {currentIndex + 1}
                          </CardTitle>
                          <div className="flex gap-2 text-[10px]">
                            <Badge variant="outline">{questions[currentIndex].type}</Badge>
                            <Badge>{questions[currentIndex].difficulty}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-800 dark:text-slate-200">
                          {questions[currentIndex].content}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      你的回答
                    </div>
                    <Textarea
                      className="min-h-[120px] text-sm"
                      placeholder="请用文字作答，可以像真实面试一样完整表达你的思路。"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={handleFinishAndReport}
                      disabled={isFinishing}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      {isFinishing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          正在生成报告...
                        </>
                      ) : (
                        <>结束本轮面试并生成报告</>
                      )}
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={
                        isSubmittingAnswer || !currentAnswer.trim() || !hasMoreQuestions
                      }
                      className="w-full sm:w-auto order-1 sm:order-2"
                    >
                      {isSubmittingAnswer ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          正在提交回答...
                        </>
                      ) : (
                        <>提交本题回答</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {sessionStatus === "ongoing" && questions.length > 0 && !hasMoreQuestions && (
                <p className="text-sm text-slate-600">
                  已经没有更多预设问题，你可以继续回顾自己的回答，或者点击下方按钮结束本轮面试并生成报告。
                </p>
              )}

              {sessionStatus === "idle" && (
                <p className="text-sm text-slate-500">
                  配置好面试信息后，点击上方的“开始文字面试”按钮即可开始。
                </p>
              )}
            </CardContent>
          </Card>

          {/* 报告区 */}
          {report && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10 dark:border-emerald-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  3. 本轮面试报告
                </CardTitle>
                <CardDescription>
                  以下为 AI 基于你本轮回答生成的总结与建议，可作为复盘与练习参考。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {typeof report.overall_score === "number" && (
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                      {report.overall_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500">
                      综合表现分（0-100），基于结构化表达、表达清晰度与反思意识等维度的加权结果。
                    </div>
                  </div>
                )}

                {report.dimensions && report.dimensions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      维度评分
                    </div>
                    <div className="space-y-1">
                      {report.dimensions.map((dim) => (
                        (() => {
                          const meta = getAbilityMetaByDimensionName(dim.name);
                          return (
                        <div
                          key={dim.name}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-xs gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {meta?.name || dim.name}
                            </span>
                            {meta && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {meta.shortDescription}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:justify-end">
                            <span className="font-mono text-slate-700 dark:text-slate-200">
                              {dim.score.toFixed(1)} / 100
                            </span>
                          </div>
                          {dim.comment && (
                            <div className="text-slate-500 dark:text-slate-400 sm:col-span-2">
                              {dim.comment}
                            </div>
                          )}
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                )}

                {(report.strength_tags && report.strength_tags.length > 0) ||
                  (report.risk_tags && report.risk_tags.length > 0) ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {report.strength_tags && report.strength_tags.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          本场亮点
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {report.strength_tags.map((tag) => (
                            (() => {
                              const meta = getAbilityMetaByTag(tag);
                              return (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="border-emerald-300 text-emerald-800 dark:text-emerald-200"
                                  title={meta?.shortDescription}
                                >
                                  {meta?.name || tag}
                                </Badge>
                              );
                            })()
                          ))}
                        </div>
                      </div>
                    )}
                    {report.risk_tags && report.risk_tags.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-rose-700 dark:text-rose-300">
                          需要注意的地方
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {report.risk_tags.map((tag) => (
                            (() => {
                              const meta = getAbilityMetaByTag(tag);
                              return (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="border-rose-300 text-rose-800 dark:text-rose-200"
                                  title={meta?.shortDescription}
                                >
                                  {meta?.name || tag}
                                </Badge>
                              );
                            })()
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {report.suggested_next_tasks && report.suggested_next_tasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      建议的下一步训练
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 dark:text-slate-200">
                      {report.suggested_next_tasks.map((task, idx) => (
                        <li key={`${task.focus}-${idx}`}>
                          <span className="font-medium">{task.focus}</span>
                          <span className="ml-1 text-slate-500">· {task.suggested_duration_min} 分钟练习</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    详细文字反馈
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 font-sans">
                    {report.feedback}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：历史会话列表 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                历史面试记录
              </CardTitle>
              <CardDescription>最近的文字版模拟面试会话（按开始时间倒序）。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[480px] overflow-y-auto">
              {history.length === 0 && (
                <p className="text-xs text-slate-500">
                  暂无历史记录。完成一轮模拟面试后，这里会展示最近的会话。
                </p>
              )}

              {history.map((s) => (
                <div
                  key={s.id}
                  className="border rounded-md p-3 text-xs flex flex-col gap-1 bg-white/70 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {s.job_title || "未命名职位"}
                    </span>
                    <Badge
                      className={
                        s.status === "finished"
                          ? "bg-emerald-500"
                          : s.status === "ongoing"
                            ? "bg-blue-500"
                            : "bg-slate-400"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <div className="text-slate-500">
                    {s.started_at
                      ? new Date(s.started_at).toLocaleString()
                      : "尚未开始"}
                  </div>
                  {s.job_description && (
                    <div className="text-slate-500 line-clamp-2">
                      {s.job_description}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function TextInterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TextInterviewContent />
    </Suspense>
  );
}
