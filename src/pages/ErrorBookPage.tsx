import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Check, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { store } from '../lib/store';
import { toast } from '../lib/toast';
import { sfx } from '../lib/sfx';
import { cn } from '../lib/cn';
import { usePageMemory } from '../lib/page-memory';

const TYPE_LABEL: Record<string, string> = {
  all: '全部',
  listening: '听力',
  reading: '阅读',
  grammar: '语法',
  dictation: '听写',
  other: '其它',
};

const TYPE_PATH: Record<string, string> = {
  listening: '/listening',
  reading: '/reading',
  grammar: '/grammar',
  dictation: '/dictation',
};

/** 错题本：筛选 + 再练 + 已掌握 + 清空本类 */
export default function ErrorBookPage() {
  const [state, setState] = useState(store.get());
  const [filter, setFilter] = usePageMemory<'all' | string>('error-filter', 'all');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewInput, setReviewInput] = useState('');

  useEffect(() => store.subscribe(() => setState(store.get())), []);

  const all = state.errors;
  const list = all.filter((e) => filter === 'all' || e.type === filter);
  const pending = list.filter((e) => !e.mastered);
  const reviewing = reviewId ? all.find((e) => e.id === reviewId) : null;

  const types = ['all', ...Array.from(new Set(all.map((e) => e.type)))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-muted-foreground">
          共 {all.length} · 待掌握 {all.filter((e) => !e.mastered).length}
        </div>
        {filter !== 'all' && (
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-2 py-1 text-[10px] font-bold"
            onClick={() => {
              const n = all.filter((e) => e.type === filter).length;
              if (!confirm(`清空「${TYPE_LABEL[filter] || filter}」下 ${n} 道错题？`)) return;
              n && store.update({ errors: all.filter((e) => e.type !== filter) });
              toast('已清空该分类', 'info');
            }}
          >
            清空本类
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {types.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
              filter === f ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {TYPE_LABEL[f] || f}
            {f !== 'all' && ` ${all.filter((e) => e.type === f).length}`}
          </button>
        ))}
      </div>

      {reviewing && (
        <div className="rounded-3xl border border-primary/40 bg-primary-soft/40 p-4">
          <div className="text-sm font-black">再练一次</div>
          <p className="mt-2 text-sm font-bold">{reviewing.question}</p>
          <p className="mt-1 text-xs text-muted-foreground">正确：{reviewing.correctAnswer}</p>
          <input
            value={reviewInput}
            onChange={(e) => setReviewInput(e.target.value)}
            placeholder="回忆后输入你的答案"
            className="mt-3 w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-2xl bg-primary py-2 text-xs font-black text-white"
              onClick={() => {
                const ok =
                  reviewInput.trim().toLowerCase() === reviewing.correctAnswer.trim().toLowerCase() ||
                  reviewInput.trim() === reviewing.correctAnswer.trim();
                if (ok) {
                  sfx.correct();
                  // 掌握：标记
                  const next = all.map((e) => (e.id === reviewing.id ? { ...e, mastered: true } : e));
                  store.update({ errors: next });
                  toast('已掌握，本题移出待练', 'success');
                } else {
                  sfx.wrong();
                  toast(`还不对：${reviewing.correctAnswer}`, 'error');
                }
                setReviewId(null);
                setReviewInput('');
              }}
            >
              提交
            </button>
            <button
              type="button"
              className="rounded-2xl border border-border/60 px-3 text-xs font-bold"
              onClick={() => {
                setReviewId(null);
                setReviewInput('');
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {!list.length && (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
          <p className="text-sm font-bold">暂无错题</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/listening" className="rounded-2xl bg-primary px-3 py-2 text-xs font-black text-white">
              听力
            </Link>
            <Link to="/reading" className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold">
              阅读
            </Link>
            <Link to="/grammar" className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold">
              语法
            </Link>
          </div>
        </div>
      )}

      <div className="stagger space-y-3">
        {list.map((e) => (
          <article
            key={e.id}
            className={cn(
              'rounded-3xl border p-4',
              e.mastered ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-500/5' : 'border-border/60 bg-card',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[11px] font-bold text-muted-foreground">
                {e.type} · {e.source} · {e.date}
                {e.mastered && <span className="ml-2 text-emerald-600">已掌握</span>}
              </div>
              <div className="flex gap-1">
                {!e.mastered && (
                  <button
                    type="button"
                    aria-label="再练"
                    className="rounded-xl p-1 text-muted-foreground"
                    onClick={() => {
                      setReviewId(e.id);
                      setReviewInput(e.myAnswer === '（空）' ? '' : '');
                    }}
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="标记掌握"
                  className="rounded-xl p-1 text-muted-foreground"
                  onClick={() => {
                    store.update({ errors: all.map((x) => (x.id === e.id ? { ...x, mastered: !x.mastered } : x)) });
                    sfx.click();
                  }}
                >
                  <Check className={cn('size-4', e.mastered && 'text-success')} />
                </button>
                <button
                  type="button"
                  aria-label="删除"
                  className="rounded-xl p-1 text-muted-foreground"
                  onClick={() => {
                    store.removeError(e.id);
                    toast('已删除', 'info');
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm font-bold">{e.question}</p>
            <p className="mt-2 text-xs text-danger">我的：{e.myAnswer}</p>
            <p className="text-xs text-success">正确：{e.correctAnswer}</p>
            {e.explain && (
              <p className="mt-2 rounded-2xl bg-muted p-2 text-[11px] text-muted-foreground">{e.explain}</p>
            )}
            {TYPE_PATH[e.type] && (
              <Link
                to={TYPE_PATH[e.type]}
                className="mt-2 inline-block text-[11px] font-bold text-ink-teal"
              >
                去{TYPE_LABEL[e.type] || e.type}再练 →
              </Link>
            )}
          </article>
        ))}
      </div>
      {!!pending.length && (
        <button
          type="button"
          className="w-full rounded-2xl border border-border/60 py-2 text-xs font-bold text-muted-foreground"
          onClick={() => {
            const first = pending[0];
            setReviewId(first.id);
            setReviewInput('');
          }}
        >
          <Filter className="mr-1 inline size-3.5" />
          从第一道待掌握题开始再练
        </button>
      )}
    </div>
  );
}
