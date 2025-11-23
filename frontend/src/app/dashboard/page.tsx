"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getAbilityMetaByDimensionName, getAbilityMetaByTag } from "@/lib/abilities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface InterviewSession {
    id: string;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    job_title: string;
    duration_minutes: number;
}

interface Order {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    package_id: string;
}

interface ScoreDimension {
    name: string;
    score: number;
}

interface AbilityOverview {
    sessionCount: number;
    dimensionAverages: ScoreDimension[];
    topRisks: string[];
}

interface AbilityTrendPoint {
    sessionId: string;
    label: string;
    scores: { [dimensionName: string]: number };
}

export default function DashboardPage() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [abilityOverview, setAbilityOverview] = useState<AbilityOverview | null>(null);
    const [abilityTrend, setAbilityTrend] = useState<AbilityTrendPoint[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        interface InterviewEvaluationDto {
            session_id: string;
            feedback: string;
            overall_score?: number | null;
            score?: number | null;
            dimensions?: { name: string; score: number; comment?: string | null }[] | null;
            strength_tags?: string[] | null;
            risk_tags?: string[] | null;
            suggested_next_tasks?: { type: string; focus: string; suggested_duration_min: number }[] | null;
        }

        const fetchData = async () => {
            try {
                const [sessionsRes, ordersRes] = await Promise.all([
                    api.get<InterviewSession[]>("/interview/sessions"),
                    api.get<Order[]>("/payment/orders"),
                ]);
                const sessionsData = sessionsRes.data;
                setSessions(sessionsData);
                setOrders(ordersRes.data);

                const finishedSessions = sessionsData.filter((s) => s.status === "finished");
                const targetSessions = finishedSessions.slice(0, 5);

                const reports: InterviewEvaluationDto[] = [];
                const trendPoints: AbilityTrendPoint[] = [];
                for (const s of targetSessions) {
                    try {
                        const repRes = await api.get<InterviewEvaluationDto>(
                            `/interview/sessions/${s.id}/report`
                        );
                        const rep = repRes.data;
                        reports.push(rep);

                        const label = s.started_at
                            ? new Date(s.started_at).toLocaleDateString()
                            : `Session ${s.id.slice(0, 4)}`;
                        const scores: { [dimensionName: string]: number } = {};
                        if (rep.dimensions) {
                            for (const dim of rep.dimensions) {
                                if (typeof dim.score === "number") {
                                    scores[dim.name] = dim.score;
                                }
                            }
                        }
                        trendPoints.push({ sessionId: s.id, label, scores });
                    } catch (err) {
                        console.error("Failed to fetch session report", err);
                    }
                }

                if (reports.length > 0) {
                    const dimMap = new Map<string, { total: number; count: number }>();
                    const riskCount = new Map<string, number>();

                    for (const report of reports) {
                        if (report.dimensions) {
                            for (const dim of report.dimensions) {
                                if (typeof dim.score !== "number") continue;
                                const prev = dimMap.get(dim.name) || { total: 0, count: 0 };
                                prev.total += dim.score;
                                prev.count += 1;
                                dimMap.set(dim.name, prev);
                            }
                        }
                        if (report.risk_tags) {
                            for (const tag of report.risk_tags) {
                                const prev = riskCount.get(tag) || 0;
                                riskCount.set(tag, prev + 1);
                            }
                        }
                    }

                    const dimensionAverages: ScoreDimension[] = Array.from(dimMap.entries()).map(
                        ([name, value]) => ({
                            name,
                            score: value.count > 0 ? value.total / value.count : 0,
                        })
                    );

                    dimensionAverages.sort((a, b) => b.score - a.score);

                    const topRisks = Array.from(riskCount.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([tag]) => tag)
                        .slice(0, 5);

                    setAbilityOverview({
                        sessionCount: reports.length,
                        dimensionAverages: dimensionAverages.slice(0, 5),
                        topRisks,
                    });
                    setAbilityTrend(trendPoints.reverse());
                } else {
                    setAbilityOverview(null);
                    setAbilityTrend([]);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, router]);

    const topTrendDimensions = abilityOverview
        ? abilityOverview.dimensionAverages.slice(0, 3).map((d) => d.name)
        : [];

    const abilityTrendData =
        abilityTrend.length > 0 && topTrendDimensions.length > 0
            ? abilityTrend.map((point) => {
                  const row: { [key: string]: string | number } = { label: point.label };
                  for (const name of topTrendDimensions) {
                      const val = point.scores[name];
                      if (typeof val === "number") {
                          row[name] = val;
                      }
                  }
                  return row;
              })
            : [];

    const recommendedAbilities = abilityOverview
        ? abilityOverview.topRisks
              .map((tag) => getAbilityMetaByTag(tag))
              .filter((meta) => meta && meta.hint)
        : [];

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {user?.full_name}</h1>
                    <p className="text-gray-500">{user?.email}</p>
                </div>
                <div className="space-x-4">
                    <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0" onClick={() => router.push("/pricing")}>
                        Upgrade Plan
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/")}>
                        Home
                    </Button>
                    <Button variant="destructive" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </div>

            {abilityOverview && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Ability Overview</CardTitle>
                        <CardDescription>
                            Based on your last {abilityOverview.sessionCount} finished interviews.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {abilityOverview.dimensionAverages.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Average scores by dimension</p>
                                <div className="space-y-1">
                                    {abilityOverview.dimensionAverages.map((dim) => (
                                        (() => {
                                            const meta = getAbilityMetaByDimensionName(dim.name);
                                            return (
                                                <div key={dim.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-0.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-700 font-medium">
                                                            {meta?.name || dim.name}
                                                        </span>
                                                        {meta?.shortDescription && (
                                                            <span className="text-[11px] text-gray-500">
                                                                {meta.shortDescription}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-mono text-gray-900 sm:text-right">
                                                        {dim.score.toFixed(1)}
                                                    </span>
                                                </div>
                                            );
                                        })()
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Complete a few interviews to see ability trends.
                            </p>
                        )}

                        {abilityOverview.topRisks.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Most frequent risk areas</p>
                                <div className="flex flex-wrap gap-2">
                                    {abilityOverview.topRisks.map((tag) => (
                                        (() => {
                                            const meta = getAbilityMetaByTag(tag);
                                            return (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
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

                        {abilityTrendData.length > 1 && topTrendDimensions.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Ability trends over recent sessions</p>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={abilityTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="label" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend />
                                            {topTrendDimensions.map((name, idx) => {
                                                const meta = getAbilityMetaByDimensionName(name);
                                                const colors = ["#2563eb", "#10b981", "#f97316"];
                                                return (
                                                    <Line
                                                        key={name}
                                                        type="monotone"
                                                        dataKey={name}
                                                        name={meta?.name || name}
                                                        stroke={colors[idx % colors.length]}
                                                        strokeWidth={2}
                                                        dot={{ r: 2 }}
                                                    />
                                                );
                                            })}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {recommendedAbilities && recommendedAbilities.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Recommended training focus</p>
                                <ul className="space-y-1 text-xs text-gray-700">
                                    {recommendedAbilities.map((meta, idx) => (
                                        <li key={meta?.id ?? idx} className="flex flex-col">
                                            <span className="font-medium">{meta?.name}</span>
                                            {meta?.hint && (
                                                <span className="text-[11px] text-gray-500">{meta.hint}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Interview History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Interview History</CardTitle>
                        <CardDescription>Your past interview sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <p className="text-gray-500">No interviews yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div key={session.id} className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <p className="font-medium">{session.job_title}</p>
                                            <p className="text-sm text-gray-500">
                                                {session.started_at ? new Date(session.started_at).toLocaleDateString() : "Not started"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={session.status === "finished" ? "secondary" : "default"}>
                                                {session.status}
                                            </Badge>
                                            {session.status === "ongoing" && (
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/interview/${session.id}`)}>
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button className="w-full mt-4" onClick={() => router.push("/interview/setup")}>
                            Start New Interview
                        </Button>
                    </CardContent>
                </Card>

                {/* Order History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order History</CardTitle>
                        <CardDescription>Your purchase history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {orders.length === 0 ? (
                            <p className="text-gray-500">No orders yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{(order.amount / 100).toFixed(2)} CNY</p>
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/pricing")}>
                            View Packages
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
