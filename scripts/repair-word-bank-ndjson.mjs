import fs from 'node:fs'
import path from 'node:path'

const sourceDir = 'E:/QMDownload/enlish data base'
const outputDir = path.join(sourceDir, 'cleaned')
const reportPath = path.join(outputDir, 'word-bank-report.json')

const fileSpecs = [
  { file: 'CET4luan_1.json', exam: 'CET4', tier: 'core', expected: 1162 },
  { file: 'CET4luan_2.json', exam: 'CET4', tier: 'full', expected: 3739 },
  { file: 'CET6luan_1.json', exam: 'CET6', tier: 'core', expected: 1228 },
  { file: 'CET6_2.json', exam: 'CET6', tier: 'full', expected: 2078 },
  { file: 'KaoYanluan_1.json', exam: 'KaoYan', tier: 'core', expected: 1341 },
  { file: 'KaoYan_2.json', exam: 'KaoYan', tier: 'full', expected: 4533 },
]

const pairMap = {
  CET4: { core: 'CET4luan_1.json', full: 'CET4luan_2.json' },
  CET6: { core: 'CET6luan_1.json', full: 'CET6_2.json' },
  KaoYan: { core: 'KaoYanluan_1.json', full: 'KaoYan_2.json' },
}

function normalizeWord(record) {
  return String(record?.headWord ?? record?.content?.word?.wordHead ?? '')
    .trim()
    .toLowerCase()
}

function stringifyNdjson(records) {
  return records.map((record) => JSON.stringify(record)).join('\n') + '\n'
}

function loadFile(spec) {
  const filePath = path.join(sourceDir, spec.file)
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const records = []
  const duplicateKeys = []
  const invalidLines = []
  const seen = new Map()

  lines.forEach((line, index) => {
    try {
      const record = JSON.parse(line)
      const key = normalizeWord(record)
      if (!key) {
        invalidLines.push(index + 1)
        return
      }

      if (seen.has(key)) {
        duplicateKeys.push(key)
        return
      }

      seen.set(key, true)
      records.push(record)
    } catch {
      invalidLines.push(index + 1)
    }
  })

  return {
    ...spec,
    filePath,
    rawCount: lines.length,
    uniqueCount: records.length,
    duplicateCount: duplicateKeys.length,
    invalidLineCount: invalidLines.length,
    duplicateKeys,
    invalidLines,
    records,
    keySet: new Set(records.map(normalizeWord)),
  }
}

function cloneForFull(record, fullBookId, nextRank) {
  const cloned = JSON.parse(JSON.stringify(record))
  cloned.bookId = fullBookId
  cloned.wordRank = nextRank
  return cloned
}

function rerank(records, bookId) {
  return records.map((record, index) => ({
    ...record,
    bookId,
    wordRank: index + 1,
  }))
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function main() {
  ensureDir(outputDir)

  const loaded = Object.fromEntries(fileSpecs.map((spec) => [spec.file, loadFile(spec)]))
  const pairReports = []

  for (const [exam, pair] of Object.entries(pairMap)) {
    const coreInfo = loaded[pair.core]
    const fullInfo = loaded[pair.full]
    const missingCoreWords = coreInfo.records.filter((record) => !fullInfo.keySet.has(normalizeWord(record)))

    if (missingCoreWords.length > 0) {
      const appended = missingCoreWords.map((record, index) =>
        cloneForFull(record, fullInfo.file.replace(/\.json$/i, ''), fullInfo.records.length + index + 1),
      )
      fullInfo.records.push(...appended)
      appended.forEach((record) => fullInfo.keySet.add(normalizeWord(record)))
    }

    pairReports.push({
      exam,
      coreFile: coreInfo.file,
      fullFile: fullInfo.file,
      missingCoreWordsAddedToFull: missingCoreWords.length,
      missingHeadWords: missingCoreWords.map((record) => normalizeWord(record)),
    })
  }

  const finalFiles = Object.values(loaded).map((info) => {
    const bookId = info.file.replace(/\.json$/i, '')
    const repairedRecords = rerank(info.records, bookId)
    const repairedPath = path.join(outputDir, info.file.replace(/\.json$/i, '.cleaned.json'))

    fs.writeFileSync(repairedPath, stringifyNdjson(repairedRecords), 'utf8')

    return {
      file: info.file,
      exam: info.exam,
      tier: info.tier,
      expectedCount: info.expected,
      rawCount: info.rawCount,
      uniqueCountAfterDedup: info.uniqueCount,
      duplicatesRemoved: info.duplicateCount,
      invalidLinesRemoved: info.invalidLineCount,
      addedFromCore: pairReports.find((pair) => pair.fullFile === info.file)?.missingCoreWordsAddedToFull ?? 0,
      finalCount: repairedRecords.length,
      expectedDelta: repairedRecords.length - info.expected,
      repairedPath,
    }
  })

  const summary = {
    sourceDir,
    outputDir,
    generatedAt: new Date().toISOString(),
    files: finalFiles,
    pairs: pairReports,
  }

  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8')

  console.table(
    finalFiles.map((item) => ({
      file: item.file,
      expected: item.expectedCount,
      raw: item.rawCount,
      deduped: item.uniqueCountAfterDedup,
      dupRemoved: item.duplicatesRemoved,
      addedFromCore: item.addedFromCore,
      final: item.finalCount,
      delta: item.expectedDelta,
    })),
  )
  console.log(`Detailed report written to ${reportPath}`)
}

main()
