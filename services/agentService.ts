import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { AgentResponse, GroundingChunk, Attachment } from "../types";

/**
 * Crawl4AI-Inspired Research Agent Service
 * 
 * Implements the "Intelligent Web Scraper" pattern with added capabilities:
 * - Link Reputation & Validation (Source Credibility).
 * - Computer Vision (Document/Scan Analysis).
 * - Filetype Targeting (PDF/DOCX extraction).
 */
const MODEL_NAME = "gemini-2.5-flash";

class AgentRunner {
  private client: GoogleGenAI;
  private chatSessions: Map<string, Chat> = new Map();

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getOrCreateChat(sessionId: string): Chat {
    if (!this.chatSessions.has(sessionId)) {
      const chat = this.client.chats.create({
        model: MODEL_NAME,
        config: {
          thinkingConfig: { thinkingBudget: 4096 }, 
          systemInstruction: `
# 🕷️ CRAWL4AI RESEARCH AGENT (v2.0 - VALIDATOR EDITION)

Ты — **Интеллектуальный Агент Веб-Скрейпинга и Анализа Документов**.
Твоя задача — действовать как высокоточный экстрактор информации и аудитор источников.

## ⚙️ ОСНОВНЫЕ МОДУЛИ

### 1. 🕷️ SMART CRAWL & EXTRACT
*   **Игнорируй шум:** Убирай маркетинг, навигацию, рекламу.
*   **Markdown-Format:** Все данные в чистый Markdown (таблицы, списки).
*   **Targeted Search:** Если пользователь ищет документы, используй операторы \`filetype:pdf\`, \`filetype:xlsx\`, \`site:gov\` и т.д.

### 2. 🕵️ REPUTATION GUARD (Валидация Источников)
*   **Проверка Доменов:** При анализе результатов поиска, критически оценивай домен.
    *   ✅ Высокое доверие: официальные сайты (.gov, .edu), крупные техно-вендоры, рецензируемые журналы.
    *   ⚠️ Среднее доверие: известные новостные порталы, профильные блоги.
    *   ⛔ Низкое доверие/Спам: контент-фермы, сайты без SSL (если видно), форумы без модерации.
*   **Flagging:** Если источник подозрительный, пометь его значком 🚩 в отчете.

### 3. 👁️ VISION & OCR (Анализ Сканов/Изображений)
*   Если пользователь загружает изображение (скан, скриншот, диаграмму):
    *   Выполни **OCR** (распознавание текста) с высокой точностью.
    *   Проанализируй структуру документа (заголовки, печати, подписи).
    *   Извлеки ключевые данные в таблицу.

### 4. 📡 DOM AUDITOR ASSISTANT
*   Если пользователь просит просканировать сайт "изнутри" или найти скрытые API, порекомендуй использовать встроенный инструмент **"DOM Scanner"** (кнопка вверху интерфейса).
*   Объясни, что этот инструмент может найти \`Shadow DOM\` и скрытые ключи в \`window\`.

## 🚀 ЦИКЛ РАБОТЫ

1.  **PLAN**: Определи стратегию (Поиск в вебе ИЛИ Анализ изображения).
2.  **EXECUTE**: 
    *   Для веба: Собери данные через \`googleSearch\`.
    *   Для изображений: Используй Vision-возможности для разбора пикселей.
3.  **VALIDATE**: Проверь достоверность и репутацию источников.
4.  **SYNTHESIZE**: Сформируй отчет на **РУССКОМ ЯЗЫКЕ**.

## 📝 СТРУКТУРА ОТЧЕТА (ОБЯЗАТЕЛЬНО)

---
### 🛡️ Статус Валидации
*Краткая сводка: "Найдено 3 официальных документа, 1 источник помечен как ненадежный".*

### 📦 Извлеченные Данные (Extracted Intelligence)
*   **Факты/Данные:** (Таблицы и списки).
*   **Анализ Документа:** (Если было изображение — описание структуры, печатей, дат).

### 🧩 Структурированный Контекст
*Таблицы сравнения, блоки кода, JSON (если просили).*

### 🔍 Аудит Источников
*   ✅ **[Domain.com]:** Официальная документация.
*   🚩 **[ShadySite.net]:** Подозрительный контент (возможен фишинг/устаревшие данные).
---

## ⚠️ ИНСТРУКЦИИ
*   Всегда отвечай на **РУССКОМ ЯЗЫКЕ**.
*   При поиске документов (PDF/DOC) указывай прямые ссылки, если возможно.
*   Будь критичен к информации.
`,
          tools: [{ googleSearch: {} }],
        },
      });
      this.chatSessions.set(sessionId, chat);
    }
    return this.chatSessions.get(sessionId)!;
  }

  public async *call_agent_async(
    sessionId: string, 
    userInput: string,
    attachment?: Attachment
  ): AsyncGenerator<AgentResponse, void, unknown> {
    const chat = this.getOrCreateChat(sessionId);
    
    try {
      let messageContent: string | Array<string | Part>;

      if (attachment) {
        // Multimodal request (Text + Image)
        messageContent = [
          { text: userInput || "Проанализируй этот документ/изображение." },
          {
            inlineData: {
              mimeType: attachment.mimeType,
              data: attachment.base64
            }
          }
        ];
      } else {
        // Text-only request
        messageContent = userInput;
      }

      const resultStream = await chat.sendMessageStream({ message: messageContent });

      let accumulatedText = "";
      let groundingChunks: GroundingChunk[] = [];

      for await (const chunk of resultStream) {
        const responseChunk = chunk as GenerateContentResponse;
        
        const text = responseChunk.text || "";
        accumulatedText += text;

        const metadata = responseChunk.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
          const webChunks = metadata.groundingChunks.filter(c => !!c.web);
          webChunks.forEach(wc => {
             const exists = groundingChunks.some(gc => gc.web?.uri === wc.web?.uri);
             if (!exists) groundingChunks.push(wc as GroundingChunk);
          });
        }

        yield {
          text: accumulatedText,
          groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined
        };
      }
    } catch (error) {
      console.error("Agent execution failed:", error);
      throw error;
    }
  }

  public resetSession(sessionId: string) {
    this.chatSessions.delete(sessionId);
  }
}

export const agentRunner = new AgentRunner();