// src/store.js
import { defineStore } from 'pinia';

// 辅助函数
function randomDo(posibility, obj, fn, argv) {
    if (Math.random() < posibility) {
        fn.apply(obj, argv);
    }
}
function attributeBuff(attribute, ob, operator, delta) {
    if (!ob || !attribute) return;
    switch (operator) {
        case '+': ob[attribute] += delta; break;
        case '*': ob[attribute] *= delta; break;
    }
}

function addTimedAutoSkillTrigger(character, skillKey, skillargs, turns, chance = 1.0, expireLog = null) {
    const skill = character.skillTree[skillKey];
    character.effects.push([
        randomDo,
        [chance, character, skill.execute.bind(skill), skillargs],
        {
            trigger: 'onTurnStart',
            durationType: 'turn',
            remaining: turns,
            onExpire() {
                character._log(expireLog ? expireLog : `${skill.name} 的自动触发效果结束`);
            }
        }
    ]);
}


const pfList = ["铁制", "精致的", "黑色的", "火焰的", "恶魔的", "蓝色的", "神圣的", "红色的", "金色的", "暗黑的", "神秘的", "绿色的", "水晶的", "神奇的", "龙鳞的", "神话的", "神器的", "神力的", "神光的", "神速的", "狂暴的", "魔法的", "冰冷的", "风暴的", "毁灭的", "战斗的", "生命的", "死亡的", "狩猎的", "隐秘的", "巨人的", "精灵的", "狼人的", "龙的", "狮子的", "蛇的", "熊的", "猛虎的", "猛鹫的", "邪恶的", "正义的", "勇敢的", "荣耀的", "智慧的", "诅咒的", "恐怖的", "疯狂的", "疾病的", "魔毒的", "毒蛇的", "暴风的", "雷霆的", "寒冰的", "地震的", "岩石的", "沙漠的", "海洋的", "灼热的", "奥术的", "元素的"];
const weaponNameList = ['长剑', '短剑', '刀', '匕首', '斧头', '大锤', '钉锤', '链锤', '钩镰', '长弓', '短弓', '弩', '长枪', '短枪', '长矛', '短矛', '长棍', '短棍', '弯刀', '战斧', '飞刀', '镰刀', '长鞭', '短鞭', '拳套', '钢爪', '飞镖', '法杖', '魔杖', '魔法书', '魔法卷轴', '火枪', '冰枪', '光剑'];
const armorNameList = ['布甲', '皮甲', '棉甲', '锁子甲', '板甲', '重甲', '鳞甲', '长袍', '法袍', '袈裟', '防弹衣', '链甲', '札甲', '藤甲', '骨甲', '革甲', '鳞袍', '轻甲', '胸甲', '护心甲', '铁衣'];
// 额外效果函数（名字对应 globalEffectMapping）
function exAttack(amount) { this.attackEnemy(this.enemy, amount, true); }
function exHeal(amount) { this.health = Math.min(this.maxHealth, this.health + Math.floor(this.maxHealth * amount * 0.01)); }
function exBoost(amount) { if (amount > Math.random()) this.skillTree.boost.execute(this, this.skillTree.boost.level, true); }
function exDefBoost(amount) { if (amount > Math.random()) this.skillTree.defenceBoost.execute(this, this.skillTree.defenceBoost.level, true); }
const globalEffectMapping = { exAttack, exHeal, exBoost, exDefBoost };

// 随机装备生成逻辑
function randomEquipPf(rarity) {
    const prefixes = [];
    for (let i = 0; i < rarity; i++) {
        const pf = pfList[Math.floor(Math.random() * pfList.length)];
        if (!prefixes.includes(pf)) {
            prefixes.push(pf);
        }
    }
    return prefixes;
}
function randomWeaponEffect(rarity) {
    const effectPool = ['exAttack', 'exHeal', 'exBoost', 'exDefBoost'];
    const effectMap = {};

    for (let i = 0; i < rarity; i++) {
        const eff = effectPool[Math.floor(Math.random() * effectPool.length)];

        let value = 0;
        switch (eff) {
            case 'exAttack': value = Math.random() * 100; break;
            case 'exHeal': value = Math.random() * 10; break;
            case 'exBoost': value = Math.random() * 0.25; break;
            case 'exDefBoost': value = Math.random() * 0.25; break;
        }

        // 累加效果数值
        if (!effectMap[eff]) effectMap[eff] = 0;
        effectMap[eff] += value;
    }

    return Object.entries(effectMap).map(([eff, val]) => [eff, parseFloat(val.toFixed(2))]);
}

