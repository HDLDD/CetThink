/** CetThink 成就系统 — 借鉴 NativeThink，场景对齐四六级备考 */

export interface AchStats {
  streak: number;
  todayWords: number;
  totalMinutes: number;
  errorCount: number;
  vocabMastered: number;
  examsDone: number;
  favoriteCount: number;
  listeningDone: number;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: (s: AchStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_word', name: '启程', desc: '学习第一个单词', icon: '🌱', condition: (s) => s.todayWords >= 1 },
  { id: 'words_30', name: '每日达标', desc: '单日学词达 30', icon: '📖', condition: (s) => s.todayWords >= 30 },
  { id: 'streak_3', name: '三日坚持', desc: '连续学习 3 天', icon: '🔥', condition: (s) => s.streak >= 3 },
  { id: 'streak_7', name: '一周达人', desc: '连续学习 7 天', icon: '⭐', condition: (s) => s.streak >= 7 },
  { id: 'streak_14', name: '半月修行', desc: '连续学习 14 天', icon: '🌟', condition: (s) => s.streak >= 14 },
  { id: 'streak_30', name: '月度冠军', desc: '连续学习 30 天', icon: '👑', condition: (s) => s.streak >= 30 },
  { id: 'master_50', name: '词汇入门', desc: '掌握度达标 50 词', icon: '📚', condition: (s) => s.vocabMastered >= 50 },
  { id: 'master_200', name: '词汇进阶', desc: '掌握度达标 200 词', icon: '🎓', condition: (s) => s.vocabMastered >= 200 },
  { id: 'master_500', name: '词场高手', desc: '掌握度达标 500 词', icon: '🏆', condition: (s) => s.vocabMastered >= 500 },
  { id: 'listen_1', name: '竖起耳朵', desc: '完成一次听力练习', icon: '🎧', condition: (s) => s.listeningDone >= 1 },
  { id: 'listen_10', name: '精听达人', desc: '完成 10 次听力', icon: '🔉', condition: (s) => s.listeningDone >= 10 },
  { id: 'exam_1', name: '模考启程', desc: '完成一次模考', icon: '🎯', condition: (s) => s.examsDone >= 1 },
  { id: 'exam_3', name: '模考常客', desc: '完成 3 次模考', icon: '🏅', condition: (s) => s.examsDone >= 3 },
  { id: 'err_collect', name: '错题收集者', desc: '错题本达到 10 题', icon: '📕', condition: (s) => s.errorCount >= 10 },
  { id: 'fav_10', name: '收藏家', desc: '收藏 10 项内容', icon: '❤️', condition: (s) => s.favoriteCount >= 10 },
  { id: 'time_60', name: '专注一小时', desc: '累计学习 60 分钟', icon: '⏱️', condition: (s) => s.totalMinutes >= 60 },
  { id: 'time_600', name: '十小时里程碑', desc: '累计学习 600 分钟', icon: '💪', condition: (s) => s.totalMinutes >= 600 },
];

const KEY = 'cetthink_achievements';

export function loadUnlocked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveUnlocked(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** 检查并解锁，返回新解锁的成就 */
export function checkAchievements(stats: AchStats): Achievement[] {
  const unlocked = new Set(loadUnlocked());
  const newly: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    try {
      if (a.condition(stats)) {
        unlocked.add(a.id);
        newly.push(a);
      }
    } catch {
      /* ignore */
    }
  }
  if (newly.length) saveUnlocked([...unlocked]);
  return newly;
}

export function countMastered(vocab: Record<string, { mastery?: number }>): number {
  return Object.values(vocab).filter((p) => (p.mastery || 0) >= 0.8).length;
}
