"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import PricingCard from '@/components/PricingCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Package {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string;
    currency: string;
}

export default function PricingPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const response = await api.get("/payment/packages");
                setPackages(response.data);
            } catch (error) {
                console.error("Failed to fetch packages", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handleSelectPackage = (pkg: Package) => {
        if (!isAuthenticated) {
            router.push("/login?redirect=/pricing");
            return;
        }
        setSelectedPackage(pkg);
        setIsPaymentModalOpen(true);
    };

    const handlePayment = async (method: "alipay" | "wechat") => {
        if (!selectedPackage) return;
        setProcessingId(selectedPackage.id);
        setIsPaymentModalOpen(false);

        try {
            const endpoint = method === "alipay" ? "/payment/create/alipay" : "/payment/create/wechat";
            const response = await api.post(`${endpoint}?package_id=${selectedPackage.id}`);

            // Redirect to payment URL (Mock or Real)
            window.location.href = response.data.payment_url;
        } catch (error) {
            console.error("Payment creation failed", error);
            setProcessingId(null);
            alert("Failed to initiate payment. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                        Choose the plan that best fits your interview preparation needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
                    {packages.map((pkg) => (
                        <PricingCard
                            key={pkg.id}
                            title={pkg.name}
                            price={pkg.price}
                            currency={pkg.currency}
                            description={pkg.description || ""}
                            features={pkg.features ? pkg.features.split(",") : []}
                            isPopular={pkg.name === "Standard"}
                            onSelect={() => handleSelectPackage(pkg)}
                            isLoading={processingId === pkg.id}
                        />
                    ))}
                </div>
            </div>

            {/* Payment Method Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Select Payment Method</h3>
                        <p className="text-gray-500 mb-6">Choose how you would like to pay for <strong>{selectedPackage?.name}</strong>.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePayment("alipay")}
                                className="w-full flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <span className="font-medium text-gray-700 group-hover:text-blue-700">Alipay</span>
                                <span className="text-blue-500">Pay with Alipay</span>
                            </button>

                            <button
                                onClick={() => handlePayment("wechat")}
                                className="w-full flex items-center justify-between p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                            >
                                <span className="font-medium text-gray-700 group-hover:text-green-700">WeChat Pay</span>
                                <span className="text-green-500">Pay with WeChat</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
