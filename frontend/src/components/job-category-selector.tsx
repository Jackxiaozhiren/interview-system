"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown } from "lucide-react";

interface JobSubgroup {
  name: string;
  roles: string[];
}

interface JobCategory {
  id: string;
  name: string;
  subgroups: JobSubgroup[];
}

const JOB_CATEGORIES: JobCategory[] = [
  {
    id: "internet-ai",
    name: "互联网/AI",
    subgroups: [
      {
        name: "后端开发",
        roles: [
          "Java 后端开发工程师",
          "C/C++ 开发工程师",
          "PHP 开发工程师",
          "Python 后端开发工程师",
          ".NET 开发工程师",
          "Golang 开发工程师",
          "Node.js 开发工程师",
          "全栈工程师",
          "软件工程师",
        ],
      },
      {
        name: "前端 / 移动开发",
        roles: [
          "前端开发工程师",
          "前端移动开发工程师",
          "Android 开发工程师",
          "iOS 开发工程师",
          "U3D 客户端开发",
          "小程序开发工程师",
        ],
      },
      {
        name: "算法 / AI 方向",
        roles: [
          "语音/视频算法工程师",
          "计算机视觉算法工程师",
          "自然语言处理工程师",
          "推荐算法工程师",
          "高性能计算工程师",
        ],
      },
      {
        name: "测试 / 运维",
        roles: [
          "测试工程师",
          "自动化测试工程师",
          "SRE/运维工程师",
          "DevOps 工程师",
        ],
      },
    ],
  },
  {
    id: "electronics",
    name: "电子/电气/通信",
    subgroups: [
      {
        name: "通信与嵌入式",
        roles: [
          "嵌入式软件工程师",
          "通信工程师",
          "硬件开发工程师",
        ],
      },
    ],
  },
  {
    id: "product",
    name: "产品",
    subgroups: [
      {
        name: "产品方向",
        roles: [
          "产品经理",
          "产品助理",
          "数据产品经理",
          "游戏策划",
        ],
      },
    ],
  },
  {
    id: "operation",
    name: "客户运营",
    subgroups: [
      {
        name: "运营方向",
        roles: [
          "用户运营",
          "内容运营",
          "新媒体运营",
          "活动运营",
        ],
      },
    ],
  },
  {
    id: "sales",
    name: "销售",
    subgroups: [
      {
        name: "销售方向",
        roles: [
          "销售代表",
          "商务拓展",
          "客户经理",
        ],
      },
    ],
  },
  {
    id: "hr-legal",
    name: "人力/行政/法务",
    subgroups: [
      {
        name: "职能岗位",
        roles: [
          "人力资源专员",
          "招聘专员",
          "行政专员",
          "法务助理",
        ],
      },
    ],
  },
];

export interface JobCategorySelectorProps {
  value: string;
  onChange: (title: string) => void;
}

export function JobCategorySelector({ value, onChange }: JobCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeCategory = activeId
    ? JOB_CATEGORIES.find((c) => c.id === activeId)
    : undefined;

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const ensureActiveCategory = () => {
    if (!activeId && JOB_CATEGORIES.length > 0) {
      setActiveId(JOB_CATEGORIES[0].id);
    }
  };

  const handleChooseRole = (role: string) => {
    onChange(role);
    setOpen(false);
  };

  const keyword = value.trim().toLowerCase();

  return (
    <div ref={rootRef} className="mt-2 relative text-xs">
      <div className="flex items-center border border-teal-400 rounded-md bg-white dark:bg-slate-950 overflow-hidden">
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 border-r border-teal-300 text-xs text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-900"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              ensureActiveCategory();
            }
          }}
        >
          <span>职位类型</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${
              open ? "rotate-180 text-teal-500" : "text-slate-400"
            }`}
          />
        </button>
        <input
          className="flex-1 px-3 py-2 text-xs outline-none bg-transparent placeholder:text-slate-400"
          placeholder="搜索职位、公司"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            ensureActiveCategory();
          }}
        />
      </div>

      {open && (
        <Card className="absolute z-20 mt-1 w-full border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="flex gap-3 py-3">
            {/* 左侧大类列表 */}
            <div className="w-32 flex flex-col gap-1 text-xs border-r border-slate-100 dark:border-slate-800 pr-2">
              {JOB_CATEGORIES.map((cat) => {
                const isActive = activeCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const nextId = isActive ? null : cat.id;
                      setActiveId(nextId);
                    }}
                    className={`flex items-center justify-between px-2 py-1 rounded-md text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
                      isActive ? "bg-slate-100 dark:bg-slate-800 font-medium" : ""
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <ChevronRight
                      className={`h-3 w-3 transition-transform ${
                        isActive ? "rotate-90 text-blue-600" : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* 右侧具体岗位 */}
            <div className="flex-1 space-y-3 max-h-72 overflow-y-auto">
              {!activeCategory && (
                <div className="text-xs text-slate-500">
                  先在左侧选择一个职位大类，再从这里选择具体岗位；也可以在上方搜索框中输入关键词。
                </div>
              )}
              {activeCategory?.subgroups.map((group) => {
                const roles =
                  keyword.length > 0
                    ? group.roles.filter((role) =>
                        role.toLowerCase().includes(keyword)
                      )
                    : group.roles;

                if (roles.length === 0) {
                  return null;
                }

                return (
                  <div key={group.name} className="space-y-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {group.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          onClick={() => handleChooseRole(role)}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
