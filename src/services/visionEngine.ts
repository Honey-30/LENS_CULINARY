/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient } from "../types";

type HfDetection = {
  label: string;
  score: number;
  box?: {
    xmin?: number;
    ymin?: number;
    xmax?: number;
    ymax?: number;
  };
};

const NON_FOOD_LABEL_HINTS = [
  "person",
  "human",
  "face",
  "hand",
  "finger",
  "plate",
  "bowl",
  "cup",
  "fork",
  "knife",
  "spoon",
  "table",
  "bottle",
  "phone",
  "package",
  "box",
  "bag",
  "napkin",
  "cloth",
];

const MIN_HF_SCORE = 0.1;
const MIN_FINAL_CONFIDENCE = 0.08;
const MIN_RECOVERY_CONFIDENCE = 0.05;
const HF_FOOD_DETECTION_MODEL = "https://api-inference.huggingface.co/models/BinhQuocNguyen/food-recognition-model";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyNonFood(label: string): boolean {
  const normalized = normalizeName(label);
  return NON_FOOD_LABEL_HINTS.some((hint) => normalized.includes(hint));
}

function toNormalizedBoundingBox(box?: HfDetection["box"]): [number, number, number, number] | undefined {
  if (!box) return undefined;
  const { xmin, ymin, xmax, ymax } = box;
  if ([xmin, ymin, xmax, ymax].some((v) => typeof v !== "number" || Number.isNaN(v))) return undefined;

  const values = [xmin as number, ymin as number, xmax as number, ymax as number];
  const maxValue = Math.max(...values);
  const scale = maxValue <= 1 ? 1000 : maxValue <= 100 ? 10 : 1;

  return [
    clamp(Math.round((ymin as number) * scale), 0, 1000),
    clamp(Math.round((xmin as number) * scale), 0, 1000),
    clamp(Math.round((ymax as number) * scale), 0, 1000),
    clamp(Math.round((xmax as number) * scale), 0, 1000),
  ];
}

function centerFromBoundingBox(box?: [number, number, number, number]): { x: number; y: number } | undefined {
  if (!box) return undefined;
  const [ymin, xmin, ymax, xmax] = box;
  return {
    x: clamp(((xmin + xmax) / 2) / 10, 0, 100),
    y: clamp(((ymin + ymax) / 2) / 10, 0, 100),
  };
}

function parseHfDetections(raw: unknown): HfDetection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is HfDetection => {
      const candidate = item as HfDetection;
      return typeof candidate?.label === "string" && typeof candidate?.score === "number";
    })
    .filter((item) => item.score >= MIN_HF_SCORE)
    .filter((item) => !isLikelyNonFood(item.label));
}

function dedupeIngredients(items: Ingredient[]): Ingredient[] {
  const merged = new Map<string, Ingredient>();

  for (const item of items) {
    if (!item.name?.trim()) continue;
    const key = normalizeName(item.name);
    if (!key) continue;

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }

    const preferred = item.confidence > existing.confidence ? item : existing;
    const fallback = preferred === item ? existing : item;

    merged.set(key, {
      ...fallback,
      ...preferred,
      category: preferred.category || fallback.category || "Detected",
      boundingBox: preferred.boundingBox || fallback.boundingBox,
      x: preferred.x ?? fallback.x,
      y: preferred.y ?? fallback.y,
      confidence: clamp(preferred.confidence || fallback.confidence || 0, 0, 1),
    });
  }

  return Array.from(merged.values());
}