function randomArmorEffect(rarity) {
    return [];
}

export const useGameStore = defineStore('game', {
    state: () => ({
        // player: null,
        // enemy: null,
        // pendingSkills: [],
        // pendingWeapon: null,
        // pendingArmor: null,
        logs: [],
        level: 1,
        levelstr: '',
        isChallenge: false,
        challengeLevel: null,

        // 新增
        playerParty: [],
        enemyParty: [],
        actionQueue: [],
        currentActor: null,
        selectedSkill: null,
        mode: 'init'// 'init'|'selectActor'|'selectSkill'|'selectTarget'|'resolving'
    }),
    actions: {
        // 初始化游戏
        init(name) {
            this.level = 1;
            this.levelstr = '';
            this.player = new Character(name || '你');
            this.player._log = this._log.bind(this);
            this.setAbility();
        },

        initBattle() {
            // 1. 生成新一关的敌人阵营
            this.enemyParty = [];
            for (let i = 0; i < Math.random() * (1 + 0.02 * this.level); i++) {
                const enemy = new Enemy(/* 名称或等级 */ `敌人${i + 1}`, this.level);
                enemy._log = this._log.bind(this);
                // 重置属性与效果
                enemy.effects = [];
                enemy.updateStats();
                enemy.health = enemy.maxHealth;
                this.enemyParty.push(enemy);
            }

            // 2. 重置玩家阵营的每个角色
            this.playerParty.forEach(ch => {
                ch.effects = [];
                ch.updateStats();
            });

            // 3. 装备 & 技能生效（如果你将 pending 挂到每个角色上）
            //    假设 ch.pendingWeapon / pendingArmor / pendingSkills
            this.playerParty.forEach(ch => {
                if (ch.pendingWeapon) {
                    ch.armedWeapon = ch.pendingWeapon;
                    ch.pendingWeapon = null;
                }
                if (ch.pendingArmor) {
                    ch.armedArmor = ch.pendingArmor;
                    ch.pendingArmor = null;
                }
                if (Array.isArray(ch.pendingSkills) && ch.pendingSkills.length) {
                    ch.activeSkills = [...ch.pendingSkills];
                    ch.pendingSkills = [];
                }
                // 重新算一次属性
                ch.updateStats();
                ch.health = ch.maxHealth;
            });

            // 4. 构建行动队列（等待character更新）
            this.actionQueue = [...this.playerParty, ...this.enemyParty]
                .sort(() => Math.random() - 0.5);

            // 5. 切入selectActor
            this.currentActor = null;
            this.mode = 'selectActor';
            //this._log(`开始第${this.level}关战斗，阵营准备完毕`);
        },

        startNextRound() {
            // 重建行动队列，顺序可按速度或随机
            this.actionQueue = shuffle([...this.playerParty, ...this.enemyParty]);
            // 重置选择
            this.currentActor   = null;
            this.selectedSkill  = null;
            // 切回选角色阶段
            this.mode = 'selectActor';
            this._log(`第 ${this.level} 回合开始`);
      
            // 触发 onTurnStart 效果
            [...this.playerParty, ...this.enemyParty].forEach(ch => {
              ch.checkEffects('onTurnStart');
            });
          },

        //当玩家-AI 选中一个角色来行动时调用
        nextActor(actor) {
            this.currentActor = actor;
            this.mode = 'selectSkill';
            //this._log(`轮到 ${actor.name} 行动`);
        },

        selectSkill(key) {
            this.selectedSkill = key;
            const sk = this.currentActor.skillTree[key];
            // 判断技能目标类型（假设 sk.targetType）
            if (sk.targetType === 'single') {
                this.mode = 'selectTarget';
            } else {
                // 群体或自体直接执行
                this.resolveAction(this.currentActor, key, this.getTargets(sk.targetType));
            }
        },

        selectTarget(target) {
            this.resolveAction(this.currentActor, this.selectedSkill, [target]);
        },

        // resolveAction() 对应 'resolving'
        resolveAction(actor, key, targets) {
            this.mode = 'resolving';
            const sk = actor.skillTree[key];
            targets.forEach(t => {
                sk.execute.call(sk.owner, t, sk.level, true);
            });
            // 触发攻击或施法类效果
            actor.checkEffects('onAttack');
            actor.checkEffects('onCastSkill', key);
            // 执行完一个行动后，继续下一个
            if (this.actionQueue.length) {
                this.mode = 'selectActor';
            } else {
                this.mode = 'endRound';
            }
        },

        endRound() {
            // 回合结束触发
            [...this.playerParty, ...this.enemyParty].forEach(ch => {
                ch.checkEffects('onTurnEnd');
            });
            // 新一回合重新排队
            this.initBattle();  // 或者专门的 startNextRound()
        },



        // 不知道为什么取了这个名字，但是发展成为回合完整逻辑了
        playerUseSkill(key) {
            this.player.updateStats();
            this.enemy.updateStats();

            this.player.checkEffects('onTurnStart');
            this.enemy.checkEffects('onTurnStart');

            const sk = this.player.skillTree[key] || this.player.skillTree.normalAtk;
            sk.execute.call(sk.owner, this.enemy, sk.level, true);

            this.enemyAction();

            // 在这里统一扣“turn”型 Buff
            this.player.checkEffects('onTurnEnd');
            this.enemy.checkEffects('onTurnEnd');

            this.checkWin();
        },

        enemyAction() {
            const avail = Object.values(this.enemy.skillTree).filter(s => s.level > 0);
            const sk = avail.length ? avail[Math.floor(Math.random() * avail.length)] : this.enemy.skillTree.normalAtk;
            sk.execute.call(sk.owner, this.player, sk.level, true);
        },

        checkWin() {
            if (this.enemy.health <= 0) {
                this._log('你赢了！');
                this.handleVictory();
                return true;
            }
            if (this.player.health <= 0) {
                this._log('你输了！');
                this.handleDefeat();
                return true;
            }
            return false;
        },

        handleVictory() {
            // 特殊挑战分支
            if (this.levelstr === '陈瑞洋') {
                this.wincry();
            } else if (this.levelstr === '东方不败') {
                this.windfbb();
            }
            if (confirm('进行下一关吗?')) {
                this.level++;
            }
            this._log('敌人升级!');
            this.getRandomEquipment();
            this.addAbility();
            this.setAbility();
        },

        handleDefeat() {
            this.levelstr = "";
            this.setAbility();
        },

        // 装备相关
        equipItem(idx) {
            const item = this.player.equipmentList[idx];
            if (!item) return;
            if (item.equipmentClass === 'weapon') {
                this.pendingWeapon = item;
                this._log(`已选择武器 ${item.name}，下次战斗时生效`);
            } else {
                this.pendingArmor = item;
                this._log(`已选择护甲 ${item.name}，下次战斗时生效`);
            }
        },
        sellItem(idx) {
            const item = this.player.equipmentList.splice(idx, 1)[0];
            this.player.skillRate += item.skillRate;
            this._log(`出售装备 ${item.name}，获得 ${item.skillRate} 技能点`);
        },
        moveItemToBottom(idx) {
            const [item] = this.player.equipmentList.splice(idx, 1);
            this.player.equipmentList.push(item);
        },

        togglePendingSkill(key) {
            const idx = this.pendingSkills.indexOf(key);
            if (idx >= 0) {
                this.pendingSkills.splice(idx, 1);
                this._log(`取消下次战斗装备技能：${this.player.skillTree[key].name}`);
            } else if (this.pendingSkills.length < 5) {
                this.pendingSkills.push(key);
                this._log(`下次战斗将装备技能：${this.player.skillTree[key].name}`);
            } else {
                this._log('主动技能栏已满，下次战斗只能装备 5 个');
            }
        },

        // 挑战
        cryChallenge() {
            if (this.player.skillRate < 604) {
                this._log('技能点不足，无法挑战陈瑞洋');
                return;
            }
            this.player.skillRate -= 604;
            this.level = 15;
            this.levelstr = '陈瑞洋';
            this.setAbility();
            this.enemy.name = '陈瑞洋';
            this.enemy.selfHealthPlus = 504.5;
            this.enemy.selfAtkPlus = 75;
            this.enemy.boosted = 1;
            this.enemy.selfDefPlus = 211;
            this.enemy.updateStats();
            alert('就你也想拿604.5?\n致敬单科缺考604.5大神');
        },
        wincry() {
            this.player.equipmentList.push({
                name: '陈瑞洋的语数英',
                equipmentClass: 'weapon',
                atkPlus: 12, atkMult: 2, skillRate: 604,
                effect: [['exAttack', 80.6]], rary: 4
            });
            this.player.equipmentList.push({
                name: '李乐贤的物化生',
                equipmentClass: 'armor',
                healthPlus: 211, healthMult: 1.4, defPlus: 85, defMult: 1.4,
                skillRate: 593, effect: []
            });
            alert('不愧是你，就连李乐贤看了都说好');
        },

        dfbbChallenge() {
            if (this.player.skillRate < 1980) {
                this._log('技能点不足，无法挑战东方不败');
                return;
            }
            this.player.skillRate -= 1980;
            this.level = 30;
            this.levelstr = '东方不败';
            this.setAbility();
            this.enemy.name = '东方不败';
            this.enemy.selfHealthPlus = 190;
            this.enemy.selfAtkPlus = 140;
            this.enemy.boosted = 20;
            this.enemy.selfDefPlus = 810;
            this.enemy.updateStats();
            alert('钱到位了，人够不够格呢?');
        },
        windfbb() {
            this.player.equipmentList.push({
                name: '葵花宝典',
                equipmentClass: 'weapon',
                atkPlus: 30, atkMult: 2, skillRate: 5000,
                effect: [['exHeal', 0.1], ['exBoost', 0.3]], rary: 4
            });
            alert('小子骨骼惊奇，日后定为大内一流人物啊!');
        },

        // 技能树
        upgradeSkill(key) {
            const sk = this.player.skillTree[key];
            const cost = sk.cost(sk.level);
            const ok = sk.dependencies.every(dep => this.player.skillTree[dep].level > 0);
            if (!ok) { this._log(`${sk.name} 依赖未满足`); return; }
            if (this.player.skillRate < cost) {
                this._log(`技能点不足，无法升级 ${sk.name}`); return;
            }
            this.player.skillRate -= cost;
            sk.level++;
            this._log(`升级 ${sk.name} 到 Lv${sk.level}`);
        },
        toggleActiveSkill(key) {
            const idx = this.player.activeSkills.indexOf(key);
            if (idx >= 0) {
                this.player.activeSkills.splice(idx, 1);
                this._log(`移除了主动技能 ${this.player.skillTree[key].name}`);
            } else if (this.player.activeSkills.length < 5) {
                this.player.activeSkills.push(key);
                this._log(`添加了主动技能 ${this.player.skillTree[key].name}`);
            } else {
                this._log('主动技能栏已满');
            }
        },

        // 存档
        exportSave() {
            const obj = {
                name: this.player.name,
                skillRate: this.player.skillRate,
                equipmentList: this.player.equipmentList,
                armedWeapon: this.player.armedWeapon,
                armedArmor: this.player.armedArmor,
                skillTree: Object.fromEntries(
                    Object.entries(this.player.skillTree).map(([k, v]) => [k, { level: v.level }])
                )
            };
            return JSON.stringify(obj);
        },
        importSave(str) {
            let data;
            try { data = JSON.parse(str); } catch {
                this._log('存档解析失败');
                return;
            }
            Object.assign(this.player, {
                name: data.name,
                skillRate: data.skillRate,
                equipmentList: data.equipmentList,
                armedWeapon: data.armedWeapon,
                armedArmor: data.armedArmor
            });
            for (const k in data.skillTree) {
                if (this.player.skillTree[k]) this.player.skillTree[k].level = data.skillTree[k].level;
            }
            this.player.updateStats();
            this._log('存档已加载');
        },

        // 日志
        _log(msg) { this.logs.push(msg); },
        clearLogs() { this.logs = []; },

        // 随机装备与属性点
        getRandomEquipment() {
            const isWeapon = Math.random() < 0.5
            const rarity = Math.floor(Math.log(1 - Math.random()) / Math.log(0.3));

            // 生成前缀列表
            const pfs = randomEquipPf(rarity);
            if (isWeapon) {
                // 武器部分
                const baseName = weaponNameList[Math.floor(Math.random() * weaponNameList.length)];
                const name = pfs.join('') + baseName;
                const eff = randomWeaponEffect(rarity);
                const atkPlus = Math.floor((0.5 + 0.5 * Math.random()) * (Math.pow(1.05, this.level) + this.level));
                const atkMult = 1 + rarity * 0.2 + 0.2 * Math.random();
                const weapon = {
                    name,
                    equipmentClass: 'weapon',
                    atkPlus,
                    atkMult,
                    effect: eff,
                    skillRate: Math.pow(this.level, 2) * rarity,
                    rary: rarity
                };
                this.player.equipmentList.push(weapon);
                this._log(`获得新武器：${name}`);
            } else {
                // 护甲部分
                const baseName = armorNameList[Math.floor(Math.random() * armorNameList.length)];
                const name = pfs.join('') + baseName;
                const eff = randomArmorEffect(rarity);
                const healthPlus = Math.floor(10 * (0.5 + 0.5 * Math.random()) * (Math.pow(1.05, this.level) + this.level));
                const healthMult = 1 + rarity * 0.2 + 0.2 * Math.random();
                const defPlus = Math.floor((0.5 + 0.5 * Math.random()) * Math.pow(this.level, 1.5));
                const defMult = 1 + rarity * 0.2 + 0.2 * Math.random();
                const armor = {
                    name,
                    equipmentClass: 'armor',
                    healthPlus,
                    healthMult,
                    defPlus,
                    defMult,
                    effect: eff,
                    skillRate: Math.floor(Math.pow(1.03, this.level) * rarity * 5 + this.level),
                    rary: rarity
                };
                this.player.equipmentList.push(armor);
                this._log(`获得新护甲：${name}`);
            }

        },

        // 升级属性（小卖部）
        addAbility() {
            this.player.skillRate++;
            const action = Math.floor(Math.random() * 6);
            switch (action) {
                case 0: this.player.selfDefPlus += Math.floor(Math.random() * Math.pow(this.level, 0.7)); break;
                case 1: this.player.selfAtkPlus += Math.floor(0.1 * Math.random() * Math.pow(this.level, 0.7)); break;
                case 2: this.player.selfHealthPlus += Math.floor(Math.random() * this.level); break;
                case 3: this.player.selfDefMult += 0.1; break;
                case 4: this.player.selfAtkMult += 0.1; break;
                case 5: this.player.selfHealthMult += 0.1; break;
            }
            this._log('角色属性提升');
        }
    }
});


