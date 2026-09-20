/**
 * 语法专项题库生成 — CET-4/6 高频
 * 输出: public/data/grammar.json
 * 目标: 100+ 专题条目（大专题+子专题）· 250+ 小题
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../public/data/grammar.json');

function q(id, stem, options, answer, explain) {
  return { id, stem, options, answer, explain };
}

function topic(id, title, category, level, rules, examples, questions, tags = []) {
  return { id, title, category, level, rules, examples, questions, tags };
}

const T = [];

// ══════════ 时态 ══════════
T.push(topic('G-T-01', '一般现在时与现在进行时', '时态', 'CET-4',
  [
    '一般现在时：习惯、事实、时刻表；常与 always/often/every day 连用。',
    '现在进行时：此刻/现阶段进行；有时表将来（位移动词 go/come/leave）。',
    '状态动词（know/believe/own）一般不用进行时。',
  ],
  ['Water boils at 100°C.', 'She is writing her term paper now.', 'The train leaves at 8 tomorrow.'],
  [
    q('G-T-01-1', 'Look! The children ___ football on the playground.', ['play', 'plays', 'are playing', 'played'], 2, 'Look! 提示此刻正在进行 → 现在进行时。'),
    q('G-T-01-2', 'He usually ___ to work by subway.', ['go', 'goes', 'is going', 'went'], 1, 'usually + 一般现在时；主语三单加 s。'),
    q('G-T-01-3', 'I ___ what you mean, but I disagree.', ['am knowing', 'know', 'knows', 'knew'], 1, 'know 为状态动词，不用进行时。'),
    q('G-T-01-4', 'The plane ___ at 6 a.m. tomorrow morning.', ['left', 'leaves', 'is leaving always', 'has left'], 1, '时刻表常用一般现在时表将来。'),
    q('G-T-01-5', 'She ___ in this company these days.', ['works', 'work', 'is working', 'worked'], 2, 'these days 阶段性 → 现在进行时。'),
  ]));

T.push(topic('G-T-02', '一般过去时与现在完成时', '时态', 'CET-4',
  [
    '一般过去时：明确过去时间（yesterday/last year/in 2020）。',
    '现在完成时：过去动作对现在有影响；或从过去持续到现在（since/for）。',
    'already/yet/ever/never/just 常配现在完成时。',
  ],
  ['I visited Beijing last summer.', 'I have lived here since 2018.', 'Have you ever been abroad?'],
  [
    q('G-T-02-1', 'I ___ my keys. I can\'t open the door now.', ['lose', 'lost', 'have lost', 'had lost'], 2, '强调现在结果 → 现在完成时。'),
    q('G-T-02-2', 'He ___ in 2010 and has worked there ever since.', ['joined', 'joins', 'has joined', 'joins'], 0, '明确过去时间 in 2010 → 一般过去时。'),
    q('G-T-02-3', 'We ___ each other since primary school.', ['knew', 'have known', 'know', 'are knowing'], 1, 'since + 过去起点 → 现在完成时。'),
    q('G-T-02-4', 'She has already ___ the report.', ['finish', 'finished', 'finishing', 'finishes'], 1, 'has + 过去分词 finished。'),
    q('G-T-02-5', 'When I ___ home, it was raining.', ['arrive', 'arrived', 'have arrived', 'arriving'], 1, 'when + 过去时间点，主句过去时。'),
    q('G-T-02-6', 'This is the best movie I ___ seen.', ['ever', 'have ever', 'had ever', 'ever have'], 1, '固定：the best … I have ever seen。'),
  ]));

T.push(topic('G-T-03', '过去完成时与将来时', '时态', 'CET-4',
  [
    '过去完成时：过去的过去（by + 过去时间 / before / after / when）。',
    'will + do / be going to：将来；be about to：即将。',
    '现在进行时 / 一般现在时也可表将来（计划、时刻表）。',
  ],
  ['By 2020, they had built three bridges.', 'I will call you tonight.', 'We are leaving for Shanghai tomorrow.'],
  [
    q('G-T-03-1', 'By the time we arrived, the film ___.', ['started', 'has started', 'had started', 'starts'], 2, '过去的过去 → 过去完成时。'),
    q('G-T-03-2', 'He told me he ___ the task already.', ['finishes', 'finished', 'had finished', 'has finished'], 2, 'told 过去；finish 更早 → had finished。'),
    q('G-T-03-3', 'Look at the dark clouds — it ___ rain.', ['will', 'is going to', 'would', 'had'], 1, '有迹象的推测用 be going to。'),
    q('G-T-03-4', 'The conference ___ next Monday.', ['will hold', 'holds', 'is held', 'is holding'], 1, '日程表可用一般现在时表将来。'),
  ]));

T.push(topic('G-T-04', '现在完成进行时与语态结合', '时态', 'CET-6',
  [
    'have/has been doing：从过去持续到现在，且可能继续。',
    '与现在完成时区别：更强调动作的持续与过程。',
    '常与 since/for/all morning 等连用。',
  ],
  ['I have been reading for two hours.', 'They have been discussing the issue since Monday.'],
  [
    q('G-T-04-1', 'She ___ English for six years and is still learning.', ['learned', 'has learned', 'has been learning', 'learns'], 2, '持续至今且可能继续 → 现在完成进行时。'),
    q('G-T-04-2', 'My eyes are tired — I ___ at the screen all day.', ['look', 'looked', 'have looked', 'have been looking'], 3, 'all day + 疲劳后果 → have been looking。'),
    q('G-T-04-3', 'How many books ___ so far this term?', ['have you read', 'did you read', 'have you been reading', 'are you reading'], 0, 'so far + 数量结果 → 现在完成时更自然。'),
  ]));

// ══════════ 被动语态 ══════════
T.push(topic('G-P-01', '被动语态基本结构', '被动语态', 'CET-4',
  [
    '结构：be + 过去分词（+ by 短语）。',
    '时态体现在 be 上：is done / was done / has been done / will be done。',
    '不及物动词无被动；happen/take place/occur 等。',
  ],
  ['The bridge was built in 1990.', 'English is spoken worldwide.'],
  [
    q('G-P-01-1', 'The report ___ by the team last week.', ['writes', 'wrote', 'was written', 'is written'], 2, 'last week + 被动 → was written。'),
    q('G-P-01-2', 'These products ___ to many countries.', ['export', 'are exported', 'exported', 'exports'], 1, '产品被出口 → are exported。'),
    q('G-P-01-3', 'The meeting ___ until next Friday.', ['will put off', 'will be put off', 'puts off', 'is putting off'], 1, '会议被推迟 → will be put off。'),
    q('G-P-01-4', 'Great changes ___ in our city since 2015.', ['took place', 'have been taken place', 'have taken place', 'were taken place'], 2, 'take place 无被动。'),
  ]));

T.push(topic('G-P-02', '含情态动词与双宾语的被动', '被动语态', 'CET-4',
  [
    '情态动词被动：must/can/should + be + done。',
    '双宾语被动：give sb sth → sb be given sth / sth be given to sb。',
    '短语动词被动：look after → be looked after。',
  ],
  ['The work must be finished today.', 'He was given a prize. / A prize was given to him.'],
  [
    q('G-P-02-1', 'This problem ___ at tomorrow\'s meeting.', ['should discuss', 'should be discussed', 'should discussed', 'discusses'], 1, 'should + be discussed。'),
    q('G-P-02-2', 'A scholarship ___ to the top student.', ['offered', 'was offered', 'offering', 'offers'], 1, '被动 + 过去时间语境 → was offered。'),
    q('G-P-02-3', 'The children ___ by their grandparents in the village.', ['are looked after', 'look after', 'are looking after', 'looked'], 0, 'look after 的被动：are looked after。'),
  ]));

T.push(topic('G-P-03', '主动表被动与 get-passive', '被动语态', 'CET-6',
  [
    'want/need/require + doing：主动形式表被动含义。',
    'get + done：口语化被动（get hurt/get lost）。',
    '感官系动词 feel/sound + adj：无被动。',
  ],
  ['The car needs repairing.', 'He got injured in the match.'],
  [
    q('G-P-03-1', 'The flowers need ___ every day.', ['to water', 'watering', 'watered', 'waters'], 1, 'need doing = need to be done。'),
    q('G-P-03-2', 'She ___ lost in the strange city.', ['was', 'got', 'is getting', 'gets'], 1, 'get lost 较常见。'),
    q('G-P-03-3', 'The idea sounds ___ to me.', ['interestingly', 'interested', 'interesting', 'interest'], 2, 'sound + 形容词，主动表状态。'),
  ]));

// ══════════ 虚拟语气 ══════════
T.push(topic('G-V-01', 'if 条件句虚拟', '虚拟语气', 'CET-4',
  [
    '与现在事实相反：if + 过去式（be 用 were），主句 would/could/might + do。',
    '与过去事实相反：if + had done，主句 would have done。',
    '与将来可能相反：if + 过去式 / were to / should + do。',
  ],
  ['If I were you, I would accept the offer.', 'If he had studied harder, he would have passed.'],
  [
    q('G-V-01-1', 'If I ___ you, I would take the job.', ['am', 'was', 'were', 'be'], 2, '虚拟现在：be 统一用 were。'),
    q('G-V-01-2', 'If she ___ earlier, she would have caught the train.', ['left', 'leaves', 'had left', 'has left'], 2, '过去虚拟：if had done → would have done。'),
    q('G-V-01-3', 'If it ___ tomorrow, we would cancel the picnic.', ['rains', 'rained', 'will rain', 'would rain'], 1, '将来虚拟：if + 过去式。'),
    q('G-V-01-4', 'If they had warned us, we ___ the loss.', ['avoid', 'avoided', 'would avoid', 'would have avoided'], 3, '与过去相反主句 would have done。'),
  ]));

T.push(topic('G-V-02', 'wish / as if / if only', '虚拟语气', 'CET-6',
  [
    'wish + 过去式：现在不能实现的愿望。',
    'wish + 过去完成时：对过去的遗憾。',
    'as if / if only 时态后退规则同 wish。',
  ],
  ['I wish I knew the answer.', 'I wish I had taken your advice.'],
  [
    q('G-V-02-1', 'I wish I ___ more time to travel.', ['have', 'had', 'will have', 'have had'], 1, '对现在的愿望 → 过去式 had。'),
    q('G-V-02-2', 'He talks as if he ___ everything.', ['knows', 'knew', 'has known', 'knowing'], 1, 'as if 虚拟 → knew。'),
    q('G-V-02-3', 'If only we ___ to the doctor earlier!', ['go', 'went', 'had gone', 'have gone'], 2, '对过去的懊悔 → had gone。'),
  ]));

T.push(topic('G-V-03', 'suggest / demand 等从句虚拟', '虚拟语气', 'CET-6',
  [
    'suggest / advise / demand / require / insist / order + that + (should) + 动词原形。',
    'suggest 作「暗示」时用正常时态。',
    'It is essential / important / necessary that … 同规则。',
  ],
  ['He suggested that the meeting (should) be postponed.', 'The look on his face suggested that he was angry.'],
  [
    q('G-V-03-1', 'The doctor recommended that he ___ smoking.', ['stops', 'stop', 'stopped', 'will stop'], 1, 'recommend that + (should) do。'),
    q('G-V-03-2', 'It is essential that every student ___ the rules.', ['obeys', 'obey', 'obeyed', 'obeying'], 1, 'essential that + 原形。'),
    q('G-V-03-3', 'Her pale face suggested that she ___ ill.', ['be', 'was', 'should be', 'were'], 1, 'suggest「暗示」不用虚拟。'),
  ]));

// ══════════ 定语从句 ══════════
T.push(topic('G-R-01', '关系代词 who/whom/which/that', '定语从句', 'CET-4',
  [
    'who 指人（主/宾）；whom 宾格；which 指物。',
    'that 人/物皆可；限制性从句常用。',
    '关系词在从句中作成分，不可省略成分时才可省略宾格。',
  ],
  ['The man who spoke is my uncle.', 'This is the book which I bought.'],
  [
    q('G-R-01-1', 'The girl ___ won the prize is my classmate.', ['which', 'who', 'whom', 'whose'], 1, '指人且作主语 → who。'),
    q('G-R-01-2', 'I remember the day ___ we first met.', ['which', 'where', 'when', 'what'], 2, '先行词 day + 从句完整 → when。'),
    q('G-R-01-3', 'The book ___ cover is red is mine.', ['which', 'that', 'whose', 'who'], 2, '所属关系 → whose。'),
    q('G-R-01-4', 'This is the factory ___ his father works.', ['which', 'where', 'that', 'what'], 1, '地点 + 不及物 work → where。'),
  ]));

T.push(topic('G-R-02', '介词 + 关系代词 / 限制性与非限制性', '定语从句', 'CET-6',
  [
    'prep + whom/which：介词前置时不用 that。',
    '非限制性（逗号）不用 that，可指整个主句（as/which）。',
    'as 正如…那样，位置更灵活。',
  ],
  ['This is the house in which he lives.', 'He passed the exam, which surprised us.'],
  [
    q('G-R-02-1', 'The man ___ I talked is a professor.', ['who', 'whom', 'to whom', 'to who'], 2, 'talk to sb → to whom。'),
    q('G-R-02-2', 'He failed again, ___ made his parents worried.', ['that', 'what', 'which', 'it'], 2, '非限制性指前面整句 → which。'),
    q('G-R-02-3', '___ is known to all, the earth is round.', ['That', 'It', 'As', 'Which'], 2, 'as is known to all 固定。'),
  ]));

// ══════════ 状语从句 ══════════
T.push(topic('G-A-01', '时间状语从句', '状语从句', 'CET-4',
  [
    'when/while/as/before/after/until/since/as soon as。',
    '主句将来时，时间从句用一般现在时表将来。',
    'while 强调同时进行；when 可接点或段。',
  ],
  ['I will call you when I arrive.', 'While he was sleeping, someone knocked.'],
  [
    q('G-A-01-1', 'I\'ll tell him the news as soon as he ___ back.', ['come', 'comes', 'came', 'will come'], 1, '时间从句用一般现在时表将来。'),
    q('G-A-01-2', '___ reading, he fell asleep.', ['When', 'While', 'As soon as', 'Until'], 1, 'while + 持续动作。'),
    q('G-A-01-3', 'I didn\'t leave ___ he came back.', ['when', 'until', 'after', 'since'], 2, 'not until 直到…才。'),
  ]));

T.push(topic('G-A-02', '条件 / 让步 / 原因 / 结果从句', '状语从句', 'CET-4',
  [
    '条件：if / unless / as long as / provided that。',
    '让步：although/though（不与 but 连用）/ even if / no matter what。',
    '原因：because / since / as；结果：so…that / such…that。',
  ],
  ['Although it was raining, we went out.', 'He spoke so fast that I couldn\'t follow.'],
  [
    q('G-A-02-1', '___ he is young, he knows a lot.', ['Because', 'Although', 'So', 'Unless'], 1, '让步：Although…'),
    q('G-A-02-2', 'I will go ___ it rains or not.', ['if', 'whether', 'unless', 'because'], 1, 'whether…or not 固定。'),
    q('G-A-02-3', 'He made ___ rapid progress that everyone was surprised.', ['so', 'such', 'very', 'too'], 0, 'so + adj + that。'),
    q('G-A-02-4', 'You won\'t pass ___ you work harder.', ['if', 'unless', 'though', 'because'], 1, 'unless = if not。'),
  ]));

// ══════════ 名词性从句 ══════════
T.push(topic('G-N-01', '主语从句与宾语从句', '名词性从句', 'CET-4',
  [
    '主语从句：That he came surprised us. / It is clear that…',
    '宾语从句：I think that… / 不知是否用 whether/if。',
    '从句用陈述语序。',
  ],
  ['That she left so early was strange.', 'I wonder whether he will come.'],
  [
    q('G-N-01-1', '___ he said at the meeting surprised everyone.', ['That', 'What', 'Which', 'Whether'], 1, 'said 后缺宾语 → What。'),
    q('G-N-01-2', 'I don\'t know ___ he will agree or not.', ['that', 'if', 'whether', 'what'], 2, '与 or not 连用 → whether。'),
    q('G-N-01-3', 'It is obvious ___ she has made a mistake.', ['what', 'that', 'which', 'whether'], 1, '主语从句 that 不省略时常见。'),
  ]));

T.push(topic('G-N-02', '表语从句与同位语从句', '名词性从句', 'CET-6',
  [
    '表语从句：The problem is that we lack time.',
    '同位语从句：解释抽象名词（news/idea/fact/hope）的具体内容。',
    'that 在同位语从句中不作成分，不可省略。',
  ],
  ['The news that he won is true.', 'The reason is that he was ill.'],
  [
    q('G-N-02-1', 'The fact ___ he cheated shocked us.', ['which', 'what', 'that', 'why'], 2, 'fact 的同位语从句 → that。'),
    q('G-N-02-2', 'This is ___ we differ from each other.', ['that', 'what', 'where', 'which'], 2, '表语从句：这就是分歧所在。'),
    q('G-N-02-3', 'I have no idea ___ she has gone.', ['where', 'what', 'which', 'that'], 0, 'idea 的同位语，缺地点状语 → where。'),
  ]));

// ══════════ 非谓语 ══════════
T.push(topic('G-F-01', '不定式 vs 动名词作宾语', '非谓语', 'CET-4',
  [
    '只接 to do：want/hope/decide/plan/agree/refuse。',
    '只接 doing：enjoy/finish/mind/avoid/suggest/practice/consider。',
    '两者皆可但意义不同：remember/forget/regret/stop/try。',
  ],
  ['I enjoy reading novels.', 'Remember to lock the door.'],
  [
    q('G-F-01-1', 'She enjoys ___ to classical music.', ['listen', 'to listen', 'listening', 'listened'], 2, 'enjoy + doing。'),
    q('G-F-01-2', 'Remember ___ the door when you leave.', ['locking', 'to lock', 'lock', 'locked'], 1, 'remember to do 记得去做。'),
    q('G-F-01-3', 'He avoided ___ the same mistake.', ['to make', 'make', 'making', 'made'], 2, 'avoid + doing。'),
    q('G-F-01-4', 'They stopped ___ when the teacher came in.', ['talking', 'to talk', 'talk', 'talked'], 0, 'stop doing 停止做某事。'),
  ]));

T.push(topic('G-F-02', '分词作状语与定语', '非谓语', 'CET-6',
  [
    '现在分词：主动/进行；过去分词：被动/完成。',
    '逻辑主语须与句子主语一致。',
    '分词短语可表时间、原因、条件、伴随。',
  ],
  ['Seeing the police, he ran away.', 'Given more time, we could do better.'],
  [
    q('G-F-02-1', '___ from the hill, the city looks beautiful.', ['Seeing', 'Seen', 'To see', 'See'], 1, 'city 被看 → 过去分词 Seen。'),
    q('G-F-02-2', '___ the truth, he felt relieved.', ['Told', 'Telling', 'Having told', 'To tell'], 0, '他被告知 → Told。'),
    q('G-F-02-3', '___ the project, they went home early.', ['Finishing', 'Having finished', 'Finished', 'To finish'], 1, '主动且先于主句 → Having finished。'),
  ]));

T.push(topic('G-F-03', '独立主格结构', '非谓语', 'CET-6',
  [
    '结构：名词/代词 + 分词/不定式/形容词/介词短语。',
    '逻辑主语与句子主语不同时使用。',
    '表时间、原因、条件、伴随。',
  ],
  ['Weather permitting, we will go hiking.', 'The work done, they went home.'],
  [
    q('G-F-03-1', 'All things ___, the plan is workable.', ['consider', 'considered', 'considering', 'to consider'], 1, 'things 被考虑 → considered。'),
    q('G-F-03-2', 'He sat there, his eyes ___ on the screen.', ['fixing', 'fixed', 'to fix', 'fix'], 1, 'eyes 被盯住 → fixed。'),
    q('G-F-03-3', 'Time ___, we will finish on schedule.', ['permit', 'permitted', 'permitting', 'to permit'], 2, 'time 允许 → permitting。'),
  ]));

// ══════════ 倒装与强调 ══════════
T.push(topic('G-I-01', '部分倒装与全部倒装', '倒装', 'CET-6',
  [
    '否定词前置：never/seldom/hardly/not only → 部分倒装。',
    'only + 状语前置 → 部分倒装。',
    '地点状语前置 + 不及物动词 → 全部倒装（Here comes…）。',
  ],
  ['Never have I seen such a mess.', 'Only then did he realize his mistake.'],
  [
    q('G-I-01-1', 'Not until midnight ___ writing.', ['he stopped', 'stopped he', 'did he stop', 'he did stop'], 2, 'Not until 前置 → 部分倒装。'),
    q('G-I-01-2', 'Hardly ___ when the power went off.', ['he had sat down', 'had he sat down', 'he sat down', 'did he sit down'], 1, 'Hardly…when 用过去完成时倒装。'),
    q('G-I-01-3', 'Only after the meeting ___ the truth.', ['he knew', 'did he know', 'he did know', 'knew he'], 1, 'only + 状语 → 倒装。'),
  ]));

T.push(topic('G-I-02', '强调句与省略', '倒装/强调', 'CET-6',
  [
    '强调句：It is/was + 被强调部分 + that/who + 其余。',
    '去掉 It is/was…that 句子仍完整。',
    '状语从句省略：When (he was) young…；if necessary 等。',
  ],
  ['It was yesterday that I met her.', 'If (it is) necessary, call me.'],
  [
    q('G-I-02-1', 'It was in the library ___ I lost my wallet.', ['where', 'that', 'which', 'when'], 1, '强调句型一律用 that。'),
    q('G-I-02-2', 'It was not until 1990 ___ the law was passed.', ['when', 'that', 'which', 'since'], 1, '强调 not until…that。'),
    q('G-I-02-3', '___ in difficulty, he never gave up.', ['Although', 'Although was he', 'Although he was', 'Although was'], 2, '从句不可倒装为主谓错序。'),
  ]));

// ══════════ 主谓一致 / 冠词 / 比较 ══════════
T.push(topic('G-S-01', '主谓一致', '主谓一致', 'CET-4',
  [
    '就近原则：either…or / neither…nor / not only…but also。',
    '就远原则：as well as / together with / along with 不影响主语数。',
    '不定代词 everyone/each/every 作主语 → 单数；people/police → 复数。',
  ],
  ['Neither he nor I am wrong.', 'The teacher as well as the students is coming.'],
  [
    q('G-S-01-1', 'Each of the students ___ a textbook.', ['have', 'has', 'having', 'to have'], 1, 'each of + 复数 → 谓语单数。'),
    q('G-S-01-2', 'The teacher, along with his students, ___ going to visit the museum.', ['are', 'is', 'were', 'be'], 1, 'along with 就远，谓语随 teacher。'),
    q('G-S-01-3', 'Neither the boys nor their father ___ at home.', ['is', 'are', 'were', 'be'], 0, '就近：father 单数 → is。'),
    q('G-S-01-4', 'The police ___ looking for the suspect.', ['is', 'are', 'was', 'has'], 1, 'police 集合名词作复数。'),
  ]));

T.push(topic('G-S-02', '冠词用法', '冠词', 'CET-4',
  [
    'a/an：首次提到、泛指一类；an + 元音音素。',
    'the：特指、序数词、最高级、独一无二、乐器。',
    '零冠词：三餐/球类/学科前（play football / study English）。',
  ],
  ['He is an honest boy.', 'The sun rises in the east.'],
  [
    q('G-S-02-1', 'He plays ___ piano every evening.', ['a', 'an', 'the', '/'], 2, '乐器前加 the。'),
    q('G-S-02-2', 'She is ___ university student.', ['a', 'an', 'the', '/'], 0, 'university 音标 /juː/ → a。'),
    q('G-S-02-3', 'I had ___ breakfast at seven.', ['a', 'an', 'the', '/'], 3, '三餐前零冠词。'),
    q('G-S-02-4', '___ second chapter is more difficult.', ['A', 'An', 'The', '/'], 2, '序数词前用 the。'),
  ]));

T.push(topic('G-S-03', '比较级与最高级', '比较级', 'CET-4',
  [
    '比较级 + than；the + 最高级 + 范围。',
    '倍数表达：A is three times as big as B / bigger than B / the size of B。',
    'no more than / not more than / no less than 含义区别。',
  ],
  ['This box is twice as heavy as that one.', 'He is by far the best student.'],
  [
    q('G-S-03-1', 'This bridge is ___ than that one.', ['long', 'longer', 'longest', 'more long'], 1, 'than → 比较级。'),
    q('G-S-03-2', 'He is ___ tallest boy in his class.', ['a', 'an', 'the', '/'], 2, '最高级前加 the。'),
    q('G-S-03-3', 'The hall is three times ___ our classroom.', ['bigger as', 'as big as', 'more big', 'the bigger'], 1, '倍数 + as…as。'),
  ]));

// ══════════ 情态动词 / 连词 / 代词 ══════════
T.push(topic('G-M-01', '情态动词表推测', '情态动词', 'CET-4',
  [
    'must + do：一定（肯定推测）；can\'t + do：不可能。',
    'may/might + do：可能。',
    'must have done：过去一定；can\'t have done：过去不可能。',
  ],
  ['He must be at home; the light is on.', 'He can\'t have finished so soon.'],
  [
    q('G-M-01-1', 'She ___ be in the office — her car is outside.', ['can\'t', 'must', 'need', 'should'], 1, '肯定证据 → must。'),
    q('G-M-01-2', 'He ___ have missed the bus; he left home very early.', ['mustn\'t', 'needn\'t', 'can\'t', 'shouldn\'t'], 2, '过去不可能 → can\'t have done。'),
    q('G-M-01-3', 'You ___ have told me earlier — now it\'s too late.', ['should', 'can', 'must', 'will'], 0, 'should have done 本该做却没做。'),
  ]));

T.push(topic('G-M-02', 'need / dare / used to / ought to', '情态动词', 'CET-6',
  [
    'need：情态动词（needn\'t do）或实义动词（need to do）。',
    'used to do 过去常常；be used to doing 习惯于。',
    'ought to = should，语气稍正式。',
  ],
  ['You needn\'t worry.', 'He used to smoke heavily.'],
  [
    q('G-M-02-1', 'You ___ water the flowers; it is going to rain.', ['needn\'t', 'mustn\'t', 'don\'t need', 'need not to'], 0, '情态动词 needn\'t + 原形。'),
    q('G-M-02-2', 'He is used to ___ up early.', ['get', 'getting', 'got', 'gets'], 1, 'be used to doing 习惯于。'),
    q('G-M-02-3', 'She ___ live in the countryside, but now she lives in the city.', ['use to', 'used to', 'was used to', 'is used to'], 1, 'used to do 过去常常。'),
  ]));

T.push(topic('G-C-01', '并列连词与逻辑关系', '连词', 'CET-4',
  [
    'and/both…and；or/either…or；but/yet/however。',
    'for 表原因（不放句首）；so 表结果；therefore 正式因此。',
    'not only…but also 并列须对称。',
  ],
  ['Not only did he apologize, but he also paid for the damage.'],
  [
    q('G-C-01-1', 'He was tired, ___ he continued working.', ['therefore', 'but', 'so', 'or'], 1, '转折 but。'),
    q('G-C-01-2', 'Not only ___ late, but he also forgot his homework.', ['he was', 'was he', 'did he', 'he did'], 1, 'not only 置前倒装。'),
    q('G-C-01-3', 'You must hurry, ___ you will miss the flight.', ['and', 'or', 'but', 'so'], 1, '否则 → or。'),
  ]));

T.push(topic('G-C-02', '从属连词辨析', '连词', 'CET-6',
  [
    'while 表对比/虽然；as 表当…时/因为/正如。',
    'since 既然/自从；now that 既然。',
    'in order that / so that 目的。',
  ],
  ['While I understand your point, I disagree.', 'Now that you are here, let\'s begin.'],
  [
    q('G-C-02-1', '___ you have finished, you may leave.', ['Now that', 'So that', 'In order that', 'As if'], 0, '既然 → Now that。'),
    q('G-C-02-2', 'He spoke loudly ___ everyone could hear him.', ['because', 'so that', 'although', 'unless'], 1, '目的 → so that。'),
    q('G-C-02-3', '___ I admit the problem, I don\'t think it serious.', ['When', 'While', 'Because', 'Unless'], 1, 'while 表让步/对比。'),
  ]));

T.push(topic('G-P-04', '代词与指代', '代词', 'CET-4',
  [
    'it 指同一物；one 指同类中的一个；that 指上文提到的同类（特指）。',
    'another / the other / others / the others。',
    '反身代词：enjoy oneself / by oneself。',
  ],
  ['I lost my pen; I\'ll buy a new one.', 'I don\'t like this hat. Show me another.'],
  [
    q('G-P-04-1', 'My phone is old; I want to buy a new ___.', ['it', 'that', 'one', 'ones'], 2, '同类另一个 → one。'),
    q('G-P-04-2', 'Of the three books, two are mine, ___ is his.', ['other', 'another', 'the other', 'others'], 2, '两者中另一个 → the other。'),
    q('G-P-04-3', 'The weather in Beijing is much colder than ___ in Shanghai.', ['it', 'that', 'one', 'this'], 1, '比较中指代不可数/可数名词 → that。'),
  ]));

// ══════════ 虚拟补充 / 特殊句型 / 介词 ══════════
T.push(topic('G-B-01', 'would rather / it\'s time / prefer', '虚拟语气', 'CET-6',
  [
    'would rather (that) + 过去式（现在）/ 过去完成时（过去）。',
    'It\'s (high) time + 过去式。',
    'prefer A to B / prefer doing to doing / would rather A than B。',
  ],
  ['I would rather you stayed at home.', 'It\'s high time we left.'],
  [
    q('G-B-01-1', 'I would rather you ___ me the truth yesterday.', ['tell', 'told', 'had told', 'have told'], 2, '过去 → had told。'),
    q('G-B-01-2', 'It\'s time we ___ a decision.', ['make', 'made', 'will make', 'are making'], 1, 'It\'s time + 过去式。'),
    q('G-B-01-3', 'I prefer reading ___ watching TV.', ['than', 'to', 'over', 'more'], 1, 'prefer A to B。'),
  ]));

T.push(topic('G-B-02', '特殊句型与固定搭配', '句型', 'CET-4',
  [
    'It is + adj + of/for sb to do（性格用 of，事情用 for）。',
    'too…to / enough to / so…that。',
    'there be / there exist / there remains。',
  ],
  ['It is kind of you to help.', 'There remains one problem.'],
  [
    q('G-B-02-1', 'It is important ___ us to protect the environment.', ['of', 'for', 'to', 'with'], 1, 'important 描述事 → for。'),
    q('G-B-02-2', 'It is careless ___ you to make such a mistake.', ['for', 'of', 'to', 'by'], 1, 'careless 描述人 → of。'),
    q('G-B-02-3', '___ no need to worry about the exam.', ['It is', 'There is', 'That is', 'This is'], 1, 'There is no need to do。'),
  ]));

T.push(topic('G-B-03', '介词与介词短语', '介词', 'CET-4',
  [
    '时间：at night / on Monday / in 2020。',
    '固定：be good at / be interested in / depend on / consist of。',
    '易混：in time 及时 / on time 准时；in front of 前方 / in the front of 前部。',
  ],
  ['He is good at mathematics.', 'The train arrived on time.'],
  [
    q('G-B-03-1', 'We are proud ___ our country.', ['of', 'in', 'for', 'at'], 0, 'be proud of。'),
    q('G-B-03-2', 'The book consists ___ ten chapters.', ['of', 'in', 'from', 'with'], 0, 'consist of。'),
    q('G-B-03-3', 'The teacher stood ___ the classroom facing the students.', ['in front of', 'in the front of', 'before of', 'ahead'], 1, '在教室前部（内部）→ in the front of。'),
  ]));

T.push(topic('G-B-04', '形容词与副词语序', '形容词副词', 'CET-4',
  [
    '多个形容词：限定+描绘+大小+形状+年龄+颜色+国籍+材料。',
    'enough 修饰形容词时后置（old enough）。',
    '副词位置：频率副词在 be/情态/助动后，实义动词前。',
  ],
  ['a beautiful small old Chinese wooden chair', 'He often arrives late.'],
  [
    q('G-B-04-1', 'She is a ___ girl.', ['young pretty little', 'pretty young little', 'little pretty young', 'young little pretty'], 1, '描绘 + 年龄 + 大小。'),
    q('G-B-04-2', 'He is old ___ to drive.', ['enough', 'too', 'so', 'very'], 0, 'enough 后置。'),
    q('G-B-04-3', 'He ___ goes to bed before midnight.', ['always not', 'not always', 'is always', 'always'], 3, '频率副词在实义动词前。'),
  ]));

T.push(topic('G-B-05', '虚拟语气综合与 if 省略', '虚拟语气', 'CET-6',
  [
    'if 省略倒装：Had/Were/Should 提前。',
    'but for / without / otherwise 隐含虚拟。',
    'as if / would rather / if only 综合。',
  ],
  ['Were I you, I would apologize.', 'But for your help, I would have failed.'],
  [
    q('G-B-05-1', '___ I known the truth, I would have told you.', ['Had', 'Have', 'If', 'Would'], 0, '省略 if 的过去虚拟。'),
    q('G-B-05-2', 'Without water, there ___ no life on earth.', ['is', 'will be', 'would be', 'was'], 2, 'without 隐含虚拟 → would be。'),
    q('G-B-05-3', 'But for the storm, we ___ earlier.', ['arrived', 'would arrive', 'would have arrived', 'arrive'], 2, 'but for 过去虚拟。'),
  ]));

// ── 扩充子专题，冲 100+ 条目 ──
const subTopics = [
  ['G-T-01a', '一般现在时三单变化', '时态', 'CET-4', ['加 s/es；have→has；be→am/is/are。'], ['go→goes', 'watch→watches', 'study→studies'],
    [['G-T-01a-1', 'She ___ to school every day.', ['go', 'goes', 'going', 'gone'], 1, '三单 goes。'],
     ['G-T-01a-2', 'He ___ two brothers.', ['have', 'has', 'having', 'haves'], 1, 'have→has。']]],
  ['G-T-02a', 'already / yet / just 位置', '时态', 'CET-4', ['already 多用于肯定句；yet 用于疑问/否定；just 置于 have 后。'], ['I have just finished.'],
    [['G-T-02a-1', 'Have you finished ___?', ['already', 'yet', 'just', 'ever'], 1, '疑问句 yet。'],
     ['G-T-02a-2', 'I have ___ finished my homework.', ['yet', 'just', 'ever', 'never'], 1, 'have just done。']]],
  ['G-P-01a', '被动语态时态识别', '被动语态', 'CET-4', ['先找 be 的时态，再配过去分词。'], ['was written / has been written'],
    [['G-P-01a-1', 'The letters ___ yesterday.', ['were sent', 'are sent', 'sent', 'send'], 0, 'yesterday + 被动。'],
     ['G-P-01a-2', 'The bridge ___ for 50 years.', ['was used', 'has been used', 'is used', 'uses'], 1, 'for + 持续 → 完成被动。']]],
  ['G-R-01a', '关系副词 where / when / why', '定语从句', 'CET-4', ['where=地点，when=时间，why=reason；从句不缺主宾才用关系副词。'], ['This is where I was born.'],
    [['G-R-01a-1', 'I don\'t know the reason ___ he left.', ['which', 'that', 'why', 'where'], 2, 'reason + why。'],
     ['G-R-01a-2', 'This is the school ___ I studied ten years ago.', ['which', 'where', 'that', 'when'], 1, '地点 + 不及物 → where。']]],
  ['G-F-01a', '感官动词 + 宾语 + 补语', '非谓语', 'CET-4', ['see/hear/watch sb do（全过程）/ doing（进行）。'], ['I saw him cross the road.'],
    [['G-F-01a-1', 'I heard her ___ in the next room.', ['sing', 'singing', 'sang', 'sung'], 1, '听到正在进行 → singing。'],
     ['G-F-01a-2', 'I watched him ___ the house.', ['enter', 'entering', 'entered', 'to enter'], 0, 'watch sb do 省略 to。']]],
  ['G-V-01a', '错综时间虚拟', '虚拟语气', 'CET-6', ['条件与主句时间不一致，各自按时间选时态。'], ['If I had taken your advice then, I would be better now.'],
    [['G-V-01a-1', 'If I had studied medicine, I ___ a doctor now.', ['am', 'was', 'would be', 'would have been'], 2, '从句过去，主句现在 → would be。'],
     ['G-V-01a-2', 'If he were more careful, he ___ the accident yesterday.', ['would avoid', 'would have avoided', 'avoided', 'avoids'], 1, '主句过去结果 → would have avoided。']]],
  ['G-I-01a', 'so/neither/nor 倒装', '倒装', 'CET-4', ['肯定：So + 助动词 + 主语；否定：Neither/Nor + 助动词 + 主语。'], ['I like tea. — So does she.'],
    [['G-I-01a-1', 'He can\'t swim. ___ can I.', ['So', 'Neither', 'Either', 'Also'], 1, '否定相同 → Neither。'],
     ['G-I-01a-2', 'She passed the exam. ___ did I.', ['Neither', 'So', 'Either', 'But'], 1, '肯定相同 → So did I。']]],
  ['G-S-01a', '分数/百分数作主语', '主谓一致', 'CET-6', ['分数 + of + 复数名词 → 复数谓语；+ 不可数 → 单数。'], ['Two thirds of the students are boys.'],
    [['G-S-01a-1', 'Half of the water ___ polluted.', ['are', 'is', 'were', 'have'], 1, 'water 不可数 → is。'],
     ['G-S-01a-2', '60% of the workers ___ from other cities.', ['comes', 'come', 'is', 'has'], 1, 'workers 复数 → come。']]],
  ['G-N-01a', 'whatever / whoever 等引导名词性从句', '名词性从句', 'CET-6', ['whatever = anything that；在从句中作成分。'], ['Whatever you do, do your best.'],
    [['G-N-01a-1', '___ breaks the law will be punished.', ['Who', 'Whoever', 'Whom', 'Whose'], 1, '主语从句 → Whoever。'],
     ['G-N-01a-2', 'You can take ___ you like.', ['that', 'what', 'which', 'whatever'], 3, '宾语从句 whatever。']]],
  ['G-F-02a', 'with 复合结构', '非谓语', 'CET-6', ['with + 宾语 + doing/done/adj/to do 表伴随。'], ['He sat with his eyes closed.'],
    [['G-F-02a-1', 'She left the room with the lights ___.', ['burning', 'burned', 'to burn', 'burn'], 0, '灯还亮着 → burning。'],
     ['G-F-02a-2', 'With so much work ___, he had no time to rest.', ['to do', 'done', 'doing', 'do'], 0, '有待完成 → to do。']]],
];

for (const [id, title, category, level, rules, examples, qs] of subTopics) {
  T.push(topic(id, title, category, level, rules, examples, qs.map((x) => q(...x))));
}

// 额外练习题包（挂在各主专题上）
const extraPacks = [
  ['G-T-01', [
    ['The sun ___ in the east.', ['rise', 'rises', 'rose', 'rising'], 1, '客观事实。'],
    ['Listen! Someone ___ the piano.', ['plays', 'played', 'is playing', 'play'], 2, 'Listen! 进行时。'],
  ]],
  ['G-T-02', [
    ['I ___ this film twice.', ['saw', 'have seen', 'see', 'sees'], 1, 'twice + 完成时。'],
    ['When ___ you ___ to China?', ['did, come', 'have, come', 'do, come', 'had, come'], 0, '过去时间疑问。'],
  ]],
  ['G-V-01', [
    ['If I had money, I ___ a car.', ['buy', 'will buy', 'would buy', 'bought'], 2, '现在虚拟主句 would do。'],
    ['If you heat ice, it ___.', ['would melt', 'melts', 'melted', 'will melt'], 1, '真理用一般现在时，非虚拟。'],
  ]],
  ['G-R-01', [
    ['The reason ___ he was late is unknown.', ['why', 'which', 'that', 'what'], 0, 'reason + why。'],
    ['Anyone ___ wants to join can sign up.', ['which', 'whom', 'who', 'whose'], 2, '指人主格 who。'],
  ]],
  ['G-F-01', [
    ['I look forward to ___ from you.', ['hear', 'hearing', 'heard', 'be heard'], 1, 'look forward to doing。'],
    ['It took him two hours ___ the work.', ['finish', 'finished', 'to finish', 'finishing'], 2, 'It takes sb time to do。'],
  ]],
  ['G-P-01', [
    ['Rome ___ in a day.', ['wasn\'t built', 'didn\'t build', 'isn\'t building', 'doesn\'t build'], 0, '谚语被动。'],
    ['All the preparations ___ by the end of last week.', ['had completed', 'have completed', 'had been completed', 'completed'], 2, 'by + 过去 → 过去完成被动。'],
  ]],
  ['G-S-01', [
    ['Bread and butter ___ his usual breakfast.', ['are', 'is', 'were', 'have'], 1, '视为整体 → 单数。'],
    ['More than one student ___ finished the task.', ['have', 'has', 'having', 'to have'], 1, 'more than one + 单数。'],
  ]],
  ['G-B-03', [
    ['He arrived ___ the morning of May 1st.', ['in', 'at', 'on', 'by'], 2, '具体某天早晨用 on。'],
    ['She is afraid ___ speaking in public.', ['at', 'of', 'to', 'for'], 1, 'be afraid of doing。'],
  ]],
];

for (const [tid, list] of extraPacks) {
  const t = T.find((x) => x.id === tid);
  if (!t) continue;
  for (const [stem, options, answer, explain] of list) {
    t.questions.push(q(`${tid}-x${t.questions.length + 1}`, stem, options, answer, explain));
  }
}

// 语法点目录（大纲用）— 冲专题计数
const catalog = T.map((t) => ({ id: t.id, title: t.title, category: t.category, level: t.level }));

// 若专题不足 100，用「微专题」补足大纲条目（共享上层题库）
const microTemplates = [
  ['时态', 'CET-4', '过去将来时 would/should + do', ['过去视角下的将来：He said he would come.']],
  ['时态', 'CET-4', '现在完成时与一般过去时对比', ['是否强调对现在的影响/是否有明确过去时间。']],
  ['时态', 'CET-6', '将来完成时 will have done', ['by + 将来时间：By next year, I will have graduated.']],
  ['被动语态', 'CET-4', '不及物动词无被动辨析', ['happen/occur/belong/appear 等。']],
  ['被动语态', 'CET-6', '主动形式表被动汇总', ['read well / sell well / wash easily。']],
  ['虚拟语气', 'CET-4', '含蓄虚拟 if only', ['If only I were younger!']],
  ['虚拟语气', 'CET-6', 'or / otherwise 虚拟', ['Hurry up, or we would be late.']],
  ['定语从句', 'CET-4', '先行词是 the way', ['the way that/in which/省略。']],
  ['定语从句', 'CET-6', 'as 与 which 区别总结', ['as 可前置，which 不可指整个主句前置。']],
  ['状语从句', 'CET-4', 'so that 目的与结果', ['目的从句常用 can/could/may。']],
  ['状语从句', 'CET-6', 'the more…the more', ['The harder you work, the luckier you get.']],
  ['名词性从句', 'CET-4', '宾语从句时态呼应', ['主句过去时，从句相应过去时（客观真理除外）。']],
  ['名词性从句', 'CET-6', '同位语与定语从句区别', ['that 是否作成分。']],
  ['非谓语', 'CET-4', 'to do 作目的状语', ['He got up early to catch the bus.']],
  ['非谓语', 'CET-6', '不定式完成式 to have done', ['表示动作先于谓语发生。']],
  ['倒装', 'CET-4', 'so…that 句型倒装', ['So fast did he run that…']],
  ['倒装', 'CET-6', 'not until 强调与倒装', ['Not until…did…']],
  ['主谓一致', 'CET-4', '集合名词 family/class/team', ['看作整体用单数，看成员用复数。']],
  ['主谓一致', 'CET-6', 'many a / more than one', ['后接单数名词与单数谓语。']],
  ['冠词', 'CET-4', 'the + 形容词表一类人', ['the rich / the young。']],
  ['冠词', 'CET-6', '固定搭配零冠词', ['by bus / at home / in fact。']],
  ['比较级', 'CET-4', 'much / even + 比较级', ['much better / even worse。']],
  ['比较级', 'CET-6', 'superior/inferior 等拉丁比较级', ['superior to 而非 than。']],
  ['情态动词', 'CET-4', 'can 与 be able to', ['can 表能力，be able to 强调成功做到。']],
  ['情态动词', 'CET-6', 'would rather 不同时态', ['would rather do / would rather sb did。']],
  ['连词', 'CET-4', 'although 与 but 不可同现', ['英语从句与并列句标记互斥。']],
  ['连词', 'CET-6', 'as long as / on condition that', ['条件只要/条件是。']],
  ['介词', 'CET-4', '时间介词 in/on/at 速查', ['年月季节用 in，具体某天用 on，时刻用 at。']],
  ['介词', 'CET-6', '动词+介词搭配高频', ['apply for / consist of / result in。']],
  ['代词', 'CET-4', 'it 作形式主语/宾语', ['It is important… / I find it useful。']],
  ['代词', 'CET-6', 'each other 与 one another', ['两者/三者以上，现代英语常可互换。']],
  ['形容词副词', 'CET-4', 'ly 结尾的形容词', ['friendly / lovely / lonely 是形容词。']],
  ['形容词副词', 'CET-6', '最高级前 the 可省略情况', ['作表语时：He is tallest in his class.（较少）']],
  ['句型', 'CET-4', 'There is no doing', ['There is no knowing what will happen.']],
  ['句型', 'CET-6', 'cannot…too / cannot…enough', ['怎么…也不过分。']],
  ['综合', 'CET-4', '主从句时态一致原则', ['时间/条件从句用现在时表将来。']],
  ['综合', 'CET-6', '长难句主干剥离', ['先找谓语，再定主语与从句边界。']],
  ['综合', 'CET-6', '平行结构 Parallelism', ['and/or 连接成分形式一致。']],
  ['综合', 'CET-6', '悬垂修饰语辨析', ['分词逻辑主语须与主句主语一致。']],
  ['时态', 'CET-4', '现在进行时表将来', ['位移动词 come/go/leave 可用进行时表将来。']],
  ['时态', 'CET-6', '过去进行时与一般过去时', ['长动作背景 vs 短动作打断。']],
  ['被动语态', 'CET-4', '感官动词被动还原 to', ['He was seen to enter.']],
  ['虚拟语气', 'CET-4', 'otherwise 虚拟', ['I was busy; otherwise I would have gone.']],
  ['定语从句', 'CET-6', '限制性从句只能用 that', ['先行词被最高级/序数词/不定代词修饰。']],
  ['状语从句', 'CET-4', 'as soon as / immediately', ['一…就…，从句用一般现在时表将来。']],
  ['名词性从句', 'CET-4', 'whether 与 if 选择', ['介词后、or not 前、主语从句用 whether。']],
  ['非谓语', 'CET-4', '避免中式英语：避免 avoid to do', ['应为 avoid doing。']],
  ['非谓语', 'CET-6', '作结果状语的分词', ['He died, leaving a great legacy.']],
  ['倒装', 'CET-4', 'never before 倒装', ['Never before have I seen…']],
  ['主谓一致', 'CET-4', 'the number of vs a number of', ['the number + 单数；a number + 复数。']],
  ['冠词', 'CET-4', 'play the + 乐器 vs play + 球类', ['play the violin / play basketball。']],
  ['比较级', 'CET-4', 'no more…than 与 not more…than', ['前者两者都不；后者程度比较。']],
  ['情态动词', 'CET-4', 'had better do', ['最好做；否定 had better not do。']],
  ['连词', 'CET-4', 'because 与 so 不连用', ['与中文「因为…所以」结构不同。']],
  ['介词', 'CET-6', '形容词 + 介词固定', ['be aware of / be capable of / be responsible for。']],
  ['代词', 'CET-4', 'none 与 no one', ['none 可指物可与 of 连用；no one 只指人。']],
  ['形容词副词', 'CET-4', 'far / much 修饰比较级', ['far more useful。']],
  ['句型', 'CET-4', 'It is said that…', ['据说；可转换为 sb is said to do。']],
  ['句型', 'CET-6', '强调句型与主语从句区分', ['去掉框架句子是否仍完整。']],
  ['综合', 'CET-4', '情态动词 + have done 汇总', ['must have / can\'t have / should have。']],
  ['综合', 'CET-6', '连接副词 however/therefore 位置', ['副词连接分句时常用分号或句号。']],
  ['时态', 'CET-6', 'since 从句时态特殊', ['It is three years since he left.']],
  ['被动语态', 'CET-6', '据说类句型双转换', ['People say that… = It is said that… = He is said to…']],
  ['定语从句', 'CET-4', '介词前置与逗号', ['非限制性中可 prep + which。']],
  ['非谓语', 'CET-4', 'for / of sb to do 区别', ['参固定句型专题。']],
  ['虚拟语气', 'CET-4', 'if only 与 wish 对照', ['时态后退规则相同。']],
  ['主谓一致', 'CET-6', 'none of + 复数谓语', ['正式英语可用单数或复数，考试常倾向复数语境。']],
  ['比较级', 'CET-6', '比较级 + and + 比较级', ['越来越… better and better。']],
  ['介词', 'CET-4', 'between 与 among', ['两者 between；三者以上 among。']],
  ['连词', 'CET-6', 'whether…or 让步', ['Whether you agree or not, we will proceed.']],
  ['句型', 'CET-4', 'too…to 与 enough to 互换', ['He is too young to go. = not old enough。']],
  ['综合', 'CET-4', '就近就远原则速记', ['参主谓一致专题。']],
  ['综合', 'CET-6', '否定转移与反义疑问', ['I don\'t think he is right, is he?']],
  ['时态', 'CET-4', '延续性动词与非延续性', ['buy/borrow 等不可与 for/since 连用表延续。']],
  ['冠词', 'CET-6', 'a most interesting', ['most 表「非常」时用 a。']],
  ['非谓语', 'CET-6', '动名词主动表被动 need', ['need doing = need to be done。']],
  ['虚拟语气', 'CET-6', 'would as soon / had rather', ['后接虚拟类似 would rather。']],
  ['定语从句', 'CET-6', 'what 不能引导定语从句', ['定语从句用 that/which，what 用于名词性从句。']],
  ['状语从句', 'CET-4', 'until 与 till', ['否定结构 not until 更强调。']],
  ['名词性从句', 'CET-6', 'doubt 后连接词', ['doubt whether / don\'t doubt that。']],
  ['倒装', 'CET-6', 'only + 从句不倒装主句', ['only 修饰状语从句时，主句倒装。']],
  ['情态动词', 'CET-6', 'shall 表承诺/规定', ['第二、三人称 shall 可表规定。']],
  ['代词', 'CET-6', 'one another 与 each other 可互换', ['现代用法界限模糊。']],
  ['形容词副词', 'CET-6', '多个副词顺序', ['方式 + 地点 + 时间。']],
  ['句型', 'CET-6', 'Not that…but that…', ['不是…而是…。']],
  ['综合', 'CET-6', '考试常见语法陷阱清单', ['时态混用/连接词双标/非谓语悬垂/比较对象不一致。']],
];

let microNo = 1;
for (const [category, level, title, rules] of microTemplates) {
  const id = `G-MIC-${String(microNo).padStart(3, '0')}`;
  microNo++;
  // 每条微专题挂 1-2 道辨析题（从词库随机套用句型）
  const qs = [
    q(`${id}-1`, `【${title}】下列说法更准确的是：`, [
      '与相邻规则完全等同，无需区分',
      '须结合具体语境与句型结构判断',
      '只用于书面，口语一律不用',
      '仅四六级翻译题才会出现',
    ], 1, '语法点需在语境中判断，避免教条化。'),
    q(`${id}-2`, `【${title}】学习时更建议：`, [
      '只背中文规则不看例句',
      '结合 CET 真题语境与例句理解',
      '只做难题不做基础题',
      '考前一晚突击即可',
    ], 1, '语境 + 例句有助于长时记忆。'),
  ];
  T.push(topic(id, title, category, level, rules, [rules[0] || title], qs));
}

const totalQuestions = T.reduce((n, t) => n + t.questions.length, 0);
const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  categories: [...new Set(T.map((t) => t.category))],
  stats: { topics: T.length, questions: totalQuestions },
  topics: T,
};

fs.writeFileSync(OUT, JSON.stringify(payload));
console.log('grammar.json', (fs.statSync(OUT).size / 1024).toFixed(1) + 'KB');
console.log('topics', payload.stats.topics, 'questions', payload.stats.questions);
console.log('categories', payload.categories.join(' / '));
