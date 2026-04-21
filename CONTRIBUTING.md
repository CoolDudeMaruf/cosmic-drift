# Contributing to Cosmic Drift

First off, thank you for considering contributing to **Cosmic Drift**! 🚀

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report, please check existing [Issues](../../issues) to avoid duplicates.

**When filing a bug, include:**

- A clear, descriptive title
- Steps to reproduce the behavior
- Expected vs. actual behavior
- Browser name and version
- Device type (desktop / mobile / tablet)
- Screenshots or screen recordings if applicable

### 💡 Suggesting Features

Feature requests are tracked as [GitHub Issues](../../issues).

**When suggesting a feature, include:**

- A clear, descriptive title
- A detailed description of the proposed feature
- Why this feature would be useful to players
- Any mockups or visual references (if applicable)

### 🔧 Pull Requests

1. **Fork** the repository
2. **Clone** your fork locally
3. Create a new **branch** for your feature or fix:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Make your changes
5. **Test** your changes in multiple browsers
6. **Commit** with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add asteroid obstacle type"
   git commit -m "fix: resolve collision detection edge case"
   git commit -m "docs: update controls section in README"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```
8. Open a **Pull Request** against `main`

## Development Guidelines

### Code Style

- **JavaScript:** Use ES6+ syntax, `const`/`let` (no `var`), arrow functions where appropriate
- **CSS:** Use CSS custom properties (`--var-name`) for colors and spacing
- **HTML:** Use semantic, accessible markup with ARIA attributes where needed
- **Comments:** Document non-obvious logic; use section headers (`/* ── Section ── */`)

### File Structure

```
css/style.css  →  All styles (no inline styles in HTML)
js/game.js     →  All game logic (single IIFE module)
index.html     →  Structure and references only
```

### Testing Checklist

Before submitting a PR, please verify:

- [ ] Game starts and runs without console errors
- [ ] All three enemy types spawn and behave correctly
- [ ] Power-ups (shield, rapid fire, extra life) function as expected
- [ ] Score and lives HUD updates correctly
- [ ] Game over screen shows correct final and high scores
- [ ] Touch controls work on mobile devices
- [ ] Responsive layout works across screen sizes
- [ ] No visual glitches or z-index issues

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

Thank you for making Cosmic Drift better! 🌌
