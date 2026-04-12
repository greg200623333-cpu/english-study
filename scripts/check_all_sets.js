const fs = require('fs');
const path = require('path');

const sets = ['set1', 'set2', 'set3'];

sets.forEach(set => {
  const filename = `cet4-2024-12-${set}.json`;
  const filePath = path.join('C:', 'Users', 'greg2', 'OneDrive', '文档', 'VueProjects', 'english-study', 'public', 'data', filename);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const listening = data.filter(q => q.type === 'listening');
  const withPassage = listening.filter(q => q.passage && q.passage !== 'null' && q.passage.length > 50);

  console.log(`\n=== ${filename} ===`);
  console.log(`Total listening: ${listening.length}`);
  console.log(`With passage: ${withPassage.length}`);

  if (withPassage.length < listening.length) {
    console.log('\nMissing passages:');
    listening.filter(q => !q.passage || q.passage === 'null' || q.passage.length <= 50).forEach(q => {
      console.log(`  Question ${q.number} (${q.section})`);
    });
  }
});
