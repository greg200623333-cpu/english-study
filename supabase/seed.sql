-- 四六级题目示例
insert into questions (category, type, content, options, answer, explanation) values
('cet4', 'grammar', 'She _____ in Beijing for ten years before she moved to Shanghai.', '["A. lived", "B. has lived", "C. had lived", "D. was living"]', 'C', '表示在过去某时间点之前已持续的动作，用过去完成时 had lived。'),
('cet4', 'grammar', 'It is essential that every student _____ the rules.', '["A. follows", "B. follow", "C. followed", "D. has followed"]', 'B', 'essential that 后接虚拟语气，动词用原形 follow。'),
('cet4', 'reading', 'Which of the following best describes the author''s attitude toward technology?', '["A. Optimistic", "B. Pessimistic", "C. Neutral", "D. Indifferent"]', 'A', '根据文章作者多次强调技术带来的进步，态度为乐观。'),
('cet4', 'cloze', 'The government has taken measures to _____ pollution in major cities.', '["A. reduce", "B. increase", "C. ignore", "D. celebrate"]', 'A', 'reduce pollution 减少污染，为固定搭配。'),
('cet4', 'grammar', '_____ the heavy rain, the football match was cancelled.', '["A. Despite", "B. Because of", "C. Although", "D. However"]', 'B', 'Because of 后接名词短语，表示原因；despite 后也接名词但表让步，语义不符。'),

('cet6', 'grammar', 'The report, together with several proposals, _____ to the committee yesterday.', '["A. was submitted", "B. were submitted", "C. has submitted", "D. have submitted"]', 'A', '主语是 The report（单数），together with 不影响主谓一致，用 was submitted。'),
('cet6', 'reading', 'The word "elusive" in paragraph 3 is closest in meaning to _____.', '["A. difficult to find", "B. easy to understand", "C. widely known", "D. frequently used"]', 'A', 'elusive 意为难以捉摸的、难以找到的。'),
('cet6', 'grammar', 'Not until he retired _____ how important family was.', '["A. he realized", "B. did he realize", "C. he did realize", "D. realized he"]', 'B', 'Not until 置于句首时，主句需部分倒装，用 did he realize。'),
('cet6', 'cloze', 'In _____ to the growing demand, the company expanded its production line.', '["A. response", "B. regard", "C. addition", "D. contrast"]', 'A', 'in response to 意为对……作出回应，为固定搭配。'),
('cet6', 'grammar', 'The findings suggest that exercise _____ a significant role in mental health.', '["A. plays", "B. play", "C. played", "D. is playing"]', 'A', '陈述客观规律或研究结论用一般现在时，主语 exercise 为单数。'),

('kaoyan', 'grammar', 'The phenomenon _____ scientists have been puzzling over for decades remains unexplained.', '["A. which", "B. that", "C. over which", "D. about which"]', 'C', 'puzzle over sth. 是固定搭配，关系代词提前需带介词 over which。'),
('kaoyan', 'reading', 'The author''s primary purpose in writing this passage is to _____.', '["A. argue for a new theory", "B. describe a historical event", "C. analyze a social phenomenon", "D. criticize government policies"]', 'C', '根据文章结构和论述重点，作者旨在分析一种社会现象。'),
('kaoyan', 'cloze', 'The committee reached a _____ after hours of heated debate.', '["A. consensus", "B. conflict", "C. confusion", "D. compromise"]', 'A', 'reach a consensus 达成共识，为固定搭配。'),
('kaoyan', 'grammar', '_____ the project on time would require additional funding and staff.', '["A. Complete", "B. Completing", "C. To completing", "D. Having completed"]', 'B', '动名词 Completing 作主语，表示完成项目这件事。'),
('kaoyan', 'reading', 'It can be inferred from the passage that the author believes education should _____.', '["A. focus solely on academic knowledge", "B. cultivate critical thinking skills", "C. prioritize vocational training", "D. eliminate standardized testing"]', 'B', '根据文章多处强调批判性思维，可推断作者观点。');

-- 单词种子数据
insert into words (word, phonetic, meaning, example, category) values
('abandon', '/əˈbændən/', 'v. 放弃；抛弃', 'They had to abandon the project due to lack of funds.', 'cet4'),
('abundant', '/əˈbʌndənt/', 'adj. 丰富的；充裕的', 'The region has abundant natural resources.', 'cet4'),
('accelerate', '/əkˈseləreɪt/', 'v. 加速；促进', 'Technology has accelerated the pace of change.', 'cet4'),
('acknowledge', '/əkˈnɒlɪdʒ/', 'v. 承认；致谢', 'She acknowledged that she had made a mistake.', 'cet4'),
('acquire', '/əˈkwaɪər/', 'v. 获得；学到', 'It takes time to acquire a new language.', 'cet4'),
('adapt', '/əˈdæpt/', 'v. 适应；改编', 'Animals can adapt to different environments.', 'cet4'),
('adequate', '/ˈædɪkwət/', 'adj. 足够的；适当的', 'Make sure you get adequate sleep every night.', 'cet4'),
('advocate', '/ˈædvəkeɪt/', 'v./n. 提倡；拥护者', 'She advocates for equal rights in education.', 'cet4'),
('ambiguous', '/æmˈbɪɡjuəs/', 'adj. 模糊的；不明确的', 'The instructions were ambiguous and confusing.', 'cet6'),
('anticipate', '/ænˈtɪsɪpeɪt/', 'v. 预期；期待', 'We anticipate strong growth in the coming year.', 'cet6'),
('articulate', '/ɑːˈtɪkjuleɪt/', 'v./adj. 清楚表达；口齿清晰的', 'She articulated her ideas very clearly.', 'cet6'),
('assert', '/əˈsɜːt/', 'v. 声称；坚持', 'He asserted his innocence throughout the trial.', 'cet6'),
('assess', '/əˈses/', 'v. 评估；评价', 'We need to assess the risks before proceeding.', 'cet6'),
('inevitable', '/ɪnˈevɪtəbl/', 'adj. 不可避免的', 'Change is inevitable in any organization.', 'cet6'),
('elaborate', '/ɪˈlæbərət/', 'v./adj. 详细说明；精心的', 'Could you elaborate on your proposal?', 'kaoyan'),
('eminent', '/ˈemɪnənt/', 'adj. 杰出的；著名的', 'An eminent scholar delivered the keynote speech.', 'kaoyan'),
('empirical', '/ɪmˈpɪrɪkl/', 'adj. 实证的；经验主义的', 'The study is based on empirical evidence.', 'kaoyan'),
('encompass', '/ɪnˈkʌmpəs/', 'v. 包含；涵盖', 'The curriculum encompasses a wide range of subjects.', 'kaoyan'),
('enhance', '/ɪnˈhɑːns/', 'v. 提高；增强', 'Regular exercise enhances both physical and mental health.', 'kaoyan'),
('ethical', '/ˈeθɪkl/', 'adj. 道德的；伦理的', 'Researchers must follow strict ethical guidelines.', 'kaoyan');