// ---------- Character 与 Enemy 类定义 ----------

class Character {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 10;
        this.defence = 0;
        this.boosted = 0;
        this.defBoosted = 0;
        this.effects = [];

        this.selfHealthPlus = 0;
        this.selfAtkPlus = 0;
        this.selfDefPlus = 0;
        this.selfHealthMult = 1;
        this.selfAtkMult = 1;
        this.selfDefMult = 1;

        this.skillRate = 5;
        this.equipmentList = [
            { name: '未装备剑', equipmentClass: 'weapon', atkPlus: 0, atkMult: 1, effect: [], skillRate: 10, rary: "初始" },
            { name: '未装备护甲', equipmentClass: 'armor', healthPlus: 0, healthMult: 1, defPlus: 0, defMult: 1, effect: [], skillRate: 10, rary: "初始" }
        ];
        this.armedWeapon = this.equipmentList[0];
        this.armedArmor = this.equipmentList[1];

        this.skillTree = this._createSkillTree();
        this.activeSkills = ['normalAtk'];
    }

    // 深拷贝原脚本 skillTree 并实现 execute
    _createSkillTree() {
        const template = {
            normalAtk: {
                name: "普通攻击",
                description: lvl =>
                    `威力: ${100 + 5 * lvl}\n最普通的攻击`,
                level: 1,
                maxLevel: 10,
                dependencies: [],
                cost: lvl => Math.floor(100 * Math.pow(1.05, lvl)),
                execute: null
            },
            swiftAtk: {
                name: "迅捷打击",
                description: lvl =>
                    `威力: ${100 + 4 * lvl}\n4回合内，回合开始时，${((0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) * 100).toFixed(1)}%在回合初额外使用一次lv${lvl}普通攻击`,
                level: 0,
                maxLevel: 10,
                dependencies: ["normalAtk"],
                cost: lvl => Math.floor(200 * Math.pow(1.1, lvl)),
                execute: null
            },
            afterimage: {
                name: "残影步",
                description: lvl =>
                    `消除对方攻防强化\n4回合内，回合开始时，${((0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) * 100).toFixed(1)}%在回合初额外使用一次lv${lvl}迅捷打击`,
                level: 0,
                maxLevel: 5,
                dependencies: ["swiftAtk"],
                cost: lvl => Math.floor(300 * Math.pow(1.2, lvl)),
                execute: null
            },
            windRage: {
                name: "狂风暴击",
                description: lvl => {
                    const base = 200 + 10 * lvl;
                    const proc = ((0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) * 100);
                    return `造成${base}点固定伤害，${(proc / 2).toFixed(1)}%造成${200 + 5 * lvl}%伤害\n4回合内，回合开始时，${proc.toFixed(1)}%在回合初额外使用一次lv${lvl}迅捷打击`;
                },
                level: 0,
                maxLevel: 5,
                dependencies: ["afterimage"],
                cost: lvl => Math.floor(400 * Math.pow(1.3, lvl)),
                execute: null
            },
            dispel: {
                name: "驱散",
                description: lvl =>
                    `移除自身所有所有临时状态。`,
                level: 0,
                maxLevel: 1,
                dependencies: ["normalAtk"],
                cost: lvl => 500,
                execute: null
            },
            roar: {
                name: "威吓",
                description: lvl => {
                    const factor = Math.max(0.75, 0.9 - 0.01 * lvl);
                    return `降低目标攻击力至 ${(factor * 100).toFixed(1)}% ，持续 ${Math.min(5, 2 + Math.floor(0.1 * lvl))} 回合`;
                },
                level: 0,
                maxLevel: 5,
                dependencies: ["dispel"],
                cost: lvl => Math.floor(300 * Math.pow(1.25, lvl)),
                execute: null
            },
            boost: {
                name: "力量提升",
                description: lvl =>
                    `提升自身攻击力 +${lvl} 层`,
                level: 0,
                maxLevel: 5,
                dependencies: ["roar"],
                cost: lvl => Math.floor(400 * Math.pow(1.25, lvl)),
                execute: null
            },
            defenceBoost: {
                name: "防御提升",
                description: lvl =>
                    `提升自身防御力 +${lvl} 层`,
                level: 0,
                maxLevel: 5,
                dependencies: ["boost"],
                cost: lvl => Math.floor(400 * Math.pow(1.3, lvl)),
                execute: null
            },
            toxicMist: {
                name: "毒雾",
                description: lvl =>
                    `覆盖目标并持续中毒,下${Math.min(5, 2 + Math.floor(0.1 * lvl))} 回合，每回合开始时造成 ${Math.floor(4 * Math.pow(1.1, lvl))} 伤害`,
                level: 0,
                maxLevel: 5,
                dependencies: ["normalAtk"],
                cost: lvl => Math.floor(150 * Math.pow(1.15, lvl)),
                execute: null
            },
            toxicSlice: {
                name: "毒刃",
                description: lvl =>
                    `威力:${60 + 3 * lvl}\n下${Math.min(5, 2 + Math.floor(0.1 * lvl))}次攻击额外造成 ${0.2 + 0.01 * lvl}%攻击数值的固定伤害`,
                level: 0,
                maxLevel: 5,
                dependencies: ["toxicMist"],
                cost: lvl => Math.floor(200 * Math.pow(1.2, lvl)),
                execute: null
            },
            heal: {
                name: "治疗",
                description: lvl =>
                    `治疗自身 ${50 + 20 * lvl} 点生命`,
                level: 0,
                maxLevel: 5,
                dependencies: ["normalAtk"],
                cost: lvl => Math.floor(300 * Math.pow(1.15, lvl)),
                execute: null
            }
        };

        const tree = {};
        for (const k in template) {
            tree[k] = { ...template[k], owner: this };
        }
        // execute 实现
        tree.normalAtk.execute = (target, lvl, logSign = true) => {
            const dmg = this.attackEnemy(target, 100 + 5 * lvl, logSign);
            this._log(`${this.name} 使用 Lv${lvl} 普通攻击，对 ${target.name} 造成了 ${dmg} 点伤害！`);
        };
        tree.swiftAtk.execute = (target, lvl, logSign = true) => {
            if (tree.swiftAtk.level < 0 && logSign) { this._log(`${this.name} 的迅捷打击未解锁`); return; }
            const dmg = this.attackEnemy(target, 100 + 4 * lvl, logSign);
            this._log(`${this.name} 使用 Lv${lvl} 迅捷打击，对 ${target.name} 造成了 ${dmg} 点伤害，留下了连击的可能!`);
            addTimedAutoSkillTrigger(
                this, // character
                'normalAtk', // skillKey
                [target, lvl, false], // skillargs
                4, // turns
                (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), // chance
                `${this.name}的速度减缓到正常水平了！`
            );
        };
        tree.afterimage.execute = (target, lvl, logSign = true) => {
            if (tree.afterimage.level < 0 && logSign) { this._log(`${this.name} 的残影步未解锁`); return; }
            target.boosted--; target.defBoosted--;
            this._log(`${this.name} 施展 Lv${lvl} 残影步，消除了对方攻防强化，脚下生风!!`);
            addTimedAutoSkillTrigger(
                this, // character
                'swiftAtk', // skillKey
                [target, lvl, false], // skillargs
                4, // turns
                (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), // chance
                `${this.name}的残影消失了！`
            );
        };
        tree.windRage.execute = (target, lvl, logSign = true) => {
            if (tree.windRage.level < 0 && logSign) { this._log(`${this.name} 的狂风暴击未解锁`); return; }
            const damageRate = (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) / 2 > Math.random() ? (2 + 0.05 * lvl) : 1;
            const dmg = Math.floor(0.1 * this.attack + 10 * Math.pow(1.05, lvl) * damageRate);
            this._log(`${this.name} 施展 Lv${lvl} 狂风暴击，对 ${target.name} 造成了 ${dmg} 点伤害，风之力带来一系列的后劲!`);
            addTimedAutoSkillTrigger(
                this, // character
                'afterimage', // skillKey
                [target, lvl, false], // skillargs
                4, // turns
                (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), // chance
                `${this.name}的狂风之力消失了！`
            );
        };
        tree.dispel.execute = (target, lvl, logSign = true) => {
            if (tree.dispel.level < 0 && logSign) return this._log(`${this.name} 的驱散未解锁`);
            this._log(`${this.name} 施展 Lv${lvl} 驱散，清除了所有状态!`);

            // 移除自己身上所有“可驱散”的 Buff
            const before = this.effects.length;

            this.effects = this.effects.filter(([fn, args, meta]) => {
                // 判断是否为可移除 Buff
                const isDispellable =
                    remaining === Infinity;

                if (isDispellable) {
                    // 立即触发 onExpire 回调
                    if (typeof meta.onExpire === 'function') {
                        meta.onExpire.call(this);
                    }
                    return false; // 移除
                }
                return true; // 保留
            });
            const removed = before - this.effects.length;
            this._log(`驱散成功，移除了 ${removed} 个状态`);
        };

        tree.heal.execute = (target, lvl, logSign = true) => {
            if (tree.heal.level < 0 && logSign) { this._log(`${this.name} 的治疗未解锁`); return; }
            const amt = 50 + 20 * lvl;
            this.health = Math.min(this.maxHealth, this.health + amt);
            this._log(`${this.name} 施展 Lv${lvl} 治疗，恢复了 ${amt} 点生命值!`);
        };
        tree.boost.execute = (target, lvl, logSign = true) => {
            if (tree.boost.level < 0 && logSign) { this._log(`${this.name} 的力量提升未解锁`); return; }
            this.boosted += lvl;
            this._log(`${this.name} 施展 Lv${lvl} 力量提升，攻击力提高!`);
        };
        tree.defenceBoost.execute = (target, lvl, logSign = true) => {
            if (tree.defenceBoost.level < 0 && logSign) { this._log(`${this.name} 的防御提升未解锁`); return; }
            this.defBoosted += lvl;
            this._log(`${this.name} 施展 Lv${lvl} 防御提升，防御力提高!`);
        };
        tree.toxicMist.execute = (tgt, lvl, logSign = true) => {
            if (tree.toxicMist.level < 0 && logSign) return this._log(`${this.name} 的毒雾未解锁`);
            this._log(`${this.name} 使用 Lv${lvl} 毒雾，${tgt.name} 正在被侵蚀`);
            this.effects.push([
                () => tgt.damaged(Math.floor(4 * Math.pow(1.1, lvl)), false),
                [],
                {
                    trigger: 'onTurnStart',
                    durationType: 'turn',
                    remaining: Math.min(5, 2 + Math.floor(0.1 * lvl)),
                    onExpire() { this._log(`${this.name} 释放的毒雾消散了！`); }
                }
            ]);
        };
        tree.toxicSlice.execute = (tgt, lvl, logSign = true) => {
            if (tree.toxicSlice.level < 0 && logSign) return this._log(`${this.name} 的毒刃未解锁`);
            const base = 60 + 3 * lvl;
            const hit = this.attackEnemy(tgt, base, log);
            this._log(`${this.name} 使用 Lv${lvl} 毒刃，造成 ${hit} 点伤害，并附加中毒`);
            // 中毒次数型：下 N 次攻击触发
            this.effects.push([
                (target) => target.damaged(Math.floor(this.attack * (0.2 + 0.01 * lvl)), false),
                [tgt],
                {
                    trigger: 'onAttack',
                    durationType: 'count',
                    remaining: Math.min(5, 2 + Math.floor(0.1 * lvl)),
                    onExpire() {
                        this._log(`${this.name} 的毒刃效果耗尽`);
                    }
                }
            ]);
        };
        tree.roar.execute = (tgt, lvl, logSign = true) => {
            if (tree.roar.level < 0 && logSign) return this._log(`${this.name} 的威吓未解锁`);

            const factor = Math.max(0.75, 0.9 - 0.01 * lvl);
            this._log(`${this.name} 使用 Lv${lvl} 威吓，${tgt.name} 的攻击力下降`);

            tgt.effects.push([
                attributeBuff,
                ['attack', tgt, '*', factor],
                {
                    trigger: 'updateStats',
                    durationType: 'turn',
                    remaining: Math.min(5, 2 + Math.floor(0.1 * lvl)),
                    // 不需要 onExpire，效果在失效后自然不再生效
                }
            ]);
        };

        return tree;
    }

    // 更新属性
    updateStats() {
        this.atkPlus = this.armedWeapon.atkPlus + this.selfAtkPlus;
        this.atkMult = this.armedWeapon.atkMult * this.selfAtkMult;
        this.healthPlus = this.armedArmor.healthPlus + this.selfHealthPlus;
        this.healthMult = this.armedArmor.healthMult * this.selfHealthMult;
        this.defPlus = this.armedArmor.defPlus + this.selfDefPlus;
        this.defMult = this.armedArmor.defMult * this.selfDefMult;
        this.maxHealth = Math.floor((100 + this.healthPlus) * this.healthMult);
        this.attack = Math.floor((10 + this.atkPlus) * this.atkMult);
        this.defence = Math.floor(this.defPlus * this.defMult);
        this.checkEffects('updateStats');
        if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    // 受伤
    damaged(dmg) {
        this.health = Math.max(0, this.health - dmg);
    }

    // 攻击计算，返回造成的伤害
    attackEnemy(target, power, logSign) {
        const base = this.boosted ? this.attack * (1 + 0.1 * this.boosted) : this.attack;
        const dmg = Math.floor(base * power / (100 + target.defence * (1 + 0.1 * target.defBoosted)));
        target.damaged(dmg);
        this.checkEffects("onAttack")
        if (logSign) this._log(`${this.name} 对 ${target.name} 造成了 ${dmg} 点伤害！`);
        this.updateStats();
        target.updateStats();
        return dmg;
    }

    // 效果队列检查
    checkEffects(triggerType, ...triggerArgs) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const [fn, args, meta] = this.effects[i];
            // 仅触发匹配时机的效果
            if (meta.trigger === triggerType) {
                fn.apply(this, args.concat(triggerArgs));

                // 如果是“次数型”则在触发时扣减
                if (meta.durationType === 'count') {
                    meta.remaining--;
                }
            }
        }

        // 如果是“回合型”，在回合结束时统一扣减
        if (triggerType === 'onTurnEnd') {
            this.effects.forEach(([_, __, meta]) => {
                if (meta.durationType === 'turn') {
                    meta.remaining--;
                }
            });
        }

        // 清理到期效果，并调用 onExpire
        this.effects = this.effects.filter(([_, __, meta]) => {
            if (meta.remaining <= 0) {
                meta.onExpire?.call(this);
                return false;
            }
            return true;
        });
    }


    _log(msg) {
        // 通过 store._log 注入
    }
}

class Enemy extends Character {
    constructor(level) {
        super(`level${level} 敌人`);
        this.level = level;
        this.selfHealthPlus = Math.floor(10 * level + 100 * Math.pow(1.08, level) - 100);
        this.selfAtkPlus = Math.floor(level - 19 + 10 * Math.pow(1.075, level));
        this.selfDefPlus = Math.floor(10 + Math.pow(level, 2) / 2);
        this.updateStats();
        // 随机升级
        for (let i = 0; i < level; i++) {
            this.levelUpRandomSkill();
        }
    }
    canUpgrade(s) {
        return s.level < s.maxLevel && s.dependencies.every(dep => this.skillTree[dep].level > 0);
    }
    levelUpRandomSkill() {
        const cand = Object.values(this.skillTree).filter(s => this.canUpgrade(s));
        if (!cand.length) return;
        cand[Math.floor(Math.random() * cand.length)].level++;
    }
}

