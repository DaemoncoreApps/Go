import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'src', 'assets', 'daemoncore-go-logo.png')
const png = path.join(root, 'build', 'icon.png')
const ico = path.join(root, 'build', 'icon.ico')
const appxDir = path.join(root, 'build', 'appx')

const appxAssets = [
  ['StoreLogo.png', 50, 50, 50],
  ['Square44x44Logo.png', 44, 44, 44],
  ['Square150x150Logo.png', 150, 150, 150],
  ['Wide310x150Logo.png', 310, 150, 132],
]

await mkdir(path.join(root, 'build'), { recursive: true })
await mkdir(appxDir, { recursive: true })
const sourceBuffer = await readFile(source)
await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 3, g: 2, b: 5, alpha: 1 } } })
  .composite([{ input: await sharp(sourceBuffer).resize(468, 468, { fit: 'contain' }).png().toBuffer(), gravity: 'centre' }])
  .png().toFile(png)
await writeFile(ico, await pngToIco(png))

for (const [name, width, height, iconSize] of appxAssets) {
  const icon = await sharp(sourceBuffer).resize(iconSize, iconSize, { fit: 'contain' }).png().toBuffer()
  await sharp({
    create: { width, height, channels: 4, background: { r: 3, g: 2, b: 5, alpha: 1 } },
  })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(path.join(appxDir, name))
}

console.log('Generated Windows desktop and AppX identity assets')
