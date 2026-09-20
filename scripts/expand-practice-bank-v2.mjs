/**
 * CetThink 题库大规模扩充 v2
 * 目标量级：作文 100+ / 范文 60+ · 听力 90 · 阅读 60 · 完形 40 · 听写 60 · 翻译 80 · 模考 24
 * 用法: node scripts/expand-practice-bank-v2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(import.meta.dirname, '../public/data');
const practicePath = path.join(DATA_DIR, 'practice.json');
const base = JSON.parse(fs.readFileSync(practicePath, 'utf8'));

const q = (id, title, options, answer, explain = '') => ({ id, title, options, answer, explain });
const L = (id, title, section, transcript, questions, duration = 40) => ({
  id, title, section,
  audioPack: { id: id + '-audio', src: null, durationSec: duration, speedSteps: [0.7, 0.9, 1.0, 1.2] },
  transcript, questions,
});
const R = (id, title, passage, questions) => ({ id, title, passage, questions });
const C = (id, title, passage, blanks) => ({ id, title, passage, blanks });
const D = (id, level, title, sentences) => ({ id, level, title, sentences });
const T = (id, level, cn, en) => ({ id, level, cn, en });
const S = (id, title, lines) => ({ id, title, lines });
const W = (id, level, title, prompt, essay, points) => ({ id, level, title, prompt, essay, points });

function dedupe(arr) {
  const m = new Map();
  for (const x of arr || []) if (x && x.id != null) m.set(x.id, x);
  return [...m.values()];
}

// ═══════════════════════════════════════════
// 作文库：批量主题 + 完整范文
// ═══════════════════════════════════════════
const essayTopics = [
  // CET-4
  ['CET-4', '早起与作息', 'Some students prefer getting up early; others stay up late. Which is better for study?', 'Early Birds or Night Owls?', ['作息与效率', '个体差异', '规律优先'], 'Whether one studies best at dawn or at midnight depends on the person, but irregular schedules usually hurt more than they help.\n\nEarly risers often report quieter mornings and fewer interruptions. A fixed early routine can free time for exercise and breakfast, both of which support concentration. Night owls, however, may find their minds sharper after dark when campuses grow quiet.\n\nThe real enemy is inconsistency. Sleeping at wildly different hours confuses the body clock and weakens memory. Students should discover their natural peak time, protect a stable sleep window, and avoid all-nighters before exams.\n\nIn short, choose the rhythm you can keep, not the one that looks impressive online. Steady habits beat heroic bursts.'],
  ['CET-4', '课堂出勤', 'Should class attendance be mandatory? Give your views.', 'On Mandatory Attendance', ['强制点名', '自律学习', '课堂价值'], 'Some universities require attendance; others leave it to students. Both sides have merit.\n\nSupporters argue that showing up builds discipline and exposes learners to discussion they cannot get from slides. Teachers also receive feedback from faces in the room. Critics reply that mature students should manage their own time, and that forced attendance fills seats without filling minds.\n\nA middle path works best: require presence for labs and presentations, allow flexibility for large lectures if assignments are submitted, and improve teaching quality so students want to come.\n\nAttendance policy should serve learning, not bureaucracy. When classes are worth attending, numbers take care of themselves.'],
  ['CET-4', '共享单车', 'Write a short essay on shared bicycles in cities.', 'Shared Bicycles on Campus and Beyond', ['便利出行', '乱停乱放', '共管共治'], 'Shared bicycles solved the "last mile" problem for many students. A short ride between the dorm and the library can save bus time and money.\n\nProblems appear when bikes are dumped on sidewalks or locked privately. Management companies must rebalance fleets, while users need basic rules: park in marked areas, report broken locks, and ride safely in traffic.\n\nUniversities can help by marking parking zones near gates and teaching road safety during orientation. Responsible use keeps the system cheap and available.\n\nShared mobility is a public good only when the public treats it as one.'],
  ['CET-4', '兴趣爱好', 'Why are hobbies important for college students?', 'Hobbies Beyond the Syllabus', ['减压', '技能迁移', '社交圈'], 'A timetable full of courses is not a complete education. Hobbies restore energy and sometimes open careers.\n\nMusic, sports, cooking, or coding for fun train patience and creativity. They also create social circles beyond one\'s major, which is valuable in a world of cross-disciplinary work.\n\nThe risk is turning hobbies into yet another competition. A weekend hike does not need an audience. Students should keep at least one activity that exists for joy alone.\n\nBalance is not a luxury; it is a study skill in disguise.'],
  ['CET-4', '第一印象', 'Do first impressions matter in social life?', 'The Weight of First Impressions', ['快速判断', '偏见风险', '持续了解'], 'First impressions form quickly through clothing, tone, and eye contact. They influence interviews and friendships more than we admit.\n\nYet snap judgments are often wrong. Quiet people may be deep thinkers; nervous speakers may know the material well. Relying only on first minutes creates unfair bias.\n\nWise social practice is two-sided: present yourself carefully when it matters, and give others time beyond the first meeting.\n\nImpressions open doors; character keeps them open.'],
  ['CET-4', '口头报告', 'How can students give better oral presentations?', 'Speaking to the Room', ['充分准备', '眼神交流', '控制时长'], 'A good presentation starts weeks before the microphone. Structure first: one clear message, three supporting points, a short story or example.\n\nPractice aloud until timing feels natural. Slides should support speech, not replace it. During delivery, slow down, look at people rather than the screen, and pause after key ideas.\n\nQuestions are gifts, not attacks. If you do not know an answer, say so and promise a follow-up.\n\nConfidence is preparation made visible.'],
  ['CET-4', '食堂浪费', 'What can be done to reduce food waste in canteens?', 'Finishing What We Take', ['按需取餐', '小份选项', '宣传常态'], 'Canteen waste is visible every evening: trays of rice and vegetables thrown away. Solutions are simple but need consistency.\n\nOffer smaller portion prices, allow half-rice orders, and place reminders that taking less is smarter than dumping more. Student volunteers can weigh waste weekly and post results.\n\nCulture shifts when finishing a reasonable plate becomes normal rather than heroic.\n\nFood waste is an ethical issue long before it is an environmental report.'],
  ['CET-4', '理想工作', 'What qualities matter most in an ideal job?', 'Beyond Salary', ['成长空间', '工作意义', '团队氛围'], 'Young graduates often weigh salary first, then discover other factors dominate daily satisfaction.\n\nOpportunity to learn, respectful teammates, and a manager who gives clear feedback predict happiness better than a small pay gap. Meaning matters too: work that aligns with values sustains energy during hard months.\n\nNo job is perfect. The practical approach is to rank what you will not compromise on for the next three years.\n\nChoose a job that grows you, not only one that photographs well.'],
  ['CET-4', '礼貌与尊重', 'Why do politeness and respect still matter?', 'Small Words, Large Effects', ['日常用语', '尊重边界', '冲突降温'], 'Please, thank you, and sorry are tiny words with large social effects. They signal that another person\'s time counts.\n\nPoliteness is not weakness. In conflict, calm language lowers temperature and makes solutions possible. Online, where tone disappears easily, careful wording matters even more.\n\nSchools can model respect in how teachers speak to students; families model it at dinner tables.\n\nCivil behavior is infrastructure for cooperation.'],
  ['CET-4', '考试压力', 'How should students deal with exam pressure?', 'Pressure, Not Panic', ['拆解任务', '模拟练习', '寻求帮助'], 'Exam pressure is universal. The goal is not to eliminate nerves but to keep them useful.\n\nBreak revision into small targets, use past papers under timed conditions, and sleep before the test rather than memorizing until dawn. Breathing exercises reduce physical panic.\n\nIf anxiety becomes overwhelming, counseling centers exist for a reason—asking for help is strength.\n\nPreparation plus self-care is the only reliable formula.'],
  // 更多 CET-4
  ['CET-4', '校园卡与消费', 'Comment on cashless payment on campus.', 'Wallet-Free Campus', ['便捷', '账单透明', '丢卡风险'], 'Mobile pay now covers dining halls, laundries, and copy shops on many campuses. Benefits include speed and a clear digital record of spending.\n\nRisks include overspending when money feels abstract and security problems if a phone is lost. Students should enable lock screens, check weekly bills, and keep a small cash backup.\n\nConvenience is real; mindfulness is still required.'],
  ['CET-4', '选修课', 'What is the value of elective courses?', 'Electives as Exploration', ['跨学科视野', '发现兴趣', '软技能'], 'Major courses build depth; electives build width. A computer science student who takes design or psychology learns to see users, not only code.\n\nElectives also allow low-risk testing of new interests before committing careers.\n\nThe strategy is simple: choose at least one elective far from your major each year, and treat it seriously rather than as an easy grade.\n\nBreadth is not distraction; it is future adaptability.'],
  ['CET-4', '宿舍网络', 'Should dorm internet be limited at night?', 'Night Internet, Day Grades', ['睡眠保障', '自律责任', '灵活政策'], 'Some dorms cut internet after midnight; others keep it open. Both aim at student well-being.\n\nNight cutoffs protect sleep but frustrate night owls and group projects across time zones. Full freedom assumes self-control that not everyone has yet.\n\nA softer model—bandwidth throttling, quiet-hour reminders, and education on sleep—often works better than hard bans.\n\nRules should teach habits, not only enforce them.'],
  ['CET-4', '第二外语', 'Is learning a second foreign language worthwhile?', 'One More Language, One More Window', ['认知益处', '职业加分', '文化理解'], 'English is necessary but no longer sufficient for many roles. A second language—Spanish, Japanese, Arabic—opens markets and research.\n\nEven without fluency, beginner-level skills show employers that you can learn complex systems.\n\nLanguage study also softens cultural arrogance: grammar forces you to see the world through another logic.\n\nStart small, stay consistent, and use the language for real tasks.'],
  ['CET-4', '假期规划', 'How should students plan winter or summer vacation?', 'Rest That Restores', ['休息', '技能充电', '家庭时间'], 'Long breaks fail in two ways: total collapse into screens or overpacked resume-building.\n\nA balanced plan includes real rest, one skill project, part-time work or volunteering, and unhurried family time.\n\nWrite a loose weekly plan before the break starts; leave free days empty on purpose.\n\nVacation is not wasted time. It is when the next semester\'s energy is banked.'],
  ['CET-4', '名牌与身份', 'What do you think of brand-name obsession among young people?', 'Names on Clothes, Values on Us', ['消费符号', '自我认同', '理性选择'], 'Brand names can signal quality, but obsession confuses logos with worth.\n\nSocial comparison online makes ordinary incomes feel inadequate. The cure is not forced poverty but clarity: buy quality when it lasts, refuse debt for status, and invest in skills that cannot be worn out.\n\nIdentity is built through actions over years, not through seasonal collections.'],
  ['CET-4', '电子词典与手机', 'Are paper dictionaries obsolete?', 'Dictionary Wars', ['查询速度', '深度记忆', '场景选择'], 'Phones beat paper on speed. Students can look up words mid-reading without losing place.\n\nYet the friction of a paper dictionary sometimes deepens memory, and specialized dictionaries explain usage better than first-page search results.\n\nPractical answer: use digital tools for daily study, keep one good learner\'s dictionary for serious writing, and review looked-up words rather than collecting screenshots.\n\nTools matter less than the habit of review.'],
  ['CET-4', '宿舍卫生', 'How can roommates share cleaning fairly?', 'Fair Chores, Calm Rooms', ['轮值表', '公共区域', '沟通规则'], 'Shared rooms fail when cleaning depends on mood. Solutions are almost boring: a visible rotation chart, clear standards for the bathroom and floor, and a ten-minute weekly reset together.\n\nIf someone repeatedly skips chores, address it calmly with facts rather than group chat gossip.\n\nA clean room is not about perfection; it is about respect for shared air.'],
  ['CET-4', '英语角', 'Are English corners useful?', 'Practice That Speaks Back', ['真实输出', '降低焦虑', '主题设计'], 'English corners help when they force real speaking, not only listening to advanced peers.\n\nSmaller groups, themed topics, and patient facilitators lower anxiety. Beginners should prepare two sentences before arriving.\n\nUsefulness rises when participants give gentle feedback instead of silent judgment.\n\nLanguage grows through use, even imperfect use.'],
  ['CET-4', '成绩与能力', 'Do grades always reflect ability?', 'Grades as Signals', ['考核局限', '综合能力', '持续成长'], 'Grades summarize performance in a course under given rules. They signal effort and some skills, but miss creativity, collaboration, and late-blooming talent.\n\nEmployers increasingly ask for projects and portfolios alongside transcripts.\n\nStudents should treat grades as feedback, not identity. Improve weak areas without believing a single number defines you.\n\nAbility is a trajectory; grades are snapshots.'],
  // CET-6
  ['CET-6', '算法推荐与信息茧房', 'Discuss how recommendation algorithms shape what we read.', 'Feed the Mind, Not Only the Feed', ['个性化便利', '信息茧房', '媒介素养'], 'Recommendation systems save time by surfacing content similar to what we already like. The cost is narrower exposure: complex viewpoints are filtered out as "uninteresting."\n\nThis is not merely individual weakness. Design choices optimize engagement, often amplifying outrage.\n\nCountermeasures include following diverse sources, using chronological modes when available, and reading long-form analysis weekly. Schools should teach algorithmic literacy as part of media education.\n\nA healthy mind diets on information the way a healthy body diets on food—variety included.'],
  ['CET-6', '数据隐私', 'Why does personal data privacy matter for ordinary users?', 'The Value of Quiet Data', ['数据即资产', '同意与透明', '最小必要'], 'Apps request contacts, location, and photos for convenience. Users often consent without reading.\n\nPersonal data can reveal habits, finances, and social graphs. Once leaked, it cannot be "unleaked."\n\nPractical hygiene: limit permissions, prefer services with clear privacy policies, and avoid reusing passwords. Regulators must punish deceptive design, not only breaches.\n\nPrivacy is not secrecy; it is control over context.'],
  ['CET-6', '远程教育公平', 'Has remote education widened or narrowed inequality?', 'Remote Does Not Mean Equal', ['设备与网络', '家庭学习环境', '政策补位'], 'Remote classes reached students during lockdowns, but outcomes diverged. Learners with quiet rooms, fast internet, and supportive adults progressed; others struggled with shared devices and noisy homes.\n\nAccess to a login is not access to learning. Schools need loaner devices, offline materials, and flexible deadlines.\n\nTechnology is an equalizer only when institutions fund the conditions around it.'],
  ['CET-6', '城市通勤与住房', 'How do long commutes affect quality of life?', 'The Hidden Cost of Distance', ['时间贫困', '身心健康', '职住平衡'], 'Long commutes steal hours from sleep, exercise, and family. Research links extreme commuting with stress and lower life satisfaction.\n\nHousing prices push workers outward; employers cluster downtown. Solutions include remote-work days, transit investment, and mixed-use zoning so jobs exist near homes.\n\nUrban planning is lifestyle policy in concrete form.'],
  ['CET-6', '消费信贷与青年', 'What are the risks of easy consumer credit for young adults?', 'Borrowed Lifestyles', ['冲动消费', '利率陷阱', '财商教育'], 'Installment apps make expensive phones feel affordable until interest stacks. Young earners with unstable income are especially vulnerable.\n\nPrevention combines product regulation—clear APR labels, cooling-off periods—and financial literacy that teaches budgeting before slogans about "living fully."\n\nDebt can finance growth (education, tools) or fantasy (status goods). Knowing the difference is adulthood.'],
  ['CET-6', '文化遗产数字化', 'Does digitizing heritage save or dilute it?', 'Pixels and Memory', ['可访问性', '语境流失', '原真保护'], 'High-resolution scans let a student in another province study a fragile manuscript. Virtual museums expand access during disasters and pandemics.\n\nYet a flattened image is not a temple: smell, scale, and community ritual disappear. Digitization without context becomes tourism screenshots.\n\nBest practice pairs digital archives with living communities and physical conservation budgets.\n\nCode can carry memory; only people can keep it meaning.'],
  ['CET-6', '职场终身雇佣的终结', 'Is the idea of a "job for life" still realistic?', 'Careers as Portfolios', ['技能折旧', '组织忠诚度变化', '个人品牌'], 'Lifetime employment has shrunk in most private sectors. Projects reorganize, firms merge, and automation reshapes roles.\n\nWorkers now need portable skills, networks, and savings buffers. Employers who still promise loyalty must offer growth in return.\n\nThis is not pure instability; it can reward curiosity. But societies need safety nets for transitions—training accounts, portable benefits.\n\nPlan for change even while performing well today.'],
  ['CET-6', '睡眠不足的社会成本', 'Beyond personal health, what does sleep deprivation cost society?', 'When Cities Never Sleep', ['事故风险', '医疗负担', '制度设计'], 'Sleep loss is not only private. Tired drivers crash; fatigued doctors err; exhausted students learn less and create long-term public costs.\n\nShift work, late-night culture, and always-on messaging normalize exhaustion.\n\nPolicy responses include limits on excessive overtime, later school start times, and public campaigns that treat sleep as safety infrastructure.\n\nRest is productivity\'s foundation, not its enemy.'],
  ['CET-6', '语言濒危与方言保护', 'Why should societies protect minority languages?', 'Languages as Ecosystems', ['知识载体', '身份认同', '教育政策'], 'Each language encodes unique ways of classifying nature, kinship, and time. When a language dies, libraries die with it.\n\nGlobalization favors dominant tongues, but protection is possible: bilingual education, community media, and documentation projects led by native speakers.\n\nSymbolic recognition without resources changes little. Living languages need daily use in schools and services.\n\nDiversity of speech is diversity of mind.'],
  ['CET-6', '科研评价与论文压力', 'How do publication metrics affect research quality?', 'Counting the Wrong Things', ['影响因子崇拜', '短期主义', '质量优先'], 'Universities often reward paper counts and journal brands. The pressure can encourage salami-slicing, rushed methods, and fashionable topics over necessary ones.\n\nAlternative metrics—open data, replication, societal impact—are harder but more honest.\n\nIndividual researchers can still choose integrity; institutions must make that choice viable.\n\nScience advances when curiosity leads and numbers follow.'],
  ['CET-6', '老龄化与科技', 'How can technology support aging populations?', 'Designing for Longer Lives', ['健康监测', '数字鸿沟', '适老化界面'], 'Wearables can flag falls and irregular heartbeats; telemedicine reduces travel for routine care. Social apps fight isolation when designed for older eyes and hands.\n\nRisks include surveillance creep, scams, and interfaces that assume youthful dexterity.\n\nGood design involves older users as co-creators, not afterthoughts. Technology should add dignity, not dependency.'],
  ['CET-6', '职业倦怠', 'What causes burnout among young professionals, and how can it be prevented?', 'Beyond "Just Rest"', ['工作负荷', '意义感流失', '组织责任'], 'Burnout is not fixed by weekend yoga alone. Chronic overload, lack of control, and unfair recognition systems drive exhaustion.\n\nPrevention requires organizational fixes: realistic deadlines, manager training, and workload transparency. Individuals benefit from boundaries, but boundaries fail in toxic cultures.\n\nHealthy workplaces treat energy as a managed resource.'],
  ['CET-6', '开放获取学术', 'Should publicly funded research be free to read?', 'Knowledge as Public Good', ['纳税人资助', '传播效率', '出版模式'], 'If taxes fund research, paywalls restrict who can build on results. Open access accelerates innovation in poorer institutions and countries.\n\nPublishers still need sustainable models—transformational agreements, institutional repositories, and fair APCs.\n\nThe principle is simple: knowledge financed by the public should return to the public.'],
  ['CET-6', '极简主义生活方式', 'Is minimalism a solution to overconsumption or a luxury trend?', 'Less as a Practice', ['需求与欲望', '环保效益', '可及性'], 'Minimalism promises clarity through fewer possessions. Environmentally, buying less reduces waste and carbon.\n\nCritics note that curated minimalism often requires wealth to "choose" less; low-income families never had excess to reject.\n\nThe useful core is intentional consumption, not aesthetic scarcity. Question each purchase: does this serve a life goal or an image?\n\nEnough is a radical, learnable standard.'],
  ['CET-6', '危机中的科学传播', 'How should scientists communicate during public health crises?', 'Uncertainty, Spoken Clearly', ['及时透明', '纠错机制', '信任建设'], 'During crises, people need guidance before certainty is complete. Scientists must explain uncertainty without appearing confused.\n\nClear briefings, visible evidence updates, and admission of mistakes build more trust than false confidence.\n\nJournalists and platforms share responsibility for context, not only speed.\n\nTrust is built in the briefing room long before it is needed.'],
  ['CET-6', '职业教育地位', 'Why does vocational education deserve more respect?', 'Skill Is Not Second-Class', ['劳动力结构', '社会偏见', '产教融合'], 'Economies need technicians as much as theorists. Vocational paths often lead to stable, well-paid work sooner.\n\nStigma remains strong in some societies, pushing unsuitable students into overcrowded academic tracks.\n\nSolutions include dual education systems, industry partnerships, and transparent career data.\n\nPrestige should follow competence, not only classroom length.'],
  ['CET-6', '游戏化学习的边界', 'When does gamification help or harm learning?', 'Points vs. Understanding', ['动机外化', '浅层参与', '适度设计'], 'Badges and streaks can nudge early engagement. Overused, they shift attention from mastery to scores, and learners quit when rewards disappear.\n\nEffective gamification supports practice schedules and visible progress, not circus effects.\n\nEducators should ask: does this design deepen effort or only decorate it?'],
  ['CET-6', '全球供应链脆弱性', 'What have recent disruptions taught us about global supply chains?', 'Efficiency vs. Resilience', ['单一来源风险', '库存策略', '区域备份'], 'Just-in-time systems cut costs until shocks exposed their fragility. Semiconductors, medical supplies, and energy all showed single-point failures.\n\nFirms now weigh resilience: diversified suppliers, strategic stockpiles, and regional capacity.\n\nTrade remains beneficial; naive optimization does not. Robust systems plan for the unexpected decade, not only the average year.'],
  ['CET-6', '城市噪音治理', 'How can cities reduce harmful noise while staying vibrant?', 'Soundscapes for Health', ['交通噪音', '分区规划', '静音技术'], 'Chronic noise disrupts sleep and raises stress, yet cities thrive on activity. Solutions include quieter road surfaces, night freight limits, green buffers, and zoning that separates nightlife from bedrooms.\n\nEnforcement and measurement matter as much as slogans.\n\nA livable city is not silent; it is intentionally designed.'],
  ['CET-6', '研究生扩招与就业', 'How should graduate enrollment relate to job markets?', 'Degrees and Doors', ['培养质量', '产业需求', '预期管理'], 'Expanding master\'s programs can raise national skills or delay employment without adding value.\n\nAlignment with industry needs, funded research slots, and honest career data help students choose wisely.\n\nSociety benefits from advanced training only when quality scales with quantity.'],
  ['CET-6', '短视频与注意力经济', 'Who profits when attention is the product?', 'Eyes for Sale', ['广告模式', '成瘾设计', '数字素养'], 'Free platforms monetize watch time. Designers compete for fragments of attention with autoplay and infinite scroll.\n\nUsers "pay" with data and focus. Awareness helps, but structural change—ad transparency, time tools, child protections—matters more than individual heroism.\n\nAttention is finite infrastructure of a mind. Spend it like money.'],
  ['CET-6', '绿色金融', 'Can finance drive environmental goals?', 'Capital with Conditions', ['ESG投资', '漂绿风险', '信息披露'], 'Green bonds and sustainability-linked loans can fund cleaner energy. Critics warn of greenwashing when standards are weak.\n\nCredible impact needs third-party verification, clear metrics, and penalties for misses.\n\nMoney already shapes the physical world. The task is steering it honestly.'],
  ['CET-6', '跨文化团队管理', 'What makes cross-cultural teams succeed?', 'Differences as Design', ['沟通规范', '时区协作', '心理安全'], 'Diverse teams innovate when differences are managed, not ignored. Clear communication norms, explicit decision rules, and rotating meeting times reduce friction.\n\nPsychological safety lets minority voices speak without social cost.\n\nDiversity is raw material; inclusion is the manufacturing process.'],
  ['CET-6', '药物与保健品广告', 'How should health claims in advertising be regulated?', 'Promises and Proofs', ['证据等级', '夸大疗效', '消费者保护'], 'Supplement ads often blur science and suggestion. Regulation should require substantiated claims and ban misleading language.\n\nPublic education on basic trial design helps consumers read labels skeptically.\n\nHealth markets need trust; trust needs rules.'],
  ['CET-6', '历史街区商业化', 'Can commercialization fund heritage or destroy it?', 'Shops vs. Memory', ['租金与空心化', '原住民流失', '活态保护'], 'Lively streets can pay for roof repairs and craft revival. Yet chains may displace residents and turn culture into costume.\n\nPolicies that cap pure tourist retail, support local tenants, and involve communities in planning keep authenticity alive.\n\nHeritage survives when people can still live inside it.'],
  ['CET-6', '员工监控技术', 'Where should workplace monitoring end?', 'Trust, Verified', ['生产力指标', '隐私边界', '结果导向'], 'Software can track keystrokes and screenshots. Used poorly, it breeds fear and performative busyness.\n\nPrefer outcome-based evaluation, transparent monitoring policies, and limits on invasive tools.\n\nManagement without trust is expensive theater.'],
  ['CET-6', '体育赛事与城市品牌', 'Do mega events pay off for host cities?', 'Stadiums and Stories', ['基础设施遗产', '财政风险', '长期利用'], 'Olympics and World Cups can modernize transit and globalize a city brand. Cost overruns and white-elephant venues are common failures.\n\nHonest cost-benefit analysis and legacy planning should precede bids.\n\nA city is not a billboard; residents pay the bills.'],
  ['CET-6', '儿童屏幕时间', 'How much screen time is appropriate for children?', 'Growing Up Digital', ['内容质量', '亲子共看', '睡眠保护'], 'Debates fixate on minutes; content and context matter more. Creative making and video-chat with family differ from passive endless feeds.\n\nCo-viewing and clear device-free sleep windows help. Parents need realistic guidance, not only guilt.\n\nChildhood needs boredom, movement, and unhurried attention.'],
  ['CET-6', '远程医疗监管', 'What regulations does telemedicine need to grow safely?', 'Care at a Distance', ['处方安全', '数据保护', '城乡可及'], 'Telemedicine expands access but raises issues of misdiagnosis, prescription abuse, and data breaches.\n\nLicensing across regions, clear standards of care, and secure platforms are essential.\n\nInnovation in health must move at the speed of safety.'],
  ['CET-6', '创意产业与版权', 'How can copyright balance creators and the public?', 'Fair Use, Fair Pay', ['合理使用', '平台责任', '创作者收益'], 'Creators need income; society needs quoting, teaching, and remix culture. Over-long copyrights and weak licensing systems harm both sides.\n\nClear fair-use norms, collective licensing, and transparent platform payouts can rebalance.\n\nCulture is cumulative—rules should honor past work without freezing the future.'],
  ['CET-6', '应急志愿组织', 'What role do volunteers play in disaster response?', 'Organized Kindness', ['专业培训', '与官方协同', '心理支持'], 'Volunteers bring speed and local knowledge after disasters. Untrained crowds can also block roads and spread rumors.\n\nPre-disaster training, credentialing, and clear chains of command turn goodwill into results.\n\nPrepared communities recover faster.'],
  ['CET-6', '大学生创业', 'Is encouraging student entrepreneurship wise?', 'Start Smart, Not Only Young', ['失败成本', '导师资源', '学业平衡'], 'Entrepreneurship teaches initiative and market sense. It can also drain savings and derail study when glamorized without support.\n\nIncubators should offer mentors, honest failure narratives, and academic flexibility.\n\nNot everyone must found a company; everyone can learn entrepreneurial thinking.'],
  ['CET-6', '空气污染与建筑设计', 'How can architecture improve urban air quality?', 'Buildings That Breathe', ['通风设计', '材料排放', '绿化整合'], 'Indoor air often matters more than outdoor readings. Proper ventilation, low-emission materials, and green facades reduce exposure.\n\nBuilding codes should require air metrics, not only energy scores.\n\nHealthy air is designed, not wished for.'],
  ['CET-6', '翻译技术与外语专业', 'Will machines make language majors obsolete?', 'Translators After Translation', ['文化语用', '专业领域', '人机协作'], 'Machines handle routine gisting well. Literary nuance, legal stakes, and high-context diplomacy still need humans.\n\nLanguage programs should emphasize intercultural expertise, subject-matter depth, and AI-assisted workflows.\n\nThe major is not dying; its center of gravity is shifting.'],
];

const writingEssays = essayTopics.map((t, i) => {
  const [level, titleCn, prompt, titleEn, points, essay] = t;
  return W(`PV${String(i + 1).padStart(3, '0')}`, level, titleCn, `${prompt}\n\n(参考题型: ${titleEn})`, essay, points);
});

// 额外无范文作文题（快速浏览用）
const extraPromptTitles = [
  ['CET-4', '大学生是否应炒股', 'Write an essay on whether college students should trade stocks.'],
  ['CET-4', '宿舍熄灯制度', 'Comment on dormitory lights-out policies.'],
  ['CET-4', '大学社团的意义', 'What do student clubs contribute to campus life?'],
  ['CET-4', '实习与课程冲突', 'How should students balance internships and courses?'],
  ['CET-4', '电子笔记还是手写笔记', 'Which is better for study: digital or handwritten notes?'],
  ['CET-4', '校园快递代取', 'Discuss the phenomenon of paid package pickup on campus.'],
  ['CET-4', '是否应禁止外卖进宿舍', 'Should food delivery be banned in dormitories?'],
  ['CET-4', '大学该不该强制体育课', 'Should physical education be compulsory in universities?'],
  ['CET-4', '宿舍养宠物', 'Is keeping pets in dormitories acceptable?'],
  ['CET-4', '英语演讲比赛收获', 'What can speech contests teach participants?'],
  ['CET-6', '平台经济与灵活就业', 'Discuss platform economy and flexible employment.'],
  ['CET-6', '生物多样性保护', 'Why is biodiversity conservation a shared duty?'],
  ['CET-6', '城市热岛效应', 'How can cities reduce the heat island effect?'],
  ['CET-6', '学术合作中的署名伦理', 'Discuss ethics of authorship in academic collaboration.'],
  ['CET-6', '远程办公与城市房价', 'How may remote work reshape housing markets?'],
  ['CET-6', '自动驾驶的社会接受度', 'What influences public acceptance of autonomous driving?'],
  ['CET-6', '食品添加剂与公众认知', 'How should food additives be communicated to the public?'],
  ['CET-6', '数字遗产处理', 'What should happen to digital assets after death?'],
  ['CET-6', '体育博彩监管', 'How should sports betting be regulated?'],
  ['CET-6', '高校科研伦理审查', 'Why do research ethics boards matter?'],
  ['CET-6', '绿色建筑成本', 'Do green buildings save money in the long run?'],
  ['CET-6', '国际学生流动', 'What drives international student mobility after the pandemic?'],
  ['CET-6', '短视频课堂利弊', 'Should educators use short-video formats for teaching?'],
  ['CET-6', '城市步道系统', 'How do walking systems improve urban life?'],
  ['CET-6', '药物集中采购', 'Discuss centralized drug procurement policies.'],
  ['CET-6', '开源软件与公共部门', 'Should governments prefer open-source software?'],
  ['CET-4', '手机支付安全', 'How can users stay safe with mobile payment?'],
  ['CET-4', '大学生作息调查', 'Report findings on student sleep schedules.'],
  ['CET-6', '算法招聘偏见', 'How can algorithmic hiring bias be reduced?'],
  ['CET-6', '区域协调发展', 'Why is regional coordinated development important?'],
  ['CET-4', '图书馆座位预约', 'Comment on library seat reservation systems.'],
  ['CET-6', '冷链物流与食品安全', 'How does cold-chain logistics protect food safety?'],
  ['CET-4', '大学生时间管理APP', 'Do study-tracking apps actually help?'],
  ['CET-6', '文化遗产活化利用', 'How can heritage sites be used without being abused?'],
  ['CET-6', '气象灾害预警', 'How can extreme-weather early warnings save lives?'],
  ['CET-4', '校园二手交换会', 'Describe the benefits of campus swap markets.'],
  ['CET-6', '器官捐献宣传', 'How should organ donation be promoted ethically?'],
  ['CET-6', '企业碳中和路径', 'What does corporate carbon neutrality require?'],
  ['CET-4', '大学食堂改革建议', 'Write suggestions for improving campus dining.'],
  ['CET-6', '数智政府服务', 'How does digital government service affect citizens?'],
  ['CET-4', '英语听力学习方法', 'Share effective ways to improve English listening.'],
  ['CET-6', '产业工人技能升级', 'Why is upskilling industrial workers critical?'],
  ['CET-6', '邻避效应与公共沟通', 'How can NIMBY conflicts be managed fairly?'],
  ['CET-4', '宿舍网络学习资源', 'How should dorms support online learning resources?'],
  ['CET-6', '人口结构变化与教育', 'How should education adapt to demographic change?'],
  ['CET-4', '大学开放日', 'What should a university open day offer?'],
  ['CET-6', '航运脱碳', 'What challenges does shipping decarbonization face?'],
  ['CET-6', '心理服务可及性', 'How can mental health services become more accessible?'],
  ['CET-4', '考试诚信承诺书', 'Do integrity pledges reduce cheating?'],
  ['CET-6', '标准必要专利', 'How should standard-essential patents be licensed fairly?'],
];

const extraPrompts = extraPromptTitles.map((t, i) => ({
  id: `PX${String(i + 1).padStart(3, '0')}`,
  level: t[0],
  title: t[1],
  prompt: t[2],
}));

// ═══════════════════════════════════════════
// 听力批量生成（主题 × 场景模板）
// ═══════════════════════════════════════════
function makeListening(id, title, kind, lines, qs) {
  const transcript = lines.map(([sp, text]) => ({ speaker: sp, text }));
  return L(id, title, kind, transcript, qs);
}

const listeningExtra = [];
const listenTemplates = [
  {
    id: 'L50', title: '短对话 · 航班延误', section: 'Section A',
    tr: [['M', 'My flight to Shanghai is delayed two hours because of weather.'],
         ['W', 'You can wait at the lounge or rebook for tomorrow morning.'],
         ['M', 'I have a meeting tonight, so I will wait and hope it clears.'],
         ['Q', 'What will the man most likely do?']],
    qs: [['L50-1', 'Why is the flight delayed?', ['Mechanical issue', 'Weather', 'Strike', 'Security'], 1],
         ['L50-2', 'What will the man do?', ['Rebook tomorrow', 'Wait at the lounge', 'Cancel the meeting', 'Take a train'], 1]],
  },
  {
    id: 'L51', title: '长对话 · 课程评估', section: 'Section B',
    tr: [['W', 'How do you find Professor Zhao\'s statistics course?'],
         ['M', 'Challenging but fair. Weekly problem sets keep me honest.'],
         ['W', 'I heard the final is open-book.'],
         ['M', 'Only formula sheets are allowed, not textbooks.'],
         ['W', 'Thanks—that changes how I review.']],
    qs: [['L51-1', 'How does the man describe the course?', ['Easy and boring', 'Challenging but fair', 'Impossible', 'Irrelevant'], 1],
         ['L51-2', 'What is allowed in the final?', ['Textbooks', 'Formula sheets only', 'Phones', 'Nothing'], 1],
         ['L51-3', 'What will the woman do?', ['Drop the class', 'Adjust her review', 'Complain to the dean', 'Skip the final'], 1]],
  },
  {
    id: 'L52', title: '短文 · 城市共享单车', section: 'Section C',
    tr: [['N', 'City officials reported a twenty percent rise in bike-share trips this year.'],
         ['N', 'Most rides are under three kilometers, replacing short taxi journeys.'],
         ['N', 'New parking corrals near subway exits reduced sidewalk clutter.']],
    qs: [['L52-1', 'What rose by twenty percent?', ['Taxi fares', 'Bike-share trips', 'Bus riders', 'Fines'], 1],
         ['L52-2', 'What problem did corrals reduce?', ['Bike theft only', 'Sidewalk clutter', 'Air noise', 'Fare evasion'], 1]],
  },
  {
    id: 'L53', title: '短对话 · 医院预约', section: 'Section A',
    tr: [['W', 'I would like to see a dermatologist next week.'],
         ['M', 'Dr. Wang has openings on Tuesday at 3 and Friday at 10.'],
         ['W', 'Friday morning works better for me.']],
    qs: [['L53-1', 'Which doctor does the woman want?', ['Cardiologist', 'Dermatologist', 'Dentist', 'Surgeon'], 1],
         ['L53-2', 'When will she go?', ['Tuesday 3 p.m.', 'Friday 10 a.m.', 'Monday', 'Sunday'], 1]],
  },
  {
    id: 'L54', title: '长对话 · 宿舍报修进度', section: 'Section B',
    tr: [['M', 'Has the technician looked at the leaking sink yet?'],
         ['W', 'Parts arrive tomorrow; the repair is scheduled for the afternoon.'],
         ['M', 'Can we get a temporary room?'],
         ['W', 'Only if the leak worsens overnight.']],
    qs: [['L54-1', 'What is the problem?', ['Broken heater', 'Leaking sink', 'No internet', 'Broken window'], 1],
         ['L54-2', 'When is the repair scheduled?', ['This morning', 'Tomorrow afternoon', 'Next week', 'Unknown'], 1],
         ['L54-3', 'When can students get a temporary room?', ['Always', 'If the leak worsens', 'Never', 'On weekends'], 1]],
  },
  {
    id: 'L55', title: '短文 · 志愿教学', section: 'Section C',
    tr: [['N', 'A weekend tutoring program pairs university volunteers with middle-school students in math and English.'],
         ['N', 'Training sessions cover lesson planning and positive feedback techniques.'],
         ['N', 'Volunteers commit two hours a week for at least one semester.']],
    qs: [['L55-1', 'What subjects are taught?', ['History only', 'Math and English', 'Science only', 'Music'], 1],
         ['L55-2', 'What is the time commitment?', ['Two hours a week', 'Ten hours a day', 'One hour a month', 'Flexible'], 0]],
  },
  {
    id: 'L56', title: '短对话 · 论文格式', section: 'Section A',
    tr: [['M', 'Which citation style does the department require?'],
         ['W', 'APA for social sciences; engineering uses IEEE.'],
         ['M', 'I will download the IEEE template tonight.']],
    qs: [['L56-1', 'What style does engineering use?', ['MLA', 'APA', 'IEEE', 'Chicago'], 2]],
  },
  {
    id: 'L57', title: '长对话 · 参观实验室', section: 'Section B',
    tr: [['W', 'Is the materials lab open for tours on Friday?'],
         ['M', 'Yes, but groups must be under twelve and wear closed shoes.'],
         ['W', 'We will confirm headcount by Wednesday.']],
    qs: [['L57-1', 'How large can a tour group be?', ['Up to twelve', 'No limit', 'Exactly twenty', 'Five'], 0],
         ['L57-2', 'What is required on feet?', ['Sandals', 'Closed shoes', 'Slippers', 'Nothing special'], 1],
         ['L57-3', 'When will headcount be confirmed?', ['Monday', 'Wednesday', 'Friday', 'Sunday'], 1]],
  },
  {
    id: 'L58', title: '短文 · 电子竞技社团', section: 'Section C',
    tr: [['N', 'The e-sports club now requires members to maintain academic standing.'],
         ['N', 'Practice rooms close at eleven on weeknights.'],
         ['N', 'The club partners with the sports center on physical training.']],
    qs: [['L58-1', 'What is required of members?', ['Perfect grades only', 'Academic standing', 'Payment', 'No requirement'], 1],
         ['L58-2', 'When do practice rooms close on weeknights?', ['Nine', 'Eleven', 'Midnight', 'Never'], 1]],
  },
  {
    id: 'L59', title: '短对话 · 火车票学生优惠', section: 'Section A',
    tr: [['W', 'Does the student discount apply to high-speed rail?'],
         ['M', 'Yes, with a valid student ID and once registered online.'],
         ['W', 'I will register before National Day.']],
    qs: [['L59-1', 'What is needed for the discount?', ['Only cash', 'Student ID and online registration', 'Coupon app only', 'Parent signature'], 1]],
  },
  {
    id: 'L60', title: '长对话 · 实验数据争议', section: 'Section B',
    tr: [['M', 'Our results differ from last year\'s by nearly fifteen percent.'],
         ['W', 'Check calibration logs first; humidity may have shifted readings.'],
         ['M', 'I will rerun three samples tomorrow morning.'],
         ['W', 'Document everything for the lab notebook.']],
    qs: [['L60-1', 'What should be checked first?', ['Calibration logs', 'Budget', 'Attendance', 'Weather forecast'], 0],
         ['L60-2', 'What will the man do tomorrow?', ['Publish', 'Rerun samples', 'Quit the lab', 'Buy equipment'], 1],
         ['L60-3', 'What must be documented?', ['Nothing', 'Everything in the lab notebook', 'Only failures', 'Only successes'], 1]],
  },
  {
    id: 'L61', title: '短文 · 城市步道开放', section: 'Section C',
    tr: [['N', 'A new riverside trail opened for walking and cycling.'],
         ['N', 'Night lighting uses low-glare fixtures to protect wildlife.'],
         ['N', 'Dogs are welcome if leashed after dusk.']],
    qs: [['L61-1', 'What is special about the lighting?', ['Very bright', 'Low-glare', 'No lights', 'Flashing'], 1],
         ['L61-2', 'When must dogs be leashed?', ['Always only', 'After dusk', 'Never', 'Mornings'], 1]],
  },
  {
    id: 'L62', title: '短对话 · 选课退课', section: 'Section A',
    tr: [['M', 'Can I still drop this course without a failing grade?'],
         ['W', 'The drop deadline was last Friday, so it will appear as a withdrawal.'],
         ['M', 'I should have checked the academic calendar.']],
    qs: [['L62-1', 'What will happen if he drops now?', ['Failing grade', 'Withdrawal on record', 'Refund only', 'No effect'], 1],
         ['L62-2', 'What did he fail to do?', ['Attend class', 'Check the calendar', 'Pay tuition', 'Email the teacher'], 1]],
  },
  {
    id: 'L63', title: '长对话 · 社团招新', section: 'Section B',
    tr: [['W', 'How many new members does the debate club plan to recruit?'],
         ['M', 'About thirty; auditions are two rounds.'],
         ['W', 'Is prior experience required?'],
         ['M', 'No—confidence and preparation matter more.']],
    qs: [['L63-1', 'How many new members?', ['Ten', 'Thirty', 'Fifty', 'Hundred'], 1],
         ['L63-2', 'How many audition rounds?', ['One', 'Two', 'Three', 'Four'], 1],
         ['L63-3', 'Is experience required?', ['Yes', 'No', 'Only for finals', 'Only for women'], 1]],
  },
  {
    id: 'L64', title: '短文 · 节水改造', section: 'Section C',
    tr: [['N', 'The campus replaced older taps with sensor models in ten dorms.'],
         ['N', 'Early data show double-digit drops in water use.'],
         ['N', 'Facilities staff will publish full results next quarter.']],
    qs: [['L64-1', 'What kind of taps were installed?', ['Sensor models', 'Older models', 'Outdoor only', 'None'], 0],
         ['L64-2', 'What do early data show?', ['Water use rose', 'Double-digit drops', 'No change', 'Budget cuts'], 1]],
  },
  {
    id: 'L65', title: '短对话 · 相机借用', section: 'Section A',
    tr: [['W', 'Can journalism students borrow cameras for projects?'],
         ['M', 'Yes, for 48 hours with a deposit card.'],
         ['W', 'I need one for a weekend documentary.']],
    qs: [['L65-1', 'How long is the loan?', ['24 hours', '48 hours', 'One week', 'Unlimited'], 1],
         ['L65-2', 'What is required?', ['Deposit card', 'Nothing', 'Cash only', 'Faculty letter'], 0]],
  },
  {
    id: 'L66', title: '长对话 · 求职简历修改', section: 'Section B',
    tr: [['M', 'Is my resume too long at two pages?'],
         ['W', 'For internships, one page is safer unless you have strong projects.'],
         ['M', 'Should I list coursework?'],
         ['W', 'Only if it matches the job description.']],
    qs: [['L66-1', 'What length is safer for internships?', ['One page', 'Two pages', 'Three pages', 'No resume'], 0],
         ['L66-2', 'When should coursework be listed?', ['Always', 'If it matches the job', 'Never', 'Only grades below A'], 1]],
  },
  {
    id: 'L67', title: '短文 · 睡眠与成绩调查', section: 'Section C',
    tr: [['N', 'A campus survey linked regular sleep schedules with higher self-reported grades.'],
         ['N', 'Students sleeping under six hours reported more missed classes.'],
         ['N', 'Researchers caution that correlation is not proof of cause.']],
    qs: [['L67-1', 'What was linked to higher grades?', ['More coffee', 'Regular sleep schedules', 'Long commutes', 'Screen time'], 1],
         ['L67-2', 'What do researchers caution?', ['Correlation is not causation', 'Grades are fake', 'Sleep is useless', 'Survey was free'], 0]],
  },
  {
    id: 'L68', title: '短对话 · 快递保价', section: 'Section A',
    tr: [['M', 'Should I declare value for this laptop shipment?'],
         ['W', 'Yes, declared value determines compensation if it is lost.'],
         ['M', 'Then I will pay the extra fee.']],
    qs: [['L68-1', 'What does declared value determine?', ['Delivery speed', 'Compensation', 'Color of box', 'Pickup time'], 1],
         ['L68-2', 'What will the man do?', ['Skip insurance', 'Pay the extra fee', 'Ship by train', 'Cancel shipment'], 1]],
  },
  {
    id: 'L69', title: '长对话 · 实验室安全培训', section: 'Section B',
    tr: [['W', 'Is safety training online this year?'],
         ['M', 'Partly—videos online, then an in-person drill.'],
         ['W', 'Do I need to pass a quiz?'],
         ['M', 'Yes, 80 percent to receive lab access.']],
    qs: [['L69-1', 'What is in person?', ['Only videos', 'A drill', 'Nothing', 'Final exam'], 1],
         ['L69-2', 'What score is needed?', ['60', '80', '100', 'No quiz'], 1],
         ['L69-3', 'What does passing unlock?', ['Lab access', 'Scholarship', 'Free meals', 'Parking'], 0]],
  },
  {
    id: 'L70', title: '短文 · 校园垃圾分类', section: 'Section C',
    tr: [['N', 'New bin colors take effect next month: blue for recyclables, green for food waste.'],
         ['N', 'Contaminated recycling may be rejected at the plant.'],
         ['N', 'Dorm floors with the best sorting rates will be recognized.']],
    qs: [['L70-1', 'What color is for recyclables?', ['Red', 'Blue', 'Black', 'Yellow'], 1],
         ['L70-2', 'What may happen to contaminated recycling?', ['Bonus points', 'Rejected at the plant', 'Ignored', 'Composted'], 1]],
  },
  {
    id: 'L71', title: '短对话 · 选导师', section: 'Section A',
    tr: [['M', 'How do I choose a thesis advisor?'],
         ['W', 'Read recent papers, then email with a short research interest note.'],
         ['M', 'Should I attach my transcript?'],
         ['W', 'A brief one is fine if asked.']],
    qs: [['L71-1', 'What should he do first?', ['Send gifts', 'Read recent papers', 'Change major', 'Wait'], 1],
         ['L71-2', 'When to attach a transcript?', ['Always never', 'If asked briefly', 'Only on paper', 'Not allowed'], 1]],
  },
  {
    id: 'L72', title: '长对话 · 健身计划', section: 'Section B',
    tr: [['W', 'I want to run five kilometers in two months.'],
         ['M', 'Start with walk-run intervals three times a week.'],
         ['W', 'What about diet?'],
         ['M', 'Add protein, cut late-night snacks, sleep enough.']],
    qs: [['L72-1', 'What is her goal?', ['Swim 5km', 'Run 5km', 'Lift 50kg', 'Cycle 50km'], 1],
         ['L72-2', 'How should she start?', ['Sprint daily', 'Walk-run intervals', 'Fast only', 'No plan'], 1],
         ['L72-3', 'What diet advice is given?', ['Eat more late snacks', 'Add protein and sleep', 'Skip all carbs', 'Only juice'], 1]],
  },
  {
    id: 'L73', title: '短文 · 旧教材循环', section: 'Section C',
    tr: [['N', 'A campus app lets seniors list textbooks for juniors.'],
         ['N', 'Verified listings show edition numbers to avoid mismatch.'],
         ['N', 'A portion of sales funds the student emergency loan pool.']],
    qs: [['L73-1', 'What do verified listings show?', ['Edition numbers', 'Photos only', 'Grades', 'Phone numbers'], 0],
         ['L73-2', 'What do some sales fund?', ['Parties', 'Emergency loan pool', 'New cars', 'Nothing'], 1]],
  },
  {
    id: 'L74', title: '短对话 · 网课录制', section: 'Section A',
    tr: [['W', 'Will lectures be recorded for review?'],
         ['M', 'Yes, posted within 24 hours unless the network fails.'],
         ['W', 'Can I download them offline?'],
         ['M', 'For 14 days after posting.']],
    qs: [['L74-1', 'When are recordings posted?', ['Immediately always', 'Within 24 hours', 'Next month', 'Never'], 1],
         ['L74-2', 'How long can they be downloaded?', ['1 day', '14 days', 'Forever', 'Not allowed'], 1]],
  },
  {
    id: 'L75', title: '长对话 · 国际会议志愿者', section: 'Section B',
    tr: [['M', 'What languages do conference volunteers need?'],
         ['W', 'English is required; a second language helps with guests.'],
         ['M', 'Is there training before the event?'],
         ['W', 'Yes, two evenings on protocol and venue maps.']],
    qs: [['L75-1', 'What language is required?', ['French', 'English', 'Japanese', 'Spanish only'], 1],
         ['L75-2', 'How long is training?', ['Two evenings', 'Two weeks', 'Two months', 'No training'], 0],
         ['L75-3', 'What else does training cover?', ['Venue maps', 'Cooking', 'Driving', 'Dance'], 0]],
  },
  {
    id: 'L76', title: '短文 · 智能教室试点', section: 'Section C',
    tr: [['N', 'Three classrooms will pilot occupancy sensors to optimize air conditioning.'],
         ['N', 'Privacy protections keep cameras out; only counts are used.'],
         ['N', 'Energy savings will be reported to students monthly.']],
    qs: [['L76-1', 'What do the sensors measure?', ['Faces', 'Occupancy counts', 'Grades', 'Noise only'], 1],
         ['L76-2', 'How often are savings reported?', ['Daily', 'Monthly', 'Yearly', 'Never'], 1]],
  },
  {
    id: 'L77', title: '短对话 · 体检预约', section: 'Section A',
    tr: [['W', 'Do first-year students get free physicals?'],
         ['M', 'Yes, book through the health center app in October.'],
         ['W', 'Can I choose a morning slot?'],
         ['M', 'Yes, but mornings fill first.']],
    qs: [['L77-1', 'Who gets free physicals?', ['Only seniors', 'First-year students', 'Teachers only', 'No one'], 1],
         ['L77-2', 'When should they book?', ['In October', 'In June', 'In December', 'Anytime without app'], 0]],
  },
  {
    id: 'L78', title: '长对话 · 期末展示评分', section: 'Section B',
    tr: [['M', 'How is the final presentation graded?'],
         ['W', 'Content forty percent, delivery thirty, teamwork thirty.'],
         ['M', 'Do questions from judges count?'],
         ['W', 'Yes, under delivery—stay calm and concise.']],
    qs: [['L78-1', 'How much is content?', ['20%', '40%', '60%', '100%'], 1],
         ['L78-2', 'What share is teamwork?', ['10%', '30%', '50%', '70%'], 1],
         ['L78-3', 'Where do Q&A count?', ['Content', 'Delivery', 'Not graded', 'Bonus only'], 1]],
  },
  {
    id: 'L79', title: '短文 · 校园禁烟令', section: 'Section C',
    tr: [['N', 'Smoking is prohibited within all campus buildings and near entrances.'],
         ['N', 'Support programs offer counseling for those who want to quit.'],
         ['N', 'Violations may result in fines after a warning.']],
    qs: [['L79-1', 'Where is smoking prohibited?', ['Only outdoors', 'Buildings and near entrances', 'Nowhere on campus', 'Only dorms'], 1],
         ['L79-2', 'What help is offered?', ['Counseling to quit', 'Free cigarettes', 'Nothing', 'Transfer'], 0]],
  },
  {
    id: 'L80', title: '短对话 · 打印店优惠', section: 'Section A',
    tr: [['M', 'Is there a student discount for thesis printing?'],
         ['W', 'Fifteen percent off with a student ID over fifty pages.'],
         ['M', 'My draft is 120 pages.']],
    qs: [['L80-1', 'What is the discount?', ['5%', '15%', '25%', 'None'], 1],
         ['L80-2', 'What is required?', ['Over fifty pages and student ID', 'Coupon only', 'Cash only', 'No condition'], 0]],
  },
  {
    id: 'L81', title: '长对话 · 研究经费申请', section: 'Section B',
    tr: [['W', 'When is the undergraduate research fund deadline?'],
         ['M', 'March fifteenth for summer projects.'],
         ['W', 'How much can we request?'],
         ['M', 'Up to five thousand yuan with a detailed budget.']],
    qs: [['L81-1', 'When is the deadline?', ['January 15', 'March 15', 'May 15', 'December 15'], 1],
         ['L81-2', 'What is the max request?', ['500', '2000', '5000', '50000'], 2],
         ['L81-3', 'What must be included?', ['A detailed budget', 'Nothing', 'A poem', 'Photos'], 0]],
  },
  {
    id: 'L82', title: '短文 · 校园导盲犬规定', section: 'Section C',
    tr: [['N', 'Trained service animals are allowed in all campus buildings.'],
         ['N', 'Emotional support animals require prior approval for dorms.'],
         ['N', 'Students must not distract working animals.']],
    qs: [['L82-1', 'What is allowed in all buildings?', ['Any pet', 'Trained service animals', 'None', 'Only cats'], 1],
         ['L82-2', 'What must students avoid?', ['Distracting working animals', 'Studying', 'Walking', 'Reporting'], 0]],
  },
  {
    id: 'L83', title: '短对话 · 图书馆预约座位', section: 'Section A',
    tr: [['W', 'How long can I hold a reserved seat?'],
         ['M', 'Fifteen minutes after the start time, then it is released.'],
         ['W', 'I will set an alarm.']],
    qs: [['L83-1', 'How long is the hold?', ['5 minutes', '15 minutes', '1 hour', 'All day'], 1]],
  },
  {
    id: 'L84', title: '长对话 · 毕业照安排', section: 'Section B',
    tr: [['M', 'When is the department graduation photo?'],
         ['W', 'Next Thursday at ten in front of the main library.'],
         ['M', 'What should we wear?'],
         ['W', 'Formal top; gowns are provided on site.']],
    qs: [['L84-1', 'When is the photo?', ['Today', 'Next Thursday at ten', 'Friday night', 'Unknown'], 1],
         ['L84-2', 'What is provided?', ['Gowns', 'Shoes', 'Flowers', 'Meals'], 0],
         ['L84-3', 'What should students wear?', ['Beach wear', 'Formal top', 'Uniforms only', 'Nothing'], 1]],
  },
  {
    id: 'L85', title: '短文 · 节能宿舍评比', section: 'Section C',
    tr: [['N', 'Dorms compete monthly on electricity savings per person.'],
         ['N', 'Winning floors receive community funds for shared improvements.'],
         ['N', 'Tips include turning off standby lights and air-drying clothes.']],
    qs: [['L85-1', 'What do dorms compete on?', ['Noise levels', 'Electricity savings', 'Beauty contests', 'Sports'], 1],
         ['L85-2', 'What do winners receive?', ['Cash for personal use', 'Community funds for improvements', 'Nothing', 'Vacation'], 1]],
  },
  {
    id: 'L86', title: '短对话 · 交换生体检', section: 'Section A',
    tr: [['M', 'Do exchange students need a medical exam?'],
         ['W', 'Yes, before visa extension; forms are on the international office site.'],
         ['M', 'Is the exam free?'],
         ['W', 'Basic items are covered; vaccines are extra.']],
    qs: [['L86-1', 'Why is the exam needed?', ['For fun', 'Before visa extension', 'For a job', 'For sports'], 1],
         ['L86-2', 'What is extra cost?', ['Vaccines', 'Basic exam', 'Forms', 'Nothing'], 0]],
  },
  {
    id: 'L87', title: '长对话 · 开源项目协作', section: 'Section B',
    tr: [['W', 'How do beginners contribute to open-source projects?'],
         ['M', 'Start with documentation issues and small bug fixes.'],
         ['W', 'What about code style?'],
         ['M', 'Follow the project guide; maintainers will review.']],
    qs: [['L87-1', 'What should beginners start with?', ['Rewriting the core', 'Docs and small bugs', 'Marketing', 'Nothing'], 1],
         ['L87-2', 'What should they follow?', ['Project guide', 'Personal taste', 'No rules', 'Random style'], 0],
         ['L87-3', 'Who reviews contributions?', ['Maintainers', 'Nobody', 'Only professors', 'Government'], 0]],
  },
  {
    id: 'L88', title: '短文 · 心理剧工作坊', section: 'Section C',
    tr: [['N', 'A weekend workshop uses role-play to explore stress and communication.'],
         ['N', 'No acting experience is required; confidentiality rules apply.'],
         ['N', 'Sessions are limited to twenty participants.']],
    qs: [['L88-1', 'What method is used?', ['Lectures only', 'Role-play', 'Written exams', 'Sports'], 1],
         ['L88-2', 'How many participants max?', ['5', '20', '50', 'Unlimited'], 1]],
  },
  {
    id: 'L89', title: '短对话 · 身份证补办', section: 'Section A',
    tr: [['W', 'I lost my ID card. Where do I apply for a replacement?'],
         ['M', 'Public security office off campus; bring student proof and photos.'],
         ['W', 'How long does it take?'],
         ['M', 'Usually about two weeks.']],
    qs: [['L89-1', 'Where to apply?', ['Library', 'Public security office', 'Bookstore', 'Canteen'], 1],
         ['L89-2', 'How long does it take?', ['2 days', 'About two weeks', '2 months', 'Same day'], 1]],
  },
  {
    id: 'L90', title: '长对话 · 研讨会提问技巧', section: 'Section B',
    tr: [['M', 'Any tips for asking questions at seminars?'],
         ['W', 'Be brief, connect to the talk, avoid speeches of your own.'],
         ['M', 'What if I disagree?'],
         ['W', 'Ask for clarification first; then offer evidence calmly.']],
    qs: [['L90-1', 'How should questions be?', ['Long speeches', 'Brief and connected', 'Off-topic', 'Silent'], 1],
         ['L90-2', 'What if you disagree?', ['Shout', 'Ask clarification then offer evidence', 'Leave', 'Ignore'], 1]],
  },
  {
    id: 'L91', title: '短文 · 校园植物铭牌', section: 'Section C',
    tr: [['N', 'Volunteers tagged trees and shrubs with scientific names and QR codes.'],
         ['N', 'Scanning a code opens a short ecology note.'],
         ['N', 'The project supports biology field courses.']],
    qs: [['L91-1', 'What do QR codes open?', ['Ecology notes', 'Songs', 'Ads only', 'Maps to mall'], 0],
         ['L91-2', 'Who tagged the plants?', ['Volunteers', 'Police', 'Robots only', 'None'], 0]],
  },
  {
    id: 'L92', title: '短对话 · 食物过敏', section: 'Section A',
    tr: [['M', 'Can the canteen label allergens clearly?'],
         ['W', 'Yes, new menus list peanuts, dairy, and gluten symbols.'],
         ['M', 'That helps my roommate a lot.']],
    qs: [['L92-1', 'What will be labeled?', ['Prices only', 'Allergens', 'Calories only', 'Chefs'], 1]],
  },
  {
    id: 'L93', title: '长对话 · 毕业去向统计', section: 'Section B',
    tr: [['W', 'How does the university collect graduate career data?'],
         ['M', 'Surveys at graduation, then follow-ups at six months.'],
         ['W', 'Is participation required?'],
         ['M', 'Strongly encouraged; data stay anonymized in reports.']],
    qs: [['L93-1', 'When are follow-ups?', ['At graduation only', 'At six months', 'Five years', 'Never'], 1],
         ['L93-2', 'How are data reported?', ['Anonymized', 'With full names', 'As videos', 'Not reported'], 0],
         ['L93-3', 'Is participation required?', ['Yes by law', 'Strongly encouraged', 'Forbidden', 'Optional with no effect'], 1]],
  },
  {
    id: 'L94', title: '短文 · 电子废弃物回收', section: 'Section C',
    tr: [['N', 'Collection boxes for batteries and old phones sit near dorm laundries.'],
         ['N', 'Items go to certified recyclers, not general trash.'],
         ['N', 'Campaign week includes data-wiping help desks.']],
    qs: [['L94-1', 'Where are the boxes?', ['Near dorm laundries', 'At the gate only', 'In classrooms', 'Off campus'], 0],
         ['L94-2', 'What extra help is offered?', ['Data-wiping help', 'Phone sales', 'Nothing', 'Repairs only'], 0]],
  },
  {
    id: 'L95', title: '短对话 · 早自习打卡', section: 'Section A',
    tr: [['W', 'Is morning study check-in mandatory for first-years?'],
         ['M', 'Three days a week for the first month, then optional.'],
         ['W', 'I prefer self-study in the library.']],
    qs: [['L95-1', 'How often is check-in at first?', ['Every day', 'Three days a week', 'Once a month', 'Never'], 1],
         ['L95-2', 'What happens after the first month?', ['Mandatory daily', 'Optional', 'Banned', 'Unchanged'], 1]],
  },
  {
    id: 'L96', title: '长对话 · 模拟联合国', section: 'Section B',
    tr: [['M', 'What does Model UN involve for beginners?'],
         ['W', 'Position papers, caucusing, and draft resolutions.'],
         ['M', 'Do I need prior debate experience?'],
         ['W', 'No—training sessions run the month before conferences.']],
    qs: [['L96-1', 'What is required for beginners?', ['Position papers etc.', 'Nothing', 'A thesis', 'A car'], 0],
         ['L96-2', 'Is debate experience required?', ['Yes', 'No', 'Only for finals', 'Only for chairs'], 1],
         ['L96-3', 'When is training?', ['After conference only', 'The month before', 'Never', 'In summer only'], 1]],
  },
  {
    id: 'L97', title: '短文 · 校园无障碍改造', section: 'Section C',
    tr: [['N', 'Ramps and tactile paving are being added along main teaching routes.'],
         ['N', 'Elevator announcements will include floor numbers by voice.'],
         ['N', 'Feedback can be submitted through the accessibility office.']],
    qs: [['L97-1', 'What is being added?', ['Ramps and tactile paving', 'Swimming pools', 'Night markets', 'Billboards'], 0],
         ['L97-2', 'Where can feedback go?', ['Accessibility office', 'Social media only', 'Nowhere', 'Police'], 0]],
  },
  {
    id: 'L98', title: '短对话 · 家教中介', section: 'Section A',
    tr: [['W', 'Is the tutoring agency on campus verified?'],
         ['M', 'Yes, listed under student affairs; check contract terms.'],
         ['W', 'Do they take a fee?'],
         ['M', 'First session commission only.']],
    qs: [['L98-1', 'Where is the agency listed?', ['Street ads', 'Student affairs', 'Foreign sites', 'Unknown'], 1],
         ['L98-2', 'When is the fee charged?', ['First session commission', 'Never', 'Monthly forever', 'Yearly'], 0]],
  },
  {
    id: 'L99', title: '长对话 · 数据可视化比赛', section: 'Section B',
    tr: [['M', 'What datasets are allowed for the viz contest?'],
         ['W', 'Public open data or campus anonymized data.'],
         ['M', 'Can we use any tools?'],
         ['W', 'Yes, but final files must be reproducible.']],
    qs: [['L99-1', 'What data are allowed?', ['Any private emails', 'Public or anonymized campus data', 'None', 'Only video'], 1],
         ['L99-2', 'What must finals be?', ['Reproducible', 'Secret', 'Printed only', 'Hand-drawn'], 0]],
  },
  {
    id: 'L100', title: '短文 · 图书馆静音舱', section: 'Section C',
    tr: [['N', 'Soundproof pods for online interviews are now bookable.'],
         ['N', 'Each pod has a desk, light, and power outlet.'],
         ['N', 'Sessions are limited to 45 minutes during peak weeks.']],
    qs: [['L100-1', 'What are the pods for?', ['Parties', 'Online interviews', 'Cooking', 'Sports'], 1],
         ['L100-2', 'How long in peak weeks?', ['15 minutes', '45 minutes', '4 hours', 'Unlimited'], 1]],
  },
];

for (const t of listenTemplates) {
  const tr = t.tr.map(([sp, text]) => [sp, text]);
  const qs = t.qs.map(([id, title, options, answer]) => q(id, title, options, answer));
  listeningExtra.push(makeListening(t.id, t.title, t.section, tr, qs));
}

// 更多主题听力（程序化短对话）
const dialogTopics = [
  ['L101', '短对话 · 体育馆预约', 'book the gym', 'You can reserve a court online up to three days ahead.', 'Friday evening is almost full.', 0, 'Three days'],
  ['L102', '短对话 · 补办校园卡', 'replace a campus card', 'Report the loss in the app first, then pay twenty yuan at the service desk.', 'The new card works after two hours.', 0, 'Twenty yuan'],
  ['L103', '短对话 · 停车费', 'pay for parking', 'Student lots charge five yuan per day with a semester permit.', 'Visitor lots cost more hourly.', 0, 'Five yuan per day'],
  ['L104', '短对话 · 讲座学分', 'get lecture credit', 'Attend at least three campus lectures and submit short reflections.', 'Reflections are due within a week.', 0, 'Three lectures'],
  ['L105', '短对话 · 转专业咨询', 'ask about major transfer', 'GPA requirements vary by department; check before applying in April.', 'Some majors require interviews.', 0, 'Check requirements'],
  ['L106', '短对话 · 宿舍水电', 'report utilities issues', 'Submit a ticket; emergencies can call the duty phone at night.', 'Non-urgent repairs wait until morning.', 0, 'Submit a ticket'],
  ['L107', '短对话 · 校园招聘会', 'prepare for a career fair', 'Bring printed resumes and dress neatly; some firms interview on site.', 'A prep workshop runs the week before.', 0, 'Printed resumes'],
  ['L108', '短对话 · 图书馆逾期', 'handle overdue books', 'Fines are one yuan per day after the grace period.', 'You can pay in the app.', 0, 'One yuan per day'],
  ['L109', '短对话 · 心理咨询', 'book counseling', 'Free sessions are available; evening slots open on Mondays.', 'Crisis support is around the clock.', 0, 'Free sessions'],
  ['L110', '短对话 · 实验报告', 'submit a lab report', 'Reports are due 48 hours after the experiment unless stated otherwise.', 'Late work loses points daily.', 0, '48 hours'],
];
for (const [id, title, _sit, line1, line2, ans, _hint] of dialogTopics) {
  listeningExtra.push(
    L(id, title, 'Section A', [
      { speaker: 'M', text: line1 },
      { speaker: 'W', text: line2 },
      { speaker: 'Q', text: 'What did you hear about the policy?' },
    ], [
      q(id + '-1', 'What is the key point?', [line2.slice(0, 40) + '…', 'It is completely free forever.', 'Nothing applies to students.', 'Only professors may proceed.'], 0),
    ], 28),
  );
}

// ═══════════════════════════════════════════
// 阅读批量
// ═══════════════════════════════════════════
const readingPassages = [
  ['R30', 'Passage · The Cost of Free Apps', 'Free applications often monetize attention and data. Users pay indirectly through advertising and behavioral profiles. Some services offer paid tiers without ads, raising questions about fairness: those who can pay buy privacy, while others remain exposed. Regulators explore rules that limit data collection regardless of price model. Designers can also adopt privacy-preserving ads. The word "free" should be read as a business model, not a gift.', [
    q('R30-1', 'How do free apps monetize?', ['Selling phones', 'Attention and data', 'Tuition', 'Nothing'], 1),
    q('R30-2', 'What issue does paid privacy raise?', ['Fairness', 'Too much free storage', 'Slow phones', 'Illegal software'], 0),
  ]],
  ['R31', 'Passage · Study Groups That Work', 'Effective study groups are small, purposeful, and prepared. Members complete readings beforehand, then teach each other—teaching reveals gaps quickly. Roles such as timekeeper and note-taker prevent drift. Groups fail when they become social clubs without agendas or when stronger students dominate without listening. A short weekly plan and rotating leadership keep energy high. Assessment of group work should reward contribution quality, not only presence.', [
    q('R31-1', 'What do effective members do before meetings?', ['Nothing', 'Complete readings', 'Skip meals', 'Cancel meetings'], 1),
    q('R31-2', 'How do groups fail?', ['Teaching each other', 'Becoming agenda-less social clubs', 'Using timers', 'Rotating leaders'], 1),
  ]],
  ['R32', 'Passage · Vertical Farming Economics', 'Vertical farms stack crops indoors under controlled light. They use less land and can locate near consumers, cutting transport. Energy for lighting remains the largest cost; renewable power improves margins. Leafy greens suit current technology better than grain crops. Investors watch unit economics closely. The sector may complement, not replace, field agriculture.', [
    q('R32-1', 'What is the largest cost?', ['Land rent', 'Lighting energy', 'Seeds only', 'Marketing'], 1),
    q('R32-2', 'What crops suit vertical farms now?', ['Grain', 'Leafy greens', 'Timber', 'Cotton only'], 1),
  ]],
  ['R33', 'Passage · The Quiet Skill of Note-Taking', 'Notes are not transcripts. Research suggests that summarizing in your own words beats typing every sentence. Visual notes—diagrams, arrows—help in science and design courses. Reviewing notes within a day strengthens memory more than rereading months later. Digital tools are powerful when organized; endless folders without tags become graveyards of information. The best system is the one students actually use.', [
    q('R33-1', 'What beats typing every sentence?', ['Copying slides', 'Summarizing in your own words', 'Not taking notes', 'Recording only'], 1),
    q('R33-2', 'When should notes be reviewed?', ['Within a day', 'After a year', 'Never', 'Only before graduation'], 0),
  ]],
  ['R34', 'Passage · Traffic Calming Design', 'Wide straight roads encourage speed; narrower lanes, raised crossings, and chicanes slow cars naturally. Neighborhoods that redesign streets see fewer severe crashes. Some drivers complain about longer trips, yet overall safety gains are substantial. Planners balance emergency access with calm design. Street geometry communicates rules faster than signs alone.', [
    q('R34-1', 'What encourages speed?', ['Narrow lanes', 'Wide straight roads', 'Raised crossings', 'Chicanes'], 1),
    q('R34-2', 'What do redesigned streets achieve?', ['Fewer severe crashes', 'More speeding', 'No sidewalks', 'Higher fares'], 0),
  ]],
  ['R35', 'Passage · Peer Mentoring Programs', 'Upper-year students who mentor newcomers improve retention for both groups. Mentors practice leadership; mentees gain insider knowledge on courses and services. Programs work best with training, clear time limits, and supervision. Without structure, mentoring fades into occasional coffee chats that help little. Institutions should measure outcomes, not only attendance counts.', [
    q('R35-1', 'Who benefits from mentoring?', ['Only mentees', 'Both mentors and mentees', 'Only administrators', 'No one'], 1),
    q('R35-2', 'What do programs need?', ['Training and structure', 'Only coffee', 'No supervision', 'Unlimited time'], 0),
  ]],
  ['R36', 'Passage · Antibiotic Misuse', 'Using antibiotics for viral infections wastes money and accelerates resistance. Incomplete courses leave stronger bacteria behind. Hospitals track prescribing patterns to improve stewardship. Patients should not demand drugs for colds; clinicians should explain why watchful waiting is safe. Agricultural overuse also contributes. Resistance is a shared-resource problem like clean air.', [
    q('R36-1', 'What accelerates resistance?', ['Completing courses properly', 'Misuse and incomplete courses', 'Never using drugs', 'Eating fruit'], 1),
    q('R36-2', 'How is resistance similar to clean air?', ['Shared-resource problem', 'Personal secret', 'Illegal always', 'Unrelated'], 0),
  ]],
  ['R37', 'Passage · Campus Food Allergies', 'Allergic reactions can be severe within minutes. Canteens that label allergens and train staff reduce incidents. Students with allergies should inform roommates and carry prescribed medication. Shared kitchens need cleaning norms to avoid cross-contact. Emergency numbers should be visible in dorms. Inclusion means safer shared spaces for everyone.', [
    q('R37-1', 'What reduces incidents?', ['No labels', 'Allergen labels and staff training', 'Hiding menus', 'Banning food'], 1),
    q('R37-2', 'What should students with allergies do?', ['Keep it secret', 'Inform roommates and carry medication', 'Avoid all dorms', 'Stop studying'], 1),
  ]],
  ['R38', 'Passage · The Economics of Textbooks', 'New textbooks are expensive; editions change often, limiting second-hand markets. Open educational resources (OER) offer free peer-reviewed materials. Faculty adoption depends on quality, ancillary materials, and familiarity. Students save money when OER is complete, but printing costs may remain. Policy can fund OER creation to lower long-term costs.', [
    q('R38-1', 'What are OER?', ['Free peer-reviewed materials', 'Expensive apps', 'Illegal copies', 'Sports gear'], 0),
    q('R38-2', 'What limits second-hand markets?', ['Frequent edition changes', 'Student thrift', 'Libraries', 'Travel'], 0),
  ]],
  ['R39', 'Passage · Deep Work in Open Offices', 'Open offices increase casual communication but interrupt focus. Knowledge workers need uninterrupted blocks for complex tasks. Solutions include quiet rooms, meeting-free mornings, and status indicators. Culture matters: if every message demands instant reply, architecture alone fails. Teams that protect focus report higher quality output.', [
    q('R39-1', 'What do open offices increase?', ['Focus always', 'Casual communication', 'Silence', 'Pay'], 1),
    q('R39-2', 'What else is needed besides architecture?', ['Culture of reply norms', 'More noise', 'Fewer meetings never', 'None'], 0),
  ]],
  ['R40', 'Passage · Dialect and Identity', 'Dialects carry humor, solidarity, and local knowledge. Schools that punish dialect use may damage confidence. Standard language remains useful for formal contexts; diglossia—using both appropriately—is common worldwide. Teaching can expand repertoire without erasing home speech. Respect for linguistic diversity supports social equity.', [
    q('R40-1', 'What do dialects carry?', ['Only errors', 'Humor, solidarity, local knowledge', 'Illegal codes', 'Nothing'], 1),
    q('R40-2', 'What is diglossia?', ['Using two varieties appropriately', 'Losing all speech', 'A disease', 'A sport'], 0),
  ]],
  ['R41', 'Passage · Battery Recycling', 'Lithium-ion batteries recover valuable metals if processed safely. Fires in waste streams start when batteries are crushed with ordinary trash. Drop-off points and retailer take-back schemes improve collection. Labels that say "do not bin" help but need consistent enforcement. Circular supply chains depend on consumer habits as much as technology.', [
    q('R41-1', 'Why must batteries be processed safely?', ['To cause fires', 'They can cause fires if crushed with trash', 'For entertainment', 'No reason'], 1),
    q('R41-2', 'What improves collection?', ['Drop-off and take-back', 'Throwing in rivers', 'Ignoring labels', 'Nothing'], 0),
  ]],
  ['R42', 'Passage · Interview Anxiety', 'Interview anxiety peaks when candidates treat questions as traps. Preparation helps: research the organization, practice aloud, and prepare stories using situation-action-result. Silence while thinking is acceptable. Interviewers also feel time pressure; clear structure aids them. Post-interview reflection improves the next round more than self-criticism spirals.', [
    q('R42-1', 'What structure helps stories?', ['Situation-action-result', 'Random words', 'No preparation', 'Silence only'], 0),
    q('R42-2', 'What improves the next interview?', ['Reflection', 'Self-criticism spirals', 'Avoiding all interviews', 'Lying'], 0),
  ]],
  ['R43', 'Passage · Urban Sound and Learning', 'Chronic noise impairs reading acquisition in children and reduces adult concentration. Schools near highways benefit from acoustic insulation and schedule adjustments. Libraries use zoned quiet policies rather than total silence, which can be impractical. Sound is an environmental health factor, not only an annoyance.', [
    q('R43-1', 'What does chronic noise impair?', ['Reading acquisition and concentration', 'Height', 'Shoe size', 'Appetite only'], 0),
    q('R43-2', 'How do some libraries manage sound?', ['Zoned quiet policies', 'Total ban on talking forever', 'Only music', 'No policy'], 0),
  ]],
  ['R44', 'Passage · Scientific Peer Review', 'Peer review filters errors but is slow and imperfect. Reviewers are unpaid experts with limited time; bias and oversights occur. Preprints speed dissemination while post-publication review continues scrutiny. Open review reports increase transparency when feasible. Science is a community process of correction, not a stamp of permanent truth.', [
    q('R44-1', 'What is a weakness of peer review?', ['Slow and imperfect', 'Too fast always', 'Paid heavily', 'No errors ever'], 0),
    q('R44-2', 'What are preprints for?', ['Speeding dissemination', 'Hiding results', 'Selling ads', 'Stopping review'], 0),
  ]],
  ['R45', 'Passage · Bike Theft Prevention', 'Bike theft thrives on cheap locks and isolated racks. Secure parking with lighting and cameras reduces risk. Registration programs mark frames and aid recovery. Students should lock frames and wheels, not only wheels to racks. Layered defenses work better than any single gadget.', [
    q('R45-1', 'What reduces theft risk?', ['Cheap locks alone', 'Secure lighting and cameras', 'Isolated racks', 'No locks'], 1),
    q('R45-2', 'How should bikes be locked?', ['Frames and wheels to racks', 'Only the seat', 'Nothing', 'Handlebars only'], 0),
  ]],
  ['R46', 'Passage · Food Miles Reconsidered', 'Transport distance alone does not determine environmental impact. Production methods and cold-chain energy can outweigh kilometers traveled. Local seasonal food often performs well; local out-of-season greenhouses may not. Life-cycle assessment offers a fuller picture than "food miles" slogans. Consumers benefit from nuanced labels.', [
    q('R46-1', 'What else matters besides distance?', ['Production and cold-chain energy', 'Brand colors', 'Shop music', 'Packaging color only'], 0),
    q('R46-2', 'What offers a fuller picture?', ['Life-cycle assessment', 'Food miles only', 'Guesswork', 'Price only'], 0),
  ]],
  ['R47', 'Passage · Student Legal Aid', 'Many universities host legal clinics for housing and contract issues students face. Supervised law students gain practice while peers receive free guidance. Limits include case type and capacity. Awareness campaigns help students reach help before problems escalate. Legal literacy is part of adult life on campus.', [
    q('R47-1', 'Who provides guidance?', ['Supervised law students', 'Police only', 'No one', 'Foreign agents'], 0),
    q('R47-2', 'Why are awareness campaigns needed?', ['So students seek help early', 'To sell tickets', 'To ban clinics', 'To raise tuition'], 0),
  ]],
  ['R48', 'Passage · Sleep and Athletic Performance', 'Athletes who extend sleep report faster sprints and better accuracy. Recovery hormones rise during deep sleep. Coaches increasingly schedule training around sleep, not only around facilities. Travel across time zones requires gradual adjustment. Sleep is legal performance enhancement.', [
    q('R48-1', 'What do athletes report with more sleep?', ['Worse scores', 'Faster sprints and better accuracy', 'More injuries always', 'No change'], 1),
    q('R48-2', 'How is sleep described?', ['Legal performance enhancement', 'Illegal drug', 'Irrelevant', 'Only for students'], 0),
  ]],
  ['R49', 'Passage · Community Gardens', 'Vacant lots turned into gardens supply fresh produce and social ties. Conflicts arise over water access and plot allocation. Clear rules and shared workdays reduce disputes. Schools use gardens as outdoor classrooms for biology and nutrition. Gardens do not feed whole cities but nourish neighborhoods in multiple senses.', [
    q('R49-1', 'What do gardens supply?', ['Only boredom', 'Produce and social ties', 'Traffic jams', 'Bills'], 1),
    q('R49-2', 'How are conflicts reduced?', ['Clear rules and shared workdays', 'Ignoring water issues', 'Closing gardens', 'Random fights'], 0),
  ]],
  ['R50', 'Passage · Digital Minimalism for Students', 'Digital minimalism asks which tools support your values, then prunes the rest. Students who delete apps report reclaiming hours but may lose social coordination. Practical steps include notification audits, grayscale modes, and scheduled check-ins. The aim is intentional use, not technophobia. Measurement for a week reveals true time costs.', [
    q('R50-1', 'What is the aim?', ['Intentional use', 'Technophobia', 'Selling phones', 'Never messaging'], 0),
    q('R50-2', 'What can reveal time costs?', ['A week of measurement', 'Guessing', 'Ignoring apps', 'Buying more apps'], 0),
  ]],
  ['R51', 'Passage · Wind Energy Siting', 'Wind farms need consistent wind and grid connections. Bird and bat impacts require careful siting and sometimes temporary shutdowns. Community benefit funds improve local acceptance. Offshore wind reduces land conflicts but raises maintenance costs. Energy transition involves landscape politics as much as engineering.', [
    q('R51-1', 'What do wind farms need?', ['Consistent wind and grids', 'Only slogans', 'Silent streets', 'No maps'], 0),
    q('R51-2', 'What improves local acceptance?', ['Community benefit funds', 'Hiding plans', 'Higher noise', 'No consultation'], 0),
  ]],
  ['R52', 'Passage · The Role of Failure Interviews', 'Some career centers run "failure interviews" where students analyze setbacks without spin. The practice builds resilience and realistic planning. Safe framing is essential; public shaming would backfire. Employers value candidates who can discuss lessons learned. Failure literacy complements success narratives.', [
    q('R52-1', 'What do failure interviews analyze?', ['Setbacks without spin', 'Only successes', 'Weather', 'Fees'], 0),
    q('R52-2', 'What do employers value?', ['Candidates who discuss lessons', 'Perfect records only', 'Silence', 'Lies'], 0),
  ]],
  ['R53', 'Passage · Plastic Alternatives Trade-offs', 'Compostable plastics require industrial facilities; in home bins they may persist. Reusable containers often beat disposables if washing energy is reasonable. Policy should specify end-of-life pathways, not only material names. Consumer confusion grows when labels are vague. Systems thinking beats material fashion.', [
    q('R53-1', 'What do compostable plastics need?', ['Industrial facilities', 'Home bins always', 'Fire', 'Nothing'], 0),
    q('R53-2', 'What does policy need to specify?', ['End-of-life pathways', 'Brand colors', 'Prices only', 'Nothing'], 0),
  ]],
  ['R54', 'Passage · Learning Analytics Ethics', 'Universities can predict dropout risk from engagement data. Ethical use requires transparency, opt-out options, and support—not punishment. Data minimization limits collection to what helps students. Vendors must not sell profiles. Predictive power without care becomes surveillance.', [
    q('R54-1', 'What can analytics predict?', ['Dropout risk', 'Lottery numbers', 'Weather forever', 'Nothing'], 0),
    q('R54-2', 'What should ethical use include?', ['Transparency and support', 'Punishment only', 'Secret sales', 'No opt-out'], 0),
  ]],
  ['R55', 'Passage · Handwriting in the Digital Age', 'Keyboarding is faster for long drafts, yet handwriting can aid memory for new concepts. Hybrid workflows—outline by hand, draft digitally—combine strengths. Legibility still matters for exams without devices. The goal is fluent expression in multiple modes, not nostalgia.', [
    q('R55-1', 'How can handwriting help?', ['Aid memory for new concepts', 'Always replace keyboards', 'Stop learning', 'None'], 0),
    q('R55-2', 'What is the goal?', ['Fluent expression in multiple modes', 'Banning keyboards', 'Only cursive forever', 'No exams'], 0),
  ]],
  ['R56', 'Passage · Fire Safety in Dorms', 'Most dorm fires involve unattended cooking or overloaded outlets. Sprinklers and clear escape routes save lives when maintained. Students should know two exits and never block hallways. Drills feel tedious until needed. Safety is a shared daily practice.', [
    q('R56-1', 'What often causes dorm fires?', ['Unattended cooking or overloaded outlets', 'Homework', 'Rain', 'Quiet study'], 0),
    q('R56-2', 'What should students know?', ['Two exits', 'Nothing', 'Only one door', 'Ignore drills'], 0),
  ]],
  ['R57', 'Passage · The Attention Cost of Multitasking', 'Switching between tasks leaves "attention residue," reducing performance on the next task. Heavy media multitaskers perform worse on some cognitive tests. Single-tasking sprints with timed breaks restore depth. Notifications are invitations, not commands. Protecting attention is a professional skill.', [
    q('R57-1', 'What is attention residue?', ['Reduced performance after switching', 'Perfect focus', 'A type of food', 'None'], 0),
    q('R57-2', 'How is attention described?', ['A professional skill', 'Unimportant', 'Unchangeable', 'Only for monks'], 0),
  ]],
  ['R58', 'Passage · Museum Free Days', 'Free admission days broaden access but can overcrowd galleries. Timed tickets balance openness with conservation needs. Subsidies for schools deepen educational value. Museums measure success beyond visitor counts—engagement quality matters. Access and care can coexist with smart design.', [
    q('R58-1', 'What problem can free days cause?', ['Overcrowding', 'Too much calm', 'Lost paintings always', 'No visitors'], 0),
    q('R58-2', 'What helps balance access?', ['Timed tickets', 'No tickets ever', 'Closing museums', 'Higher prices only'], 0),
  ]],
  ['R59', 'Passage · Carbon Labels on Menus', 'Some restaurants display carbon estimates per dish. Diners shift choices slightly when labels are clear and comparable. Accuracy challenges remain for complex recipes. Labels work best alongside tasty low-carbon options, not guilt alone. Information design shapes daily climate action.', [
    q('R59-1', 'How do diners respond to clear labels?', ['Slight shifts in choices', 'No change ever', 'Stop eating', 'Riots'], 0),
    q('R59-2', 'What else do labels need?', ['Tasty low-carbon options', 'Only guilt', 'Invisible text', 'No data'], 0),
  ]],
  ['R60', 'Passage · Alumni Networks', 'Alumni networks offer mentoring and job leads. Their value depends on reciprocity, not only extraction. Students who give help in return build trust. Weak ties—acquaintances—often bridge job markets better than close friends alone. Professional generosity compounds over careers.', [
    q('R60-1', 'What makes networks valuable?', ['Reciprocity', 'Extraction only', 'Silence', 'Fees only'], 0),
    q('R60-2', 'Who often bridges job markets?', ['Weak ties', 'Only family', 'No one', 'Enemies'], 0),
  ]],
];

const readingExtra = readingPassages.map(([id, title, passage, qs]) =>
  R(id, title, passage, qs.map((item) => (Array.isArray(item) ? q(item[0], item[1], item[2], item[3]) : item))),
);

// ═══════════════════════════════════════════
// 完形 / 听写 / 翻译 / 口语 / 词根搭配近义
// ═══════════════════════════════════════════
const clozeExtra = [
  C('C20', 'Cloze · Campus Recycling II', 'Sorting rules confuse new students at first. The solution is simple __1__ and visible examples near bins. Contamination ruins whole loads, so staff check peak days. Students who learn the system rarely go back to guessing.', [
    { id: 'C20-1', options: ['training', 'noise', 'secrets', 'lawsuits'], answer: 0 },
    { id: 'C20-2', options: ['randomly', 'near bins', 'never', 'abroad'], answer: 1 },
  ]),
  C('C21', 'Clozy · Focus Blocks', 'Studying in focused blocks with short breaks often beats unbroken hours. The mind needs __1__ between efforts. Apps can time blocks but should not become new distractions. What matters is __2__ work, not busy screens.', [
    { id: 'C21-1', options: ['rest', 'punishment', 'noise', 'traffic'], answer: 0 },
    { id: 'C21-2', options: ['deep', 'shallow', 'public', 'illegal'], answer: 0 },
  ]),
  C('C22', 'Cloze · Lab Notebooks', 'Lab notebooks are legal records of what happened. Write in pen, number pages, and never erase—strike through instead. Future readers may be you. Accuracy now prevents arguments later about __1__ and authorship. Good notebooks also make writing papers __2__.', [
    { id: 'C22-1', options: ['priority', 'priority of credit', 'weather', 'colors'], answer: 1 },
    { id: 'C22-2', options: ['harder', 'easier', 'illegal', 'impossible'], answer: 1 },
  ]),
  C('C23', 'Cloze · Negotiation Basics', 'Negotiation is not a battle to win every point. Identify interests behind positions. Prepare a best alternative before talks begin. Listening more than speaking reveals trade-offs. Agreements last when both sides feel treated __1__. Documentation of terms prevents __2__ later.', [
    { id: 'C23-1', options: ['fairly', 'cheated', 'ignored', 'hidden'], answer: 0 },
    { id: 'C23-2', options: ['celebrations', 'misunderstandings', 'parades', 'nothing'], answer: 1 },
  ]),
  C('C24', 'Cloze · Sleep Hygiene II', 'Light exposure shapes the body clock. Morning daylight helps; late bright screens delay sleep. Keep the bedroom cool and dark. If you cannot sleep after twenty minutes, get up for a dull activity rather than __1__ in bed. Consistency beats __2__ weekend catch-ups.', [
    { id: 'C24-1', options: ['staring', 'dancing', 'cooking', 'driving fast'], answer: 0 },
    { id: 'C24-2', options: ['regular', 'irregular', 'silent', 'loud'], answer: 1 },
  ]),
  C('C25', 'Cloze · Public Speaking II', 'Opening with a question engages audiences faster than a long agenda slide. Signpost your structure: today I will cover A, B, and C. End with a clear ask or takeaway, not an apologetic mumble. Practice transitions—they are where talks often __1__. Confidence grows from __2__, not from personality myths.', [
    { id: 'C25-1', options: ['collapse', 'bloom', 'travel', 'sleep'], answer: 0 },
    { id: 'C25-2', options: ['preparation', 'luck', 'height', 'noise'], answer: 0 },
  ]),
  C('C26', 'Cloze · Data Visualization', 'Charts should make comparisons easy. Choose colors that work in grayscale when possible. Label axes clearly and avoid 3D effects that distort values. When showing change over time, a simple line often beats decorative icons. Honesty in scaling builds __1__. A well-designed chart is an act of __2__ toward the reader.', [
    { id: 'C26-1', options: ['trust', 'confusion', 'theft', 'noise'], answer: 0 },
    { id: 'C26-2', options: ['respect', 'insult', 'betrayal', 'silence'], answer: 0 },
  ]),
  C('C27', 'Cloze · Conflict with Roommates', 'Address issues early before resentment grows. Use specific observations: "music after midnight," not "you always ruin my life." Propose workable solutions and be willing to __1__. If talks fail, involve a resident advisor rather than group chat attacks. Shared living is a practice of __2__ boundaries.', [
    { id: 'C27-1', options: ['compromise', 'explode', 'move country', 'quit school'], answer: 0 },
    { id: 'C27-2', options: ['respecting', 'ignoring', 'erasing', 'selling'], answer: 0 },
  ]),
  C('C28', 'Cloze · Reading Speed', 'Speed-reading claims often exaggerate. Comprehension matters more than pages per minute. Skimming first for structure, then reading deeply, works for textbooks. Annotate lightly; reread key sections. Silent subvocalization is normal and not a flaw. The goal is __1__ understanding within reasonable time, not theatrical __2__.', [
    { id: 'C28-1', options: ['adequate', 'zero', 'hidden', 'foreign'], answer: 0 },
    { id: 'C28-2', options: ['flipping', 'cooking', 'swimming', 'sleeping'], answer: 0 },
  ]),
  C('C29', 'Cloze · Group Chat Etiquette', 'Group chats die when flooded with stickers and off-topic links. Pin important messages. Use threads or separate chats for courses. Mute is a tool, not an insult. Before sending, ask: does everyone need this? Clear chat norms save hours of __1__ scrolling and protect attention for __2__ work.', [
    { id: 'C29-1', options: ['aimless', 'careful', 'slow', 'foreign'], answer: 0 },
    { id: 'C29-2', options: ['real', 'fake', 'illegal', 'ancient'], answer: 0 },
  ]),
  C('C30', 'Cloze · Internship Learning', 'Treat an internship as a long interview and a class. Ask for feedback weekly. Document achievements in plain language for future resumes. Networking means building genuine relationships, not collecting business cards. Students who __1__ learning over ego progress faster. Keep a simple journal to track __2__ and questions.', [
    { id: 'C30-1', options: ['prioritize', 'ignore', 'sell', 'bury'], answer: 0 },
    { id: 'C30-2', options: ['lessons', 'weather', 'gossip', 'nothing'], answer: 0 },
  ]),
  C('C31', 'Cloze · Digital Archives II', 'Scanning is only the first step. Metadata—dates, creators, subjects—makes files findable. File formats age; migration plans are part of preservation. Access rights must be documented before publication. Archives fail when __1__ is treated as optional. Community collections grow through trusted __2__ with source holders.', [
    { id: 'C31-1', options: ['metadata', 'marketing', 'noise', 'paint'], answer: 0 },
    { id: 'C31-2', options: ['partnership', 'theft', 'war', 'silence'], answer: 0 },
  ]),
  C('C32', 'Cloze · Exam Review Strategies', 'Active recall outperforms rereading. Close the book and write what you remember, then check gaps. Spacing sessions across days strengthens memory more than massed practice. Teaching a peer reveals weak spots quickly. Review should be effortful but not __1__. Mix topics to build __2__ flexibility.', [
    { id: 'C32-1', options: ['hopeless', 'easy', 'public', 'loud'], answer: 0 },
    { id: 'C32-2', options: ['retrieval', 'sleep', 'traffic', 'dining'], answer: 0 },
  ]),
  C('C33', 'Cloze · Crowdfunding Campaigns', 'Successful campaigns tell a clear story, set realistic goals, and update backers often. Visual proof beats vague promises. Stretch goals can excite but also delay delivery. Transparency about risks builds trust more than hype. Read the fine print on fees and timelines before __1__ money. A campaign is a __2__ to deliver, not only to collect.', [
    { id: 'C33-1', options: ['raising', 'hiding', 'losing', 'counting'], answer: 0 },
    { id: 'C33-2', options: ['commitment', 'joke', 'rumor', 'accident'], answer: 0 },
  ]),
];

const dictationExtra = [];
const dictationThemes = [
  ['CET-4', '天气', 'The weather forecast says light rain this afternoon.', '天气预报说今天下午有小雨。'],
  ['CET-4', '购物', 'This jacket is on sale for half price this week.', '这件夹克本周半价。'],
  ['CET-4', '问路', 'Turn right at the second crossing and walk two blocks.', '在第二个路口右转再走两个街区。'],
  ['CET-4', '学习', 'Review your notes before you start the exercises.', '开始练习前先复习笔记。'],
  ['CET-4', '健康', 'Drinking enough water helps you stay focused.', '喝足够的水有助于保持专注。'],
  ['CET-4', '交通', 'The bus to the museum leaves every fifteen minutes.', '去博物馆的公交每十五分钟一班。'],
  ['CET-4', '电话', 'I am sorry, the number you dialed is busy.', '对不起，您拨打的电话正在通话中。'],
  ['CET-4', '用餐', 'Could we have the menu, please?', '可以给我们菜单吗？'],
  ['CET-4', '住宿', 'I have a reservation under the name Chen.', '我用陈的名字订了房间。'],
  ['CET-4', '校园', 'The computer lab closes at ten on weekdays.', '机房工作日十点关门。'],
  ['CET-4', '邮件', 'Please find the attachment for your reference.', '请查收附件供您参考。'],
  ['CET-4', '运动', 'We play badminton every Wednesday evening.', '我们每周三晚上打羽毛球。'],
  ['CET-6', '学术', 'The hypothesis remains to be tested with more data.', '该假设仍有待更多数据检验。'],
  ['CET-6', '经济', 'Inflation affects purchasing power over time.', '通货膨胀会影响购买力。'],
  ['CET-6', '环境', 'Renewable energy capacity has grown rapidly.', '可再生能源装机容量增长迅速。'],
  ['CET-6', '科技', 'Machine learning models require careful evaluation.', '机器学习模型需要仔细评估。'],
  ['CET-6', '社会', 'Aging populations reshape labor markets.', '人口老龄化重塑劳动力市场。'],
  ['CET-6', '法律', 'Contract disputes often start with unclear terms.', '合同纠纷常始于条款不清。'],
  ['CET-6', '教育', 'Formative assessment supports ongoing improvement.', '形成性评估支持持续改进。'],
  ['CET-6', '健康', 'Preventive care can reduce long-term costs.', '预防性医疗可降低长期成本。'],
  ['CET-6', '媒体', 'Source verification prevents the spread of rumors.', '核对来源可防止谣言传播。'],
  ['CET-6', '城市', 'Transit-oriented development reduces car dependency.', '以公共交通为导向的开发可减少小汽车依赖。'],
  ['CET-6', '心理', 'Self-compassion correlates with resilience under stress.', '自我同情与压力下的韧性相关。'],
  ['CET-6', '职业', 'Skills portfolios matter more than job titles alone.', '技能组合比职称本身更重要。'],
  ['CET-4', '网络', 'Please connect to the campus Wi-Fi before logging in.', '请先连接校园无线网再登录。'],
  ['CET-4', '银行', 'You can withdraw money at the ATM outside the bank.', '你可以在银行外的取款机取钱。'],
  ['CET-6', '能源', 'Energy efficiency standards encourage better design.', '能效标准鼓励更好的设计。'],
  ['CET-6', '文化', 'Intangible heritage includes crafts and oral traditions.', '非物质文化遗产包括技艺与口头传统。'],
  ['CET-4', '节日', 'People exchange greetings during the Spring Festival.', '人们在春节期间互致问候。'],
  ['CET-6', '治理', 'Transparent procurement reduces opportunities for corruption.', '透明采购减少腐败机会。'],
  ['CET-4', '图书馆', 'Silent floors are reserved for individual study.', '静音楼层供个人自习使用。'],
  ['CET-4', '天气二', 'The temperature will drop sharply tonight.', '今晚气温将急剧下降。'],
  ['CET-6', '物流', 'Cold-chain logistics keep perishable goods fresh.', '冷链物流保持易腐货物新鲜。'],
  ['CET-4', '机场', 'Please arrive at the airport two hours early.', '请提前两小时到达机场。'],
  ['CET-6', '伦理', 'Research ethics boards protect human participants.', '研究伦理审查保护人类受试者。'],
  ['CET-4', '课程', 'The deadline for the report is next Monday.', '报告截止日期是下周一。'],
  ['CET-6', '金融', 'Diversification can reduce unsystematic risk.', '多元化可降低非系统性风险。'],
  ['CET-4', '天气三', 'Take an umbrella if you go out this evening.', '今晚出门的话带把伞。'],
  ['CET-6', '人口', 'Migration patterns reflect economic opportunities.', '迁移模式反映经济机会。'],
  ['CET-4', '宿舍', 'Quiet hours begin at eleven every night.', '每晚十一点开始进入静音时段。'],
  ['CET-6', '设计', 'Universal design benefits users of all abilities.', '通用设计惠及各种能力的用户。'],
  ['CET-4', '考试', 'Read the instructions before answering questions.', '答题前请阅读说明。'],
  ['CET-6', '安全', 'Multi-factor authentication improves account security.', '多因素认证提升账户安全。'],
  ['CET-4', '社团', 'Sign up for clubs during the first two weeks.', '前两周可以报名社团。'],
  ['CET-6', '农业', 'Soil health underpins long-term food security.', '土壤健康支撑长期粮食安全。'],
  ['CET-4', '邮件二', 'I look forward to your early reply.', '期待您的早日回复。'],
  ['CET-6', '交通', 'Shared mobility complements public transit systems.', '共享出行补充公共交通系统。'],
];
dictationThemes.forEach(([level, title, en, zh], i) => {
  dictationExtra.push(D(`DV${String(i + 1).padStart(3, '0')}`, level, title, [{ en, zh }]));
});

const translationPairs = [
  ['CET-4', '阅读是获取知识的重要途径。', 'Reading is an important way to acquire knowledge.'],
  ['CET-4', '他每天花半小时练习听力。', 'He spends half an hour practicing listening every day.'],
  ['CET-4', '这家书店离学校很近。', 'This bookstore is very close to the school.'],
  ['CET-4', '我们应该互相帮助。', 'We should help each other.'],
  ['CET-4', '会议将于下周二举行。', 'The meeting will be held next Tuesday.'],
  ['CET-4', '她对音乐很感兴趣。', 'She is very interested in music.'],
  ['CET-4', '保护环境是每个人的责任。', 'Protecting the environment is everyone\'s responsibility.'],
  ['CET-4', '请把窗户打开。', 'Please open the window.'],
  ['CET-4', '这道题对我来说有点难。', 'This question is a bit difficult for me.'],
  ['CET-4', '他们决定推迟旅行。', 'They decided to put off the trip.'],
  ['CET-4', '学生们正在操场上踢足球。', 'The students are playing football on the playground.'],
  ['CET-4', '我父母都是教师。', 'Both of my parents are teachers.'],
  ['CET-4', '这本小说已被翻译成多种语言。', 'This novel has been translated into many languages.'],
  ['CET-4', '如果你努力，就会进步。', 'If you work hard, you will make progress.'],
  ['CET-4', '我们需要更多的练习机会。', 'We need more opportunities for practice.'],
  ['CET-6', '数字化转型要求组织更新流程与人才结构。', 'Digital transformation requires organizations to update processes and talent structures.'],
  ['CET-6', '城市规划应兼顾效率与公平。', 'Urban planning should balance efficiency and equity.'],
  ['CET-6', '科研成果的可重复性是科学可信度的基础。', 'Reproducibility of research findings is the foundation of scientific credibility.'],
  ['CET-6', '公众参与有助于政策更好地落地。', 'Public participation helps policies be implemented more effectively.'],
  ['CET-6', '过度包装造成资源浪费。', 'Excessive packaging wastes resources.'],
  ['CET-6', '心理韧性可以通过训练得到提升。', 'Psychological resilience can be improved through training.'],
  ['CET-6', '国际合作对于应对气候变化至关重要。', 'International cooperation is vital for addressing climate change.'],
  ['CET-6', '人工智能伦理需要跨学科讨论。', 'AI ethics requires interdisciplinary discussion.'],
  ['CET-6', '职业教育应与产业需求更紧密对接。', 'Vocational education should align more closely with industry needs.'],
  ['CET-6', '文化遗产的活化利用需要社区参与。', 'The adaptive use of cultural heritage requires community participation.'],
  ['CET-6', '远程协作工具提高了跨时区项目的可行性。', 'Remote collaboration tools have improved the feasibility of cross-timezone projects.'],
  ['CET-6', '数据治理框架应明确责任与权限。', 'Data governance frameworks should clarify responsibilities and permissions.'],
  ['CET-6', '绿色建筑有助于降低运营能耗。', 'Green buildings help reduce operational energy consumption.'],
  ['CET-6', '算法透明度有助于建立用户信任。', 'Algorithm transparency helps build user trust.'],
  ['CET-6', '社会企业以商业手段解决公共问题。', 'Social enterprises solve public problems through business means.'],
  ['CET-4', '图书馆提供免费的网络。', 'The library provides free internet access.'],
  ['CET-4', '老师鼓励我们多说英语。', 'The teacher encourages us to speak more English.'],
  ['CET-4', '这项服务是免费的。', 'This service is free of charge.'],
  ['CET-4', '他因病缺席了会议。', 'He was absent from the meeting because of illness.'],
  ['CET-4', '我们班有四十名学生。', 'There are forty students in our class.'],
  ['CET-6', '人口结构变化将影响养老金体系。', 'Demographic changes will affect pension systems.'],
  ['CET-6', '平台责任需要法律进一步明确。', 'Platform responsibilities need further legal clarification.'],
  ['CET-6', '适应性学习系统可根据表现调整难度。', 'Adaptive learning systems can adjust difficulty based on performance.'],
  ['CET-6', '供应链韧性比单纯的成本最小化更重要。', 'Supply chain resilience is more important than pure cost minimization.'],
  ['CET-6', '非物质文化遗产保护强调代际传承。', 'Intangible heritage protection emphasizes intergenerational transmission.'],
  ['CET-4', '别忘了带上你的学生证。', 'Do not forget to bring your student ID.'],
  ['CET-4', '这部电影很值得看。', 'This film is well worth watching.'],
  ['CET-4', '我正在准备下周的考试。', 'I am preparing for next week\'s exam.'],
  ['CET-6', '批判性思维训练应贯穿课程体系。', 'Critical thinking training should run through the curriculum.'],
  ['CET-6', '公共卫生应急体系需要常态演练。', 'Public health emergency systems need regular drills.'],
  ['CET-6', '共享经济的监管应保护消费者权益。', 'Regulation of the sharing economy should protect consumer rights.'],
  ['CET-6', '科学传播要避免制造不必要的恐慌。', 'Science communication should avoid creating unnecessary panic.'],
  ['CET-4', '他在会议上做了一个简短的报告。', 'He made a short report at the meeting.'],
  ['CET-6', '产业升级带动对高技能劳动力的需求。', 'Industrial upgrading drives demand for highly skilled labor.'],
  ['CET-6', '开放数据可以激发社会创新。', 'Open data can stimulate social innovation.'],
];
const translationExtra = translationPairs.map((t, i) => T(`TV${String(i + 1).padStart(3, '0')}`, t[0], t[1], t[2]));

const speakingExtra = [
  S('SV01', '描述图表', [
    { en: 'As can be seen from the chart, the figure rose steadily from 2018 to 2023.', zh: '从图表可以看出，数字从2018到2023稳步上升。' },
    { en: 'The most dramatic change occurred after 2020.', zh: '最显著的变化发生在2020年之后。' },
  ]),
  S('SV02', '表达同意', [
    { en: 'I completely agree with your point about time management.', zh: '我完全同意你关于时间管理的观点。' },
    { en: 'That is exactly what I was thinking.', zh: '那正是我所想的。' },
  ]),
  S('SV03', '礼貌打断', [
    { en: 'Sorry to interrupt, but could we clarify the deadline?', zh: '抱歉打断一下，我们能确认截止时间吗？' },
  ]),
  S('SV04', '道歉与补救', [
    { en: 'I apologize for missing yesterday\'s meeting.', zh: '我为错过昨天的会议道歉。' },
    { en: 'I have reviewed the notes and will catch up today.', zh: '我已看了纪要，今天会补上进度。' },
  ]),
  S('SV05', '请求帮助', [
    { en: 'Could you explain this formula again when you are free?', zh: '你有空时能再讲一下这个公式吗？' },
  ]),
  S('SV06', '给出建议', [
    { en: 'I suggest starting with the methodology section.', zh: '我建议从方法部分开始。' },
    { en: 'It might help to split the work by week.', zh: '按周拆分任务或许有帮助。' },
  ]),
  S('SV07', '结束通话', [
    { en: 'Thanks for your time. I will send a summary email.', zh: '感谢您的时间。我会发一封总结邮件。' },
  ]),
  S('SV08', '机场值机', [
    { en: 'I would like an aisle seat if available.', zh: '如果可以，我想要靠过道的座位。' },
    { en: 'Here is my passport and booking reference.', zh: '这是我的护照和订座编号。' },
  ]),
];

const rootsExtra = [
  { id: 'RV01', root: 'aud', meaning: '听', words: ['audience', 'audio', 'auditorium'] },
  { id: 'RV02', root: 'bene', meaning: '好', words: ['benefit', 'benevolent'] },
  { id: 'RV03', root: 'chrono', meaning: '时间', words: ['chronology', 'synchronize'] },
  { id: 'RV04', root: 'dem', meaning: '人民', words: ['democracy', 'demographic'] },
  { id: 'RV05', root: 'equ', meaning: '相等', words: ['equal', 'equivalent', 'adequate'] },
  { id: 'RV06', root: 'hydr', meaning: '水', words: ['hydrogen', 'dehydrate'] },
  { id: 'RV07', root: 'luc/lum', meaning: '光', words: ['illuminate', 'translucent'] },
  { id: 'RV08', root: 'man/manu', meaning: '手', words: ['manual', 'manufacture'] },
  { id: 'RV09', root: 'nov', meaning: '新', words: ['novel', 'innovate'] },
  { id: 'RV10', root: 'phil', meaning: '爱', words: ['philosophy', 'philanthropy'] },
];

const collocationsExtra = [
  { id: 'CV01', topic: '研究', pairs: [
    { phrase: 'collect data', meaning: '收集数据' },
    { phrase: 'analyze results', meaning: '分析结果' },
    { phrase: 'publish a paper', meaning: '发表论文' },
    { phrase: 'peer review', meaning: '同行评审' },
    { phrase: 'replicate a study', meaning: '重复研究' },
  ]},
  { id: 'CV02', topic: '求职', pairs: [
    { phrase: 'submit an application', meaning: '提交申请' },
    { phrase: 'go for an interview', meaning: '参加面试' },
    { phrase: 'meet the requirements', meaning: '满足要求' },
    { phrase: 'accept an offer', meaning: '接受录用' },
    { phrase: 'negotiate salary', meaning: '协商薪资' },
  ]},
  { id: 'CV03', topic: '健康', pairs: [
    { phrase: 'catch a cold', meaning: '感冒' },
    { phrase: 'take medicine', meaning: '吃药' },
    { phrase: 'recover from illness', meaning: '病后恢复' },
    { phrase: 'keep a balanced diet', meaning: '保持均衡饮食' },
    { phrase: 'build up immunity', meaning: '增强免疫' },
  ]},
  { id: 'CV04', topic: '环境', pairs: [
    { phrase: 'cut emissions', meaning: '减排' },
    { phrase: 'protect wildlife', meaning: '保护野生动物' },
    { phrase: 'conserve energy', meaning: '节能' },
    { phrase: 'raise awareness', meaning: '提高意识' },
    { phrase: 'take concrete steps', meaning: '采取具体步骤' },
  ]},
  { id: 'CV05', topic: '媒体', pairs: [
    { phrase: 'cover a story', meaning: '报道新闻' },
    { phrase: 'go viral', meaning: '疯传' },
    { phrase: 'verify sources', meaning: '核实消息来源' },
    { phrase: 'draw attention to', meaning: '引起关注' },
    { phrase: 'report accurately', meaning: '准确报道' },
  ]},
  { id: 'CV06', topic: '法律', pairs: [
    { phrase: 'sign a contract', meaning: '签合同' },
    { phrase: 'comply with the law', meaning: '遵守法律' },
    { phrase: 'file a complaint', meaning: '提出申诉' },
    { phrase: 'reach a settlement', meaning: '达成和解' },
    { phrase: 'protect rights', meaning: '保护权利' },
  ]},
  { id: 'CV07', topic: '教育', pairs: [
    { phrase: 'enroll in a course', meaning: '选课注册' },
    { phrase: 'meet a deadline', meaning: '赶上截止日期' },
    { phrase: 'earn a degree', meaning: '获得学位' },
    { phrase: 'give a presentation', meaning: '做展示' },
    { phrase: 'receive feedback', meaning: '获得反馈' },
  ]},
  { id: 'CV08', topic: '科技', pairs: [
    { phrase: 'develop software', meaning: '开发软件' },
    { phrase: 'protect privacy', meaning: '保护隐私' },
    { phrase: 'update a system', meaning: '更新系统' },
    { phrase: 'store data securely', meaning: '安全存储数据' },
    { phrase: 'adopt new tools', meaning: '采用新工具' },
  ]},
];

const synonymsExtra = [
  { id: 'YV01', group: '重要的', words: ['important', 'significant', 'crucial', 'vital', 'essential'], note: 'crucial/vital 更强' },
  { id: 'YV02', group: '导致', words: ['cause', 'lead to', 'result in', 'give rise to'], note: 'give rise to 较正式' },
  { id: 'YV03', group: '改善', words: ['improve', 'enhance', 'upgrade', 'refine'], note: 'refine 偏精细打磨' },
  { id: 'YV04', group: '问题', words: ['problem', 'issue', 'challenge', 'obstacle'], note: 'obstacle 强调阻碍' },
  { id: 'YV05', group: '方法', words: ['method', 'approach', 'means', 'strategy'], note: 'approach 常接 to' },
  { id: 'YV06', group: '影响', words: ['affect', 'influence', 'impact', 'shape'], note: 'impact 作名词/动词皆可' },
  { id: 'YV07', group: '充足的', words: ['enough', 'sufficient', 'adequate', 'plenty of'], note: 'sufficient 书面' },
  { id: 'YV08', group: '著名的', words: ['famous', 'well-known', 'renowned', 'notable'], note: 'renowned 更强声望' },
];

// 词库辅料：补齐缺失的英文例句（中文）
function enrichVocabDeep(file) {
  const list = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  let n = 0;
  for (const w of list) {
    if (!w.example && w.word) {
      w.example = `Students often meet the word <em>${w.word}</em> in CET exams.`;
      w.exampleZh = `学生在四六级考试中常遇到 ${w.word} 这个词。`;
      n++;
    }
    if ((!w.collocations || !w.collocations.length) && w.word && w.word.length >= 3) {
      const word = w.word.toLowerCase();
      if (/ly$/.test(word)) w.collocations = [`${word} enough`, `quite ${word}`];
      else if (/tion$|ment$|ness$|ity$|ance$|ence$/.test(word)) w.collocations = [`the ${word} of`, `in ${word}`];
      else if (/ous$|ful$|ive$|able$|ible$|al$/.test(word)) w.collocations = [`highly ${word}`, `${word} for`];
      else w.collocations = [`use ${word}`, `${word} in context`];
      n++;
    }
  }
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(list));
  console.log(file, 'deep-enriched ops', n, 'words', list.length);
}

// ── 合并写出 ──
const practice = {
  ...base,
  listening: dedupe([...(base.listening || []), ...(listeningExtra || [])]),
  reading: dedupe([...(base.reading || []), ...(readingExtra || [])]),
  cloze: dedupe([...(base.cloze || []), ...(clozeExtra || [])]),
  dictation: dedupe([...(base.dictation || []), ...(dictationExtra || [])]),
  translations: dedupe([...(base.translations || []), ...(translationExtra || [])]),
  speakingScripts: dedupe([...(base.speakingScripts || []), ...(speakingExtra || [])]),
  writingLibrary: dedupe([...(base.writingLibrary || []), ...writingEssays]),
  writingPrompts: dedupe([...(base.writingPrompts || []), ...writingEssays, ...extraPrompts]),
  roots: dedupe([...(base.roots || []), ...(rootsExtra || [])]),
  collocations: dedupe([...(base.collocations || []), ...(collocationsExtra || [])]),
  synonyms: dedupe([...(base.synonyms || []), ...(synonymsExtra || [])]),
};

// 基于现有听力/阅读自动追加模考套题（组合不同 id）
const mockExtra = [];
const mockLevels = ['CET-4', 'CET-6'];
for (let m = 15; m <= 24; m++) {
  const level = mockLevels[m % 2];
  const list = practice.listening;
  const read = practice.reading;
  const cloz = practice.cloze;
  const LIds = [];
  for (let i = 0; i < 4; i++) LIds.push(list[(m * 3 + i) % list.length]?.id);
  const RIds = [];
  for (let i = 0; i < 2; i++) RIds.push(read[(m * 2 + i) % read.length]?.id);
  const CIds = [];
  for (let i = 0; i < 2; i++) CIds.push(cloz[(m * 2 + i) % cloz.length]?.id);
  const wPool = practice.writingPrompts.filter((x) => x.level === level || !x.level);
  const tPool = practice.translations.filter((x) => x.level === level || !x.level);
  const w = wPool[m % wPool.length]?.id || practice.writingPrompts[0]?.id;
  const t = tPool[m % tPool.length]?.id || practice.translations[0]?.id;
  mockExtra.push({
    id: `M-SET-${m}`,
    title: `全真模考 · 第 ${m} 套`,
    level,
    duration: level === 'CET-6' ? 130 : 125,
    sections: [
      { type: 'listening', title: '听力', count: 20, sourceIds: LIds.filter(Boolean) },
      { type: 'reading', title: '阅读理解', count: 10, sourceIds: RIds.filter(Boolean) },
      { type: 'cloze', title: '完形填空', count: 8, sourceIds: CIds.filter(Boolean) },
      { type: 'writing', title: '写作', count: 1, sourceIds: [w] },
      { type: 'translation', title: '翻译', count: 1, sourceIds: [t] },
    ],
  });
}
practice.mockExams = dedupe([...(base.mockExams || []), ...mockExtra]);

fs.writeFileSync(practicePath, JSON.stringify(practice));
console.log('practice.json', (fs.statSync(practicePath).size / 1024).toFixed(1) + 'KB');
for (const k of ['listening', 'reading', 'cloze', 'dictation', 'writingPrompts', 'writingLibrary', 'translations', 'speakingScripts', 'mockExams', 'roots', 'collocations', 'synonyms']) {
  console.log(k, Array.isArray(practice[k]) ? practice[k].length : '-');
}
enrichVocabDeep('vocab-cet4.json');
enrichVocabDeep('vocab-cet6.json');
console.log('expand v2 done');
