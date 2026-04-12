const fs = require('fs');
const path = require('path');

// Load layout.json
const layoutPath = path.join('C:', 'Users', 'greg2', 'OneDrive', 'Desktop', 'new', 'answer', 'layout.json');
const layoutData = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

// Extract all text content from layout
function extractTextsFromLayout(layoutData) {
  const texts = [];

  for (const page of layoutData.pdf_info || []) {
    for (const block of page.para_blocks || []) {
      if (block.type === 'text') {
        for (const line of block.lines || []) {
          for (const span of line.spans || []) {
            const content = (span.content || '').trim();
            if (content) {
              texts.push(content);
            }
          }
        }
      }
    }
  }

  return texts;
}

const texts = extractTextsFromLayout(layoutData);
console.log('Total texts:', texts.length);

// Find listening-related texts
const listeningTexts = texts.filter((t, i) => {
  return t.includes('News Report') ||
         t.includes('Conversation') ||
         t.includes('Passage One') ||
         t.includes('Passage Two') ||
         t.includes('Passage Three') ||
         t.includes('Listening Comprehension') ||
         t.includes('第1套') ||
         t.includes('第2套') ||
         t.includes('第3套');
});

console.log('\nListening-related texts found:', listeningTexts.length);
listeningTexts.slice(0, 20).forEach((t, i) => {
  console.log(`${i}: ${t.substring(0, 100)}`);
});
