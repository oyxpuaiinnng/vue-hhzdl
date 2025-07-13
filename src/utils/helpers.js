// src/utils/helpers.js

import { Enemy } from '../core/Enemy.js';

/**
 * Fisher–Yates shuffle
 */
export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * generateEnemies(level, count=3)
 * 返回 Enemy 实例数组
 */
export function generateEnemies(level, count = 1) {
    const list = [];
    for (let i = 0; i < count; i++) {
        const e = new Enemy(`敌人${i + 1}`, "",level);
        e.resetForBattle()
        list.push(e);
    }
    return list;
}
