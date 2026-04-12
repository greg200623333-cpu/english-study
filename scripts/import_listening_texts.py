import json
import re
from pathlib import Path

# Load layout.json
layout_path = Path(r"C:\Users\greg2\OneDrive\Desktop\new\answer\layout.json")
with open(layout_path, 'r', encoding='utf-8') as f:
    layout_data = json.load(f)

# Extract all text content from layout
def extract_texts_from_layout(layout_data):
    """Extract all text content blocks from layout JSON"""
    texts = []

    for page in layout_data.get('pdf_info', []):
        for block in page.get('para_blocks', []):
            if block.get('type') == 'text':
                for line in block.get('lines', []):
                    for span in line.get('spans', []):
                        content = span.get('content', '').strip()
                        if content:
                            texts.append(content)

    return texts

# Extract listening passages
def extract_listening_passages(texts):
    """Extract listening passages organized by section"""
    passages = {
        'set1': {'news': [], 'conversation': [], 'passage': []},
        'set2': {'news': [], 'conversation': [], 'passage': []},
        'set3': {'news': [], 'conversation': [], 'passage': []}
    }

    current_set = None
    current_section = None
    current_passage = []

    # Markers for different sections
    news_markers = ['News Report One', 'News Report Two', 'News Report Three']
    conv_markers = ['Conversation One', 'Conversation Two']
    pass_markers = ['Passage One', 'Passage Two', 'Passage Three']

    # Track which set we're in based on title
    set_counter = 0

    for i, text in enumerate(texts):
        # Detect set boundaries
        if '2024年12月大学英语四级考试真题' in text and '答案与解析' in text:
            if '第1套' in text:
                current_set = 'set1'
                set_counter = 1
            elif '第2套' in text:
                current_set = 'set2'
                set_counter = 2
            elif '第3套' in text:
                current_set = 'set3'
                set_counter = 3

        # Skip if no set detected yet
        if not current_set:
            continue

        # Detect section start
        if text in news_markers:
            if current_passage and current_section:
                passages[current_set][current_section].append(' '.join(current_passage))
            current_section = 'news'
            current_passage = []
            continue
        elif text in conv_markers:
            if current_passage and current_section:
                passages[current_set][current_section].append(' '.join(current_passage))
            current_section = 'conversation'
            current_passage = []
            continue
        elif text in pass_markers:
            if current_passage and current_section:
                passages[current_set][current_section].append(' '.join(current_passage))
            current_section = 'passage'
            current_passage = []
            continue

        # Collect passage text
        if current_section:
            # Stop collecting if we hit a question marker or explanation
            if text.startswith('Questions ') or text.startswith('【解析】') or text.startswith('【干扰项'):
                if current_passage:
                    passages[current_set][current_section].append(' '.join(current_passage))
                    current_passage = []
                    current_section = None
            elif not text.startswith('Section ') and text != 'Listening Comprehension':
                # Filter out obvious non-passage content
                if len(text) > 20 and not text.startswith('Part '):
                    current_passage.append(text)

    return passages

# Update JSON files
def update_json_files(passages):
    """Update the quiz JSON files with listening passages"""
    data_dir = Path(r"C:\Users\greg2\OneDrive\文档\VueProjects\english-study\public\data")

    # Mapping of sets to files
    file_mapping = {
        'set1': 'cet4-2024-12-set1.json',
        'set2': 'cet4-2024-12-set2.json',
        'set3': 'cet4-2024-12-set3.json'
    }

    # Section mapping
    section_to_type = {
        'Section A': 'news',
        'Section B': 'conversation',
        'Section C': 'passage'
    }

    for set_name, filename in file_mapping.items():
        file_path = data_dir / filename

        if not file_path.exists():
            print(f"Warning: {filename} not found")
            continue

        # Load existing JSON
        with open(file_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)

        # Group questions by section and context
        section_groups = {}
        for q in questions:
            if q.get('type') == 'listening':
                section = q.get('section', '')
                context = q.get('context', '')
                key = (section, context)
                if key not in section_groups:
                    section_groups[key] = []
                section_groups[key].append(q)

        # Assign passages to questions
        for (section, context), group in section_groups.items():
            section_type = section_to_type.get(section)
            if not section_type:
                continue

            passage_list = passages[set_name][section_type]

            # Determine which passage index based on context
            if 'Questions 1 and 2' in context or 'Question 1' in context:
                passage_idx = 0
            elif 'Questions 3 and 4' in context or 'Question 3' in context:
                passage_idx = 1
            elif 'Questions 5' in context or 'Question 5' in context:
                passage_idx = 2
            elif 'Questions 8' in context or 'Question 8' in context:
                passage_idx = 0
            elif 'Questions 12' in context or 'Question 12' in context:
                passage_idx = 1
            elif 'Questions 16' in context or 'Question 16' in context:
                passage_idx = 0
            elif 'Questions 19' in context or 'Question 19' in context:
                passage_idx = 1
            elif 'Questions 22' in context or 'Question 22' in context:
                passage_idx = 2
            else:
                passage_idx = 0

            # Assign passage to all questions in this group
            if passage_idx < len(passage_list):
                passage_text = passage_list[passage_idx]
                for q in group:
                    q['passage'] = passage_text

        # Save updated JSON
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

        print(f"Updated {filename}")

        # Print summary
        news_count = sum(1 for q in questions if q.get('type') == 'listening' and q.get('section') == 'Section A' and q.get('passage'))
        conv_count = sum(1 for q in questions if q.get('type') == 'listening' and q.get('section') == 'Section B' and q.get('passage'))
        pass_count = sum(1 for q in questions if q.get('type') == 'listening' and q.get('section') == 'Section C' and q.get('passage'))
        print(f"  - News: {news_count} questions with passages")
        print(f"  - Conversations: {conv_count} questions with passages")
        print(f"  - Passages: {pass_count} questions with passages")

# Main execution
print("Extracting texts from layout.json...")
texts = extract_texts_from_layout(layout_data)
print(f"Extracted {len(texts)} text blocks")

print("\nExtracting listening passages...")
passages = extract_listening_passages(texts)

# Print summary
for set_name, sections in passages.items():
    print(f"\n{set_name}:")
    for section, passage_list in sections.items():
        print(f"  {section}: {len(passage_list)} passages")
        for i, p in enumerate(passage_list):
            print(f"    Passage {i+1}: {len(p)} chars - {p[:80]}...")

print("\n\nUpdating JSON files...")
update_json_files(passages)

print("\n✓ Done!")
