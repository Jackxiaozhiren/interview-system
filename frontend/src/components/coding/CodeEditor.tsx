"use client";

import React from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
    language: string;
    value: string;
    onChange: (value: string | undefined) => void;
    theme?: "vs-dark" | "light";
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    language,
    value,
    onChange,
    theme = "vs-dark"
}) => {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Configure editor settings here if needed
        editor.updateOptions({
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        });
    };

    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-[#1e1e1e] shadow-inner">
            <Editor
                height="100%"
                defaultLanguage="python"
                language={language}
                value={value}
                theme={theme}
                onChange={onChange}
                onMount={handleEditorDidMount}
                loading={
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading Editor...
                    </div>
                }
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                }}
            />
        </div>
    );
};
