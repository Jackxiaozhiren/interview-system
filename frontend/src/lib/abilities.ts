// Centralized ability & tag dictionary for explanations across reports and dashboards

export type AbilityId =
  | "behavior.star_structure"
  | "behavior.clarity"
  | "behavior.reflection"
  | "delivery.pacing"
  | "delivery.filler_words"
  | "delivery.eye_contact"
  | "delivery.posture"
  | "delivery.emotion";

export interface AbilityMeta {
  id: AbilityId;
  name: string;
  shortDescription: string;
  hint?: string;
}

export const ABILITIES: Record<AbilityId, AbilityMeta> = {
  "behavior.star_structure": {
    id: "behavior.star_structure",
    name: "结构化表达（STAR）",
    shortDescription: "是否按情境-任务-行动-结果讲清楚一段经历。",
    hint: "练习时刻意补全结果（Result），别只讲过程。",
  },
  "behavior.clarity": {
    id: "behavior.clarity",
    name: "表达清晰度",
    shortDescription: "观点是否清楚、重点突出、条理清晰。",
    hint: "先说结论，再用 2-3 点支持理由展开。",
  },
  "behavior.reflection": {
    id: "behavior.reflection",
    name: "反思与成长",
    shortDescription: "是否能总结经验、反思不足并提出改进。",
    hint: "回答结束前加一句“这件事让我学到/改进的是…”。",
  },
  "delivery.pacing": {
    id: "delivery.pacing",
    name: "语速与停顿",
    shortDescription: "语速是否适中、停顿是否自然。",
    hint: "关键句前适当停顿 0.5-1 秒，让听众跟上。",
  },
  "delivery.filler_words": {
    id: "delivery.filler_words",
    name: "口头禅控制",
    shortDescription: "是否频繁出现“嗯”“然后”“就是”等无意义填充。",
    hint: "感到卡壳时，宁可短暂停顿，也尽量少用口头禅填空。",
  },
  "delivery.eye_contact": {
    id: "delivery.eye_contact",
    name: "眼神接触",
    shortDescription: "看向摄像头/面试官的比例是否足够。",
    hint: "关键句时刻意看向摄像头 1-2 秒，避免总是看别处。",
  },
  "delivery.posture": {
    id: "delivery.posture",
    name: "坐姿与肢体",
    shortDescription: "坐姿是否稳定、自然，有无明显摇晃或小动作。",
    hint: "上半身保持稳定，避免长时间大幅度晃动。",
  },
  "delivery.emotion": {
    id: "delivery.emotion",
    name: "表情与情绪",
    shortDescription: "表情是否自然、有亲和力，整体情绪是否积极。",
    hint: "讲到成果和收获时，可以适当微笑，传递自信。",
  },
};

export function getAbilityMeta(id: AbilityId | string): AbilityMeta | undefined {
  if ((ABILITIES as Record<string, AbilityMeta>)[id]) {
    return (ABILITIES as Record<string, AbilityMeta>)[id];
  }
  return undefined;
}

// Mapping from backend dimension / tag display names to internal ability ids.
// These strings should match the names used in InterviewEvaluation.dimensions[i].name
// and strength_tags / risk_tags, e.g. in backend/app/routers/interview.py.

const DIMENSION_NAME_TO_ID: Record<string, AbilityId> = {
  "结构化表达（STAR）": "behavior.star_structure",
  "表达清晰度": "behavior.clarity",
  "反思与成长意识": "behavior.reflection",
};

const TAG_TO_ID: Record<string, AbilityId> = {
  "结构化表达（STAR）": "behavior.star_structure",
  "表达清晰度": "behavior.clarity",
  "反思与成长意识": "behavior.reflection",
  "Pacing: speaking too slowly": "delivery.pacing",
  "Pacing: speaking too fast": "delivery.pacing",
  "Too many pauses": "delivery.pacing",
  "Too few pauses (rushed)": "delivery.pacing",
  "Filler Words": "delivery.filler_words",
  "Eye Contact": "delivery.eye_contact",
  "Posture": "delivery.posture",
  "Facial Expression / Confidence": "delivery.emotion",
};

export function getAbilityMetaByDimensionName(name: string): AbilityMeta | undefined {
  const id = DIMENSION_NAME_TO_ID[name];
  return id ? ABILITIES[id] : undefined;
}

export function getAbilityMetaByTag(tag: string): AbilityMeta | undefined {
  const id = TAG_TO_ID[tag];
  return id ? ABILITIES[id] : undefined;
}
