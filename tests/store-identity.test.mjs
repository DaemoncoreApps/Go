import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)))

test('Microsoft Store identity matches Partner Center', () => {
  assert.equal(pkg.build.appx.identityName, 'DaemonCore.DaemonCoreAcademyIntrotoGo')
  assert.equal(pkg.build.appx.publisher, 'CN=B7B53B09-651D-4171-90BE-4E9E1F5738BA')
  assert.equal(pkg.build.appx.publisherDisplayName, 'DaemonCore')
  assert.equal(pkg.build.appx.displayName, 'DaemonCore Academy: Intro to Go')
})
