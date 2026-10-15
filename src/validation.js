function scanDelimiters(source) {
  const pairs = { ')': '(', ']': '[', '}': '{' }
  const stack = []
  let quote = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (lineComment) { if (char === '\n') lineComment = false; continue }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; index += 1 }; continue }
    if (quote) {
      if (quote !== '`' && escaped) { escaped = false; continue }
      if (quote !== '`' && char === '\\') { escaped = true; continue }
      if (char === quote) quote = null
      continue
    }
    if (char === '/' && next === '/') { lineComment = true; index += 1; continue }
    if (char === '/' && next === '*') { blockComment = true; index += 1; continue }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue }
    if ('([{'.includes(char)) stack.push(char)
    if (')]}'.includes(char) && stack.pop() !== pairs[char]) return `Unexpected “${char}” near character ${index + 1}.`
  }

  if (quote) return 'A quoted string or rune is not closed.'
  if (blockComment) return 'A block comment is not closed.'
  if (stack.length) return `A closing delimiter is missing for “${stack.at(-1)}”.`
  return null
}

export function inspectSubmission(source) {
  const trimmed = source.trim()
  if (!trimmed) return 'The code lab is empty.'

  const delimiterError = scanDelimiters(source)
  if (delimiterError) return delimiterError

  if (/\bpackage\b/.test(source)) {
    const packageLines = source.match(/^\s*package\s+[A-Za-z_]\w*\s*$/gm) ?? []
    if (packageLines.length !== 1) return 'A Go file needs one package declaration on its own line, such as “package main”.'
    const firstCodeLine = source.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith('//'))
    if (!/^\s*package\s+[A-Za-z_]\w*\s*$/.test(firstCodeLine ?? '')) return 'The package declaration must be the first code line.'
  }

  if (/\bimport\b/.test(source) && !/(?:^|\n)\s*import\s+(?:"[^"\n]+"|\([\s\S]*?\))/.test(source)) {
    return 'The import declaration is malformed. Put a quoted package path after import, or use an import block.'
  }
  if (/\bfunc\b/.test(source) && !/\bfunc\s+(?:\([^)]*\)\s*)?[A-Za-z_]\w*\s*\([^)]*\)/.test(source)) {
    return 'The function declaration is malformed. A named function needs a name and parentheses.'
  }
  if (/\bfmt\.Print(?:ln|f)?\b/.test(source) && !/\bfmt\.Print(?:ln|f)?\s*\(/.test(source)) {
    return 'A fmt print call needs parentheses around its arguments.'
  }
  return null
}

export function validateSubmission({ source, walkthrough, expected }) {
  const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase()
  if (normalize(source) === normalize(walkthrough)) return { passed: false, kind: 'unchanged', message: 'The walkthrough is a reference, not the answer. Make a meaningful change that completes the mission.' }
  const syntaxError = inspectSubmission(source)
  if (syntaxError) return { passed: false, kind: 'syntax', message: syntaxError }
  if (!source.toLowerCase().includes(expected.toLowerCase())) return { passed: false, kind: 'concept', message: `The expected concept is not visible yet. Your solution should demonstrate “${expected}”.` }
  return { passed: true, kind: 'passed', message: 'Structure and lesson objective verified.' }
}
