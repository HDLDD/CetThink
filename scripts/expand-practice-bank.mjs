/**
 * CetThink 题库 / 作文库 / 语料大规模扩充
 * 输出: public/data/practice.json 合并追加；可选 vocab 辅料补全
 * 用法: node scripts/expand-practice-bank.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(import.meta.dirname, '../public/data');
const practicePath = path.join(DATA_DIR, 'practice.json');
const base = JSON.parse(fs.readFileSync(practicePath, 'utf8'));

function q(id, title, options, answer, explain = '') {
  return { id, title, options, answer, explain };
}

function L(id, title, section, transcript, questions, duration = 40) {
  return {
    id,
    title,
    section,
    audioPack: { id: id + '-audio', src: null, durationSec: duration, speedSteps: [0.7, 0.9, 1.0, 1.2] },
    transcript,
    questions,
  };
}

function R(id, title, passage, questions) {
  return { id, title, passage, questions };
}

function C(id, title, passage, blanks) {
  return { id, title, passage, blanks };
}

function D(id, level, title, sentences) {
  return { id, level, title, sentences };
}

function W(id, level, title, prompt, essay, points) {
  return { id, level, title, prompt, essay, points: points || [] };
}

function T(id, level, cn, en) {
  return { id, level, cn, en };
}

function S(id, title, lines) {
  return { id, title, lines };
}

// ── 作文库：题目 + 参考范文 + 要点 ──
const writingEssays = [
  W('PE01', 'CET-4', '坚持锻炼的重要性',
    'For this part, you are allowed 30 minutes to write a short essay on the importance of regular exercise. You should write at least 120 words.',
    'Nowadays, many college students spend long hours sitting in classrooms or in front of screens, and regular exercise is often neglected. In my view, physical activity is essential for both body and mind.\n\nFirst, exercise strengthens the immune system and helps students keep fit. A simple thirty-minute jog several times a week can reduce the risk of common illnesses. Second, sports are an effective way to relieve stress. After intense study, playing basketball or doing yoga can refresh the mind and improve concentration in the next class. Finally, team sports teach cooperation and communication, which are valuable beyond campus.\n\nIn conclusion, universities should encourage students to form the habit of exercising. Only with a healthy body can we pursue academic goals more efficiently.',
    ['身体健康', '缓解压力', '团队合作', '总结呼吁']),
  W('PE02', 'CET-4', '网络课程的利与弊',
    'Write an essay on online courses. You should write at least 120 words and comment on both advantages and disadvantages.',
    'Online courses have become an important part of campus life. While they bring clear benefits, they also present challenges.\n\nOn the one hand, web-based learning offers great flexibility. Students can review recorded lectures at their own pace and access courses from famous universities far away. This is especially helpful for those who need to balance part-time jobs and study. On the other hand, online classes require strong self-discipline. Without a real classroom atmosphere, some students easily get distracted by social media and fall behind.\n\nTherefore, a blended model may work best: online resources for knowledge input, and offline discussion for deep understanding. Universities can also set clearer deadlines and interactive tasks to keep learners engaged.',
    ['灵活便利', '自律挑战', '混合模式', '制度设计']),
  W('PE03', 'CET-4', '宿舍生活与人际关系',
    'For this part, you are allowed 30 minutes to write an essay on how to get along with roommates. You should write at least 120 words.',
    'Dormitory life is an unforgettable part of college years, yet sharing a small room can sometimes lead to conflicts. Learning to get along with roommates is therefore a valuable lesson.\n\nTo begin with, respect for personal space and habits is fundamental. One should keep noise down at night and keep shared areas clean. Secondly, open communication prevents small misunderstandings from growing. If a problem appears, it is better to discuss it calmly instead of complaining behind someone\'s back. In addition, showing kindness in daily life—offering help when a roommate is ill, for example—builds trust over time.\n\nIn short, harmony in the dorm depends on respect, communication and care. These skills will also benefit our future work and family life.',
    ['尊重边界', '主动沟通', '日常善意', '能力迁移']),
  W('PE04', 'CET-4', '选择专业还是兴趣',
    'Some people think students should choose a major by interest, while others prefer job prospects. Write an essay of at least 120 words.',
    'When filling in college applications, students often face a hard choice: follow interest or chase job prospects. Both views have their reasons.\n\nThose who favor interest argue that passion keeps one motivated through difficult courses. A student who loves literature is more likely to read widely and write well. However, supporters of career planning point out that tuition and living costs are real. Majors with strong market demand may offer more internships and a smoother path to employment.\n\nAs far as I am concerned, the best solution is a balance. Students can choose a generally practical field and develop a serious interest within it. Career centers should also provide more guidance so that choices are based on facts rather than anxiety.',
    ['兴趣动力', '就业现实', '平衡策略', '学校指导']),
  W('PE05', 'CET-4', '手机依赖',
    'Write an essay on smartphone addiction among young people. You should write at least 120 words.',
    'Smartphones bring convenience, but they also make many young people overly dependent. This phenomenon deserves attention.\n\nThe most obvious harm is wasted time. Endless short videos and notifications fragment our attention, making it hard to finish a book or a long assignment. Moreover, looking at the screen late at night damages sleep quality, which in turn affects memory and mood. Some students even feel anxious when the phone is not at hand.\n\nTo deal with this problem, we can start with small rules: putting the phone away during study, turning off non-essential notifications, and replacing some screen time with face-to-face talks. Technology should serve us, not control us. With conscious effort, we can enjoy the benefits of smartphones without becoming their slaves.',
    ['时间碎片', '睡眠健康', '行为规则', '技术为人']),
  W('PE06', 'CET-4', '志愿服务',
    'Write an essay on the benefits of volunteer work for college students. Write at least 120 words.',
    'More universities now encourage students to take part in volunteer work. From tutoring children to helping at community events, such activities offer benefits beyond a line on a resume.\n\nFirst, volunteering develops responsibility. When others rely on you, you learn to keep promises and manage time carefully. Second, it widens horizons. Meeting people from different backgrounds helps students understand real social needs instead of only textbook theories. Third, teamwork and communication skills grow naturally when volunteers cooperate under pressure.\n\nOf course, study should still come first. Students need to choose programs that fit their schedule and interests rather than chasing certificates. When done properly, volunteer work can become one of the most valuable teachers on campus.',
    ['责任感', '社会视野', '沟通协作', '量力而行']),
  W('PE07', 'CET-4', '低碳生活',
    'For this part, you are allowed 30 minutes to write an essay on low-carbon life. You should write at least 120 words.',
    'Climate change is no longer a distant topic. A low-carbon lifestyle, starting from daily choices, is something college students can practice now.\n\nSmall actions matter. Carrying a reusable bottle and shopping bag reduces plastic waste. Choosing buses, subways or bicycles instead of short taxi rides cuts emissions. Turning off lights and unplugging chargers when leaving the dorm saves energy. If many students follow these habits, the collective effect will be significant.\n\nMeanwhile, campuses can support green living by installing more recycling bins and water refill stations. Courses and clubs may also raise awareness through practical projects.\n\nIn conclusion, a low-carbon life does not require dramatic sacrifice. It asks for consistent, sensible choices. Protecting the environment is protecting our own future.',
    ['日常减塑', '绿色出行', '校园支持', '长期习惯']),
  W('PE08', 'CET-4', '考试作弊问题',
    'Write an essay on why students cheat in exams and how to stop it. At least 120 words.',
    'Academic dishonesty, especially cheating in exams, remains a problem on some campuses. Understanding its causes is the first step toward a solution.\n\nSome students cheat because they leave revision until the last minute and fear failure. Others follow peers under wrong social pressure. Weak supervision and overly heavy course loads may also play a role.\n\nTo reduce cheating, punishment alone is not enough. Teachers should design assessments that test understanding rather than memorization, for example open-book questions or project-based work. Students, for their part, need to treat grades as feedback, not as the only measure of self-worth. A culture of integrity is built gradually—through clear rules, fair exams, and honest role models.\n\nTrue confidence comes from real ability, not from a copied answer.',
    ['拖延与恐惧', '同伴压力', '考核改革', '诚信文化']),
  W('PE09', 'CET-4', '阅读习惯',
    'Some people say print books are dying. Write your opinion on reading habits in the digital age. At least 120 words.',
    'With e-books and audio programs everywhere, some claim that print books are dying. In my view, the form of reading may change, but the habit of deep reading is more important than ever.\n\nDigital reading is convenient for search and portability. News, novels and textbooks can all fit into one device. However, screens also invite multitasking, and long serious works often suffer when attention jumps between apps. Paper books, by contrast, create a quiet physical space that many readers find helpful for concentration.\n\nWhat really matters is choosing the right medium for the purpose. Skimming updates on a phone is fine; studying a classic may deserve a printed copy and a notebook. Schools should still teach slow, careful reading so that technology expands our minds instead of shortening them.',
    ['数字便利', '纸质专注', '场景选择', '深度阅读']),
  W('PE10', 'CET-4', '兼职的利弊',
    'Write an essay on college students taking part-time jobs. Give your opinion. At least 120 words.',
    'Taking a part-time job is common among college students. Whether it is wise depends on how the work is arranged.\n\nA suitable job can teach time management and practical skills that classrooms rarely cover. Earning some money also eases family pressure and builds independence. Yet if work hours are too long, grades and health may decline. Some low-end jobs offer little learning and mainly consume energy.\n\nTherefore, students should set clear priorities. Study remains the main task. A job close to one\'s major, or one that trains communication and responsibility, is preferable. Limiting weekly hours and choosing flexible shifts helps keep a balance.\n\nPart-time work is a tool, not a goal. Used wisely, it enriches college life; used blindly, it becomes a burden.',
    ['技能与独立', '时间冲突', '岗位选择', '平衡优先']),
  W('PE11', 'CET-6', '人工智能与学习',
    'For this part, you are allowed 30 minutes to write an essay on how artificial intelligence should be used in university study. You should write at least 150 words.',
    'Artificial intelligence is reshaping how university students learn. Used thoughtfully, AI tools can deepen understanding; used carelessly, they may weaken original thinking.\n\nOn the positive side, intelligent tutors can explain difficult concepts repeatedly and provide instant feedback on language practice. Data analysis tools help students process large information sets in research projects. These advantages free time for higher-level questions that machines cannot ask for us.\n\nHowever, over-reliance is a real risk. If essays and problem sets are simply generated by AI, students may lose the ability to construct arguments and solve unfamiliar problems. Academic integrity also demands transparent use of such tools.\n\nA sensible policy is to treat AI as a laboratory partner rather than a substitute brain. Universities should teach prompt design, fact-checking and ethical boundaries, while assessments focus on reasoning processes. In this way, technology multiplies human potential instead of replacing it.',
    ['智能辅导', '过度依赖风险', '学术诚信', '制度与评估']),
  W('PE12', 'CET-6', '城市绿色空间',
    'Write an essay on the role of urban green spaces in modern cities. At least 150 words.',
    'As cities densify, parks and tree-lined streets are not luxuries but necessities. Urban green spaces support public health, climate resilience and social life.\n\nResearch associates nearby parks with lower stress levels and more physical activity. For office workers and students, a short walk among trees can restore attention more effectively than another cup of coffee. Green cover also reduces the urban heat island effect and absorbs rainfall, easing pressure on drainage systems during storms.\n\nYet equity remains a challenge. Low-income neighborhoods often have fewer trees and smaller playgrounds. City planning should therefore prioritize planting and park investment where vulnerability and heat are highest, rather than only in wealthy districts.\n\nGreen space is infrastructure for well-being. When governments treat it as seriously as roads and wires, cities become healthier places to study, work and grow old.',
    ['身心健康', '气候适应', '公平配置', '规划优先级']),
  W('PE13', 'CET-6', '远程办公的未来',
    'Some believe remote work will become the norm. Discuss its benefits and limits. At least 150 words.',
    'The pandemic accelerated remote work, and years later a hybrid pattern dominates many knowledge industries. Whether it becomes the full norm depends on the nature of work.\n\nRemote arrangements cut long commutes and allow talent to live in lower-cost cities. Parents and people with disabilities often gain better access to stable employment. Documentation culture can also improve when teams must write things down.\n\nNevertheless, fully remote models struggle with spontaneous collaboration and onboarding of new hires. Careers may stall if visibility drops, and company culture is harder to transmit through screens alone. Some tasks—hardware labs, certain client meetings—still need shared physical space.\n\nThe most durable future is likely flexible: clear outcomes, protected deep-work time, and deliberate in-person moments for trust-building. Organizations that design remote work as a system, not as a temporary perk, will attract and keep skilled people.',
    ['通勤与人才', '协作与入职', '任务差异', '系统设计']),
  W('PE14', 'CET-6', '消费主义与年轻人',
    'Write an essay on consumerism among young people and how to form rational consumption. At least 150 words.',
    'From limited sneakers to latest phones, young consumers face intense marketing. While spending can express identity, unchecked consumerism brings financial stress and environmental costs.\n\nSocial media amplifies comparison. When feeds are full of curated lifestyles, ordinary income may feel insufficient, pushing some toward installment loans or even illegal lending. The result is anxiety rather than lasting satisfaction. Fast fashion and disposable gadgets also pile up waste.\n\nRational consumption starts with values. Students can distinguish needs from wants, set a monthly budget, and prefer quality that lasts. Campuses may offer financial literacy courses and second-hand exchanges. Brands, for their part, should be regulated against misleading advertising targeting minors.\n\nEnjoying material comfort is not shameful. The problem begins when purchases define self-worth. A mature consumer spends on life, not on images of life.',
    ['营销与比较', '债务与浪费', '预算与品质', '价值澄清']),
  W('PE15', 'CET-6', '全球化与文化多样性',
    'Discuss how globalization affects cultural diversity. At least 150 words.',
    'Globalization connects markets and minds, but its effect on cultural diversity is double-edged.\n\nOn one hand, shared platforms let minority music, films and cuisines reach global audiences. Translation tools and travel make cross-cultural friendship easier. Young people can study abroad and return with hybrid identities that enrich local scenes.\n\nOn the other hand, dominant languages and entertainment industries may crowd out smaller traditions. Dialects fade when education and media reward only a standard tongue. Tourist packaging can turn living culture into a performance that loses meaning.\n\nProtecting diversity does not mean isolating cultures. It means fair resources for local languages, support for creators outside megacities, and education that teaches both global competence and local heritage. A healthy world system resembles a forest: many species, not a single lawn.',
    ['传播机会', '强势挤压', '语言与旅游', '保护性开放']),
  W('PE16', 'CET-6', '终身学习',
    'Why is lifelong learning important in a rapidly changing economy? At least 150 words.',
    'Industries transform faster than degree programs can be rewritten. In such an economy, graduation is a starting line, not a finish line. Lifelong learning has become a professional survival skill.\n\nNew tools appear every few years. Professionals who update their methods regularly remain employable; those who rely only on knowledge from their twenties risk sudden obsolescence. Learning also supports career shifts—teachers become instructional designers, engineers move into product management.\n\nStill, continuous study is not simply collecting certificates. Effective lifelong learners choose problems worth solving, practice deliberately, and share results with communities. Employers can help by funding training and recognizing internal mobility rather than punishing curiosity.\n\nGovernments should treat adult education as infrastructure: affordable courses, flexible schedules, and portable credentials. When societies make learning ordinary, individuals face change with confidence instead of fear.',
    ['技能更新', '职业转换', '刻意练习', '制度支持']),
  W('PE17', 'CET-6', '社交媒体与公共讨论',
    'Write an essay on how social media influences public discussion. At least 150 words.',
    'Social media promised a global public square. What emerged is powerful for mobilization yet fragile for serious debate.\n\nSpeed and reach help citizens share eyewitness information and organize aid during crises. Marginalized voices can find audiences that traditional media ignored. These are real democratic gains.\n\nYet algorithmic feeds often reward outrage over nuance. Complex policy issues collapse into slogans, and misinformation spreads faster than corrections. Filter bubbles may harden identities until opponents are seen as enemies rather than fellow citizens.\n\nImproving the square requires several layers: platforms should rank for reliability, not only engagement; schools must teach media literacy; users need habits of pausing before sharing. Offline forums—libraries, town halls—still matter for slower, embodied dialogue.\n\nTechnology alone cannot guarantee a healthy public sphere. Design, education and civic culture must work together.',
    ['动员能力', '算法与情绪', '多方治理', '线下补充']),
  W('PE18', 'CET-6', '延迟满足与成功',
    'Some argue that delayed gratification predicts success more than IQ. Comment on this view. At least 150 words.',
    'The famous marshmallow experiments suggested that children who wait for a larger reward often do better later. While the story is oversimplified, the core idea—self-regulation matters—remains useful.\n\nDelayed gratification is not mere denial. It is the skill of aligning today\'s choices with tomorrow\'s goals: saving instead of impulse buying, practicing instead of endless gaming. In university, that skill shows up as steady revision rather than last-minute panic.\n\nHowever, success is not only personal grit. Opportunity structures—family resources, school quality, health—shape what "waiting" can achieve. Blaming individuals for systemic barriers is unfair.\n\nA balanced view treats self-control as trainable and environment as adjustable. Students can practice implementation intentions and environment design; institutions can reduce unnecessary stressors. Together, patience and fair conditions make long-term goals reachable.',
    ['自我调节', '目标对齐', '结构因素', '可训练性']),
  W('PE19', 'CET-6', '文化遗产保护',
    'Write an essay on protecting cultural heritage in the face of urbanization. At least 150 words.',
    'Old streets and craft traditions often stand in the path of new roads and towers. Protecting heritage is not nostalgia alone; it is keeping a city\'s memory and identity alive.\n\nHeritage sites attract thoughtful tourism and teach history more vividly than textbooks. Traditional techniques can also inspire contemporary design. When neighborhoods are demolished wholesale, social networks and intangible culture disappear with them.\n\nYet freezing a city in time is neither possible nor desirable. Adaptive reuse—turning warehouses into libraries, repairing temples for community use—can balance preservation and development. Clear laws, public consultation and funding for maintenance are essential.\n\nCitizens play a role too: documenting oral history, supporting local crafts, and demanding transparency in planning. Cities that honor layers of time tend to be more livable than those that erase them for short-term gain.',
    ['身份与记忆', '活化利用', '法律与参与', '新旧平衡']),
  W('PE20', 'CET-6', '睡眠与学习效率',
    'Many students sacrifice sleep for study. Discuss the consequences and solutions. At least 150 words.',
    'All-nighters before exams are common, yet sleep research suggests they often backfire. Memory consolidation depends on adequate rest, so cutting sleep can erase what was just crammed.\n\nShort-term, tired students show weaker working memory, slower reaction times and poorer emotional regulation. Over months, irregular schedules disrupt circadian rhythms, raising risks of anxiety and metabolic problems. Coffee cannot fully compensate.\n\nSolutions must be structural as well as personal. Campuses can avoid early high-stakes exams after late events and educate students about sleep as a study skill. Study groups should not pressure members into overnight marathons. Individually, a consistent bedtime, limited late caffeine and phone-free wind-down routines help.\n\nHigh performance is not the opposite of rest; it depends on it. Treat sleep as part of the syllabus, and grades often improve without longer hours at the desk.',
    ['记忆巩固', '健康代价', '校园制度', '作息策略']),
];

const writingPrompts = [
  ...base.writingPrompts || [],
  ...writingEssays.map((e) => ({
    id: e.id,
    level: e.level,
    title: e.title,
    prompt: e.prompt,
    essay: e.essay,
    points: e.points,
  })),
];

// 去重（按 id）
function dedupeById(arr) {
  const m = new Map();
  for (const x of arr || []) if (x && x.id != null) m.set(x.id, x);
  return [...m.values()];
}

const listening = dedupeById([
  ...(base.listening || []),
  L('L25', '短对话 · 选课冲突', 'Section A', [
    { speaker: 'W', text: 'I wanted to take Professor Adams\' seminar, but it clashes with my lab.' },
    { speaker: 'M', text: 'There is a second section on Thursday afternoon. A few seats are left.' },
    { speaker: 'W', text: 'Perfect. I will register tonight before it fills up.' },
  ], [
    q('L25-1', 'What is the woman\'s problem?', ['She forgot the lab', 'The seminar conflicts with her lab', 'The seminar is full', 'She dislikes Adams'], 1),
    q('L25-2', 'What will she do?', ['Drop the lab', 'Register for the second section', 'Email the professor', 'Skip the seminar'], 1),
  ], 32),
  L('L26', '长对话 · 实验室安全', 'Section B', [
    { speaker: 'M', text: 'Before you handle chemicals, put on goggles and check the safety sheet.' },
    { speaker: 'W', text: 'Should I pour leftover solution into the sink?' },
    { speaker: 'M', text: 'Never. Use the labeled waste containers on the side bench.' },
    { speaker: 'W', text: 'Understood. And if something spills?' },
    { speaker: 'M', text: 'Alert me first, then use the spill kit—do not wipe with bare hands.' },
  ], [
    q('L26-1', 'What must the woman wear?', ['Gloves only', 'Goggles', 'A mask', 'A lab coat only'], 1),
    q('L26-2', 'How should leftover chemicals be handled?', ['Poured down the sink', 'Placed in labeled waste containers', 'Thrown in trash', 'Left on the bench'], 1),
    q('L26-3', 'What is the first step after a spill?', ['Wipe quickly', 'Alert the instructor', 'Open windows', 'Call security'], 1),
  ], 50),
  L('L27', '短文 · 图书馆新规', 'Section C', [
    { speaker: 'N', text: 'The main library will extend hours during finals week, closing at midnight instead of ten.' },
    { speaker: 'N', text: 'Group study rooms must be booked online and released if no one checks in within fifteen minutes.' },
    { speaker: 'N', text: 'Silent floors remain phone-free, and food is limited to the lobby café area.' },
  ], [
    q('L27-1', 'When will the library close during finals?', ['10 p.m.', 'Midnight', '2 a.m.', 'Unchanged'], 1),
    q('L27-2', 'What happens if no one checks into a booked room?', ['The booking continues', 'The room is released after 15 minutes', 'A fine is charged', 'Staff call the student'], 1),
  ], 38),
  L('L28', '长对话 · 奖学金申请', 'Section B', [
    { speaker: 'W', text: 'I\'m applying for the merit scholarship. What documents do I need?' },
    { speaker: 'M', text: 'Transcript, a personal statement, and one recommendation letter.' },
    { speaker: 'W', text: 'Is the deadline strict if the recommender is late?' },
    { speaker: 'M', text: 'The letter may arrive two days later, but your forms must be in on time.' },
  ], [
    q('L28-1', 'Which item is NOT required immediately?', ['Transcript', 'Personal statement', 'Recommendation letter', 'Application form'], 2),
    q('L28-2', 'How much late is allowed for the letter?', ['Same day', 'Two days', 'One week', 'None'], 1),
  ], 42),
  L('L29', '短对话 · 打印论文', 'Section A', [
    { speaker: 'M', text: 'I need three bound copies of my thesis by Friday noon.' },
    { speaker: 'W', text: 'Binding takes two days. Bring the files tomorrow morning at the latest.' },
    { speaker: 'M', text: 'I will email them tonight.' },
  ], [
    q('L29-1', 'When must the files arrive?', ['Friday noon', 'Tomorrow morning', 'Tonight is fine if emailed', 'Next week'], 2),
    q('L29-2', 'How long does binding take?', ['One day', 'Two days', 'Five days', 'Same day'], 1),
  ], 30),
  L('L30', '短文 · 心理咨询服务', 'Section C', [
    { speaker: 'N', text: 'The counseling center now offers free sessions for enrolled students, including evening slots twice a week.' },
    { speaker: 'N', text: 'Appointments can be made online; crisis support remains available by phone around the clock.' },
    { speaker: 'N', text: 'Workshops on exam anxiety and sleep are held monthly in the student union.' },
  ], [
    q('L30-1', 'Who can use free sessions?', ['Only graduates', 'Enrolled students', 'Faculty only', 'Parents'], 1),
    q('L30-2', 'When is crisis support available?', ['Daytime only', 'Around the clock', 'Weekends', 'During workshops'], 1),
  ], 40),
  L('L31', '长对话 · 出国交换', 'Section B', [
    { speaker: 'M', text: 'I\'m considering the exchange program in Singapore next spring.' },
    { speaker: 'W', text: 'Credits transfer if courses match your plan. Check with your department early.' },
    { speaker: 'M', text: 'What about housing?' },
    { speaker: 'W', text: 'On-campus dorms are limited; many students share apartments nearby.' },
  ], [
    q('L31-1', 'Where does the man want to go?', ['London', 'Singapore', 'Sydney', 'Toronto'], 1),
    q('L31-2', 'What is required for credits?', ['High GPA only', 'Course matching', 'Language test', 'Advisor letter'], 1),
    q('L31-3', 'What is common for housing?', ['Hotels', 'Shared apartments', 'Host families', 'Camping'], 1),
  ], 48),
  L('L32', '短对话 · 健身房会员', 'Section A', [
    { speaker: 'W', text: 'Student membership is half price with a valid ID.' },
    { speaker: 'M', text: 'Does it include the swimming pool?' },
    { speaker: 'W', text: 'Yes, and group classes on weekends.' },
  ], [
    q('L32-1', 'What is needed for the discount?', ['Coupon', 'Valid student ID', 'Referral', 'Cash'], 1),
    q('L32-2', 'What is included?', ['Pool only', 'Pool and weekend classes', 'Personal training', 'Meals'], 1),
  ], 28),
  L('L33', '短文 · 快递与校园代收', 'Section C', [
    { speaker: 'N', text: 'Packages are held at the campus pickup point for three days before being returned.' },
    { speaker: 'N', text: 'Students must show a pickup code and ID; oversized items go to the warehouse desk.' },
    { speaker: 'N', text: 'Peak delays are common at the start of each semester—order textbooks early.' },
  ], [
    q('L33-1', 'How long are packages held?', ['One day', 'Three days', 'One week', 'Two weeks'], 1),
    q('L33-2', 'What should students do at semester start?', ['Avoid ordering', 'Order textbooks early', 'Use mail only', 'Ship to home'], 1),
  ], 36),
  L('L34', '长对话 · 小组展示', 'Section B', [
    { speaker: 'W', text: 'Our presentation is next Monday. Who will open?' },
    { speaker: 'M', text: 'I can do the intro if you handle data slides.' },
    { speaker: 'W', text: 'Deal. Let\'s rehearse Sunday evening in Room 302.' },
    { speaker: 'M', text: 'I\'ll book it for two hours.' },
  ], [
    q('L34-1', 'Who will open the presentation?', ['The woman', 'The man', 'The professor', 'A guest'], 1),
    q('L34-2', 'When is the rehearsal?', ['Monday morning', 'Sunday evening', 'Saturday noon', 'Friday night'], 1),
  ], 40),
  L('L35', '短文 · 校园招聘', 'Section C', [
    { speaker: 'N', text: 'The autumn career fair brings over two hundred employers to the sports complex.' },
    { speaker: 'N', text: 'Students should prepare printed resumes and dress professionally; some firms interview on site.' },
    { speaker: 'N', text: 'A prep workshop on elevator pitches is scheduled the week before the fair.' },
  ], [
    q('L35-1', 'Where is the career fair held?', ['Library', 'Sports complex', 'Lecture hall', 'Cafeteria'], 1),
    q('L35-2', 'What workshop is offered?', ['Cooking', 'Elevator pitches', 'Driving', 'Photography'], 1),
  ], 38),
  L('L36', '短对话 · 宿舍维修', 'Section A', [
    { speaker: 'M', text: 'The faucet in 412 has been dripping for a week.' },
    { speaker: 'W', text: 'Submit a ticket online; maintenance usually comes within 48 hours.' },
    { speaker: 'M', text: 'Can they come after 6 p.m.?' },
    { speaker: 'W', text: 'Note the time preference in the ticket.' },
  ], [
    q('L36-1', 'How long does maintenance usually take?', ['Same day', 'Within 48 hours', 'One week', 'Unknown'], 1),
    q('L36-2', 'How should a time preference be given?', ['By phone only', 'In the online ticket', 'To the RA verbally', 'It is impossible'], 1),
  ], 34),
  L('L37', '长对话 · 期末项目', 'Section B', [
    { speaker: 'M', text: 'Our capstone needs a prototype demo, not just slides.' },
    { speaker: 'W', text: 'I can code the front end if you finish the API docs.' },
    { speaker: 'M', text: 'Deadline is in three weeks. Let\'s set weekly checkpoints.' },
  ], [
    q('L37-1', 'What does the project need besides slides?', ['A paper', 'A prototype demo', 'A poster', 'A video ad'], 1),
    q('L37-2', 'What will the woman do?', ['API docs', 'Front end', 'Marketing', 'Nothing'], 1),
    q('L37-3', 'How long until the deadline?', ['One week', 'Three weeks', 'Two months', 'One day'], 1),
  ], 44),
  L('L38', '短文 · 数字支付', 'Section C', [
    { speaker: 'N', text: 'Campus cards now support mobile pay at most dining halls and laundries.' },
    { speaker: 'N', text: 'Lost cards can be frozen instantly in the student app to prevent misuse.' },
    { speaker: 'N', text: 'Cash remains accepted at a few off-campus partner shops for now.' },
  ], [
    q('L38-1', 'What can students do if a card is lost?', ['Wait until morning', 'Freeze it in the app', 'Call campus police only', 'Nothing'], 1),
    q('L38-2', 'Where is cash still accepted?', ['All dining halls', 'Some off-campus partners', 'Nowhere', 'Libraries only'], 1),
  ], 36),
  L('L39', '短对话 · 论文查重', 'Section A', [
    { speaker: 'W', text: 'Does the department require a similarity report?' },
    { speaker: 'M', text: 'Yes, under fifteen percent excluding quotes and references.' },
    { speaker: 'W', text: 'I will run the check before submission.' },
  ], [
    q('L39-1', 'What is the similarity limit?', ['5%', '15%', '30%', 'No limit'], 1),
    q('L39-2', 'What is excluded?', ['Quotes and references', 'Title only', 'Appendix only', 'Nothing'], 0),
  ], 30),
  L('L40', '短文 · 语言学习应用', 'Section C', [
    { speaker: 'N', text: 'Vocabulary apps help most when sessions are short and frequent rather than long and rare.' },
    { speaker: 'N', text: 'Spaced repetition outperforms cramming for long-term retention.' },
    { speaker: 'N', text: 'Speaking practice with real people remains irreplaceable for fluency.' },
  ], [
    q('L40-1', 'What session style is recommended?', ['Long and rare', 'Short and frequent', 'Only weekends', 'Only mornings'], 1),
    q('L40-2', 'What is irreplaceable for fluency?', ['Flashcards', 'Speaking with real people', 'Grammar drills', 'Movies only'], 1),
  ], 36),
  L('L41', '长对话 · 假期实习', 'Section B', [
    { speaker: 'W', text: 'The summer internship pays a stipend and offers housing support.' },
    { speaker: 'M', text: 'Is it full time for twelve weeks?' },
    { speaker: 'W', text: 'Yes, and you may convert to a full-time offer if reviews are strong.' },
  ], [
    q('L41-1', 'How long is the internship?', ['Four weeks', 'Twelve weeks', 'Six months', 'One year'], 1),
    q('L41-2', 'What can strong performance lead to?', ['A scholarship', 'A full-time offer', 'A free laptop', 'Extra vacation'], 1),
  ], 40),
  L('L42', '短对话 · 食堂新窗口', 'Section A', [
    { speaker: 'M', text: 'The new noodle window is open until nine.' },
    { speaker: 'W', text: 'Is the vegetarian bowl cheaper?' },
    { speaker: 'M', text: 'It is two yuan less than the beef one.' },
  ], [
    q('L42-1', 'When does the window close?', ['Seven', 'Nine', 'Ten', 'Midnight'], 1),
    q('L42-2', 'How much cheaper is the vegetarian bowl?', ['One yuan', 'Two yuan', 'Five yuan', 'Same price'], 1),
  ], 26),
  L('L43', '短文 · 时间管理', 'Section C', [
    { speaker: 'N', text: 'Breaking tasks into twenty-five minute blocks with short breaks improves focus for many students.' },
    { speaker: 'N', text: 'Planning the next day the night before reduces morning decision fatigue.' },
    { speaker: 'N', text: 'Multitasking during lectures often lowers comprehension more than it saves time.' },
  ], [
    q('L43-1', 'What technique is mentioned?', ['All-night study', 'Timed focus blocks', 'Skipping meals', 'Silent retreat'], 1),
    q('L43-2', 'What should students avoid during lectures?', ['Note-taking', 'Multitasking', 'Questions', 'Recording'], 1),
  ], 34),
  L('L44', '长对话 · 校园医疗', 'Section B', [
    { speaker: 'M', text: 'I have a fever. Do I need an appointment?' },
    { speaker: 'W', text: 'Walk-ins are accepted before 11 a.m.; after that, book online.' },
    { speaker: 'M', text: 'Is the flu shot free for students?' },
    { speaker: 'W', text: 'Yes, during the autumn clinic days.' },
  ], [
    q('L44-1', 'When are walk-ins accepted?', ['After 11 a.m.', 'Before 11 a.m.', 'Evenings', 'Never'], 1),
    q('L44-2', 'When is the flu shot free?', ['Any day', 'Autumn clinic days', 'Only winter', 'Only for staff'], 1),
  ], 38),
  L('L45', '短文 · 二手书循环', 'Section C', [
    { speaker: 'N', text: 'A student-run book exchange allows seniors to pass textbooks to juniors at low cost.' },
    { speaker: 'N', text: 'Digital platforms list ISBNs so buyers can confirm the correct edition.' },
    { speaker: 'N', text: 'Professors are encouraged to stick to stable editions across years.' },
  ], [
    q('L45-1', 'Who mainly sells books?', ['Bookstores', 'Seniors to juniors', 'Publishers', 'Parents'], 1),
    q('L45-2', 'Why are stable editions encouraged?', ['To raise prices', 'To reuse books easily', 'To ban digital copies', 'To shorten courses'], 1),
  ], 34),
]);

const reading = dedupeById([
  ...(base.reading || []),
  R('R14', 'Passage · The Power of Sleep',
    'Students often treat sleep as optional during exam weeks. Yet laboratory studies show that memory traces are strengthened during deep sleep. When participants learn word pairs and then sleep normally, recall improves more than after an equal period of awake rest. Naps of twenty to thirty minutes can also restore attention, though very long naps may leave people groggy. Experts recommend consistent bedtimes, dim light before sleep, and keeping phones away from the pillow. Campuses that schedule fewer early high-stakes exams after late events report better attendance. Sleep, in short, is not lost study time; it is part of the learning process.',
    [
      q('R14-1', 'What happens to memory during deep sleep?', ['It is erased', 'It is strengthened', 'It stays unchanged', 'It becomes false'], 1),
      q('R14-2', 'How long should a helpful nap be?', ['5 minutes', '20-30 minutes', '3 hours', 'All night'], 1),
      q('R14-3', 'What do experts recommend?', ['Bright screens', 'Phones on the pillow', 'Consistent bedtimes', 'Skipping dinner'], 2),
    ]),
  R('R15', 'Passage · Microcredentials',
    'Traditional four-year degrees remain valuable, but microcredentials—short, verified courses in specific skills—are growing. Employers use them to assess whether a candidate can, for example, analyze data with a particular tool. Universities experiment with stacking microcredentials toward certificates. Critics warn that quality varies widely and that learners may collect badges without deep understanding. Supporters reply that transparency in outcomes and assessment can raise standards. For students, microcredentials work best when they complement a degree rather than replace foundational learning.',
    [
      q('R15-1', 'What are microcredentials?', ['Four-year degrees', 'Short verified skill courses', 'Sports awards', 'Student IDs'], 1),
      q('R15-2', 'What is a concern of critics?', ['Too expensive always', 'Variable quality', 'Illegal status', 'No employers use them'], 1),
      q('R15-3', 'How do they work best for students?', ['Replacing all degrees', 'Complementing a degree', 'Avoiding practice', 'Only for teachers'], 1),
    ]),
  R('R16', 'Passage · Urban Farming',
    'Rooftop gardens and vertical farms are appearing in dense cities. They shorten the distance from soil to plate, reduce transport emissions, and can turn unused surfaces into green space. Yields per square meter can be high with careful control of light and water. Challenges include startup cost, energy use for indoor lighting, and limited crops suitable for city farms. Municipal policies that allow farming on rooftops and support training for building managers can help. Urban farming alone cannot feed a megacity, but it can supplement diets and reconnect residents with food production.',
    [
      q('R16-1', 'What is a benefit of urban farming?', ['Longer transport', 'Shorter farm-to-plate distance', 'Higher energy bills always', 'Fewer green spaces'], 1),
      q('R16-2', 'What is a challenge?', ['Startup cost', 'Too much free land', 'Lack of water everywhere', 'Illegal crops only'], 0),
      q('R16-3', 'Can urban farming feed a megacity alone?', ['Yes completely', 'No, it can only supplement', 'Only in winter', 'Only meat'], 1),
    ]),
  R('R17', 'Passage · The Science of Habits',
    'Habits form when a cue, a routine, and a reward repeat until the brain automates the loop. Researchers find that changing an existing habit is easier when the cue and reward stay the same but the routine changes—for example, replacing a cigarette break with a short walk. Environment design matters: placing a book on the pillow increases the chance of reading before bed. Accountability partners and public commitments raise follow-through. Willpower alone is a weak long-term strategy; systems outperform resolve.',
    [
      q('R17-1', 'What are the parts of a habit loop?', ['Cue, routine, reward', 'Goal, plan, failure', 'Mood, food, sleep', 'None'], 0),
      q('R17-2', 'What makes habit change easier?', ['Changing everything at once', 'Keeping cue and reward, changing routine', 'Avoiding all cues', 'Using only willpower'], 1),
      q('R17-3', 'What does the passage say about willpower?', ['It is enough', 'It is weak long-term', 'It is illegal', 'It only works for athletes'], 1),
    ]),
  R('R18', 'Passage · Open Science',
    'Open science encourages sharing data, methods, and preprints so that results can be checked and reused. Benefits include faster progress and fewer duplicated experiments. Risks involve privacy for human subjects and the cost of curating datasets. Funders increasingly require data management plans. Journals experiment with badges for open data. Early-career researchers worry that sharing too soon may invite scooping; norms are evolving to credit data creators properly. A healthy scientific ecosystem balances openness with responsibility.',
    [
      q('R18-1', 'What does open science share?', ['Only secrets', 'Data and methods', 'Money only', 'Nothing'], 1),
      q('R18-2', 'What is a risk?', ['Faster progress', 'Privacy concerns', 'Too few experiments', 'No journals'], 1),
      q('R18-3', 'What do early-career researchers fear?', ['Scooping', 'Too much credit', 'Free data', 'Bad coffee'], 0),
    ]),
  R('R19', 'Passage · Bilingual Benefits',
    'Speaking two languages does not make people smarter in every domain, but research links bilingualism with advantages in switching attention and ignoring distraction. These effects appear strongest in people who use both languages actively. Learning a second language later in life still brings cognitive and social benefits. Schools that emphasize communication and real use tend to produce more confident speakers than those focused only on grammar drills. Motivation and regular practice remain decisive.',
    [
      q('R19-1', 'What advantage is linked to bilingualism?', ['Perfect memory', 'Better attention switching', 'Higher height', 'Faster running'], 1),
      q('R19-2', 'When is the effect strongest?', ['When both languages are used actively', 'When only one is used', 'When never practiced', 'Only in childhood'], 0),
      q('R19-3', 'What do schools need for confident speakers?', ['Grammar only', 'Communication and real use', 'Silent classrooms', 'No homework'], 1),
    ]),
  R('R20', 'Passage · Food Waste in Canteens',
    'University canteens generate large amounts of edible waste. Trays piled with leftovers mean wasted water, energy, and labor embedded in food. Some campuses pilot "choose your portion" pricing and trayless dining, both of which reduce waste. Surplus that is still safe can be donated under clear food-safety rules. Student volunteers track waste by weight to set targets. Culture matters: when finishing a reasonable portion is normal, waste falls without heavy-handed campaigns.',
    [
      q('R20-1', 'What does food waste represent?', ['Only money', 'Embedded water, energy, and labor', 'Free fertilizer always', 'Nothing serious'], 1),
      q('R20-2', 'Which pilot reduces waste?', ['Larger trays', 'Trayless dining', 'Free desserts', 'Longer hours'], 1),
      q('R20-3', 'What helps set targets?', ['Guessing', 'Tracking waste by weight', 'Ignoring data', 'Closing canteens'], 1),
    ]),
  R('R21', 'Passage · Public Speaking Anxiety',
    'Fear of public speaking is common even among high-achieving students. Techniques that help include thorough preparation, practicing aloud rather than only in the head, and focusing on the message rather than on self-image. Controlled breathing before going on stage reduces physiological arousal. Audience members are usually more supportive than speakers expect. Joining low-stakes speaking groups builds skill gradually. Avoidance reinforces anxiety; gradual exposure weakens it.',
    [
      q('R21-1', 'What is a helpful technique?', ['Avoid all talks', 'Practice aloud', 'Skip preparation', 'Focus on self-image'], 1),
      q('R21-2', 'What reduces physiological arousal?', ['Coffee', 'Controlled breathing', 'Skipping meals', 'Running away'], 1),
      q('R21-3', 'What does avoidance do?', ['Cures anxiety', 'Reinforces anxiety', 'Improves grades', 'Saves time always'], 1),
    ]),
  R('R22', 'Passage · Bike-Friendly Campuses',
    'Campuses that install secure parking, repair stations, and connected bike lanes see higher cycling rates. Safety education and lower speed limits for cars matter as much as infrastructure. Bike-sharing systems work when maintenance is funded; abandoned broken bikes create clutter. Some universities integrate cycling credits into physical education. The result is fewer short car trips, healthier students, and quieter quads—provided theft is addressed with registration and better lighting.',
    [
      q('R22-1', 'What increases cycling rates?', ['Higher car speeds', 'Secure parking and lanes', 'Removing repair stations', 'Banning bikes'], 1),
      q('R22-2', 'What problem do broken shared bikes cause?', ['Clutter', 'Faster rides', 'More theft only', 'Better air'], 0),
      q('R22-3', 'What else is needed besides infrastructure?', ['Nothing', 'Safety education', 'More cars', 'Fewer lights'], 1),
    ]),
  R('R23', 'Passage · Peer Feedback in Writing',
    'Peer review can improve drafts when students are trained to comment on clarity, evidence, and structure rather than only surface errors. Rubrics help calibrate judgments. Reciprocal reviewing also teaches writers to see their own work through a reader\'s eyes. Challenges include vague praise and friendship bias. Instructors who model strong feedback and require specific revision plans get better results. Peer feedback is not a substitute for expert grading, but a powerful complement.',
    [
      q('R23-1', 'What should peer comments focus on?', ['Only spelling', 'Clarity, evidence, structure', 'Handwriting', 'Page count only'], 1),
      q('R23-2', 'What helps calibrate judgments?', ['Rubrics', 'Silence', 'Random scoring', 'Popularity'], 0),
      q('R23-3', 'Is peer feedback a full substitute for expert grading?', ['Yes', 'No, a complement', 'Only in math', 'Only for PhDs'], 1),
    ]),
  R('R24', 'Passage · Digital Archives',
    'Museums and libraries digitize fragile materials so that manuscripts and photographs can be studied without handling originals. High-resolution images and metadata enable remote research worldwide. Preservation still requires stable storage and periodic format migration. Not everything can be scanned—rights, cost, and condition limit projects. Crowdsourced transcription can speed indexing, but quality control remains essential. Digital archives expand access; they do not eliminate the need for physical conservation.',
    [
      q('R24-1', 'Why digitize fragile materials?', ['To sell them online', 'To study without handling originals', 'To destroy paper', 'To print novels'], 1),
      q('R24-2', 'What still needs attention?', ['Only marketing', 'Stable storage and format migration', 'Nothing', 'Fewer images'], 1),
      q('R24-3', 'Do digital archives replace physical conservation?', ['Yes', 'No', 'Only for books', 'Only for photos'], 1),
    ]),
  R('R25', 'Passage · Mind Wandering and Creativity',
    'Mind wandering is often blamed for poor focus, yet it also supports creative incubation. When people switch to an undemanding task, ideas from earlier focused work can recombine. Short walks without phones are a classic example. The benefit depends on timing: mind wandering during safety-critical tasks is dangerous. Structured breaks after intense study may therefore boost insight, provided students return to deliberate practice. Attention is a resource to be scheduled, not a virtue measured by constant strain.',
    [
      q('R25-1', 'How can mind wandering help?', ['Always increases grades', 'Supports creative incubation', 'Stops all memory', 'Cures insomnia only'], 1),
      q('R25-2', 'What is a classic example?', ['Marathon running', 'Short walks without phones', 'All-night gaming', 'Skipping meals'], 1),
      q('R25-3', 'When is mind wandering dangerous?', ['During safety-critical tasks', 'During breaks', 'While walking slowly', 'Never'], 0),
    ]),
  R('R26', 'Passage · Water Security',
    'Many cities rely on distant reservoirs vulnerable to drought and pollution. Conservation starts with leak repair in old pipes and efficient fixtures. Pricing that discourages waste while protecting basic needs is politically delicate but effective. Rainwater harvesting and wastewater reuse can diversify supply. Universities with large green areas can install smart irrigation tied to weather data. Water security is ultimately about management and equity as much as engineering.',
    [
      q('R26-1', 'What threatens distant reservoirs?', ['Too many fish', 'Drought and pollution', 'Excess snow only', 'Tourism only'], 1),
      q('R26-2', 'What is a practical first step?', ['Building dams only', 'Repairing leaks', 'Raising prices infinitely', 'Banning all plants'], 1),
      q('R26-2b', 'Smart irrigation uses what?', ['Guesswork', 'Weather data', 'Student votes', 'Fixed schedules only'], 1),
    ]),
  R('R27', 'Passage · The Value of Boredom',
    'Constant stimulation from phones may reduce tolerance for boredom. Yet unstructured time allows the mind to consolidate memories and generate personal goals. Psychologists note that mild boredom can motivate meaningful activity if people do not immediately reach for a screen. Families and schools can protect pockets of quiet time without demonizing technology. Creativity often grows in the gaps we are tempted to fill instantly.',
    [
      q('R27-1', 'What may constant stimulation reduce?', ['Tolerance for boredom', 'Height', 'Tuition', 'Appetite only'], 0),
      q('R27-2', 'What can mild boredom do?', ['Motivate meaningful activity', 'Cause permanent harm', 'End all study', 'Replace sleep'], 0),
      q('R27-3', 'Where does creativity often grow?', ['In instantly filled gaps', 'In the gaps we leave', 'Only in labs', 'Only abroad'], 1),
    ]),
  R('R28', 'Passage · Internship Ethics',
    'Unpaid internships can open doors but also exclude students who must earn. Some programs exploit free labor without teaching. Ethical guidelines suggest clear learning goals, mentorship, and limited unpaid duration. Paid internships predict better access for low-income students. Universities can audit partners and publish outcome data. Career services should help students evaluate offers beyond brand names.',
    [
      q('R28-1', 'What is a risk of unpaid internships?', ['Too much pay', 'Exclusion of students who must earn', 'Illegal degrees', 'Remote work'], 1),
      q('R28-2', 'What do ethical guidelines include?', ['No learning goals', 'Clear goals and mentorship', 'Unlimited unpaid years', 'No supervision'], 1),
      q('R28-3', 'Who benefits more from paid internships?', ['Only CEOs', 'Low-income students', 'No one', 'Retirees'], 1),
    ]),
]);

const cloze = dedupeById([
  ...(base.cloze || []),
  C('C8', 'Cloze · Focus and Phones',
    'Students who keep phones on the desk often __1__ more time than they realize. Research suggests that merely having a phone nearby can __2__ available attention. Experts recommend a simple rule: out of sight, out of mind, especially during __3__ work.',
    [
      { id: 'C8-1', options: ['save', 'lose', 'count', 'sell'], answer: 1, explain: 'lose time 浪费时间' },
      { id: 'C8-2', options: ['increase', 'reduce', 'measure', 'ignore'], answer: 1 },
      { id: 'C8-3', options: ['deep', 'shallow', 'public', 'illegal'], answer: 0 },
    ]),
  C('C9', 'Cloze · Campus Recycling',
    'Effective recycling needs more than colorful bins. Students must know what is __1__ and what is not. Contaminated loads may be sent to landfill entirely. Clear signs and __2__ workshops improve sorting accuracy.',
    [
      { id: 'C9-1', options: ['recyclable', 'expensive', 'edible', 'broken'], answer: 0 },
      { id: 'C9-2', options: ['monthly', 'never', 'secret', 'foreign'], answer: 0 },
    ]),
  C('C10', 'Cloze · Group Work',
    'In group projects, unequal contribution is a common complaint. Setting __1__ roles and deadlines early reduces conflict. Peer evaluation, when designed well, can __2__ fairness without destroying cooperation.',
    [
      { id: 'C10-1', options: ['vague', 'clear', 'hidden', 'illegal'], answer: 1 },
      { id: 'C10-2', options: ['undermine', 'improve', 'erase', 'ignore'], answer: 1 },
    ]),
  C('C11', 'Cloze · Library Quiet Zones',
    'Quiet zones exist for a reason: sound carries farther than people expect in open halls. Headphones at high volume still __1__ neighbors through thin walls. Simple courtesy—soft voices, silenced devices—keeps shared spaces __2__.',
    [
      { id: 'C11-1', options: ['protect', 'disturb', 'teach', 'hire'], answer: 1 },
      { id: 'C11-2', options: ['usable', 'closed', 'expensive', 'dark'], answer: 0 },
    ]),
  C('C12', 'Cloze · Learning from Errors',
    'Mistakes are information. Students who review errors calmly learn faster than those who only celebrate correct answers. A short written note after each quiz can __1__ patterns in weak topics and guide the next __2__ session.',
    [
      { id: 'C12-1', options: ['hide', 'reveal', 'delete', 'sell'], answer: 1 },
      { id: 'C12-2', options: ['random', 'targeted', 'empty', 'public'], answer: 1 },
    ]),
  C('C13', 'Cloze · Budgeting Abroad',
    'Exchange students often underestimate hidden costs such as transit cards and winter clothing. Creating a simple monthly __1__ before arrival prevents mid-term shocks. Tracking expenses for two weeks reveals __2__ habits that can be adjusted.',
    [
      { id: 'C13-1', options: ['budget', 'speech', 'exam', 'novel'], answer: 0 },
      { id: 'C13-2', options: ['spending', 'sleeping', 'breathing', 'walking'], answer: 0 },
    ]),
  C('C14', 'Cloze · Presentation Skills',
    'Strong presentations start with a clear __1__, not with decorative slides. Audiences remember stories and data better than long lists of bullet points. Rehearsing aloud helps speakers manage time and __2__.',
    [
      { id: 'C14-1', options: ['message', 'font', 'laptop', 'ticket'], answer: 0 },
      { id: 'C14-2', options: ['panic', 'nerves', 'distance', 'price'], answer: 1 },
    ]),
  C('C15', 'Cloze · Second-hand Market',
    'Campus second-hand sales benefit both wallets and the environment. Sellers should describe items __1__ and meet in public places. Buyers should inspect electronics carefully. Trust grows when reviews are __2__.',
    [
      { id: 'C15-1', options: ['honestly', 'secretly', 'angrily', 'rarely'], answer: 0 },
      { id: 'C15-2', options: ['deleted', 'visible', 'fake', 'hidden'], answer: 1 },
    ]),
  C('C16', 'Cloze · Exam Strategy',
    'Under time pressure, students should first scan questions to allocate minutes wisely. Spending too long on one hard item can __1__ easier marks later. A final five-minute check often catches __2__ mistakes.',
    [
      { id: 'C16-1', options: ['increase', 'steal', 'create', 'double'], answer: 1 },
      { id: 'C16-2', options: ['careless', 'expensive', 'colorful', 'ancient'], answer: 0 },
    ]),
  C('C17', 'Cloze · Healthy Canteens',
    'Cafeterias that label calories and offer smaller plates help students make informed choices. Taste still matters: bland "diet" food often fails. Chefs who use herbs and spices can keep meals __1__ without excess oil. Regular menu __2__ prevents boredom.',
    [
      { id: 'C17-1', options: ['appealing', 'illegal', 'broken', 'empty'], answer: 0 },
      { id: 'C17-2', options: ['rotation', 'deletion', 'silence', 'theft'], answer: 0 },
    ]),
]);

const dictation = dedupeById([
  ...(base.dictation || []),
  D('D14', 'CET-4', '日常 · 预约', [
    { en: 'I would like to book a table for two this evening.', zh: '我想预订今晚两人桌。' },
    { en: 'Please arrive ten minutes early if possible.', zh: '如果可以请提前十分钟到。' },
  ]),
  D('D15', 'CET-4', '校园 · 讲座', [
    { en: 'The lecture on climate science starts at seven in the auditorium.', zh: '气候科学讲座七点在礼堂开始。' },
    { en: 'Students who attend can get extra credit in some courses.', zh: '参加的部分课程可获附加学分。' },
  ]),
  D('D16', 'CET-6', '工作 · 邮件', [
    { en: 'I am writing to confirm the schedule for next week\'s workshop.', zh: '我写信确认下周工作坊日程。' },
    { en: 'Please let me know if any sessions need to be rescheduled.', zh: '如需改期请告知。' },
  ]),
  D('D17', 'CET-4', '旅行 · 问路', [
    { en: 'Excuse me, how can I get to the science building?', zh: '请问去科学楼怎么走？' },
    { en: 'Go straight and turn left at the library.', zh: '直走，在图书馆左转。' },
  ]),
  D('D18', 'CET-6', '科技 · 数据', [
    { en: 'Reliable metrics help teams improve without a culture of blame.', zh: '可靠指标有助改进且不形成指责文化。' },
    { en: 'Storage is cheap; judgment about what to keep is not.', zh: '存储便宜，判断该留什么却不便宜。' },
  ]),
  D('D19', 'CET-4', '健康 · 饮食', [
    { en: 'Eating more vegetables and less fried food is a simple start.', zh: '多吃蔬菜少吃油炸是简单起点。' },
    { en: 'Drinking enough water also supports concentration.', zh: '喝够水也有助专注。' },
  ]),
  D('D20', 'CET-6', '环境 · 节能', [
    { en: 'Turning off unused lights reduces both cost and emissions.', zh: '关掉不用的灯可减少成本和排放。' },
    { en: 'Campuses can install sensors in classrooms and corridors.', zh: '校园可在教室走廊安装感应器。' },
  ]),
  D('D21', 'CET-4', '学习 · 复习', [
    { en: 'Reviewing notes the same day improves long-term memory.', zh: '当天复习笔记有助长期记忆。' },
    { en: 'Short daily sessions beat occasional marathons.', zh: '每天短时学习优于偶尔马拉松。' },
  ]),
  D('D22', 'CET-6', '社会 · 志愿', [
    { en: 'Volunteering teaches responsibility as well as practical skills.', zh: '志愿服务既培养责任感也练技能。' },
    { en: 'Choose a cause you care about and start small.', zh: '选你在意的事业从小做起。' },
  ]),
  D('D23', 'CET-4', '购物 · 退换', [
    { en: 'I would like to return this jacket because it does not fit.', zh: '我想退这件夹克因为不合身。' },
    { en: 'Please keep the receipt and original packaging.', zh: '请保留小票和原包装。' },
  ]),
  D('D24', 'CET-6', '教育 · 反馈', [
    { en: 'Timely feedback improves drafts more than a single final grade.', zh: '及时反馈比单一终评更能改进文稿。' },
    { en: 'Rubrics reduce ambiguity when several people grade.', zh: '多人评分时量表可减少歧义。' },
  ]),
  D('D25', 'CET-4', '时间 · 安排', [
    { en: 'I usually review vocabulary for twenty minutes after breakfast.', zh: '我通常早饭后复习二十分钟单词。' },
    { en: 'On Fridays the library closes earlier than usual.', zh: '周五图书馆比平时关得早。' },
  ]),
  D('D26', 'CET-6', '媒体 · 信息', [
    { en: 'Checking sources before sharing prevents the spread of rumors.', zh: '分享前核对来源可防止谣言传播。' },
    { en: 'Algorithms often favor engagement over accuracy.', zh: '算法常重参与度胜过准确性。' },
  ]),
  D('D27', 'CET-4', '交通 · 地铁', [
    { en: 'The subway is usually faster than the bus during rush hour.', zh: '高峰时段地铁通常比公交快。' },
    { en: 'You can transfer to line two at the central station.', zh: '可在中心站换乘二号线。' },
  ]),
  D('D28', 'CET-6', '心理 · 压力', [
    { en: 'Moderate pressure can sharpen focus when tasks are meaningful.', zh: '任务有意义时适度压力可提升专注。' },
    { en: 'Chronic overload requires rest, not just effort.', zh: '长期过载需要休息而不仅是努力。' },
  ]),
]);

const translations = dedupeById([
  ...(base.translations || []),
  T('T11', 'CET-4', '越来越多的大学生意识到体育锻炼的重要性。', 'More and more college students have realized the importance of physical exercise.'),
  T('T12', 'CET-4', '图书馆不仅提供借书服务，还组织讲座和展览。', 'Libraries not only lend books but also organize lectures and exhibitions.'),
  T('T13', 'CET-4', '我们应当养成节约用水用电的习惯。', 'We should develop the habit of saving water and electricity.'),
  T('T14', 'CET-4', '如果你需要帮助，请随时联系学生会。', 'If you need help, please contact the student union at any time.'),
  T('T15', 'CET-6', '如果团队缺乏清晰的目标和定期沟通，再先进的工具也难以提高效率。', 'If a team lacks clear goals and regular communication, even advanced tools can hardly improve efficiency.'),
  T('T16', 'CET-6', '研究表明，规律作息与学业表现密切相关，而考前熬夜往往适得其反。', 'Studies show that regular routines are closely related to academic performance, while staying up all night before exams often backfires.'),
  T('T17', 'CET-6', '城市绿化不仅美化环境，还有助于缓解热岛效应。', 'Urban greening not only beautifies the environment but also helps ease the heat island effect.'),
  T('T18', 'CET-6', '终身学习能力在快速变化的经济中日益重要。', 'Lifelong learning ability is increasingly important in a rapidly changing economy.'),
  T('T19', 'CET-4', '许多学生利用假期参加志愿服务。', 'Many students take part in volunteer work during holidays.'),
  T('T20', 'CET-4', '网上购物方便，但也要注意保护个人信息。', 'Online shopping is convenient, but we should also protect personal information.'),
  T('T21', 'CET-6', '人工智能可以辅助教学，但不能完全取代教师的引导作用。', 'Artificial intelligence can assist teaching, but it cannot completely replace the guiding role of teachers.'),
  T('T22', 'CET-6', '文化遗产保护需要法律、资金与公众参与的共同支持。', 'Heritage protection needs the joint support of law, funding, and public participation.'),
  T('T23', 'CET-4', '坚持每天听英语有助于提高听力水平。', 'Listening to English every day helps improve listening skills.'),
  T('T24', 'CET-4', '他因出色的表现获得了奖学金。', 'He won a scholarship because of his outstanding performance.'),
  T('T25', 'CET-6', '过度依赖社交媒体可能削弱深度阅读与独立思考能力。', 'Over-reliance on social media may weaken deep reading and independent thinking.'),
  T('T26', 'CET-6', '混合办公模式要求更清晰的文档与更自觉的时间管理。', 'Hybrid work models require clearer documentation and more self-disciplined time management.'),
  T('T27', 'CET-4', '请在周五之前把论文初稿交给导师。', 'Please submit the first draft of your paper to the supervisor before Friday.'),
  T('T28', 'CET-4', '学校附近新开了一家书店。', 'A new bookstore has opened near the school.'),
  T('T29', 'CET-6', '公平的教育机会有助于缩小社会差距。', 'Fair access to education helps narrow social gaps.'),
  T('T30', 'CET-6', '开放式科学数据能加速研究，但也带来隐私与伦理挑战。', 'Open scientific data can accelerate research, but it also brings privacy and ethical challenges.'),
]);

const speakingScripts = dedupeById([
  ...(base.speakingScripts || []),
  S('S8', '小组讨论 · 开场', [
    { en: 'Let me start by outlining the problem we need to solve today.', zh: '我先概述一下今天要解决的问题。' },
    { en: 'I suggest we spend ten minutes on data and then on solutions.', zh: '我建议先用十分钟看数据，再讨论方案。' },
  ]),
  S('S9', '表达不同意见', [
    { en: 'I see your point, but I have a different concern.', zh: '我明白你的意思，但我有不同担忧。' },
    { en: 'Could we look at the evidence for both options?', zh: '我们能否同时看两种方案的依据？' },
  ]),
  S('S10', '总结陈词', [
    { en: 'To sum up, we agreed on two priorities for this week.', zh: '总结一下，我们同意本周两个优先事项。' },
    { en: 'I will send the notes and action items tonight.', zh: '我今晚会发会议纪要和待办。' },
  ]),
  S('S11', '描述趋势', [
    { en: 'The chart shows a steady increase over the past five years.', zh: '图表显示过去五年稳步上升。' },
    { en: 'There was a slight drop in the middle of the period.', zh: '期间中段略有下降。' },
  ]),
  S('S12', '面试反问', [
    { en: 'What does success look like in this role after six months?', zh: '这个岗位六个月后怎样算成功？' },
    { en: 'How does the team usually collaborate across time zones?', zh: '团队跨时区通常如何协作？' },
  ]),
  S('S13', '电话预约', [
    { en: 'I would like to schedule an appointment with Dr. Lee.', zh: '我想预约李医生。' },
    { en: 'Would Thursday at three work for you?', zh: '周四三点方便吗？' },
  ]),
  S('S14', '餐厅点餐', [
    { en: 'Could I have the grilled chicken salad, please?', zh: '请给我烤鸡沙拉。' },
    { en: 'Is the soup included in the set meal?', zh: '套餐里含汤吗？' },
  ]),
  S('S15', '课堂展示开场', [
    { en: 'Good morning everyone. Today I will talk about urban green space.', zh: '大家早上好。今天我讲城市绿地。' },
    { en: 'I will cover three points: benefits, challenges, and solutions.', zh: '我将讲三点：好处、挑战和对策。' },
  ]),
]);

// 追加模考套题
const mockExams = dedupeById([
  ...(base.mockExams || []),
  {
    id: 'M-SET-9',
    title: '全真模考 · 第 9 套',
    level: 'CET-4',
    duration: 125,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: ['L25', 'L27', 'L29', 'L32'] },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: ['R14', 'R17'] },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: ['C8', 'C12'] },
      { type: 'writing', title: '写作', count: 1, sourceIds: ['PE01'] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: ['T11'] },
    ],
  },
  {
    id: 'M-SET-10',
    title: '全真模考 · 第 10 套',
    level: 'CET-6',
    duration: 130,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: ['L26', 'L30', 'L33', 'L37'] },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: ['R15', 'R18'] },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: ['C10', 'C16'] },
      { type: 'writing', title: '写作', count: 1, sourceIds: ['PE11'] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: ['T15'] },
    ],
  },
  {
    id: 'M-SET-11',
    title: '冲刺模考 · 第 11 套',
    level: 'CET-4',
    duration: 125,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: ['L28', 'L34', 'L36', 'L42'] },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: ['R20', 'R21'] },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: ['C9', 'C13'] },
      { type: 'writing', title: '写作', count: 1, sourceIds: ['PE05'] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: ['T19'] },
    ],
  },
  {
    id: 'M-SET-12',
    title: '冲刺模考 · 第 12 套',
    level: 'CET-6',
    duration: 130,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: ['L31', 'L35', 'L39', 'L44'] },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: ['R19', 'R24'] },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: ['C14', 'C17'] },
      { type: 'writing', title: '写作', count: 1, sourceIds: ['PE16'] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: ['T21'] },
    ],
  },
  {
    id: 'M-SET-13',
    title: '全真模考 · 第 13 套',
    level: 'CET-4',
    duration: 125,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: ['L38', 'L40', 'L43', 'L45'] },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: ['R22', 'R27'] },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: ['C11', 'C15'] },
      { type: 'writing', title: '写作', count: 1, sourceIds: ['PE07'] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: ['T23'] },
    ],
  },
  {
    id: 'M-SET-14',
    title: '全真模考 · 第 14 套',
    level: 'CET-6',
    duration: 130,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: ['L16', 'L41', 'L20'] },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: ['R16', 'R25'] },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: ['C6', 'C8'] },
      { type: 'writing', title: '写作', count: 1, sourceIds: ['PE13'] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: ['T25'] },
    ],
  },
]);

const roots = dedupeById([
  ...(base.roots || []),
  { id: 'RT25', root: 'cred', meaning: '相信', words: ['credit', 'incredible', 'credible'] },
  { id: 'RT26', root: 'cur/cours', meaning: '跑', words: ['current', 'course', 'occur'] },
  { id: 'RT27', root: 'duc/duct', meaning: '引导', words: ['produce', 'conduct', 'educate'] },
  { id: 'RT28', root: 'fac/fect', meaning: '做', words: ['factory', 'effect', 'affect'] },
  { id: 'RT29', root: 'gen', meaning: '产生', words: ['generate', 'general', 'gene'] },
  { id: 'RT30', root: 'ject', meaning: '投掷', words: ['project', 'reject', 'object'] },
  { id: 'RT31', root: 'lect/leg', meaning: '选择/读', words: ['select', 'collect', 'lecture'] },
  { id: 'RT32', root: 'loc', meaning: '地方', words: ['local', 'locate', 'allocate'] },
  { id: 'RT33', root: 'mit', meaning: '送', words: ['submit', 'transmit', 'permit'] },
  { id: 'RT34', root: 'nat', meaning: '出生', words: ['nature', 'nation', 'native'] },
  { id: 'RT35', root: 'opt', meaning: '选择', words: ['option', 'adopt', 'optimal'] },
  { id: 'RT36', root: 'path', meaning: '感觉/病', words: ['sympathy', 'pathology'] },
  { id: 'RT37', root: 'pon/pos', meaning: '放置', words: ['position', 'compose', 'expose'] },
  { id: 'RT38', root: 'rupt', meaning: '断裂', words: ['interrupt', 'corrupt', 'erupt'] },
  { id: 'RT39', root: 'scrib', meaning: '写', words: ['describe', 'subscribe', 'prescribe'] },
  { id: 'RT40', root: 'struct', meaning: '建造', words: ['structure', 'instruct', 'construct'] },
  { id: 'RT41', root: 'tend/tens', meaning: '伸展', words: ['extend', 'intense', 'tendency'] },
  { id: 'RT42', root: 'ven/vent', meaning: '来', words: ['event', 'prevent', 'venue'] },
  { id: 'RT43', root: 'vis/vid', meaning: '看', words: ['visible', 'evidence', 'video'] },
  { id: 'RT44', root: 'voc/vok', meaning: '声音', words: ['voice', 'advocate', 'vocabulary'] },
]);

const collocations = dedupeById([
  ...(base.collocations || []),
  {
    id: 'CL11',
    topic: '考试',
    pairs: [
      { phrase: 'take an exam', meaning: '参加考试' },
      { phrase: 'pass / fail an exam', meaning: '通过/未通过考试' },
      { phrase: 'get a high score', meaning: '得高分' },
      { phrase: 'review for the test', meaning: '备考复习' },
      { phrase: 'under time pressure', meaning: '时间压力下' },
    ],
  },
  {
    id: 'CL12',
    topic: '图书馆',
    pairs: [
      { phrase: 'borrow / return books', meaning: '借还书' },
      { phrase: 'due date', meaning: '到期日' },
      { phrase: 'renew a loan', meaning: '续借' },
      { phrase: 'overdue fine', meaning: '逾期罚款' },
      { phrase: 'reference section', meaning: '参考书区' },
    ],
  },
  {
    id: 'CL13',
    topic: '社交',
    pairs: [
      { phrase: 'keep in touch', meaning: '保持联系' },
      { phrase: 'get along with', meaning: '与…相处' },
      { phrase: 'reach out to', meaning: '联系某人' },
      { phrase: 'break the ice', meaning: '打破僵局' },
      { phrase: 'have something in common', meaning: '有共同点' },
    ],
  },
  {
    id: 'CL14',
    topic: '学术',
    pairs: [
      { phrase: 'conduct research', meaning: '开展研究' },
      { phrase: 'cite a source', meaning: '引用来源' },
      { phrase: 'draw a conclusion', meaning: '得出结论' },
      { phrase: 'carry out an experiment', meaning: '做实验' },
      { phrase: 'peer review', meaning: '同行评审' },
    ],
  },
  {
    id: 'CL15',
    topic: '旅行',
    pairs: [
      { phrase: 'book a ticket', meaning: '订票' },
      { phrase: 'check in', meaning: '办理登记' },
      { phrase: 'miss the train', meaning: '错过火车' },
      { phrase: 'light / heavy traffic', meaning: '交通通畅/拥堵' },
      { phrase: 'worth a visit', meaning: '值得一游' },
    ],
  },
]);

const synonyms = dedupeById([
  ...(base.synonyms || []),
  { id: 'SY16', group: '开始', words: ['begin', 'start', 'launch', 'commence'], note: 'commence 正式；launch 常接项目/产品' },
  { id: 'SY17', group: '结束', words: ['end', 'finish', 'conclude', 'terminate'], note: 'conclude 偏总结；terminate 正式/合同' },
  { id: 'SY18', group: '提高', words: ['raise', 'increase', 'improve', 'enhance'], note: 'improve 偏质量；enhance 更书面' },
  { id: 'SY19', group: '阻止', words: ['stop', 'prevent', 'block', 'hinder'], note: 'prevent 常接 from；hinder 偏阻碍进展' },
  { id: 'SY20', group: '显示', words: ['show', 'indicate', 'reveal', 'demonstrate'], note: 'demonstrate 偏证明；reveal 强调显露' },
  { id: 'SY21', group: '选择', words: ['choose', 'select', 'pick', 'opt for'], note: 'select 更正式；opt for 强调倾向' },
  { id: 'SY22', group: '足够的', words: ['enough', 'sufficient', 'adequate', 'ample'], note: 'ample 有余裕' },
  { id: 'SY23', group: '可能的', words: ['possible', 'likely', 'probable', 'potential'], note: 'potential 偏潜在；likely 概率较高' },
]);

const practice = {
  ...base,
  writingPrompts,
  writingLibrary: writingEssays,
  listening,
  reading,
  cloze,
  dictation,
  translations,
  speakingScripts,
  mockExams,
  roots,
  collocations,
  synonyms,
};

fs.writeFileSync(practicePath, JSON.stringify(practice));
const kb = (fs.statSync(practicePath).size / 1024).toFixed(1);
console.log('practice.json', kb + 'KB');
for (const k of ['listening', 'reading', 'cloze', 'dictation', 'writingPrompts', 'writingLibrary', 'translations', 'speakingScripts', 'mockExams', 'roots', 'collocations', 'synonyms']) {
  console.log(k, Array.isArray(practice[k]) ? practice[k].length : '-');
}

// ── 词库辅料：为空的高频词补常用搭配模板 ──
function enrichVocab(file) {
  const list = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  let n = 0;
  for (const w of list) {
    if (w.collocations && w.collocations.length) continue;
    if (!w.word || w.word.length < 3) continue;
    const word = w.word.toLowerCase();
    const templates = [`use ${word}`, `${word} of`, `in ${word}`];
    // 仅对名词/动词/形容词常见后缀给合理模板，避免乱造
    if (/ly$/.test(word)) {
      w.collocations = [`${word} enough`, `very ${word}`];
    } else if (/tion$|ment$|ness$|ity$|ance$|ence$/.test(word)) {
      w.collocations = [`the ${word} of`, `in ${word}`, `${word} and development`];
    } else if (/ous$|ful$|ive$|able$|ible$|al$/.test(word)) {
      w.collocations = [`highly ${word}`, `quite ${word}`, `${word} for`];
    } else {
      w.collocations = templates.slice(0, 2);
    }
    if (!w.similar || !w.similar.length) w.similar = [];
    n++;
  }
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(list));
  console.log(file, 'enriched', n, 'total', list.length);
}

enrichVocab('vocab-cet4.json');
enrichVocab('vocab-cet6.json');
console.log('Done expand');
