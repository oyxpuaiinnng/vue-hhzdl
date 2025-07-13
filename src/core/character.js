import { createSkillTree } from '../data/skills'
export class Character {
    constructor(name, avatar = '', level = 1) {
        this.name = name;
        this.level = level;

        this.exp = 0;
        this.expToNext = this.calculateExpToNext();
        this.baseMaxHealth = 100;
        this.baseAttack = 10;
        this.baseDefence = 10;
        this.baseMaxMp = 50;

        this.health = 100;
        this.maxHealth = 100;
        this.mp = 50;
        this.maxMp = 50;

        this.calculateLevelStats();


        this.attack = 10;
        this.defence = 0;

        this.atkPlus = 0;
        this.atkMult = 1.0;
        this.defPlus = 0;
        this.defMult = 1.0;
        this.healthPlus = 0;
        this.healthMult = 1.0;

        this.armedWeapon = null;
        this.armedArmor = null;

        this.effects = [];

        this.pendingWeapon = null;
        this.pendingArmor = null;
        this.pendingSkills = [];

        this.skillRate = 5;
        this.skillTree = this._createSkillTree();
        this.activeSkills = ['normalAtk'];
        this.equipmentList = [
            { name: '初始之剑', equipmentClass: 'weapon', atkPlus: 3, atkMult: 1, effect: [], skillRate: 10, rary: "初始" },
            { name: '初始护甲', equipmentClass: 'armor', healthPlus: 10, healthMult: 1, defPlus: 1, defMult: 1, effect: [], skillRate: 10, rary: "初始" }
        ];

        // 界面显示
        this.avatarUrl = avatar;
        this.isPlayer = true;

        // 日志方法（需要外部绑定）
        this._log = msg => console.log(msg);
        //this._log = () => {};
    }

    _createSkillTree() {
        return createSkillTree(this);
    }

    damaged(amount) {
        this.health -= amount
        this.checkEffects("onDamaged")
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    attackEnemy(target, base = 100, mult = 1.0) {
        let dmg = Math.floor((this.attack * base / (100+target.defence)) * mult);
        if(dmg<0){dmg=0;}
        target.damaged(dmg);
        return dmg;
    }

    checkEffects(trigger, ...args) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const [fn, params, meta] = this.effects[i];
            if (meta.trigger === trigger) fn(...params, ...args);
        }
        if (trigger === 'onTurnEnd') {
            this.effects.forEach(e => {
                if (e[2].durationType === 'turn') e[2].remaining--;
            });
        }
        this.effects = this.effects.filter(([_, __, meta]) => {
            if (meta.remaining <= 0) {
                if (meta.onExpire) meta.onExpire.call(this);
                return false;
            }
            return true;
        });
    }

    updateStats() {
        this.calculateLevelStats()

        this.atkPlus = (this.armedWeapon?.atkPlus || 0);
        this.atkMult = (this.armedWeapon?.atkMult || 1.0);
        this.defPlus = (this.armedArmor?.defPlus || 0);
        this.defMult = (this.armedArmor?.defMult || 1.0);
        this.healthPlus = (this.armedArmor?.healthPlus || 0);
        this.healthMult = (this.armedArmor?.healthMult || 1.0);

        this.checkEffects('updateStats');

        this.attack = Math.floor((this.attack + this.atkPlus) * this.atkMult);
        this.defence = Math.floor((this.defence + this.defPlus) * this.defMult);
        this.maxHealth = Math.floor((this.maxHealth + this.healthPlus) * this.healthMult);
    
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        if (this.mp > this.maxMp) this.mp = this.maxMp;
    }

    resetForBattle() {
        this.health = this.maxHealth;
        this.mp = this.maxMp;
        this.effects = [];        // 清空回合效果
        this.updateStats();       // 重新计算预设的 buff / 装备
    }
    calculateExpToNext() {
        return Math.floor(Math.pow(10, 1.05) + (this.level * (this.level - 1)) -8);
    }
    calculateLevelStats() {
        let h = this.baseMaxHealth;
        let atk = this.baseAttack;
        let def = this.baseDefence;
        let mp = this.baseMaxMp;

        // 从 1 升到 this.level
        for (let n = 1; n < this.level; n++) {
            const factor = 1 + 0.2 / Math.pow(n, 0.418);
            atk *= factor;
            def = def * factor;
            h = h * factor;
            mp = mp + 10;
        }

        // 最终取整
        this.maxHealth = Math.floor(h);
        this.attack = Math.floor(atk);
        this.defence = Math.floor(def);
        this.maxMp = Math.floor(mp);
    }
    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = this.calculateExpToNext();
            this._log?.(`${this.name} 升级到了 Lv${this.level}！`);
            this.calculateLevelStats();
            this.updateStats?.(); // 属性刷新
        }
    }

    togglePendingSkill(key) {
        const idx = this.pendingSkills.indexOf(key);
        if (idx >= 0) {
            this.pendingSkills.splice(idx, 1);
            this._log?.(`取消下次战斗装备技能：${this.skillTree[key].name}`);
        } else if (this.pendingSkills.length < 5) {
            this.pendingSkills.push(key);
            this._log?.(`下次战斗将装备技能：${this.skillTree[key].name}`);
        } else {
            this._log?.('主动技能栏已满，下次战斗只能装备 5 个');
        }
    }
}
