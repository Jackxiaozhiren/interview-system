"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PricingCardProps {
    title: string;
    price: number;
    currency?: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    onSelect: () => void;
    isLoading?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    currency = "CNY",
    description,
    features,
    isPopular = false,
    onSelect,
    isLoading = false,
}) => {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            className={cn(
                "relative flex flex-col p-6 bg-white rounded-2xl shadow-lg border transition-all duration-300",
                isPopular ? "border-blue-500 shadow-blue-100 ring-1 ring-blue-500" : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
            )}
        >
            {isPopular && (
                <div className="absolute top-0 right-0 px-3 py-1 -mt-3 mr-3 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm">
                    Most Popular
                </div>
            )}

            <div className="mb-5">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500">{description}</p>
            </div>

            <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">
                    {currency === "CNY" ? "¥" : "$"}
                    {(price / 100).toFixed(2)}
                </span>
                <span className="text-base font-medium text-gray-500">/lifetime</span>
            </div>

            <ul className="flex-1 mb-8 space-y-4">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                            <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                    </li>
                ))}
            </ul>

            <button
                onClick={onSelect}
                disabled={isLoading}
                className={cn(
                    "w-full px-4 py-3 text-sm font-semibold text-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isPopular
                        ? "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg"
                        : "text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500"
                )}
            >
                {isLoading ? "Processing..." : "Get Started"}
            </button>
        </motion.div>
    );
};

export default PricingCard;
