const fs = require('fs');
const path = require('path');

// Load layout.json
const layoutPath = path.join('C:', 'Users', 'greg2', 'OneDrive', 'Desktop', 'new', 'answer', 'layout.json');
const layoutData = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

// Extract all text content from layout (all block types)
function extractTextsFromLayout(layoutData) {
  const texts = [];

  for (const page of layoutData.pdf_info || []) {
    for (const block of page.para_blocks || []) {
      // Extract from all block types, not just 'text'
      for (const line of block.lines || []) {
        // Merge all spans in the same line
        const lineText = line.spans
          .map(span => (span.content || '').trim())
          .filter(c => c)
          .join(' ');
        if (lineText) {
          texts.push(lineText);
        }
      }
    }
  }

  return texts;
}

// Extract listening passages
function extractListeningPassages(texts) {
  const passages = {
    set1: { news: [], conversation: [], passage: [] },
    set2: { news: [], conversation: [], passage: [] },
    set3: { news: [], conversation: [], passage: [] }
  };

  let currentSet = null;
  let currentSection = null;
  let currentPassage = [];

  const newsMarkers = ['News Report One', 'News Report Two', 'News Report Three'];
  const convMarkers = ['Conversation One', 'Conversation Two'];
  const passMarkers = ['Passage One', 'Passage Two', 'Passage Three'];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    // Detect set boundaries
    if (text.includes('2024年12月大学英语四级考试真题') && text.includes('答案与解析')) {
      if (text.includes('第1套')) {
        currentSet = 'set1';
      } else if (text.includes('第2套')) {
        currentSet = 'set2';
      } else if (text.includes('第3套')) {
        currentSet = 'set3';
      }
    }

    if (!currentSet) continue;

    // Detect section start
    if (newsMarkers.includes(text)) {
      if (currentPassage.length > 0 && currentSection) {
        passages[currentSet][currentSection].push(currentPassage.join(' '));
      }
      currentSection = 'news';
      currentPassage = [];
      continue;
    } else if (convMarkers.includes(text)) {
      if (currentPassage.length > 0 && currentSection) {
        passages[currentSet][currentSection].push(currentPassage.join(' '));
      }
      currentSection = 'conversation';
      currentPassage = [];
      continue;
    } else if (passMarkers.includes(text)) {
      if (currentPassage.length > 0 && currentSection) {
        passages[currentSet][currentSection].push(currentPassage.join(' '));
      }
      currentSection = 'passage';
      currentPassage = [];
      continue;
    }

    // Collect passage text
    if (currentSection) {
      // Stop collecting if we hit a question marker or explanation
      if (text.startsWith('Questions ') || text.startsWith('Question ') ||
          text.startsWith('【解析】') || text.startsWith('【干扰项') ||
          text.startsWith('1.') || text.startsWith('2.') ||
          text.startsWith('3.') || text.startsWith('4.') ||
          text.startsWith('5.') || text.startsWith('6.') ||
          text.startsWith('7.') || text.startsWith('8.')) {
        if (currentPassage.length > 0) {
          passages[currentSet][currentSection].push(currentPassage.join(' '));
          currentPassage = [];
          currentSection = null;
        }
      } else if (!text.startsWith('Section ') &&
                 text !== 'Listening Comprehension' &&
                 !text.includes('(25 minutes)') &&
                 !text.includes('答案与解析')) {
        // Filter out obvious non-passage content
        if (text.length > 15 && !text.startsWith('Part ')) {
          currentPassage.push(text);
        }
      }
    }
  }

  return passages;
}

// Update JSON files
function updateJsonFiles(passages) {
  const dataDir = path.join('C:', 'Users', 'greg2', 'OneDrive', '文档', 'VueProjects', 'english-study', 'public', 'data');

  const fileMapping = {
    set1: 'cet4-2024-12-set1.json',
    set2: 'cet4-2024-12-set2.json',
    set3: 'cet4-2024-12-set3.json'
  };

  const sectionToType = {
    'Section A': 'news',
    'Section B': 'conversation',
    'Section C': 'passage'
  };

  for (const [setName, filename] of Object.entries(fileMapping)) {
    const filePath = path.join(dataDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`Warning: ${filename} not found`);
      continue;
    }

    // Load existing JSON
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Group questions by section and context
    const sectionGroups = {};
    for (const q of questions) {
      if (q.type === 'listening') {
        const section = q.section || '';
        const context = q.context || '';
        const key = `${section}|||${context}`;
        if (!sectionGroups[key]) {
          sectionGroups[key] = [];
        }
        sectionGroups[key].push(q);
      }
    }

    // Assign passages to questions
    for (const [key, group] of Object.entries(sectionGroups)) {
      const [section, context] = key.split('|||');
      const sectionType = sectionToType[section];
      if (!sectionType) continue;

      const passageList = passages[setName][sectionType];

      // Determine which passage index based on context
      let passageIdx = 0;
      if (context.includes('Questions 1') || context.includes('Question 1')) {
        passageIdx = 0;
      } else if (context.includes('Questions 3') || context.includes('Question 3')) {
        passageIdx = 1;
      } else if (context.includes('Questions 5') || context.includes('Question 5')) {
        passageIdx = 2;
      } else if (context.includes('Questions 8') || context.includes('Question 8')) {
        passageIdx = 0;
      } else if (context.includes('Questions 12') || context.includes('Question 12')) {
        passageIdx = 1;
      } else if (context.includes('Questions 16') || context.includes('Question 16')) {
        passageIdx = 0;
      } else if (context.includes('Questions 19') || context.includes('Question 19')) {
        passageIdx = 1;
      } else if (context.includes('Questions 22') || context.includes('Question 22')) {
        passageIdx = 2;
      }

      if (passageIdx < passageList.length) {
        const passageText = passageList[passageIdx];
        for (const q of group) {
          q.passage = passageText;
        }
      }
    }

    // Save updated JSON
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
    console.log(`Updated ${filename}`);
  }
}

// Main execution
console.log('Extracting texts from layout.json...');
const texts = extractTextsFromLayout(layoutData);
console.log(`Extracted ${texts.length} text blocks`);

console.log('\nExtracting listening passages...');
const passages = extractListeningPassages(texts);

console.log('Passages found:');
for (const [setName, sections] of Object.entries(passages)) {
  console.log(`  ${setName}:`);
  for (const [sectionName, passageList] of Object.entries(sections)) {
    console.log(`    ${sectionName}: ${passageList.length}`);
    passageList.forEach((p, i) => {
      console.log(`      [${i}] ${p.substring(0, 80)}...`);
    });
  }
}

console.log('\nUpdating JSON files...');
updateJsonFiles(passages);

console.log('\nDone!');
