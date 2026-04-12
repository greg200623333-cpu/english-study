const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'greg2', 'OneDrive', '文档', 'VueProjects', 'english-study', 'public', 'data', 'cet4-2024-12-set1.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const listening = data.filter(q => q.type === 'listening');
const withPassage = listening.filter(q => q.passage && q.passage !== 'null' && q.passage.length > 50);

console.log('Total listening questions:', listening.length);
console.log('Questions with passage (>50 chars):', withPassage.length);
console.log('\nSample passages:');

withPassage.slice(0, 5).forEach((q, i) => {
  console.log(`\n${i + 1}. Question ${q.number} (${q.section}):`);
  console.log('   ', q.passage.substring(0, 100) + '...');
});

console.log('\n\nQuestions WITHOUT passage:');
const withoutPassage = listening.filter(q => !q.passage || q.passage === 'null' || q.passage.length <= 50);
withoutPassage.forEach(q => {
  console.log(`Question ${q.number} (${q.section}): passage = ${q.passage}`);
});
