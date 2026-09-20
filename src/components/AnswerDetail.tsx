import { useState } from 'react';
import { Loader2, Sparkles, Volume2 } from 'lucide-react';
import { localAnalyze, aiExplainQuestion } from '../lib/ai';
import { tts } from '../lib/tts';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';

export interface AnswerDetailProps {
  question: string;
  options: string[];
  answer: number;
  picked?: number;
  explain?: string;
  context?: string;
  contextLabel?: string;
}

/** 题解面板：解析 + 正误原因 + 关键词 + 原文定位 + AI 深析 */
export default function AnswerDetail({
  question,
  options,
  answer,
  picked,
  explain,
  context,
  contextLabel = '相关原文',
}: AnswerDetailProps) {
  const extra = localAnalyze({ question, options, answer, picked, explain, transcriptOrPassage: context });
  const [ai, setAi] = useState('');
  const [loading, setLoading] = useState(false);

  const runAi = async () => {
    setLoading(true);
    try {
      const text = await aiExplainQuestion({ question, options, answer, picked, explain, context });
      setAi(text);
      toast('AI 深析完成', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'AI 暂不可用', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-border/60 bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-black">
          答案 <span className="text-ink-teal">{extra.correctLabel}</span>
          {extra.yourLabel && (
            <span className={cn('ml-2', extra.isCorrect ? 'text-success' : 'text-danger')}>
              你的选择 {extra.yourLabel} · {extra.isCorrect ? '正确' : '错误'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => tts.speak(question)}
          className="rounded-xl border border-border/60 bg-card px-2 py-1 text-[10px] font-bold"
        >
          <Volume2 className="inline size-3" />
          读题
        </button>
      </div>

      <div>
        <div className="text-[11px] font-black text-muted-foreground">考点</div>
        <p className="mt-0.5 text-sm font-semibold">{extra.focus}</p>
      </div>

      <div>
        <div className="text-[11px] font-black text-muted-foreground">为何选 {extra.correctLabel}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">{extra.whyCorrect}</p>
        <p className="mt-1 text-xs font-bold">
          正确项：{String.fromCharCode(65 + answer)}. {options[answer]}
        </p>
        <button
          type="button"
          className="mt-1 text-[11px] font-bold text-ink-teal"
          onClick={() => tts.speak(options[answer] || '')}
        >
          朗读正确选项
        </button>
      </div>

      {!!extra.whyOthers.length && (
        <div>
          <div className="text-[11px] font-black text-muted-foreground">其它选项</div>
          <ul className="mt-1 space-y-1.5">
            {extra.whyOthers.map((o) => (
              <li key={o.label} className="text-[11px] leading-relaxed">
                <span className="font-black">{o.label}.</span> {o.text}
                <span className="ml-1 text-muted-foreground">— {o.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {context && (
        <div>
          <div className="text-[11px] font-black text-muted-foreground">{contextLabel}定位</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{extra.locate}</p>
        </div>
      )}

      {!!extra.keywords.filter((k) => k.en).length && (
        <div className="flex flex-wrap gap-1.5">
          {extra.keywords
            .filter((k) => k.en)
            .map((k) => (
              <button
                key={k.en}
                type="button"
                onClick={() => tts.speak(k.en)}
                className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
              >
                🔊 {k.en}
              </button>
            ))}
        </div>
      )}

      <div className="border-t border-border/50 pt-2">
        {!ai ? (
          <button
            type="button"
            onClick={runAi}
            disabled={loading}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary/10 py-2 text-xs font-black text-ink-teal disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? 'AI 分析中…' : 'AI 深度解析'}
          </button>
        ) : (
          <div>
            <div className="mb-1 flex items-center gap-1 text-[11px] font-black text-ink-teal">
              <Sparkles className="size-3.5" />
              AI 解析
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">{ai}</p>
          </div>
        )}
      </div>
    </div>
  );
}
