// src/store/index.js
import { defineStore } from 'pinia';
import { Character } from '../core/character.js';
import { Enemy } from '../core/Enemy.js';
import { shuffle, generateEnemies } from '../utils/helpers';
import { generateArmor, generateWeapon } from '../data/equipment.js'
import { challenges } from '../data/challenges.js';
import { globalEffectMapping } from '../utils/effects';

export const useGameStore = defineStore('game', {
    state: () => ({
        level: 1,
        logs: [],
        playerParty: [],    // Character[]
        enemyParty: [],     // Enemy[]
        actionQueue: [],    // Character[] merged
        currentActor: null, // Character
        selectedSkill: null,
        mode: 'init', // 'init' | 'selectActor' | 'selectSkill' | 'selectTarget' | 'resolving'
        isChallenge: false,
        challengeId: null,
    }),

    actions: {
        // ---- Initialization ----
        initPlayerParty(names, avatars) {
            this.playerParty = names.map((n, i) => {
                const ch = new Character(n, avatars?.[i] || '小猫咪');
                ch._log = this._log.bind(this);
                ch.updateStats();
                return ch;
            });
        },

        initBattle(level) {
            this.enemyParty=[];
            // reset parties
            this.enemyParty = generateEnemies(level, Math.random() * (1 + 0.05 * level)).map(e => {
                e._log = this._log.bind(this);
                e.updateStats();
                e.mp = e.maxMp;
                return e;
            });
            this.playerParty.forEach(ch => {
                if (Array.isArray(ch.pendingSkills) && ch.pendingSkills.length) {
                    // 把所有未在 activeSkills 中的 pendingSkills 加进来
                    ch.pendingSkills.forEach(skillKey => {
                        if (!ch.activeSkills.includes(skillKey)) {
                            ch.activeSkills.push(skillKey);
                        }
                    });
                    ch.pendingSkills = [];
                }
                // 如果有角色还没有任何 activeSkills，就至少给它一个普通攻击
                if (!Array.isArray(ch.activeSkills) || ch.activeSkills.length === 0) {
                    ch.activeSkills = ['normalAtk'];
                }

                if (ch.pendingWeapon) {
                    ch.armedWeapon = ch.pendingWeapon;
                    ch.pendingWeapon = null;
                }
                if (ch.pendingArmor) {
                    ch.armedArmor = ch.pendingArmor;
                    ch.pendingArmor = null;
                }
                ch.effects = [];

                // 追加装备的被动效果
                const allEffects = [
                    ...(ch.armedWeapon?.effect || []),
                    ...(ch.armedArmor?.effect || [])
                ];

                for (const [effKey, val] of allEffects) {
                    const fn = globalEffectMapping[effKey];
                    ch.effects.push([
                        (...args) => fn.apply(ch, args), // 使用 apply 手动绑定 this
                        [val],
                        {
                            trigger: 'updateStats',
                            durationType: 'forever',
                            remaining: Infinity
                        }
                    ]);
                }
                ch.health = ch.maxHealth;
                ch.mp = ch.maxMp;
                ch.effects = [];
                ch.updateStats();
            });

            // build action queue
            this.actionQueue = shuffle([...this.playerParty, ...this.enemyParty]);
            this.currentActor = null;
            this.selectedSkill = null;
            //this.mode = 'selectActor';
            this._log(`第 ${this.level} 关，战斗开始！`);

            // trigger onTurnStart for all
            [...this.playerParty, ...this.enemyParty].forEach(ch =>
                ch.checkEffects('onTurnStart')
            );
            this.startNextRound()
        },

        startChallenge(id) {
            const challenge = challenges.find(c => c.id === id);
            if (!challenge) return;

            this.isChallenge = true;
            this.challengeId = id;
            this._log(`挑战开始：${challenge.name}`);

            // 构建 Boss 队列
            this.enemyParty = challenge.bosses.map(b => {
                const boss = new Enemy(b.name, b.avatar, b.level);
                boss._log = this._log.bind(this);

                // 应用 effects
                if (Array.isArray(b.effects)) {
                    b.effects.forEach(([fn, args, meta]) => {
                        if (args[1] === null) args[1] = boss; // 设置目标为自己
                        boss.effects.push([fn, args, meta]);
                    });
                }

                boss.updateStats();
                boss.health = boss.maxHealth;
                boss.mp = boss.maxMp;
                return boss;
            });

            this.playerParty.forEach(p => p.resetForBattle());
            this._log('挑战敌人准备就绪');
            this.startNextRound();
        },

        // ---- Turn & Action Flow ----

        nextActor(ch = null) {
            if (!ch) {
                // 自动弹出队列的下一个角色
                if (this.actionQueue.length === 0) {
                    this.endRound();
                    return;
                }
                ch = this.actionQueue.shift();
            }

            this.currentActor = ch;
            if (ch.health <= 0) { this.nextActor(); return; }
            this.selectedSkill = null;

            this._log(`轮到 ${ch.name} 行动`);
            if (!ch.isPlayer) {
                const availableSkills = Object.entries(ch.skillTree)
                    .filter(([key, sk]) => sk.level > 0 && typeof sk.execute === 'function');

                if (availableSkills.length === 0) {
                    this._log(`${ch.name} 无技能可用，跳过`);
                    if (this.actionQueue.length) {
                        this.nextActor();
                    } else {
                        this.endRound();
                    }
                    return;
                }

                const [key, skill] = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                this.selectedSkill = key;

                if (skill.targetType === 'single') {
                    const candidates = ch.isPlayer ? this.enemyParty : this.playerParty;
                    const target = candidates[Math.floor(Math.random() * candidates.length)];
                    this.resolveAction([target]);
                } else if (skill.targetType === 'self') {
                    this.resolveAction([ch]);
                } else {
                    const group = ch.isPlayer ? this.enemyParty : this.playerParty;
                    this.resolveAction(group);
                }

                return;
            }

            // 玩家角色进入选择阶段
            this.mode = 'selectSkill';
        },

        selectSkill(key) {
            this.selectedSkill = key;
            const sk = this.currentActor.skillTree[key];
            // decide target mode
            if (sk.targetType === 'single') {
                this.mode = 'selectTarget';
            } else {
                this.resolveAction([...(sk.targetType === 'self' ? [this.currentActor] : this.enemyParty)]);
            }
        },

        selectTarget(target) {
            this.resolveAction([target]);
        },

        resolveAction(targets) {
            this.mode = 'resolving';
            const actor = this.currentActor;
            const sk = actor.skillTree[this.selectedSkill];
            targets.forEach(t => sk.execute.call(sk.owner, t, sk.level, true));

            // trigger effects
            actor.checkEffects('onAttack');
            actor.checkEffects('onCastSkill', this.selectedSkill);

            if (this.checkWin()) {
                return;
            }

            // enqueue next actor or end round
            //console.log(this.actionQueue);
            if (this.actionQueue.length) {
                this.nextActor()
            } else {
                this.endRound();
            }
        },

        endRound() {
            // onTurnEnd for all
            [...this.playerParty, ...this.enemyParty].forEach(ch =>
                ch.checkEffects('onTurnEnd')
            );
            this.startNextRound();
        },

        startNextRound() {
            this.actionQueue = shuffle([...this.playerParty, ...this.enemyParty]);
            this.currentActor = null;
            this.selectedSkill = null;
            this.mode = 'selectActor';
            this._log(`新的回合开始`);

            // trigger onTurnStart
            [...this.playerParty, ...this.enemyParty].forEach(ch => {
                ch.updateStats();
                ch.checkEffects('onTurnStart');
            }
            );
            this.nextActor()
        },

        checkWin() {
            const allEnemiesDefeated = this.enemyParty.every(e => e.health <= 0);
            const allPlayersDefeated = this.playerParty.every(p => p.health <= 0);

            if (allEnemiesDefeated) {
                this._log('你赢了！');
                this.handleVictory();
                return true;
            }
            if (allPlayersDefeated) {
                this._log('你输了！');
                this.handleDefeat();
                return true;
            }
            return false;
        },

        handleVictory() {
            this.logs = [];
            let expGained = 0;
            this.enemyParty.forEach(ch => {
                expGained += ch.level * (ch.level + 1)
            })
            this.playerParty.forEach(p => { p.gainExp(expGained); });

            if (this.isChallenge && this.challengeId) {
                const challenge = challenges.find(c => c.id === this.challengeId);
                if (challenge?.onVictory) challenge.onVictory(this);
                this.isChallenge = false;
                this.challengeId = null;
                this.initBattle(this.level);
                return
            }
            if (confirm('进行下一关吗?')) {
                this.level++;
            }
            this.getRandomEquipment();
            this.playerParty.forEach(p => p.skillRate += this.level);
            this.initBattle(this.level);
        },

        handleDefeat() {
            this.logs = [];
            this._log('你被击败了……');
            this.isChallenge = false;
            this.challengeId = null;
            if (this.level > 1) {
                if (confirm('打不过，退回上一关吗?')) {
                    this.level--;
                }
            }
            // 玩家角色恢复状态（不晋级）
            this.playerParty.forEach(ch => {
                ch.health = ch.maxHealth;
                ch.mp = ch.maxMp;
                ch.effects = [];
                ch.updateStats?.();
            });

            this.initBattle(this.level); // 重新挑战同一关
        },

        getRandomEquipment() {
            this.playerParty.forEach(ch => {
                // 半概率武器 / 护甲
                const eq = Math.random() < 0.5
                    ? generateWeapon(this.level)
                    : generateArmor(this.level);
                ch.equipmentList.push(eq);
                this._log(`${ch.name} 获得装备：${eq.name}`);
            });
        },

        upgradeSkill(ch, key) {
            const sk = ch.skillTree[key];
            const cost = sk.cost(sk.level);
            // 依赖检查
            const ok = sk.dependencies.every(dep => ch.skillTree[dep]?.level > 0);
            if (!ok) {
                this._log(`${sk.name} 的依赖尚未满足`);
                return;
            }
            // 技能点检查
            if ((ch.skillRate ?? 0) < cost) {
                this._log(`技能点不足，无法升级 ${sk.name}`);
                return;
            }
            // 扣点并升级
            ch.skillRate -= cost;
            sk.level++;
            this._log(`升级 ${sk.name} 到 Lv${sk.level}`);
        },

        // ---- Logging ----
        _log(msg) {
            this.logs.push(msg);
            if (this.logs.length > 200) this.logs.shift();
        },

        equipItem(ch, idx) {
            const eq = ch.equipmentList[idx];
            if (!eq) return;
            if (eq.equipmentClass === 'weapon') {
                ch.pendingWeapon = eq;
                this._log(`${ch.name} 下一次战斗将装备武器：${eq.name}`);
            } else if (eq.equipmentClass === 'armor') {
                ch.pendingArmor = eq;
                this._log(`${ch.name} 下一次战斗将装备护甲：${eq.name}`);
            } else {
                this._log(`无法识别的装备类型：${eq.equipmentClass}`);
            }
        },

        sellItem(ch, idx) {
            const eq = ch.equipmentList[idx];
            if (!eq) return;
            ch.equipmentList.splice(idx, 1);
            const gain = eq.skillRate || 0;
            ch.skillRate = (ch.skillRate || 0) + gain;
            this._log(`${ch.name} 卖出装备 ${eq.name}，获得 ${gain} 技能点`);
        },

        exportSave() {
            // 这里只示例序列化 playerParty 数组，可根据需求只序列化部分字段
            const data = this.playerParty.map(ch => ({
                name: ch.name,
                level: ch.level,
                exp: ch.exp,
                skillRate: ch.skillRate,
                // 装备栏：inventory，armedWeapon，armedArmor
                equipmentList: ch.equipmentList,
                armedWeapon: ch.armedWeapon,
                armedArmor: ch.armedArmor,
                // 技能等级
                skillTree: Object.fromEntries(
                    Object.entries(ch.skillTree).map(([k, v]) => [k, { level: v.level }])
                )
            }));
            return JSON.stringify({
                level: this.level,
                players: data
            });
        },

        /**
         * 从存档字符串恢复玩家角色数据
         */
        importSave(str) {
            let parsed;
            try {
                parsed = JSON.parse(str);
            } catch (e) {
                this._log('存档解析失败');
                return;
            }
            if (!parsed.players || !Array.isArray(parsed.players)) {
                this._log('存档格式不对');
                return;
            }
            // 恢复关卡（可选）
            if (typeof parsed.level === 'number') {
                this.level = parsed.level;
            }
            // 恢复每位角色的数据
            parsed.players.forEach((pd, idx) => {
                const ch = this.playerParty[idx];
                if (!ch) return;
                ch.name = pd.name;
                ch.skillRate = pd.skillRate;
                ch.level = pd.level;
                ch.exp = pd.exp;
                // 装备
                ch.equipmentList = pd.equipmentList || [];
                ch.armedWeapon = pd.armedWeapon || ch.armedWeapon;
                ch.armedArmor = pd.armedArmor || ch.armedArmor;
                // 技能等级
                if (pd.skillTree) {
                    for (const k in pd.skillTree) {
                        if (ch.skillTree[k]) {
                            ch.skillTree[k].level = pd.skillTree[k].level;
                        }
                    }
                }
                // 最后重新计算属性
                ch.updateStats();
                ch.gainExp(0);
            });
            this._log('存档已加载');
            this.initBattle()
        },

    }
});
