"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
    language: string;
    value: string;
    onChange: (value: string | undefined) => void;
    height?: string;
    readOnly?: boolean;
}

const LANGUAGE_DEFAULTS = {
    python: `def solution():
    # Write your code here
    pass`,
    javascript: `function solution() {
    // Write your code here
}`,
    java: `public class Solution {
    public void solution() {
        // Write your code here
    }
}`,
    cpp: `#include <iostream>
using namespace std;

void solution() {
    // Write your code here
}`
};

export function CodeEditor({
    language,
    value,
    onChange,
    height = "500px",
    readOnly = false
}: CodeEditorProps) {
    const [loading, setLoading] = useState(true);

    const handleEditorDidMount = () => {
        setLoading(false);
    };

    return (
        <div className="relative border border-slate-700 rounded-lg overflow-hidden">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            )}
            <Editor
                height={height}
                language={language}
                value={value}
                onChange={onChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    rulers: [],
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
        </div>
    );
}

export { LANGUAGE_DEFAULTS };
