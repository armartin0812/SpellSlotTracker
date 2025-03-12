# SpellSlotTracker

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.1.5.

## Synopsis

Spell Slot Tracker is a web application designed to accompany Dungeons & Dragons play sessions. The application helps players track their spellcasting resources and character status during gameplay.

## Features

### Character Management
- Create, edit, save, and delete character profiles
- Characters have attributes like name, class, level, HP (current and maximum)
- Characters are stored in the browser's local storage for persistence

### Spell Slot Tracking
- Track spell slots for spellcasting characters
- Characters have spell levels with a maximum number of slots
- Mark spell slots as used during gameplay
- Recover individual spell slots as needed
- "Long Rest" feature resets all spell slots to unused

### Combat Features
- HP management with buttons to add/subtract 1, 5, or 10 HP
- Death save tracking when a character drops to 0 HP
- Concentration tracking for spells
- Status effect management (add, edit, remove effects)

### User Interface
- Character selection dropdown
- Character sheet display
- Spell slot visualization with visual indicators
- Authentication features for user accounts

## Purpose

This application replaces the traditional pen-and-paper tracking of spell slots and character status during D&D gameplay, making it easier for players to manage their resources and focus on the game.

## Development and Deployment

### Compile Script

The project includes a custom compile script in package.json:

```
npm run compile
```

This script runs:
- `ng build --output-path docs --base-href /SpellSlotTracker/`

Which:
1. Builds the Angular application
2. Outputs the compiled files to the "docs" directory
3. Sets the base URL to "/SpellSlotTracker/"

This configuration is specifically designed for GitHub Pages deployment, as GitHub Pages can serve content from the "/docs" folder in the main branch.

