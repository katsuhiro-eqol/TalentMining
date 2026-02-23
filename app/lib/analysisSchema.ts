import { z } from "zod";

export const RadarSchema = z.object({
  continuity: z.number().min(0).max(1),
  exploration: z.number().min(0).max(1),
  breadth: z.number().min(0).max(1),
  implementation: z.number().min(0).max(1),
  practicality: z.number().min(0).max(1),
  learning: z.number().min(0).max(1),
});

export const AnalysisSchema = z.object({
  persona_summary: z.string(),
  common_traits: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.array(z.object({
      threadId: z.string(),
      question: z.string(),
    })).min(1),
  })).min(1),
  situational_traits: z.array(z.object({
    threadId: z.string(),
    theme: z.string(),
    traits: z.array(z.string()).min(1),
    evidence: z.array(z.object({
      question: z.string(),
    })).min(1),
  })).min(1),
  radar_llm: RadarSchema,
  resume_phrases: z.array(z.string()).min(1),
  disclaimer: z.string(),
});

export const AnalyzeApiResponseSchema = z.object({
  input: z.object({
    threads: z.array(z.string()),
    questionCount: z.number(),
  }),
  analysis: AnalysisSchema,
});

export type AnalyzeApiResponse = z.infer<typeof AnalyzeApiResponseSchema>;
export type Radar = z.infer<typeof RadarSchema>;
