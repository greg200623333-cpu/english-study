const fs = require('fs');
const path = require('path');

// Load layout.json
const layoutPath = path.join('C:', 'Users', 'greg2', 'OneDrive', 'Desktop', 'new', 'answer', 'layout.json');
const layoutData = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

console.log('Keys in layoutData:', Object.keys(layoutData));
console.log('pdf_info length:', layoutData.pdf_info?.length);

if (layoutData.pdf_info && layoutData.pdf_info.length > 0) {
  console.log('\nFirst page keys:', Object.keys(layoutData.pdf_info[0]));
  console.log('First page para_blocks length:', layoutData.pdf_info[0].para_blocks?.length);

  if (layoutData.pdf_info[0].para_blocks && layoutData.pdf_info[0].para_blocks.length > 0) {
    const firstBlock = layoutData.pdf_info[0].para_blocks[0];
    console.log('\nFirst block:', JSON.stringify(firstBlock, null, 2).substring(0, 500));
  }
}

// Try to find text with "News Report"
let found = false;
for (let pageIdx = 0; pageIdx < Math.min(50, layoutData.pdf_info?.length || 0); pageIdx++) {
  const page = layoutData.pdf_info[pageIdx];
  for (const block of page.para_blocks || []) {
    for (const line of block.lines || []) {
      for (const span of line.spans || []) {
        const content = span.content || '';
        if (content.includes('News Report') || content.includes('Listening')) {
          console.log(`\nFound at page ${pageIdx}:`, content);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }
  if (found) break;
}
