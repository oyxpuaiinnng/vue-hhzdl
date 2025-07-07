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
        player: null,
        enemy: null,
        level: 1,
        levelstr: '',
        logs: []
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

        // 根据 level 设置属性、生成新敌人
        setAbility() {
            // 重置玩家Buff/效果但保留装备和技能
            this.player.effects = [];
            this.player.boosted = 0;
            this.player.defBoosted = 0;
            this.player.updateStats();
            this.player.health = this.player.maxHealth;
            // 生成敌人
            this.enemy = new Enemy(this.level);
            this.enemy.effects = [];
            this.enemy.boosted = 0;
            this.enemy.defBoosted = 0;
            this.enemy.updateStats();
            this.enemy.health = this.enemy.maxHealth;
            this._log(`进入第 ${this.level} 关：${this.enemy.name}`);
            this.enemy._log = this._log.bind(this);
        },

        // 技能树、普通攻击混合调用
        playerUseSkill(key) {
            this.clearLogs();
            // 更新属性与效果
            this.player.updateStats();
            this.enemy.updateStats();
            this.player.checkEffects(randomDo);
            // 执行技能
            const skill = this.player.skillTree[key] || this.player.skillTree.normalAtk;
            skill.execute.call(skill.owner, key === 'heal' ? this.player : this.enemy, skill.level, true);
            // 判定胜负
            if (this.checkWin()) return;
            // 敌人行动
            this.enemyAction();
            this.checkWin();
        },

        enemyAction() {
            this.enemy.checkEffects(randomDo);
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
            this.setAbility();
        },

        // 装备相关
        equipItem(idx) {
            const item = this.player.equipmentList[idx];
            if (!item) return;
            if (item.equipmentClass === 'weapon') {
                this.player.armedWeapon = item;
            } else {
                this.player.armedArmor = item;
            }
            this.player.updateStats();
            this._log(`${item.equipmentClass} 已装备：${item.name}`);
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

        // 小卖部挑战
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
            { name: '未装备剑', equipmentClass: 'weapon', atkPlus: 0, atkMult: 1, effect: [], skillRate: 10 },
            { name: '未装备护甲', equipmentClass: 'armor', healthPlus: 0, healthMult: 1, defPlus: 0, defMult: 1, effect: [], skillRate: 10 }
        ];
        this.armedWeapon = this.equipmentList[0];
        this.armedArmor = this.equipmentList[1];

        this.skillTree = this._createSkillTree();
        this.activeSkills = ['normalAtk'];
    }

    // 深拷贝原脚本 skillTree 并实现 execute
    _createSkillTree() {
        const template = {
            normalAtk: { name: "普通攻击", description: "基础攻击，无依赖", level: 1, maxLevel: 10, dependencies: [], cost: lvl => Math.floor(100 * Math.pow(1.05, lvl)), execute: null },
            swiftAtk: { name: "迅捷打击", description: "对敌人造成迅捷打击，并留下连击可能", level: -1, maxLevel: 10, dependencies: ["normalAtk"], cost: lvl => Math.floor(200 * Math.pow(1.1, lvl)), execute: null },
            afterimage: { name: "残影步", description: "消除了对方攻防强化，脚下生风", level: -1, maxLevel: 5, dependencies: ["swiftAtk"], cost: lvl => Math.floor(300 * Math.pow(1.2, lvl)), execute: null },
            windRage: { name: "狂风暴击", description: "对敌人造成高额伤害，并提高暴击率", level: -1, maxLevel: 5, dependencies: ["afterimage"], cost: lvl => Math.floor(400 * Math.pow(1.3, lvl)), execute: null },
            dispel: { name: "驱散", description: "移除自身所有负面状态", level: -1, maxLevel: 1, dependencies: ["normalAtk"], cost: lvl => 500, execute: null },
            heal: { name: "治疗", description: "恢复自身生命值", level: -1, maxLevel: 5, dependencies: ["dispel"], cost: lvl => Math.floor(300 * Math.pow(1.15, lvl)), execute: null },
            boost: { name: "力量提升", description: "提升自身攻击力", level: -1, maxLevel: 5, dependencies: ["heal"], cost: lvl => Math.floor(400 * Math.pow(1.25, lvl)), execute: null },
            defenceBoost: { name: "防御提升", description: "提高自身防御力", level: -1, maxLevel: 5, dependencies: ["boost"], cost: lvl => Math.floor(400 * Math.pow(1.3, lvl)), execute: null }
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
            if (tree.swiftAtk.level < 0) { this._log(`${this.name} 的迅捷打击未解锁`); return; }
            const dmg = this.attackEnemy(target, 100 + 4 * lvl, logSign);
            this._log(`${this.name} 使用 Lv${lvl} 迅捷打击，对 ${target.name} 造成了 ${dmg} 点伤害，留下了连击的可能!`);
            this.effects.push([randomDo, [(0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), this, tree.normalAtk.execute.bind(tree.normalAtk), [target, lvl, false]], 4]);
        };
        tree.afterimage.execute = (target, lvl, logSign = true) => {
            if (tree.afterimage.level < 0) { this._log(`${this.name} 的残影步未解锁`); return; }
            target.boosted--; target.defBoosted--;
            this._log(`${this.name} 施展 Lv${lvl} 残影步，消除了对方攻防强化，脚下生风!!`);
            this.effects.push([randomDo, [(0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), this, tree.swiftAtk.execute.bind(tree.swiftAtk), [target, lvl, false]], 4]);
        };
        tree.windRage.execute = (target, lvl, logSign = true) => {
            if (tree.windRage.level < 0) { this._log(`${this.name} 的狂风暴击未解锁`); return; }
            const dmg = this.attackEnemy(target, 200 + 10 * lvl, 2);
            this._log(`${this.name} 施展 Lv${lvl} 狂风暴击，对 ${target.name} 造成了 ${dmg} 点伤害，风之力带来一系列的后劲!`);
            this.effects.push([randomDo, [(0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), this, tree.afterimage.execute.bind(tree.afterimage), [target, lvl, false]], 4]);
        };
        tree.dispel.execute = (target, lvl, logSign = true) => {
            if (tree.dispel.level < 0) { this._log(`${this.name} 的驱散未解锁`); return; }
            this._log(`${this.name} 施展 Lv${lvl} 驱散，清除了所有状态!`);
            this.effects = [];
        };
        tree.heal.execute = (target, lvl, logSign = true) => {
            if (tree.heal.level < 0) { this._log(`${this.name} 的治疗未解锁`); return; }
            const amt = 50 + 20 * lvl;
            this.health = Math.min(this.maxHealth, this.health + amt);
            this._log(`${this.name} 施展 Lv${lvl} 治疗，恢复了 ${amt} 点生命值!`);
        };
        tree.boost.execute = (target, lvl, logSign = true) => {
            if (tree.boost.level < 0) { this._log(`${this.name} 的力量提升未解锁`); return; }
            this.boosted += lvl;
            this._log(`${this.name} 施展 Lv${lvl} 力量提升，攻击力提高!`);
        };
        tree.defenceBoost.execute = (target, lvl, logSign = true) => {
            if (tree.defenceBoost.level < 0) { this._log(`${this.name} 的防御提升未解锁`); return; }
            this.defBoosted += lvl;
            this._log(`${this.name} 施展 Lv${lvl} 防御提升，防御力提高!`);
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
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        this.checkEffects(attributeBuff);
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
        if (logSign) this._log(`${this.name} 对 ${target.name} 造成了 ${dmg} 点伤害！`);
        this.updateStats();
        target.updateStats();
        return dmg;
    }

    // 效果队列检查
    checkEffects(fn) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const [f, args, turns] = this.effects[i];
            if (f === fn) {
                f(...args);
                this.effects[i][2]--;
                if (this.effects[i][2] < 0) this.effects.splice(i, 1);
            }
        }
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

