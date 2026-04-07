import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const sourceDir = 'E:/QMDownload/enlish data base'
const batchSize = 500

const sources = [
  { file: 'CET4luan_1.json', category: 'cet4', tier: 'core' },
  { file: 'CET4luan_2.json', category: 'cet4', tier: 'full' },
  { file: 'CET6luan_1.json', category: 'cet6', tier: 'core' },
  { file: 'CET6_2.json', category: 'cet6', tier: 'full' },
  { file: 'KaoYanluan_1.json', category: 'kaoyan', tier: 'core' },
  { file: 'KaoYan_2.json', category: 'kaoyan', tier: 'full' },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null
}

function extractMeaning(entry) {
  const trans = entry?.content?.word?.content?.trans
  if (!Array.isArray(trans)) return ''

  return trans
    .map((item) => [item?.pos, item?.tranCn].filter(Boolean).join('. '))
    .filter(Boolean)
    .join('; ')
    .slice(0, 1200)
}

function extractExample(entry) {
  const sentences = entry?.content?.word?.content?.sentence?.sentences
  if (!Array.isArray(sentences)) return null
  return firstString(...sentences.map((sentence) => sentence?.sContent))
}

function extractPhonetic(entry) {
  const content = entry?.content?.word?.content
  return firstString(content?.ukphone, content?.usphone, content?.phone)
}

function normalizeEntry(entry, source) {
  const word = firstString(entry?.headWord, entry?.content?.word?.wordHead)
  if (!word) return null

  return {
    word: word.slice(0, 255),
    phonetic: extractPhonetic(entry),
    meaning: extractMeaning(entry) || word,
    example: extractExample(entry),
    category: source.category,
    tier: source.tier,
  }
}

function keyOf(word, category, tier) {
  return `${String(word).toLowerCase()}::${category}::${tier}`
}

async function backfillLegacyTier() {
  const pageSize = 1000
  let from = 0
  let totalUpdated = 0

  while (true) {
    const { data, error } = await supabase
      .from('words')
      .select('id')
      .is('tier', null)
      .range(from, from + pageSize - 1)

    if (error) {
      throw new Error([
        error.message,
        error.code ? `code=${error.code}` : '',
        error.details ? `details=${error.details}` : '',
      ].filter(Boolean).join(' | '))
    }

    const ids = (data ?? []).map((item) => item.id)
    if (ids.length === 0) break

    const { error: updateError } = await supabase
      .from('words')
      .update({ tier: 'full' })
      .in('id', ids)

    if (updateError) {
      throw new Error([
        updateError.message,
        updateError.code ? `code=${updateError.code}` : '',
        updateError.details ? `details=${updateError.details}` : '',
      ].filter(Boolean).join(' | '))
    }

    totalUpdated += ids.length
    if (ids.length < pageSize) break
    from += pageSize
  }

  return totalUpdated
}

async function loadExistingKeys() {
  const pageSize = 1000
  let from = 0
  const existingKeys = new Set()

  while (true) {
    const { data, error } = await supabase
      .from('words')
      .select('word, category, tier')
      .range(from, from + pageSize - 1)

    if (error) {
      throw new Error([
        error.message,
        error.code ? `code=${error.code}` : '',
        error.details ? `details=${error.details}` : '',
      ].filter(Boolean).join(' | '))
    }

    const rows = data ?? []
    rows.forEach((row) => {
      const tier = row.tier ?? 'full'
      existingKeys.add(keyOf(row.word, row.category, tier))
    })

    if (rows.length < pageSize) break
    from += pageSize
  }

  return existingKeys
}

async function insertBatch(rows) {
  if (rows.length === 0) return 0

  const { error } = await supabase.from('words').insert(rows)
  if (error) {
    throw new Error([
      error.message,
      error.code ? `code=${error.code}` : '',
      error.details ? `details=${error.details}` : '',
      error.hint ? `hint=${error.hint}` : '',
    ].filter(Boolean).join(' | '))
  }

  return rows.length
}

async function importFile(source, existingKeys) {
  const filePath = path.join(sourceDir, source.file)
  if (!fs.existsSync(filePath)) throw new Error(`Source file not found: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const seenInFile = new Set()
  let batch = []
  let parsed = 0
  let skipped = 0
  let imported = 0

  for (const line of lines) {
    const entry = JSON.parse(line)
    const row = normalizeEntry(entry, source)
    if (!row) {
      skipped += 1
      continue
    }

    const key = keyOf(row.word, row.category, row.tier)
    if (seenInFile.has(key) || existingKeys.has(key)) {
      skipped += 1
      continue
    }

    seenInFile.add(key)
    existingKeys.add(key)
    batch.push(row)
    parsed += 1

    if (batch.length >= batchSize) {
      imported += await insertBatch(batch)
      batch = []
    }
  }

  imported += await insertBatch(batch)
  return { file: source.file, parsed, imported, skipped }
}

async function main() {
  const updated = await backfillLegacyTier()
  console.log(`Backfilled legacy tier rows: ${updated}`)

  const existingKeys = await loadExistingKeys()
  console.log(`Loaded existing keys: ${existingKeys.size}`)

  const results = []
  for (const source of sources) {
    console.log(`Importing ${source.file} -> ${source.category}/${source.tier}`)
    results.push(await importFile(source, existingKeys))
  }

  console.table(results)
  const total = results.reduce((sum, item) => sum + item.imported, 0)
  console.log(`Imported ${total} new word rows.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
