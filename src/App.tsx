import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import Shell from './components/Shell';
import DashboardPage from './pages/DashboardPage';
import VocabPage from './pages/VocabPage';
import ReviewPage from './pages/ReviewPage';
import ListeningPage from './pages/ListeningPage';
import ReadingPage from './pages/ReadingPage';
import ExamPage from './pages/ExamPage';
import ErrorBookPage from './pages/ErrorBookPage';
import WritingPage from './pages/WritingPage';
import SkillsPage from './pages/SkillsPage';
import DictationPage from './pages/DictationPage';
import GrammarPage from './pages/GrammarPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import FavoritesPage from './pages/FavoritesPage';
import { applyTheme, getStoredTheme } from './lib/theme';
import { store, hydrateFromDeepStorage } from './lib/store';
import { tts } from './lib/tts';
import { checkBundledEngineHealth } from './lib/sherpa-tts';
import { writeLearningStats } from './lib/use-memory';

export default function App() {
  const state = useSyncExternalStore(store.subscribe, store.get);

  useEffect(() => {
    applyTheme(getStoredTheme());
    tts.setRate(store.get().settings.ttsRate || 0.95);
    checkBundledEngineHealth();
    tts.warm();
    void hydrateFromDeepStorage().then(() => {
      // 深恢复后同步学习统计记忆键（NativeThink STATS_KEY）
      try {
        writeLearningStats({
          streakDays: store.get().profile.streak,
          dailyGoalMinutes: store.get().settings.dailyWordTarget,
          todayMinutes: store.today().minutes,
          todayWords: store.today().words,
          todayReviews: store.today().reviews,
          moduleProgress: {
            vocab: Object.keys(store.get().vocab).length,
            review: 0,
            listening: 0,
            reading: 0,
            dictation: 0,
            grammar: 0,
            exam: store.get().examHistory.length,
            writing: 0,
          },
          totalDays: 0,
          totalMinutes: store.get().profile.totalMinutes,
          totalWords: store.get().profile.totalWords || 0,
          lastStudyDate: store.get().profile.lastStudyDate || '',
        });
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    applyTheme(state.settings.theme);
  }, [state.settings.theme]);

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vocab" element={<VocabPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/listening" element={<ListeningPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/dictation" element={<DictationPage />} />
        <Route path="/grammar" element={<GrammarPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/errors" element={<ErrorBookPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
