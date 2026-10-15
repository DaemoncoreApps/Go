import test from 'node:test'
import assert from 'node:assert/strict'
import { lessons, tracks } from '../src/curriculum.js'

test('course contains ten paths and exactly one hundred unique lessons', () => {
  assert.equal(tracks.length, 10)
  assert.equal(lessons.length, 100)
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 100)
  tracks.forEach((track) => assert.equal(lessons.filter((lesson) => lesson.trackId === track.id).length, 10))
})

test('every lesson ships eight complete sections and a practice contract', () => {
  lessons.forEach((lesson, index) => {
    assert.equal(lesson.number, index + 1)
    assert.equal(lesson.sections.length, 8)
    lesson.sections.forEach((section) => { assert.ok(section.name); assert.ok(section.body.length > 40) })
    for (const key of ['title', 'objective', 'code', 'expected', 'task', 'hint']) assert.ok(lesson[key], `${lesson.id} needs ${key}`)
  })
})
