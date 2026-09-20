import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, ChevronRight } from 'lucide-react';
import { tts } from '../lib/tts';
import { store } from '../lib/store';
import { sfx } from '../lib/sfx';
import { cn } from '../lib/cn';
import { toast } from '../lib/toast';
import AnswerDetail from '../components/AnswerDetail';

interface Q {
  id: string;
  title: string;
  options: string[];
  answer: number;
  explain?: string;
}
interface ListeningItem {
  id: string;
  title: string;
  section: string;
  transcript: { speaker: string; text: string }[];
  questions: Q[];
}

export default function ListeningPage() {
  const [list, setList] = useState<ListeningItem[]>([]);
  const [cur, setCur] = useState<ListeningItem | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [showTranscript, setShowTranscript] = useState(() => store.get().settings.showTranscript);
  const [filterSec, setFilterSec] = useState<string>('all');
  const [progress, setProgress] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('cetthink_listen_pos') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => setList((p.listening || []).filter((x: ListeningItem) => x.questions?.length)));
  }, []);

  const sections = useMemo(() => {
    const s = new Set(list.map((x) => x.section));
    return ['all', ...Array.from(s)];
  }, [list]);

  const filtered = list.filter((x) => filterSec === 'all' || x.section === filterSec);

  const playAll = async () => {
    if (!cur) return;
    setPlaying(true);
    setLine(0);
    let i = 0;
    const next = () => {
      if (i >= cur.transcript.length) {
        setPlaying(false);
        return;
      }
      setLine(i);
      tts.speak(cur.transcript[i].text.replace(/^[MWQ]:\s*/i, ''), () => {
        i += 1;
        setTimeout(next, 280);
      });
    };
    next();
  };

  const playLine = (text: string) => {
    tts.speak(text.replace(/^[MWQ]:\s*/i, ''));
  };

  if (!cur) {
    return (
      <div className="stagger space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sections.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterSec(s)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                filterSec === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {s === 'all' ? '全部' : s}
            </button>
          ))}
        </div>
        {filtered.map((item) => {
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
                setShowTranscript(store.get().settings.showTranscript);
              }}
              className="flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm"
            >
              <div>
                <div className="text-sm font-black">{item.title}</div>
                <div className="mt-0.5 text-[11px] font-bold text-muted-foreground">
                  {item.section} · {item.questions.length} 题
                  {pos > 0 && <span className="ml-2 text-ink-teal">上次到第 {pos + 1} 题</span>}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          );
        })}
        {!filtered.length && <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>}
      </div>
    );
  }

  const q = cur.questions[qIdx];
  const picked = answers[q?.id];
  const contextText = cur.transcript.map((t) => `${t.speaker}: ${t.text}`).join(' ');
  const answered = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-bold text-ink-teal"
          onClick={() => {
            try {
              localStorage.setItem(
                'cetthink_listen_pos',
                JSON.stringify({ ...progress, [cur.id]: qIdx }),
              );
            } catch {
              /* ignore */
            }
            setProgress((p) => ({ ...p, [cur.id]: qIdx }));
            tts.stop();
            setCur(null);
            toast('已记住进度', 'info', 1200);
          }}
        >
          ← 返回（保存进度）
        </button>
        <button
          type="button"
          className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold"
          onClick={() => {
            const next = !showTranscript;
            setShowTranscript(next);
            store.setSettings({ showTranscript: next });
          }}
        >
          {showTranscript ? '隐藏原文' : '显示原文'}
        </button>
      </div>
      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="text-sm font-black">{cur.title}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          已答 {answered}/{cur.questions.length} · 第 {qIdx + 1} 题
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (playing) {
                tts.stop();
                setPlaying(false);
              } else void playAll();
            }}
            className="inline-flex items-center gap-1 rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? '停止' : '播放原文'}
          </button>
          <button
            type="button"
            onClick={() => cur.transcript.forEach((t, i) => setTimeout(() => playLine(t.text), i * 3500))}
            className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold"
          >
            逐句慢放
          </button>
        </div>
        {showTranscript && (
          <div className="mt-4 space-y-2">
            {cur.transcript.map((t, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl px-2 py-1.5 text-sm leading-relaxed transition',
                  playing && i === line ? 'bg-primary-soft font-bold text-ink-teal' : 'text-foreground/80',
                )}
              >
                <button type="button" className="w-full text-left" onClick={() => playLine(t.text)}>
                  <span className="mr-1 font-black text-muted-foreground">{t.speaker}</span>
                  {t.text}
                  <span className="ml-1 text-[10px] text-muted-foreground">🔊</span>
                </button>
              </div>
            ))}
          </div>
        )}
        {!showTranscript && (
          <p className="mt-3 rounded-2xl bg-muted/50 p-2 text-center text-[11px] text-muted-foreground">
            原文默认隐藏（听力练习）· 点「显示原文」查看
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
          <span>
            第{' '}
            <input
              type="number"
              min={1}
              max={cur.questions.length}
              value={qIdx + 1}
              onChange={(e) => {
                const n = Number(e.target.value) || 1;
                setQIdx(Math.max(0, Math.min(cur.questions.length - 1, n - 1)));
                setChecked(false);
              }}
              className="w-14 rounded-lg border border-border/60 bg-card px-1 py-0.5 text-center font-bold text-foreground outline-none focus:border-primary"
              aria-label="跳到第几题"
            />
            /{cur.questions.length} 题
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
                    type: 'listening',
                    source: cur.title,
                    question: qq.title,
                    myAnswer: qq.options?.[ans] || '未作答',
                    correctAnswer: qq.options?.[qq.answer] || '—',
                    explain: qq.explain || '',
                  });
                }
              });
              const right = cur.questions.filter((qq) => answers[qq.id] === qq.answer).length;
              store.recordStudy(3, 0, right);
              try {
                localStorage.setItem(
                  'cetthink_listen_pos',
                  JSON.stringify({ ...progress, [cur.id]: qIdx }),
                );
              } catch {
                /* ignore */
              }
              sfx.done();
              toast(`交卷：对 ${right}/${cur.questions.length}`, 'success');
            }}
          >
            交卷看解析
          </button>
        </div>
        <p className="text-sm font-bold">{q.title}</p>
        <div className="mt-3 space-y-2">
          {q.options.map((opt, i) => {
            const state =
              checked && i === q.answer
                ? 'border-success bg-success/10'
                : checked && picked === i
                  ? 'border-danger bg-danger/10'
                  : picked === i
                    ? 'border-primary bg-primary-soft'
                    : 'border-border/60';
            return (
              <button
                key={i}
                type="button"
                className={cn('w-full rounded-2xl border px-3 py-3 text-left text-sm', state)}
                onClick={() => {
                  if (checked) return;
                  setAnswers((a) => ({ ...a, [q.id]: i }));
                }}
              >
                <span className="mr-2 font-black text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {checked && q && (
          <AnswerDetail
            question={q.title}
            options={q.options}
            answer={q.answer}
            picked={picked}
            explain={q.explain}
            context={contextText}
            contextLabel="听力原文"
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
