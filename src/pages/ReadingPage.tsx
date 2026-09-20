import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { store } from '../lib/store';
import { sfx } from '../lib/sfx';
import { cn } from '../lib/cn';
import { toast } from '../lib/toast';
import { tts } from '../lib/tts';
import AnswerDetail from '../components/AnswerDetail';

interface Q {
  id: string;
  title: string;
  options: string[];
  answer: number;
  explain?: string;
}
interface ReadingItem {
  id: string;
  title: string;
  passage: string;
  questions: Q[];
}

export default function ReadingPage() {
  const [list, setList] = useState<ReadingItem[]>([]);
  const [cur, setCur] = useState<ReadingItem | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('cetthink_read_pos') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => setList((p.reading || []).filter((x: ReadingItem) => x.questions?.length)));
  }, []);

  if (!cur) {
    return (
      <div className="stagger space-y-3">
        {list.map((item) => {
          const pos = progress[item.id] || 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCur(item);
                setQIdx(Math.min(pos, item.questions.length - 1));
                setAnswers({});
                setChecked(false);
              }}
              className="flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm"
            >
              <div>
                <div className="text-sm font-black">{item.title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {item.questions.length} 题
                  {pos > 0 && <span className="ml-2 text-ink-teal">上次第 {pos + 1} 题</span>}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    );
  }

  const q = cur.questions[qIdx];
  const picked = answers[q?.id];

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="text-xs font-bold text-ink-teal"
        onClick={() => {
          try {
            localStorage.setItem(
              'cetthink_read_pos',
              JSON.stringify({ ...progress, [cur.id]: qIdx }),
            );
          } catch {
            /* ignore */
          }
          setProgress((p) => ({ ...p, [cur.id]: qIdx }));
          setCur(null);
        }}
      >
        ← 返回（保存进度）
      </button>
      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black">{cur.title}</div>
          <button
            type="button"
            className="rounded-xl border border-border/60 px-2 py-1 text-[10px] font-bold"
            onClick={() => tts.speak(cur.passage.slice(0, 500))}
          >
            朗读段落
          </button>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{cur.passage}</p>
      </section>
      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
          <span>
            {qIdx + 1}/{cur.questions.length}
          </span>
          <button
            type="button"
            className="text-ink-teal"
            onClick={() => {
              setChecked(true);
              Object.entries(answers).forEach(([qid, ans]) => {
                const qq = cur.questions.find((x) => x.id === qid);
                if (qq && ans !== qq.answer) {
                  sfx.wrong();
                  store.addError({
                    type: 'reading',
                    source: cur.title,
                    question: qq.title,
                    myAnswer: qq.options[ans],
                    correctAnswer: qq.options[qq.answer],
                    explain: qq.explain || '',
                  });
                }
              });
              store.recordStudy(5, 0, cur.questions.filter((qq) => answers[qq.id] === qq.answer).length);
              sfx.done();
              const right = cur.questions.filter((qq) => answers[qq.id] === qq.answer).length;
              toast(`交卷：对 ${right}/${cur.questions.length}`, 'success');
            }}
          >
            交卷看解析
          </button>
        </div>
        <p className="text-sm font-bold">{q.title}</p>
        <div className="mt-3 space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                'w-full rounded-2xl border px-3 py-3 text-left text-sm',
                checked && i === q.answer && 'border-success bg-success/10',
                checked && answers[q.id] === i && i !== q.answer && 'border-danger bg-danger/10',
                !checked && answers[q.id] === i && 'border-primary bg-primary-soft',
                answers[q.id] !== i && !(checked && i === q.answer) && 'border-border/60',
              )}
              onClick={() => {
                if (checked) return;
                setAnswers((a) => ({ ...a, [q.id]: i }));
              }}
            >
              <span className="mr-2 font-black text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        {checked && q && (
          <AnswerDetail
            question={q.title}
            options={q.options}
            answer={q.answer}
            picked={picked}
            explain={q.explain}
            context={cur.passage}
            contextLabel="篇章原文"
          />
        )}
        {checked && qIdx < cur.questions.length - 1 && (
          <button
            type="button"
            className="mt-3 w-full rounded-2xl bg-primary py-3 text-sm font-black text-white"
            onClick={() => setQIdx((n) => n + 1)}
          >
            下一题
          </button>
        )}
      </section>
    </div>
  );
}
