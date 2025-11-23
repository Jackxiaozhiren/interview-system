"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token found.");
            return;
        }

        const verifyEmail = async () => {
            try {
                await api.post(`/auth/verify-email?token=${token}`);
                setStatus("success");
            } catch (error: any) {
                setStatus("error");
                setMessage(error.response?.data?.detail || "Verification failed. The token may be invalid or expired.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Email Verification</CardTitle>
                <CardDescription>Verifying your email address...</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                {status === "verifying" && (
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                )}
                {status === "success" && (
                    <>
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="text-center text-green-600">Email verified successfully!</p>
                        <Button className="w-full" onClick={() => router.push("/login")}>
                            Go to Login
                        </Button>
                    </>
                )}
                {status === "error" && (
                    <>
                        <XCircle className="h-12 w-12 text-red-500" />
                        <p className="text-center text-red-600">{message}</p>
                        <Button variant="outline" className="w-full" onClick={() => router.push("/register")}>
                            Back to Register
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerifyPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
