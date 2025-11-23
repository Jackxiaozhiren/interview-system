"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

function MockLoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const provider = searchParams.get("provider");
    const { login } = useAuth();

    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

    const handleAuthorize = async () => {
        setStatus("processing");
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Call backend callback to get token
            // In a real flow, the provider would redirect back to our backend, which would then redirect to frontend with token
            // Here we simulate the callback directly
            const response = await api.get(`/auth/callback/${provider}?code=mock_code`);

            await login(response.data.access_token);

            setStatus("success");
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error) {
            console.error("Login failed", error);
            setStatus("idle");
        }
    };

    const getProviderColor = () => {
        switch (provider) {
            case "github": return "bg-gray-900 hover:bg-gray-800";
            case "google": return "bg-red-500 hover:bg-red-600";
            case "wechat": return "bg-green-500 hover:bg-green-600";
            default: return "bg-blue-500";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                        <ShieldCheck className="h-6 w-6" />
                        {provider} Login (Mock)
                    </CardTitle>
                    <CardDescription>
                        Authorize <strong>Windsurf Interview System</strong> to access your account?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                        This is a mock consent screen. No real data will be shared.
                    </div>

                    {status === "success" ? (
                        <div className="text-center space-y-2 text-green-600 animate-in fade-in zoom-in">
                            <p className="font-medium">Authorization Successful!</p>
                            <p className="text-sm text-gray-500">Redirecting...</p>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
                                Cancel
                            </Button>
                            <Button
                                className={`w-full ${getProviderColor()}`}
                                onClick={handleAuthorize}
                                disabled={status === "processing"}
                            >
                                {status === "processing" ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Authorizing...
                                    </>
                                ) : (
                                    "Authorize"
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function MockLoginPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <MockLoginContent />
        </Suspense>
    );
}
