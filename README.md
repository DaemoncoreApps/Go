# DaemonCore Academy: Intro to Go

A premium, offline-first Windows course that takes a complete beginner from installing Go through shipping a tested HTTP service.

## What ships

- 100 lessons across 10 progressive learning paths
- Eight teaching sections in every lesson: Orient, Understand, Walkthrough, Code Lab, Practice, Pitfalls, Checkpoint, and Carry Forward
- Guided first-run setup with a sustainable daily learning target
- Premium academy dashboard with path-level progress and a one-click resume flow
- Code labs with line numbers, edit-aware mastery checks, console feedback, XP, streaks, achievements, bookmarks, personal notes, search, focus mode, and progress backup/restore
- No accounts, ads, analytics, remote content, or network requirement
- Electron desktop packaging and Microsoft Store APPX packaging

## Development

Requires current Node.js and npm.

```powershell
npm install
npm run dev
```

Quality gate:

```powershell
npm test
```

Build the Microsoft Store package:

```powershell
npm run package:store
```

Output is written to `release/`. Partner Center identity and publisher values are defined in `package.json`.

## Privacy

Progress and notes stay in browser storage on the local device. See [PRIVACY.md](PRIVACY.md).
