# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-22

### Added

- **Core Gameplay**
  - Player ship with smooth keyboard and touch controls
  - Three enemy types: Drone, Cruiser, and Tank with unique stats
  - Bullet firing system with trail effects
  - Circle-based collision detection

- **Power-Up System**
  - 🟢 **Shield** — absorbs one enemy collision
  - 🟡 **Rapid Fire** — triple-shot with reduced cooldown
  - 🩷 **Extra Life** — restores one life (max 5)

- **Progression & Scoring**
  - Dynamic difficulty scaling (speed and spawn rate per level)
  - Combo multiplier system with on-screen popup notifications
  - Persistent high score via `localStorage`

- **Visual Effects**
  - Animated parallax starfield background
  - Particle explosions and thrust trail effects
  - Screen shake on player damage
  - Invulnerability flash animation

- **User Interface**
  - Glassmorphism HUD with score and lives display
  - Start screen with animated neon title
  - Game over screen with final score and high score
  - Mobile touch zone with auto-fire

- **Project Structure**
  - Separated HTML, CSS, and JavaScript into dedicated files
  - Professional GitHub repository documentation
  - SEO meta tags and Open Graph support
  - ARIA accessibility attributes

### Technical

- Zero external dependencies — pure HTML5 Canvas + CSS3 + ES6
- Delta-time synchronized game loop via `requestAnimationFrame`
- Responsive fullscreen layout with mobile-first touch support

[1.0.0]: https://github.com/CoolDudeMaruf/cosmic-drift/releases/tag/v1.0.0
