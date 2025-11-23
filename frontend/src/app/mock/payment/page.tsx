"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import api from "@/lib/api";

function MockPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const method = searchParams.get("method");
    const orderId = searchParams.get("order_id");
    const amount = searchParams.get("amount"); // In cents

    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

    const handlePayment = async () => {
        setStatus("processing");
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Call backend to update order status
            await api.post(`/payment/notify/mock?order_id=${orderId}`);

            setStatus("success");
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (error) {
            console.error("Payment failed", error);
            setStatus("idle");
        }
    };

    const formatPrice = (cents: string | null) => {
        if (!cents) return "0.00";
        return (parseInt(cents) / 100).toFixed(2);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {method === "alipay" ? (
                            <span className="text-blue-500">Alipay (Mock)</span>
                        ) : (
                            <span className="text-green-500">WeChat Pay (Mock)</span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Simulating external payment gateway
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Order Amount</p>
                        <p className="text-3xl font-bold">¥{formatPrice(amount)}</p>
                    </div>

                    {status === "success" ? (
                        <div className="text-center space-y-2 text-green-600 animate-in fade-in zoom-in">
                            <CheckCircle className="h-16 w-16 mx-auto" />
                            <p className="font-medium">Payment Successful!</p>
                            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <Button
                            className={`w-full h-12 text-lg ${method === "alipay" ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
                                }`}
                            onClick={handlePayment}
                            disabled={status === "processing"}
                        >
                            {status === "processing" ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm Payment"
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function MockPaymentPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <MockPaymentContent />
        </Suspense>
    );
}
