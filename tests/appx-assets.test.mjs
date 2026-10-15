import test from 'node:test'
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'

for (const name of ['StoreLogo.png', 'Square44x44Logo.png', 'Square150x150Logo.png', 'Wide310x150Logo.png']) {
  test(`generated ${name} exists`, async () => assert.doesNotReject(() => access(new URL(`../build/appx/${name}`, import.meta.url))))
}