export class VisionEngine {
  public ai: GoogleGenAI;
  private lastImageHash: string | null = null;
  private lastResult: { ingredients: Ingredient[], humanDetected: boolean } | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processImage(base64Image: string): Promise<{ ingredients: Ingredient[], humanDetected: boolean }> {
    // Simple caching to minimize API calls for the same image
    const currentHash = base64Image.substring(0, 100) + base64Image.length;
    if (this.lastImageHash === currentHash && this.lastResult) {
      console.log("VisionEngine: Using cached result");
      return this.lastResult;
    }

    // Stage 1: Hugging Face Object Detection
    let hfDetections: HfDetection[] = [];
    const hfToken = import.meta.env.VITE_HF_API_TOKEN || import.meta.env.HF_API_TOKEN;
    
    if (hfToken) {
      try {
        console.log("🔍 Attempting HF food detection...");
        
        // Convert base64 to Uint8Array for browser compatibility
        const binaryString = atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const hfResponse = await fetch(HF_FOOD_DETECTION_MODEL, {
            headers: { 
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/octet-stream"
            },
            method: "POST",
            body: bytes,
          }
        );
        if (hfResponse.ok) {
          const raw = await hfResponse.json();
          hfDetections = parseHfDetections(raw);
          console.log("✅ HF Detection successful:", hfDetections.length, "items found");
        } else {
          const message = await hfResponse.text();
          console.warn("⚠️ HF Detection failed:", hfResponse.status, message.substring(0, 100));
          console.log("📌 Falling back to Gemini only");
        }
      } catch (e) {
        console.error("❌ HF Detection error:", e);
      }
    } else {
      console.log("ℹ️ HF_API_TOKEN not configured - using Gemini only");
    }

    // Stage 2: Gemini Enrichment
    const geminiModels = ["gemini-2.5-flash", "gemini-3-flash-preview"];
    let response: Awaited<ReturnType<typeof this.ai.models.generateContent>> | null = null;
    let geminiError: unknown = null;

    for (const model of geminiModels) {
      try {
        response = await this.ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                { text: `You are an ingredient perception engine.
Analyze this image and return an EXHAUSTIVE list of all visible edible ingredients.

Stage-1 detector candidates (use as hints, not as limits): ${JSON.stringify(hfDetections)}

Rules:
1) Include small, partially occluded, sliced, cooked, mixed, or blurry edible items if likely visible.
2) Exclude humans, hands, faces, body parts, utensils, bowls/plates, packaging, labels, and appliances.
3) Use confidence between 0 and 1.
4) Provide center coordinates x,y from 0-100.
5) If you can infer a box, provide boundingBox as [ymin, xmin, ymax, xmax] scaled 0-1000.
6) Deduplicate near-synonyms (for example tomato/tomatoes => tomato).

Return JSON with:
- ingredients: array of { name, category, confidence, x, y, boundingBox?, aromaticProfile?, nutritionalEstimate? }
- humanDetected: boolean` },
                { inlineData: { mimeType: "image/jpeg", data: base64Image } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      category: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                      x: { type: Type.NUMBER, description: "X coordinate (0-100)" },
                      y: { type: Type.NUMBER, description: "Y coordinate (0-100)" },
                      boundingBox: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER },
                        description: "[ymin, xmin, ymax, xmax] normalized 0-1000"
                      },
                      aromaticProfile: { type: Type.STRING },
                      nutritionalEstimate: {
                        type: Type.OBJECT,
                        properties: {
                          calories: { type: Type.NUMBER },
                          protein: { type: Type.NUMBER },
                          carbs: { type: Type.NUMBER },
                          fat: { type: Type.NUMBER }
                        }
                      }
                    },
                    required: ["name", "category", "confidence", "x", "y"]
                  }
                },
                humanDetected: { type: Type.BOOLEAN }
              },
              required: ["ingredients", "humanDetected"]
            }
          }
        });
        break;
      } catch (error) {
        geminiError = error;
      }
    }

    if (!response) {
      throw geminiError || new Error("Gemini request failed for all configured models");
    }

    const result = JSON.parse(response.text || "{}");
    const geminiIngredientsRaw = Array.isArray(result.ingredients) ? result.ingredients : [];
    
    // Confidence fusion + HF fallback for missed Gemini candidates
    const enrichedGemini = geminiIngredientsRaw
      .filter((ing: any) => typeof ing?.name === "string" && !isLikelyNonFood(ing.name))
      .map((ing: any, index: number) => {
        const ingName = normalizeName(ing.name);
        const hfMatch = hfDetections.find((hf) => {
          const hfName = normalizeName(hf.label);
          return hfName.includes(ingName) || ingName.includes(hfName);
        });

        let confidence = clamp(Number(ing.confidence) || 0, 0, 1);
        let boundingBox = Array.isArray(ing.boundingBox) && ing.boundingBox.length === 4
          ? [
              clamp(Number(ing.boundingBox[0]) || 0, 0, 1000),
              clamp(Number(ing.boundingBox[1]) || 0, 0, 1000),
              clamp(Number(ing.boundingBox[2]) || 0, 0, 1000),
              clamp(Number(ing.boundingBox[3]) || 0, 0, 1000),
            ] as [number, number, number, number]
          : undefined;

        if (hfMatch) {
          confidence = clamp(Math.max(confidence, hfMatch.score * 0.95), 0, 1);
          if (!boundingBox) {
            boundingBox = toNormalizedBoundingBox(hfMatch.box);
          }
        }

        const center = centerFromBoundingBox(boundingBox);

        return {
          ...ing,
          id: `ing-${Date.now()}-${index}`,
          name: ing.name.trim(),
          category: ing.category || "Detected",
          confidence,
          x: clamp(Number(ing.x) || center?.x || 0, 0, 100),
          y: clamp(Number(ing.y) || center?.y || 0, 0, 100),
          boundingBox,
        } as Ingredient;
      });

    const geminiNameSet = new Set(enrichedGemini.map((ing: Ingredient) => normalizeName(ing.name)));
    const hfFallbackIngredients: Ingredient[] = hfDetections
      .filter((hf) => !geminiNameSet.has(normalizeName(hf.label)))
      .map((hf, index) => {
        const boundingBox = toNormalizedBoundingBox(hf.box);
        const center = centerFromBoundingBox(boundingBox);
        return {
          id: `ing-hf-${Date.now()}-${index}`,
          name: hf.label,
          category: "Detected",
          confidence: clamp(hf.score * 0.9, 0, 1),
          x: center?.x,
          y: center?.y,
          boundingBox,
        } as Ingredient;
      });

    let enrichedIngredients = dedupeIngredients([...enrichedGemini, ...hfFallbackIngredients])
      .filter((ing) => ing.confidence >= MIN_FINAL_CONFIDENCE);

    // If detection is unexpectedly sparse, recover a few lower-confidence ingredients safely.
    if (enrichedIngredients.length < 2) {
      enrichedIngredients = dedupeIngredients([...enrichedGemini, ...hfFallbackIngredients])
        .filter((ing) => ing.confidence >= MIN_RECOVERY_CONFIDENCE)
        .slice(0, 12);
    }

    const finalResult = {
      ingredients: enrichedIngredients,
      humanDetected: result.humanDetected || false
    };

    // Cache the result
    this.lastImageHash = currentHash;
    this.lastResult = finalResult;

    return finalResult;
  }
}
