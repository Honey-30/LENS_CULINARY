import { GoogleGenAI } from '@google/genai';

const recipeImageCache = new Map<string, string>();

interface RecipeImageContext {
  cuisine?: string;
  description?: string;
}

interface RecipeImageOptions {
  fallbackImageUrl?: string;
  forceRefresh?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildPlaceholder(recipeName: string): string {
  const safeName = (recipeName || 'Recipe').trim() || 'Recipe';
  const hash = hashString(safeName);
  const palettes = [
    ['#0f172a', '#1f2937', '#334155'],
    ['#111827', '#1f2937', '#374151'],
    ['#18181b', '#27272a', '#3f3f46'],
    ['#0b1324', '#172554', '#1e293b'],
  ];
  const [c1, c2, c3] = palettes[hash % palettes.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" role="img" aria-label="${escapeXml(safeName)} placeholder image">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="55%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
    </defs>
    <rect width="1200" height="600" fill="url(#bg)" rx="42" ry="42" />
    <circle cx="210" cy="170" r="80" fill="rgba(255,255,255,0.08)" />
    <circle cx="1040" cy="460" r="120" fill="rgba(255,255,255,0.06)" />

    <g transform="translate(520,220)" fill="none" stroke="#f8fafc" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="70" cy="70" rx="92" ry="48" />
      <path d="M-36 8v130" />
      <path d="M-58 8v62" />
      <path d="M-14 8v62" />
      <path d="M188 8c0 30-24 56-24 96v34" />
    </g>

    <text x="80" y="470" fill="#f8fafc" font-size="30" font-family="Inter, Segoe UI, Arial" font-weight="700">
      ${escapeXml(safeName)}
    </text>
    <text x="80" y="515" fill="rgba(248,250,252,0.85)" font-size="20" font-family="Inter, Segoe UI, Arial">
      AI recipe image unavailable, using premium placeholder
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractBase64Image(response: any): string | null {
  const generated = response?.generatedImages?.[0]?.image?.imageBytes;
  if (typeof generated === 'string' && generated.length > 0) return generated;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      const data = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;
      if (typeof data === 'string' && data.length > 0 && String(mimeType || '').includes('image')) {
        return data;
      }
    }
  }

  return null;
}

function extractInlineImage(response: any): { data: string; mimeType: string } | null {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    const data = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;
    if (typeof data === 'string' && data.length > 0 && typeof mimeType === 'string' && mimeType.includes('image')) {
      return { data, mimeType };
    }
  }

  return null;
}

function buildRecipeImagePrompt(recipeName: string, ingredients: string[], context?: RecipeImageContext): string {
  const name = (recipeName || 'Recipe').trim();
  const ingredientList = ingredients.slice(0, 10).join(', ');
  const cuisine = (context?.cuisine || '').trim();
  const description = (context?.description || '').trim();

  return [
    `Create a realistic, appetizing food photo of the dish "${name}".`,
    cuisine ? `Cuisine style: ${cuisine}.` : '',
    ingredientList ? `Visually include cues of these ingredients: ${ingredientList}.` : '',
    description ? `Dish summary: ${description}.` : '',
    'Composition: plated dish only, close-up at 45-degree angle, natural lighting, shallow depth of field.',
    'Quality: high-detail texture, true-to-life colors, clean presentation, no collage.',
    'Constraints: no text, no labels, no watermark, no logo, no people, no hands, no utensils covering the food.',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function generateRecipeImage(
  recipeName: string,
  ingredients: string[],
  context?: RecipeImageContext,
  options?: RecipeImageOptions
): Promise<string> {
  const cacheKey = `${(recipeName || '').trim().toLowerCase()}|${ingredients.join(',').toLowerCase()}|${(context?.cuisine || '').toLowerCase()}`;
  if (!options?.forceRefresh && cacheKey && recipeImageCache.has(cacheKey)) {
    return recipeImageCache.get(cacheKey)!;
  }

  const fallback = (options?.fallbackImageUrl || '').trim() || buildPlaceholder(recipeName);
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    if (cacheKey) recipeImageCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildRecipeImagePrompt(recipeName, ingredients, context);
    let result = fallback;

    const modelsClient = (ai as any)?.models;

    // Prefer Imagen when available for stronger photorealistic food results.
    if (modelsClient?.generateImages) {
      try {
        const imageResponse = await modelsClient.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '4:3',
          },
        });

        const bytes = extractBase64Image(imageResponse);
        if (bytes) {
          result = `data:image/jpeg;base64,${bytes}`;
        }
      } catch {
        // Fall through to Gemini image modality path.
      }
    }

    if (result === fallback) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        } as any,
      });

      const inline = extractInlineImage(response);
      if (inline) {
        result = `data:${inline.mimeType};base64,${inline.data}`;
      }
    }

    if (cacheKey) recipeImageCache.set(cacheKey, result);
    return result;
  } catch {
    if (cacheKey) recipeImageCache.set(cacheKey, fallback);
    return fallback;
  }
}
