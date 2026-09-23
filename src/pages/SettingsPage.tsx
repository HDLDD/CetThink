import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, Volume2, Download, Upload, VolumeX, Sparkles, Loader2 } from 'lucide-react';
import { store } from '../lib/store';
import { applyTheme } from '../lib/theme';
import { tts, listLocalVoices, getLocalVoiceId, setLocalVoiceId } from '../lib/tts';
import { sfx, isSfxEnabled, setSfxEnabled } from '../lib/sfx';
import { downloadBackup, importBackup } from '../lib/backup';
import { storageHealth } from '../lib/persist';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';
import {
  getAiProxy,
  setAiProxy,
  getUserAiKey,
  setUserAiKey,
  aiChat,
} from '../lib/ai';

function ToggleRow({
  title,
  desc,
  on,
  onToggle,
}: {
  title: string;
  desc?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-black">{title}</div>
        {desc && <div className="text-[11px] text-muted-foreground">{desc}</div>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'shrink-0 rounded-2xl px-3 py-2 text-xs font-bold',
          on ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
        )}
      >
        {on ? '开' : '关'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [state, setState] = useState(store.get());
  const [sfxOn, setSfxOn] = useState(() => isSfxEnabled());
  const [proxy, setProxy] = useState(() => getAiProxy());
  const [aiKey, setAiKey] = useState(() => getUserAiKey());
  const [testingAi, setTestingAi] = useState(false);
  const [engine, setEngine] = useState('web');
  const [nativeOk, setNativeOk] = useState(false);
  const [localVoice, setLocalVoice] = useState(() => getLocalVoiceId());
  const health = useMemo(() => storageHealth(), [state]);

  useEffect(() => store.subscribe(() => setState(store.get())), []);
  useEffect(() => {
    tts.warm();
    void tts.diagnose().then((d) => {
      setEngine(d.engine);
      setNativeOk(!!(d.sherpaAvailable || d.android));
    });
  }, []);

  const s = state.settings;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="text-sm font-black">考试级别</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['CET-4', 'CET-6'] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => store.setSettings({ examLevel: lv, wordBook: lv === 'CET-4' ? 'cet4' : 'cet6' })}
              className={cn(
                'rounded-2xl border py-3 text-sm font-black',
                s.examLevel === lv ? 'border-primary bg-primary-soft text-ink-teal' : 'border-border/60',
              )}
            >
              {lv === 'CET-4' ? '四级' : '六级'}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4 space-y-4">
        <div className="text-sm font-black">学习自由度（可任意设定）</div>

        <label className="block text-[11px] font-bold text-muted-foreground">
          每日新词目标（1–500，自定义）
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min={1}
              max={500}
              value={s.dailyWordTarget}
              onChange={(e) => {
                const n = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                store.setSettings({ dailyWordTarget: n });
              }}
              className="w-28 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm font-black text-foreground outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-1">
              {[10, 20, 30, 50, 80, 100, 150, 200].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => store.setSettings({ dailyWordTarget: n })}
                  className={cn(
                    'rounded-full px-2 py-1 text-[10px] font-bold',
                    s.dailyWordTarget === n ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </label>

        <label className="block text-[11px] font-bold text-muted-foreground">
          自动翻页延迟（0 = 关闭自动翻页；50–3000ms）
          <div className="mt-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={3000}
              step={50}
              value={s.autoAdvanceMs || 0}
              onChange={(e) => store.setSettings({ autoAdvanceMs: Number(e.target.value) })}
              className="flex-1 accent-[#00B894]"
            />
            <input
              type="number"
              min={0}
              max={3000}
              step={50}
              value={s.autoAdvanceMs || 0}
              onChange={(e) => store.setSettings({ autoAdvanceMs: Math.max(0, Math.min(3000, Number(e.target.value) || 0)) })}
              className="w-20 rounded-2xl border border-border/60 bg-background px-2 py-1.5 text-xs font-bold outline-none focus:border-primary"
            />
          </div>
        </label>

        <ToggleRow
          title="评分前必须先看释义"
          desc="关闭后可直接点「记得/忘了」"
          on={s.requireFlip !== false}
          onToggle={() => store.setSettings({ requireFlip: !(s.requireFlip !== false) })}
        />
        <ToggleRow
          title="每日目标严格卡名额"
          desc="开启后名额用尽会拦截继续学新词；关闭只提示不拦截"
          on={!!s.enforceDailyQuota}
          onToggle={() => store.setSettings({ enforceDailyQuota: !s.enforceDailyQuota })}
        />
        <ToggleRow
          title="模考须做完全部板块才能交卷"
          desc="关闭后可随时交卷（按已完成度估分）"
          on={!!s.examRequireAllDone}
          onToggle={() => store.setSettings({ examRequireAllDone: !s.examRequireAllDone })}
        />
        <ToggleRow
          title="听力显示原文"
          desc="听力练习时是否默认展开原文"
          on={!!s.showTranscript}
          onToggle={() => store.setSettings({ showTranscript: !s.showTranscript })}
        />

        <div>
          <div className="text-sm font-black">词表排序</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ['freq', '词频优先'],
                ['alpha', '字母顺序'],
                ['random', '随机打乱'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => store.setSettings({ vocabSort: k })}
                className={cn(
                  'rounded-2xl border px-3 py-2 text-xs font-bold',
                  (s.vocabSort || 'freq') === k ? 'border-primary bg-primary-soft text-ink-teal' : 'border-border/60',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold"
            onClick={() => {
              if (!confirm('重置当前词书的背词会话进度（掌握记录保留）？')) return;
              store.resetVocabSession(state.settings.examLevel);
              toast('已重置背词会话', 'info');
            }}
          >
            重置背词会话
          </button>
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold"
            onClick={() => {
              if (!confirm('清空全部错题？')) return;
              store.update({ errors: [] });
              toast('错题已清空', 'info');
            }}
          >
            清空错题本
          </button>
          <button
            type="button"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            onClick={() => {
              if (!confirm('危险：清空全部学习数据（进度/收藏/错题/统计）？建议先导出备份。')) return;
              // 必须连快照与 IndexedDB 一起清：只清 main/backup 的话，
              // 残留副本会在下次启动被当成"更完整的数据"恢复回来
              void store.clearAll().then(() => {
                toast('已彻底清空（含快照与 IndexedDB）', 'success');
                setTimeout(() => window.location.reload(), 700);
              });
            }}
          >
            危险：清空全部数据
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black">主题</div>
          <button
            type="button"
            onClick={() => {
              const next = s.theme === 'dark' ? 'light' : 'dark';
              store.setSettings({ theme: next });
              applyTheme(next);
            }}
            className="inline-flex items-center gap-1 rounded-2xl bg-muted px-3 py-2 text-xs font-bold"
          >
            {s.theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            {s.theme === 'dark' ? '深色' : '浅色'}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-black">答题音效</div>
            <div className="text-[11px] text-muted-foreground">答对/答错即时提示</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !sfxOn;
              setSfxOn(next);
              setSfxEnabled(next);
              if (next) sfx.correct();
            }}
            className="inline-flex items-center gap-1 rounded-2xl bg-muted px-3 py-2 text-xs font-bold"
          >
            {sfxOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            {sfxOn ? '开' : '关'}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4 space-y-2">
        <div className="text-sm font-black">手机朗读引擎</div>
        <p className="text-[11px] text-muted-foreground">
          链路：离线 sherpa → 系统 TTS → 云端 Edge → Google → Web
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div>当前引擎：<span className="font-bold text-foreground">{engine}</span></div>
          <div>原生/离线：<span className="font-bold text-foreground">{nativeOk ? '可用' : '待检'}</span></div>
        </div>
        <label className="text-[11px] font-bold text-muted-foreground">
          离线音色（Kokoro / Piper）
          <select
            className="mt-1 w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-xs font-normal text-foreground outline-none focus:border-primary"
            defaultValue={localVoice}
            onChange={(e) => {
              setLocalVoice(e.target.value);
              setLocalVoiceId(e.target.value);
              toast('离线音色已切换', 'success');
            }}
          >
            {listLocalVoices().map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.accent} · {v.note}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-2xl bg-primary px-3 py-2 text-xs font-black text-white"
            onClick={() => {
              tts.setRate(s.ttsRate || 0.95);
              void tts.speak('The quick brown fox jumps over the lazy dog.', () => {
                setEngine(tts.getEngine());
                const r = tts.getLastReport();
                if (r) toast(`实测：${r.engine} · 起播 ${r.firstAudioMs}ms`, 'info');
              });
            }}
          >
            <Volume2 className="mr-1 inline size-3.5" />
            朗读测试
          </button>
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold"
            onClick={async () => {
              tts.stop();
              const d = await tts.diagnose();
              toast(
                `引擎=${d.engine} · 离线=${d.sherpaStatus || (d.sherpaDisabled ? '停用' : d.sherpaAvailable ? '待加载' : '无')} · 系统=${d.android ? '有' : '无'} · Web=${d.webVoices}`,
                'info',
                5000,
              );
              if (d.sherpaDisabled) {
                tts.reenableOffline();
                toast('已重新启用离线引擎', 'success');
              }
            }}
          >
            朗读自检
          </button>
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold"
            onClick={() => {
              const r = tts.getLastReport();
              if (!r) {
                toast('尚无朗读实测，请先点「朗读测试」', 'info');
                return;
              }
              toast(
                `上次朗读：${r.engine} · 起播 ${r.firstAudioMs}ms · ${r.fellBack ? '已降级' : '首选引擎'}`,
                'info',
                4500,
              );
            }}
          >
            实测回显
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="text-sm font-black">数据健康</div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          主副本评分 {health.main} · 备份 {health.backup} · 快照 {health.snapshot}
          {health.lastSave ? ` · 上次保存 ${new Date(health.lastSave).toLocaleString('zh-CN')}` : ''}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          跟踪词 {store.summary().wordsTracked} · 累计 {store.summary().minutes} 分钟 · 连胜{' '}
          {store.summary().streak} 天
        </p>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-black">
          <Sparkles className="size-4 text-ink-teal" />
          AI 功能
        </div>
        <p className="text-[11px] text-muted-foreground">
          用于题解深析、作文批改。默认走 NativeThink 代理（出厂免费档）。
        </p>
        <label className="block text-[11px] font-bold text-muted-foreground">
          服务地址
          <input
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-xs font-normal text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="block text-[11px] font-bold text-muted-foreground">
          自定义 Key（可选，智谱 GLM）
          <input
            type="password"
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            placeholder="不填则用出厂配置"
            className="mt-1 w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-xs font-normal text-foreground outline-none focus:border-primary"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-border/60 py-2 text-xs font-bold"
            onClick={() => {
              setAiProxy(proxy);
              setUserAiKey(aiKey);
              toast('AI 配置已保存', 'success');
            }}
          >
            保存配置
          </button>
          <button
            type="button"
            disabled={testingAi}
            className="flex-1 rounded-2xl bg-primary py-2 text-xs font-black text-white disabled:opacity-60"
            onClick={async () => {
              setTestingAi(true);
              setAiProxy(proxy);
              setUserAiKey(aiKey);
              try {
                const r = await aiChat([{ role: 'user', content: '请回复：连接成功' }], { maxTokens: 20 });
                toast(r.slice(0, 40) || '成功', 'success');
                sfx.correct();
              } catch (e) {
                toast(e instanceof Error ? e.message : '连接失败', 'error');
                sfx.wrong();
              } finally {
                setTestingAi(false);
              }
            }}
          >
            {testingAi ? <Loader2 className="mx-auto size-4 animate-spin" /> : '测试连接'}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="text-sm font-black">朗读语速</div>
        <input
          type="range"
          min={0.6}
          max={1.4}
          step={0.05}
          value={s.ttsRate}
          onChange={(e) => {
            const r = Number(e.target.value);
            store.setSettings({ ttsRate: r });
            tts.setRate(r);
          }}
          className="mt-3 w-full accent-[#00B894]"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{s.ttsRate.toFixed(2)}x</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 font-bold text-ink-teal"
            onClick={() => tts.speak('This is a CetThink pronunciation preview.')}
          >
            <Volume2 className="size-4" /> 试听
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4 space-y-2">
        <div className="text-sm font-black">数据备份</div>
        <p className="text-[11px] text-muted-foreground">
          离线本地存储 · 换机前导出
        </p>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-black text-white"
          onClick={() => {
            void downloadBackup();
            toast('已导出备份', 'success');
          }}
        >
          <Download className="size-4" />
          导出学习数据
        </button>
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border/60 py-2.5 text-sm font-bold">
          <Upload className="size-4" />
          导入备份
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const ok = importBackup(await f.text());
              toast(ok ? '导入成功，刷新中…' : '文件无效', ok ? 'success' : 'error');
              if (ok) setTimeout(() => window.location.reload(), 400);
            }}
          />
        </label>
        <p className="text-[11px] text-muted-foreground">
          收藏 {state.favorites.length} · 错题 {state.errors.length} · 累计 {state.profile.totalMinutes} 分钟
        </p>
      </section>
    </div>
  );
}
