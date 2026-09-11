/**
 * Gemini Resilience Gateway & Cascading Fallback Manager
 * Tuân thủ tiêu chuẩn Google AI và quy chuẩn sư phạm Việt Nam
 */

export interface ModelCandidate {
  model: string;
  timeoutMs: number;
  label: string;
}

export const QUALITY_WATERFALL: ModelCandidate[] = [
  { model: 'gemini-3.8-flash', timeoutMs: 12000, label: 'Gemini 3.8 Flash (Chính - Chất lượng cao)' },
  { model: 'gemini-3.7-flash', timeoutMs: 10000, label: 'Gemini 3.7 Flash (Dự phòng thế hệ mới)' },
  { model: 'gemini-3.6-flash', timeoutMs: 8000,  label: 'Gemini 3.6 Flash (Dự phòng ổn định)' },
  { model: 'gemini-3.5-flash-lite', timeoutMs: 6000, label: 'Gemini 3.5 Flash-Lite (Cứu hộ phản hồi nhanh)' },
  { model: 'gemini-2.5-flash', timeoutMs: 6000, label: 'Gemini 2.5 Flash (Tương thích)' },
];

export interface GatewayOptions {
  apiKey: string;
  prompt: string;
  systemInstruction?: string;
  candidates?: ModelCandidate[];
  maxTokens?: number;
  temperature?: number;
  onFallback?: (from: string, to: string, reason: string) => void;
}

export interface GatewayResponse {
  text: string;
  modelUsed: string;
  durationMs: number;
  attempts: number;
}

export function isFallbackEligible(error: any): { eligible: boolean; reason: string } {
  if (!error) return { eligible: false, reason: 'Unknown error' };

  if (error.name === 'AbortError' || error.name === 'TimeoutError' || String(error.message).toLowerCase().includes('timeout') || String(error.message).toLowerCase().includes('aborted')) {
    return { eligible: true, reason: 'Hết thời gian chờ (Latency Timeout)' };
  }

  const status = error.status || error.statusCode || error.response?.status;
  const msg = String(error.message || '').toLowerCase();

  if (status === 429 || msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) {
    return { eligible: true, reason: 'Quá tải hạn mức API (HTTP 429 Resource Exhausted)' };
  }
  if (status === 503 || status === 502 || status === 500 || msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable')) {
    return { eligible: true, reason: 'Dịch vụ AI Google tạm thời quá tải (HTTP 503 Unavailable)' };
  }
  if (status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('is not supported')) {
    return { eligible: true, reason: 'Model không khả dụng hoặc đã thay đổi (HTTP 404)' };
  }

  if (status === 400 && (msg.includes('model') || msg.includes('not found') || msg.includes('not supported'))) {
    return { eligible: true, reason: 'Tên Model chưa được hỗ trợ trên tài khoản này' };
  }

  return { eligible: false, reason: error.message || 'Lỗi không thuộc diện tự động chuyển model' };
}

export async function executeGeminiWithFallback(options: GatewayOptions): Promise<GatewayResponse> {
  const { apiKey, prompt, systemInstruction, maxTokens = 3500, temperature = 0.4 } = options;
  if (!apiKey?.trim()) {
    throw new Error('Chưa cấu hình API Key Google Gemini. Quý Thầy/Cô vui lòng nhập API Key trong phần Cài đặt.');
  }

  const candidates = options.candidates || QUALITY_WATERFALL;
  const startTime = Date.now();
  let attempts = 0;
  let lastError: any = null;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    attempts++;

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), candidate.timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate.model)}:generateContent`;
      
      const payload: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const errObj: any = new Error(errorBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        errObj.status = res.status;
        errObj.errorDetails = errorBody;
        throw errObj;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('');

      if (!text) {
        throw new Error('Mô hình phản hồi nhưng không có nội dung văn bản.');
      }

      return {
        text,
        modelUsed: candidate.model,
        durationMs: Date.now() - startTime,
        attempts,
      };

    } catch (err: any) {
      clearTimeout(timeoutHandle);
      lastError = err;

      // Nếu lỗi do sai API Key hoặc cấm quyền (400/403 Invalid Key) thì không cần fallback
      const msg = String(err.message || '').toLowerCase();
      if (err.status === 400 && (msg.includes('api_key_invalid') || msg.includes('api key not valid'))) {
        throw new Error('Google Gemini API Key không hợp lệ. Vui lòng kiểm tra lại mã khóa đã nhập.');
      }
      if (err.status === 403) {
        throw new Error('Khóa API không có quyền truy cập dịch vụ Gemini hoặc đã bị hạn chế tên miền/IP.');
      }

      const check = isFallbackEligible(err);
      if (!check.eligible) {
        throw err;
      }

      const nextCandidate = candidates[i + 1];
      if (nextCandidate && options.onFallback) {
        options.onFallback(candidate.model, nextCandidate.model, check.reason);
      }
      console.warn(`[Gemini Gateway] Model ${candidate.model} gặp sự cố (${check.reason}). Đang chuyển sang ${nextCandidate?.model || 'kết thúc'}.`);
    }
  }

  throw lastError || new Error('Tất cả các tầng mô hình Gemini đều không phản hồi thành công.');
}
