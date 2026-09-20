/**
 * CetThink AI — 与 NativeThink 同思路：
 * 优先走服务端代理（保护 Key / 处理 CORS），支持出厂 GLM 免费档。
 */

declare const __FACTORY_API_KEY__: string | undefined;

const FACTORY_KEY = typeof __FACTORY_API_KEY__ !== 'undefined' ? __FACTORY_API_KEY__ || '' : '';

/** 默认代理：生产 NativeThink Pages；可在设置里改 */
const PROXY_KEY = 'cetthink_ai_proxy';
const USER_KEY = 'cetthink_ai_key';
const DEFAULT_PROXY = 'https://nativethink.pages.dev/api/ai/chat';

export function getAiProxy(): string {
  try {
    return localStorage.getItem(PROXY_KEY) || DEFAULT_PROXY;
  } catch {
    return DEFAULT_PROXY;
  }
}

export function setAiProxy(url: string) {
  try {
    localStorage.setItem(PROXY_KEY, url.trim() || DEFAULT_PROXY);
  } catch {
    /* ignore */
  }
}

export function getUserAiKey(): string {
  try {
    return localStorage.getItem(USER_KEY) || '';
  } catch {
    return '';
  }
}

export function setUserAiKey(key: string) {
  try {
    if (key) localStorage.setItem(USER_KEY, key.trim());
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function hasAiSupport(): boolean {
  return !!(FACTORY_KEY || getUserAiKey() || getAiProxy());
}

export interface AiChatOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export async function aiChat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], options: AiChatOptions = {}): Promise<string> {
  const proxy = getAiProxy();
  const userKey = getUserAiKey();
  const apiKey = userKey || FACTORY_KEY || undefined;

  const body = {
    provider: userKey ? 'glm' : 'factory',
    model: userKey ? 'glm-4-flash' : 'glm-4-flash-250414',
    task: 'chat',
    messages,
    max_tokens: options.maxTokens ?? 800,
    temperature: options.temperature ?? 0.5,
    stream: false,
    apiKey,
  };

  const attempts = [proxy];
  // 本地开发时也可指到本机 NativeThink
  if (!proxy.includes('localhost')) attempts.push('http://localhost:8787/api/ai/chat');

  let lastErr = '';
  for (const url of attempts) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options.signal,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        lastErr = `HTTP ${res.status} ${t.slice(0, 120)}`;
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.content || '';
      if (text) return text;
      lastErr = '空响应';
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastErr || 'AI 服务暂不可用');
}

/** 结构化题解：本地骨架 + 可选 AI 深析 */
export interface QuestionAnalysis {
  correctLabel: string;
  yourLabel?: string;
  isCorrect: boolean;
  /** 考点 */
  focus: string;
  /** 为什么选正确项 */
  whyCorrect: string;
  /** 其它选项为何不选 */
  whyOthers: { label: string; text: string; reason: string }[];
  /** 关键词 */
  keywords: { en: string; zh: string }[];
  /** 原文定位句 */
  locate?: string;
  ai?: string;
}

export function localAnalyze(input: {
  question: string;
  options: string[];
  answer: number;
  picked?: number;
  explain?: string;
  transcriptOrPassage?: string;
}): QuestionAnalysis {
  const labels = input.options.map((_, i) => String.fromCharCode(65 + i));
  const correctLabel = labels[input.answer] || '?';
  const yourLabel = input.picked != null ? labels[input.picked] : undefined;
  const isCorrect = input.picked === input.answer;

  const whyOthers = input.options
    .map((text, i) => ({ label: labels[i], text, reason: '' }))
    .filter((o) => o.label !== correctLabel)
    .map((o) => ({
      ...o,
      reason:
        input.picked === input.answer
          ? '非正确项：与题干关键信息不匹配'
          : o.label === yourLabel
            ? '你的选择：与原文/题干要点不符或范围偏差'
            : '干扰项：常偷换概念、扩大/缩小范围或无关信息',
    }));

  // 简单关键词：从解析与题干抽英文词
  const bag = `${input.question} ${input.explain || ''} ${(input.transcriptOrPassage || '').slice(0, 400)}`;
  const words = (bag.match(/[A-Za-z][A-Za-z'-]{2,}/g) || [])
    .filter((w, i, a) => a.indexOf(w) === i && !['the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was'].includes(w.toLowerCase()))
    .slice(0, 6);

  let locate = input.transcriptOrPassage?.slice(0, 180);
  if (locate && locate.length >= 180) locate += '…';

  return {
    correctLabel,
    yourLabel,
    isCorrect,
    focus: isCorrect ? '本题你已掌握考点' : '注意题干限定词与原文同义替换',
    whyCorrect: input.explain || '正确项与题干核心信息一致，其余为干扰。',
    whyOthers,
    keywords: words.map((w) => ({ en: w, zh: '' })),
    locate,
  };
}

export async function aiExplainQuestion(input: {
  question: string;
  options: string[];
  answer: number;
  picked?: number;
  explain?: string;
  context?: string;
}): Promise<string> {
  const letters = input.options.map((_, i) => String.fromCharCode(65 + i));
  const prompt = [
    '你是大学英语四六级辅导老师。请用中文简洁分析这道题（150字内）：',
    `题目：${input.question}`,
    ...input.options.map((o, i) => `${letters[i]}. ${o}`),
    `正确答案：${letters[input.answer] || input.answer}`,
    input.picked != null ? `我的选择：${letters[input.picked]}` : '',
    input.explain ? `已有解析：${input.explain}` : '',
    input.context ? `相关原文/听力稿片段：${input.context.slice(0, 600)}` : '',
    '请说明：①正确项依据 ②干扰项常见坑 ③下次如何快速定位。',
  ]
    .filter(Boolean)
    .join('\n');

  return aiChat(
    [
      { role: 'system', content: '输出纯文本，不要 markdown 标题符号，分点用①②③。' },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 500, temperature: 0.4 },
  );
}

export async function aiGradeEssay(prompt: string, essay: string): Promise<string> {
  return aiChat(
    [
      {
        role: 'system',
        content: '你是四六级写作阅卷老师。用中文给出：总分估计（满分15）/ 3条优点 / 3条改进建议 / 2个可替换的高分表达。简洁分点。',
      },
      {
        role: 'user',
        content: `题目：${prompt}\n\n学生作文：\n${essay.slice(0, 2500)}`,
      },
    ],
    { maxTokens: 700, temperature: 0.5 },
  );
}

export async function aiPolishSentence(text: string): Promise<string> {
  return aiChat(
    [
      { role: 'system', content: '润色英文句子，保持原意，更地道。只输出润色后的英文，可附一句中文说明。' },
      { role: 'user', content: text },
    ],
    { maxTokens: 300, temperature: 0.4 },
  );
}
