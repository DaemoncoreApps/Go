import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectSubmission, validateSubmission } from '../src/validation.js'

test('rejects the malformed one-line Go source from the reported reproduction', () => {
  const source = 'package mainimport "fmt"func main(){fmt.Println("Hello")}'
  const result = validateSubmission({ source, walkthrough: 'package main\nfunc main() {}', expected: 'fmt.Println' })
  assert.equal(result.passed, false)
  assert.equal(result.kind, 'syntax')
  assert.match(result.message, /package declaration/i)
})

test('rejects unchanged walkthroughs before awarding mastery', () => {
  const source = 'package main\n\nfunc main() {}'
  const result = validateSubmission({ source, walkthrough: source, expected: 'func main' })
  assert.deepEqual(result.kind, 'unchanged')
})

test('rejects unbalanced and malformed Go constructs', () => {
  assert.match(inspectSubmission('func main() { fmt.Println("hello")'), /closing delimiter/i)
  assert.match(inspectSubmission('package main\nimport fmt'), /import declaration/i)
  assert.match(inspectSubmission('package main\nfunc {'), /closing delimiter|function declaration/i)
})

test('accepts changed, structurally sound Go that demonstrates the target', () => {
  const result = validateSubmission({
    source: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, Nova!")\n}',
    walkthrough: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, Gopher!")\n}',
    expected: 'fmt.Println',
  })
  assert.equal(result.passed, true)
})

test('accepts command-oriented lesson submissions without requiring a package', () => {
  const result = validateSubmission({ source: 'go version\ngo env', walkthrough: 'go version', expected: 'go version' })
  assert.equal(result.passed, true)
})
