const fs = require('fs');
const path = require('path');

// Input files
const cet4LayoutPath = 'C:\\Users\\greg2\\OneDrive\\Desktop\\new\\layout.json';
const cet6LayoutPath = 'C:\\Users\\greg2\\OneDrive\\Desktop\\new\\layout1.json';
const cet4AnswerPath = 'C:\\Users\\greg2\\OneDrive\\Desktop\\new\\answer\\layout.json';
const cet6AnswerPath = 'C:\\Users\\greg2\\OneDrive\\Desktop\\new\\answer\\layout1.json';

// Output file
const outputPath = path.join(__dirname, '..', 'public', 'data', 'essay-prompts.json');

// Recursively extract all text content from nested structure
function extractText(obj) {
  let texts = [];
  if (typeof obj === 'string') {
    return [obj];
  }
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      texts = texts.concat(extractText(item));
    });
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.content) {
      texts.push(obj.content);
    }
    Object.values(obj).forEach(val => {
      texts = texts.concat(extractText(val));
    });
  }
  return texts;
}

// Extract essay prompts from layout JSON
function extractEssayPrompts(layoutPath, examType) {
  const data = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
  const allText = extractText(data);

  const essays = [];
  let currentSet = 0;

  for (let i = 0; i < allText.length; i++) {
    const text = allText[i].trim();

    // Detect set boundaries
    const setMatch1 = text.match(/真题[（(]第([1-3])套[）)]/);
    const setMatch2 = text.match(/真题[（(]([一二三])[）)]/);
    if (setMatch1) {
      currentSet = parseInt(setMatch1[1]);
    } else if (setMatch2) {
      const chineseNums = { '一': 1, '二': 2, '三': 3 };
      currentSet = chineseNums[setMatch2[1]];
    }

    // Find writing prompts (Directions with write/essay, but not listening/reading)
    if (text.startsWith('Directions:') && (text.includes('write') || text.includes('essay') || text.includes('Write'))) {
      if (!text.includes('hear') && !text.includes('passage') && !text.includes('blanks') && !text.includes('statements')) {
        if (currentSet > 0) {
          essays.push({
            examType,
            set: currentSet,
            year: 2024,
            season: 12,
            prompt: text
          });
        }
      }
    }
  }

  return essays;
}

// Extract model essays from answer JSON
function extractModelEssays(answerPath, examType) {
  const data = JSON.parse(fs.readFileSync(answerPath, 'utf8'));
  const allText = extractText(data);

  const modelEssays = [];
  let currentSet = 0;

  for (let i = 0; i < allText.length; i++) {
    const text = allText[i].trim();

    // Detect set boundaries
    const setMatch1 = text.match(/真题[（(]第([1-3])套[）)]/);
    const setMatch2 = text.match(/真题[（(]([一二三])[）)]/);
    if (setMatch1) {
      currentSet = parseInt(setMatch1[1]);
    } else if (setMatch2) {
      const chineseNums = { '一': 1, '二': 2, '三': 3 };
      currentSet = chineseNums[setMatch2[1]];
    }

    // Find model essay in table format
    if (text.includes('<table>') && text.includes('参考范文') && currentSet > 0) {
      // Extract text from table cells
      const tdMatch = text.match(/<td>(.*?)<\/td>/gs);
      if (tdMatch && tdMatch.length >= 3) {
        let essayText = '';
        if (tdMatch.length >= 5) {
          // CET-4 format: 6 cells, essay split across cells 2 and 4
          const part1 = tdMatch[2].replace(/<\/?td>/g, '').trim();
          const part2 = tdMatch[4].replace(/<\/?td>/g, '').trim();
          essayText = (part1 + ' ' + part2).replace(/\s+/g, ' ').trim();
        } else {
          // CET-6 format: 4 cells, essay in cell 2
          essayText = tdMatch[2].replace(/<\/?td>/g, '').replace(/&#x27;/g, "'").trim();
          essayText = essayText.replace(/\s+/g, ' ').trim();
        }

        if (essayText.length > 100) {
          modelEssays.push({
            examType,
            set: currentSet,
            modelEssay: essayText
          });
        }
      }
    }
  }

  return modelEssays;
}

// Main execution
try {
  console.log('Extracting essay prompts...');

  const cet4Prompts = extractEssayPrompts(cet4LayoutPath, 'cet4');
  const cet6Prompts = extractEssayPrompts(cet6LayoutPath, 'cet6');

  console.log(`Found ${cet4Prompts.length} CET-4 prompts`);
  console.log(`Found ${cet6Prompts.length} CET-6 prompts`);

  console.log('Extracting model essays...');

  const cet4Models = extractModelEssays(cet4AnswerPath, 'cet4');
  const cet6Models = extractModelEssays(cet6AnswerPath, 'cet6');

  console.log(`Found ${cet4Models.length} CET-4 model essays`);
  console.log(`Found ${cet6Models.length} CET-6 model essays`);

  // Merge prompts with model essays
  const allPrompts = [...cet4Prompts, ...cet6Prompts];
  const allModels = [...cet4Models, ...cet6Models];

  // Deduplicate prompts by id
  const uniquePrompts = [];
  const seenIds = new Set();
  for (const prompt of allPrompts) {
    const id = `${prompt.examType}-${prompt.year}-${prompt.season}-set${prompt.set}`;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      uniquePrompts.push(prompt);
    }
  }

  const finalData = uniquePrompts.map(prompt => {
    const model = allModels.find(m => m.examType === prompt.examType && m.set === prompt.set);
    return {
      id: `${prompt.examType}-${prompt.year}-${prompt.season}-set${prompt.set}`,
      examType: prompt.examType,
      year: prompt.year,
      season: prompt.season,
      set: prompt.set,
      prompt: prompt.prompt,
      modelEssay: model ? model.modelEssay : ''
    };
  });

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf8');

  console.log(`\nSuccessfully extracted ${finalData.length} essay prompts`);
  console.log(`Output saved to: ${outputPath}`);

  // Print summary
  finalData.forEach(item => {
    console.log(`\n${item.id}:`);
    console.log(`  Prompt: ${item.prompt.substring(0, 80)}...`);
    console.log(`  Model essay: ${item.modelEssay ? item.modelEssay.substring(0, 60) + '...' : 'NOT FOUND'}`);
  });

} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
