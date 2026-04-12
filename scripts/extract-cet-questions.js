const fs = require('fs');
const path = require('path');

function extractText(obj) {
  const texts = [];
  if (typeof obj === 'object' && obj !== null) {
    if ('content' in obj) texts.push(obj.content);
    for (const v of Object.values(obj)) texts.push(...extractText(v));
  } else if (Array.isArray(obj)) {
    for (const item of obj) texts.push(...extractText(item));
  }
  return texts;
}

function extractAnswers(answerTexts) {
  const answers = [];
  for (let i = 0; i < answerTexts.length; i++) {
    const text = answerTexts[i];
    if (!text) continue;
    const match = text.match(/【解析】([A-D])[）)]/);
    if (match) {
      answers.push({
        answer: match[1],
        explanation: text
      });
    }
  }
  return answers;
}

function processFile(questionFile, answerFile, outputFile, examName) {
  console.log(`\n处理 ${examName}...`);

  const qData = JSON.parse(fs.readFileSync(questionFile, 'utf8'));
  const aData = JSON.parse(fs.readFileSync(answerFile, 'utf8'));

  const qTexts = extractText(qData);
  const aTexts = extractText(aData);

  const answers = extractAnswers(aTexts);
  console.log(`提取到 ${answers.length} 个答案`);

  const allQuestions = [];
  let currentPart = null;
  let currentSection = null;
  let currentContext = null;
  let currentSet = 1; // 当前是第几套题
  let currentPassage = null; // 当前阅读文章
  let passageQuestionRange = null; // 文章对应的题号范围

  for (let i = 0; i < qTexts.length; i++) {
    const text = qTexts[i];
    if (!text) continue;

    // 识别套数 - 忽略前120行的目录标题，只识别后面出现的套数标记
    // 这些标记通常出现在实际题目内容附近
    const setMatch1 = text.match(/^20\d{2}年.*真题[（(]第([1-3])套[）)]/);
    const setMatch2 = text.match(/^20\d{2}年.*真题[（(]([一二三])[）)]/);

    if ((setMatch1 || setMatch2) && i >= 120) {
      let newSet;
      if (setMatch1) {
        newSet = parseInt(setMatch1[1]);
      } else if (setMatch2) {
        const cnNum = { '一': 1, '二': 2, '三': 3 };
        newSet = cnNum[setMatch2[1]];
      }

      if (newSet !== currentSet) {
        currentSet = newSet;
        currentPart = null;
        currentSection = null;
        currentPassage = null;
        passageQuestionRange = null;
      }
      continue;
    }

    // 识别 Part
    if (text.match(/^Part (I|II|III|IV)$/)) {
      currentPart = text;
      currentPassage = null;
      passageQuestionRange = null;
      continue;
    }

    // 识别 Section
    if (text.match(/^Section [A-D]$/)) {
      currentSection = text;
      currentPassage = null;
      passageQuestionRange = null;
      continue;
    }

    // 识别上下文 / 文章标题 "Questions 46 to 50 are based on the following passage."
    if (text.match(/^Questions? \d+/)) {
      currentContext = text;

      // 如果是 "based on the following passage"，开始收集文章段落
      if (text.includes('following passage') || text.includes('following article')) {
        const rangeMatch = text.match(/Questions?\s+(\d+)(?:\s+(?:to|and)\s+(\d+))?/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : start;
          passageQuestionRange = { start, end };
        }
        // Collect passage paragraphs: skip duplicate lines (each line appears twice),
        // stop when we hit a question line like "46. What..."
        const paragraphs = [];
        const seen = new Set();
        for (let j = i + 1; j < Math.min(i + 200, qTexts.length); j++) {
          const line = qTexts[j];
          if (!line || !line.trim()) continue;
          // Stop at question lines (must be question number in expected range)
          const qNumMatch = line.match(/^\s*(\d+)\.\s+(What|How|Why|Which|Who|Where|When|According)/);
          if (qNumMatch) {
            const qNum = parseInt(qNumMatch[1]);
            if (qNum >= 1 && qNum <= 100) break; // Valid question number
          }
          // Stop at section/part markers
          if (line.match(/^(Part|Section)\s/) || line.match(/^Questions?\s+\d+.*based on/)) break;
          // Skip short noise lines (type labels, page numbers, etc.)
          if (line.length < 30) continue;
          // Skip duplicates (PDF parser emits each line twice)
          if (seen.has(line)) continue;
          seen.add(line);
          paragraphs.push(line.trim());
        }
        currentPassage = paragraphs.length > 0 ? paragraphs.join('\n\n') : null;
      } else {
        // For listening "Questions X and Y are based on the news report..."
        // don't reset passage
      }
      continue;
    }

    // 识别选择题格式1: "1. A) ..." (听力题)
    const qMatch1 = text.match(/^\s*(\d+)\.\s*A\)\s*(.+)/);
    if (qMatch1) {
      const num = parseInt(qMatch1[1]);
      const optA = 'A) ' + qMatch1[2].trim();

      // 收集后续选项
      const optMap = { A: optA };
      for (let j = i + 1; j < Math.min(i + 10, qTexts.length); j++) {
        const next = qTexts[j];
        if (!next) continue;

        const optMatch = next.match(/^([B-D])\)\s*(.+)/);
        if (optMatch) {
          optMap[optMatch[1]] = optMatch[1] + ') ' + optMatch[2].trim();
        } else if (next.match(/^\s*\d+\.\s*A\)/)) {
          break;
        }
      }

      if (optMap.A && optMap.B && optMap.C && optMap.D) {
        let questionText = currentContext;
        for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
          if (qTexts[k] && qTexts[k].includes('?')) {
            questionText = qTexts[k];
            break;
          }
        }

        allQuestions.push({
          set: currentSet,
          number: num,
          part: currentPart,
          section: currentSection,
          context: currentContext,
          question: questionText || currentContext || `第 ${num} 题`,
          options: [optMap.A, optMap.B, optMap.C, optMap.D],
          type: currentPart === 'Part II' ? 'listening' : 'reading',
          passage: currentPassage
        });
      }
    }

    // 识别选择题格式2: "46. What...?" (阅读题，题号和题干在同一行)
    const qMatch2 = text.match(/^\s*(\d+)\.\s+([A-Z].{10,}\?)/);
    if (qMatch2) {
      const num = parseInt(qMatch2[1]);
      const questionText = qMatch2[2].trim();

      // 收集后续选项 A), B), C), D)
      const optMap = {};
      for (let j = i + 1; j < Math.min(i + 15, qTexts.length); j++) {
        const next = qTexts[j];
        if (!next) continue;

        const optMatch = next.match(/^([A-D])\)\s*(.+)/);
        if (optMatch) {
          optMap[optMatch[1]] = optMatch[1] + ') ' + optMatch[2].trim();
        } else if (next.match(/^\s*\d+\.\s+[A-Z]/)) {
          break;
        }
      }

      if (optMap.A && optMap.B && optMap.C && optMap.D) {
        allQuestions.push({
          set: currentSet,
          number: num,
          part: currentPart,
          section: currentSection,
          context: currentContext,
          question: questionText,
          options: [optMap.A, optMap.B, optMap.C, optMap.D],
          type: 'reading',
          passage: currentPassage
        });
      }
    }

    // 识别段落匹配题 (36-45)
    const paraMatch = text.match(/^(\d+)\.\s+([A-Z].{20,})/);
    if (paraMatch) {
      const num = parseInt(paraMatch[1]);
      if (num >= 36 && num <= 45) {
        allQuestions.push({
          set: currentSet,
          number: num,
          part: currentPart,
          section: currentSection,
          context: '段落匹配',
          question: paraMatch[2].trim(),
          options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(l => `段落 ${l}`),
          type: 'paragraph_match',
          passage: currentPassage
        });
      }
    }

    // 识别篇章词汇题 (Part III Section A)
    // 格式: "Scientists have known that depriving adult mice of vision can increase..."
    // 后面跟着词库 "A) adaptable I) readily B) closed ..."
    if (currentPart === 'Part III' && currentSection === 'Section A') {
      // 检测是否是篇章词汇的文章段落（包含数字26-35作为空格标记）
      if (text.match(/\b(26|27|28|29|30|31|32|33|34|35)\b/) && text.length > 100) {
        // 向前查找文章开头（从当前位置往前找）
        const passageParts = [];
        let startIdx = i;
        for (let k = i - 1; k >= Math.max(0, i - 30); k--) {
          const line = qTexts[k];
          if (!line || !line.trim()) continue;
          // 停止条件：遇到Directions或Section标记
          if (line.includes('Directions:') || line.match(/^Section A$/)) break;
          // 如果是长句子，可能是文章开头
          if (line.length > 50 && !line.match(/\b(26|27|28|29|30|31|32|33|34|35)\b/)) {
            passageParts.unshift(line.trim());
            startIdx = k;
          }
        }

        // 收集当前行及后续段落
        passageParts.push(text);
        for (let j = i + 1; j < Math.min(i + 50, qTexts.length); j++) {
          const line = qTexts[j];
          if (!line || !line.trim()) continue;
          // 停止条件：遇到词库选项 "A) adaptable"
          if (line.match(/^[A-O]\)\s+\w+$/)) break;
          // 停止条件：遇到下一个Section
          if (line.match(/^Section [A-D]$/)) break;
          if (line.length > 20) {
            passageParts.push(line.trim());
          }
        }

        // 收集词库选项
        const wordBank = [];
        for (let j = i + 1; j < Math.min(i + 100, qTexts.length); j++) {
          const line = qTexts[j];
          if (!line) continue;
          const wordMatch = line.match(/^([A-O])\)\s+(\w+)/);
          if (wordMatch) {
            wordBank.push({ letter: wordMatch[1], word: wordMatch[2] });
          }
          // 停止条件：遇到Section B
          if (line.match(/^Section B$/)) break;
        }

        if (wordBank.length >= 10) {
          allQuestions.push({
            set: currentSet,
            number: 26, // 篇章词汇作为一个整体题目
            part: currentPart,
            section: currentSection,
            context: '篇章词汇理解',
            question: passageParts.join('\n\n'),
            options: wordBank.map(w => `${w.letter}) ${w.word}`),
            type: 'cloze',
            passage: null,
            wordBank: wordBank
          });
        }
      }
    }

    // 识别翻译题 (Part IV Translation)
    if (currentPart === 'Part IV' && text.includes('Translation')) {
      // 收集翻译段落（中文）
      const translationParts = [];
      for (let j = i + 1; j < Math.min(i + 50, qTexts.length); j++) {
        const line = qTexts[j];
        if (!line || !line.trim()) continue;
        // 停止条件：遇到下一套题的标记
        if (line.match(/^20\d{2}年.*真题/)) break;
        if (line.match(/^Part [I-V]/)) break;
        // 跳过Directions
        if (line.includes('Directions:') || line.includes('minutes')) continue;
        // 收集中文段落
        if (line.match(/[\u4e00-\u9fa5]/)) {
          translationParts.push(line.trim());
        }
      }

      if (translationParts.length > 0) {
        allQuestions.push({
          set: currentSet,
          number: 1, // 翻译题作为一个整体
          part: currentPart,
          section: null,
          context: '段落翻译',
          question: translationParts.join(''),
          options: [],
          type: 'translation',
          passage: null
        });
      }
    }
  }

  console.log(`提取到 ${allQuestions.length} 道题目`);

  // 按套数分组
  const sets = {};
  allQuestions.forEach(q => {
    if (!sets[q.set]) sets[q.set] = [];
    sets[q.set].push(q);
  });

  console.log(`共 ${Object.keys(sets).length} 套题:`, Object.keys(sets).map(k => `第${k}套(${sets[k].length}题)`).join(', '));

  // 为每套题匹配答案并输出
  Object.keys(sets).forEach(setNum => {
    const questions = sets[setNum];

    // 匹配答案（按顺序）
    const startIdx = (parseInt(setNum) - 1) * questions.length;
    questions.forEach((q, idx) => {
      const ansIdx = startIdx + idx;
      if (answers[ansIdx]) {
        q.correctAnswer = answers[ansIdx].answer;
        q.explanation = answers[ansIdx].explanation;
      }
    });

    // 输出文件
    const fileName = outputFile.replace('.json', `-set${setNum}.json`);
    const outputPath = path.resolve(__dirname, '..', fileName);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');

    const withAnswer = questions.filter(q => q.correctAnswer).length;
    console.log(`✅ 第${setNum}套: ${outputPath}`);
    console.log(`   共 ${questions.length} 道题目，其中 ${withAnswer} 道有答案`);
  });
}

// 处理 CET-4
processFile(
  'C:/Users/greg2/OneDrive/Desktop/new/layout.json',
  'C:/Users/greg2/OneDrive/Desktop/new/answer/layout.json',
  'public/data/cet4-2024-12.json',
  'CET-4 2024年12月'
);

// 处理 CET-6
processFile(
  'C:/Users/greg2/OneDrive/Desktop/new/layout1.json',
  'C:/Users/greg2/OneDrive/Desktop/new/answer/layout1.json',
  'public/data/cet6-2024-12.json',
  'CET-6 2024年12月'
);

console.log('\n✅ 全部完成！');
