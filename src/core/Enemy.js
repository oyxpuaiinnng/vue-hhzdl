// src/core/Enemy.js
import { Character } from './character.js';
import { createSkillTree } from '../data/skills.js';

export class Enemy extends Character {
  constructor(name, avatar = '',level = 1 ) {
    super(name, avatar, level);
    this.level = level;
    this.isPlayer = false;

    // override default skillTree & activeSkills
    this.skillTree    = createSkillTree(this);
    this.activeSkills = ['normalAtk'];
    this.calculateLevelStats();
    // give some random levels to skills based on enemy level
    this.randomizeSkills();
    // calculate base stats from level
    this.updateStats();
  }

  randomizeSkills() {
    const keys = Object.keys(this.skillTree);
    for (let i = 0; i < this.level; i++) {
      // pick an upgradable skill
      const candidates = keys.filter(k => {
        const s = this.skillTree[k];
        if (s.level >= s.maxLevel) return false;
        return s.dependencies.every(dep => this.skillTree[dep]?.level > 0);
      });
      if (!candidates.length) break;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      this.skillTree[pick].level++;
    }
    // set activeSkills to whatever is nonzero up to 5
    this.activeSkills = Object.entries(this.skillTree)
      .filter(([_, s]) => s.level > 0)
      .map(([k]) => k)
      .slice(0, 5);
  }
}
