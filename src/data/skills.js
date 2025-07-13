// src/data/skills.js
import { attributeBuff, addTimedAutoSkillTrigger } from '../utils/effects.js';

const template = {
    normalAtk: {
        name: "拍击",
        description: lvl =>
            `威力: ${100 + 5 * lvl}\n击掌奇袭！(bushi)`,
        level: 1, get maxLevel() { return this.owner?.level ? this.owner.level + 4 : 5 },
        dependencies: [],
        cost: lvl => Math.floor(lvl*(lvl+1)*Math.pow(1.2, lvl)),
        targetType: 'single',
        execute: null
    },
    swiftAtk: {
        name: "疾",
        description: lvl =>
            `威力: ${100 + 4 * lvl}\n4回合内，回合开始时，${((0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) * 100).toFixed(1)}%在回合初额外使用一次lv${lvl}普通攻击\n这是否会是什么的33.33%呢？`,
        level: 0, get maxLevel() { return this.owner?.level ? this.owner.level - 1 : 5 }, dependencies: ["normalAtk"],
        cost: lvl => Math.floor(200 * Math.pow(1.2, lvl)-180),
        targetType: 'single',
        execute: null
    },
    afterimage: {
        name: "残影步",
        description: lvl =>
            `消除对方攻防强化\n4回合内，回合开始时，${((0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) * 100).toFixed(1)}%在回合初额外使用一次lv${lvl}迅捷打击`,
        level: 0, get maxLevel() { return this.owner?.level ? this.owner.level - 3 : 0 }, dependencies: ["swiftAtk"],
        cost: lvl => Math.floor(300 * Math.pow(1.2, lvl)-250),
        targetType: 'single',
        execute: null
    },
    windRage: {
        name: "咪",
        description: lvl => {
            const base = 200 + 10 * lvl;
            const proc = ((0.1 + 0.01 * lvl) / (1 + 0.01 * lvl) * 100);
            return `造成${base}点固定伤害，${(proc / 2).toFixed(1)}%造成${200 + 5 * lvl}%伤害\n4回合内，回合开始时，${proc.toFixed(1)}%在回合初额外使用一次lv${lvl}迅捷打击\n用猫猫（耄耋）之力扫平一切敌人！`;
        },
        level: 0, get maxLevel() { return this.owner?.level ?  this.owner.level - 6:0 }, dependencies: ["afterimage"],
        cost: lvl => Math.floor(400 * Math.pow(1.3, lvl)-300),
        targetType: 'single',
        execute: null
    },
    toxicMist: {
        name: "毒雾",
        description: lvl =>
            `覆盖目标并持续中毒,下${Math.min(5, 2 + Math.floor(0.1 * lvl))} 回合，每回合开始时造成 ${Math.floor(4 * Math.pow(1.1, lvl))+lvl} 伤害`,
        level: 0, get maxLevel() { return this.owner?.level ? this.owner.level :0}, dependencies: ["normalAtk"],
        cost: lvl => Math.floor(150 * Math.pow(1.15, lvl)),
        targetType: 'single',
        execute: null
    },
    toxicSlice: {
        name: "毒刃",
        description: lvl =>
            `威力:${60 + 3 * lvl}\n下${Math.min(5, 2 + Math.floor(0.1 * lvl))}次攻击额外造成 ${(0.2 + 0.01 * lvl*100).toFixed(2)}%攻击数值的固定伤害`,
        level: 0, get maxLevel() { return this.owner?.level ? this.owner.level - 3:0 }, dependencies: ["toxicMist"],
        cost: lvl => Math.floor(200 * Math.pow(1.2, lvl)),
        targetType: 'single',
        execute: null
    },
    dispel: {
        name: "驱散",
        description: lvl =>
            `移除自身所有所有临时状态。`,
        level: 0, maxLevel: 1, dependencies: ["normalAtk"],
        cost: () => 500,
        targetType: 'self',
        execute: null
    },
    heal: {
        name: "治疗",
        description: lvl =>
            `治疗自身 ${10 + 10 * lvl} 点生命`,
        level: 0, get maxLevel() { return this.owner?.level ?  Math.floor(this.owner.level / 2):1 }, dependencies: ["dispel"],
        cost: lvl => Math.floor(300 * Math.pow(1.15, lvl)),
        targetType: 'self',
        execute: null
    },
    boost: {
        name: "力量提升",
        description: lvl =>
            `提升自身攻击力 +${lvl+5}%`,
        level: 0, maxLevel: 5, dependencies: ["heal"],
        cost: lvl => Math.floor(400 * Math.pow(1.5, lvl)),
        targetType: 'self',
        execute: null
    },
    defenceBoost: {
        name: "防御提升",
        description: lvl =>
            `提升自身防御力 +${lvl+5}%`,
        level: 0, maxLevel: 5, dependencies: ["boost"],
        cost: lvl => Math.floor(400 * Math.pow(1.5, lvl)),
        targetType: 'self',
        execute: null
    },
    roar: {
        name: "哈",
        description: lvl => {
            const factor = Math.max(0.5, 0.9 - 0.01 * lvl);
            return `降低目标攻击力至 ${(factor * 100).toFixed(1)}% ，持续 ${Math.min(5, 2 + Math.floor(0.1 * lvl))} 回合`;
        },
        level: 0, get maxLevel() { return this.owner?.level ? Math.floor(this.owner.level / 2):0 }, dependencies: ["dispel"],
        cost: lvl => Math.floor(300 * Math.pow(1.25, lvl)),
        targetType: 'single',
        execute: null
    }
};

export function createSkillTree(owner) {
    const tree = {};
    // deep clone template
    for (const key in template) {
        tree[key] = {};
        Object.defineProperties(tree[key], Object.getOwnPropertyDescriptors(template[key]));
        tree[key].owner = owner;
        tree[key].level = template[key].level; // 设置初始等级
    }
    owner.skillTree = tree;

    // bind execute for each skill:
    tree.normalAtk.execute = (tgt, lvl, log) => {
        const dmg = owner.attackEnemy(tgt, 100 + 5 * lvl, log);
        owner._log(`${owner.name} 使用 Lv${lvl} 拍击，对 ${tgt.name} 造成了 ${dmg} 点伤害！`);
    };

    tree.swiftAtk.execute = (tgt, lvl, log) => {
        if (tree.swiftAtk.level < 0) return owner._log(`${owner.name} 的 疾 未解锁`);
        const dmg = owner.attackEnemy(tgt, 100 + 4 * lvl, log);
        owner._log(`快到看不见尾灯！${owner.name} 使用 Lv${lvl} 疾，对 ${tgt.name} 造成了 ${dmg} 点伤害!`);
        addTimedAutoSkillTrigger(
            owner, // character
            'normalAtk', // skillKey
            [tgt, lvl, true], // skillargs
            4, // turns
            (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl), // chance
            `${owner.name}的速度减缓到正常水平了！`
        );
    };

    tree.afterimage.execute = (tgt, lvl, log) => {
        if (tree.afterimage.level < 0) return owner._log(`${owner.name} 的残影步未解锁`);
        for (let buff of tgt.effects){
            if (buff[0]===attributeBuff){
                tgt.effects = tgt.effects.filter(item => item !== buff);
            }
            break;
        };
        owner._log(`${owner.name} 施展 Lv${lvl} 残影步，降低了对方攻防强化，脚下生风!!`);
        addTimedAutoSkillTrigger(
            owner, 'normalAtk', [tgt, lvl, true], 4,
            (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl),
            `${owner.name} 的残影消失了！`
        );
    };

    tree.windRage.execute = (tgt, lvl, log) => {
        if (tree.windRage.level < 0) return owner._log(`${owner.name} 的 米 未解锁`);
        const dmg = owner.attackEnemy(tgt, 200 + 10 * lvl, 2);
        owner._log(`${owner.name} 施展 Lv${lvl} 米，对 ${tgt.name} 造成了 ${dmg} 点伤害，耄耋之力带来一系列的后劲!`);
        addTimedAutoSkillTrigger(
            owner, 'afterimage', [tgt, lvl, true],
            4, (0.1 + 0.01 * lvl) / (1 + 0.01 * lvl),
            `${owner.name} 的耄耋之力消失了！`
        );
    };

    tree.toxicMist.execute = (tgt, lvl, log) => {
        if (tree.toxicMist.level < 0) return owner._log(`${owner.name} 的毒雾未解锁`);
        owner._log(`${owner.name} 使用 Lv${lvl} 毒雾，侵蚀 ${tgt.name}！`);
        tgt.effects.push([
            () => tgt.damaged(Math.floor(4 * Math.pow(1.1, lvl)+lvl), false),
            [], { trigger: 'onTurnStart', durationType: 'turn', remaining: Math.min(5, 2 + Math.floor(0.1 * lvl)) }
        ]);
    };

    tree.toxicSlice.execute = (tgt, lvl, log) => {
        if (tree.toxicSlice.level < 0) return owner._log(`${owner.name} 的毒刃未解锁`);
        const hit = owner.attackEnemy(tgt, 60 + 3 * lvl, log);
        owner._log(`${owner.name} 使用 Lv${lvl} 毒刃对 ${tgt.name} 造成了 ${hit} 点伤害，并附加中毒！`);
        owner.effects.push([
            () => tgt.damaged(Math.floor(owner.attack * 0.2), false),
            [], { trigger: 'onAttack', durationType: 'count', remaining: Math.min(5, 2 + Math.floor(0.1 * lvl)), onExpire() { owner._log(`${owner.name} 释放的毒雾消散了！`); } }
        ]);
    };

    // dispel
    tree.dispel.execute = (tgt, lvl, log) => {
        const before = owner.effects.length;
        owner.effects = owner.effects.filter(([fn, _, meta]) => {
            if (meta.trigger === 'updateStats' || meta.durationType === 'count') {
                // remove all non-permanent
                if (meta.onExpire) meta.onExpire.call(owner);
                return false;
            }
            return true;
        });
        owner._log(`${owner.name} 施展 Lv${lvl} 驱散，驱散了 ${before - owner.effects.length} 个效果`);
    };

    // heal
    tree.heal.execute = (tgt, lvl, log) => {
        if (tree.heal.level < 0) return owner._log(`${owner.name} 的治疗未解锁`);
        const amt = 20 + 10 * lvl;
        owner.heal(amt);
        owner._log(`${owner.name} 施展 Lv${lvl} 治疗，恢复了 ${amt} 点生命值!`);
    };

    // boost
    tree.boost.execute = (tgt, lvl, log) => {
        if (tree.boost.level < 0) return owner._log(`${owner.name} 的力量提升未解锁`);
        owner._log(`${owner.name} 施展 Lv${lvl} 力量提升，攻击力提高!`);
        const factor = 1.05 + 0.01 * lvl;
        tgt.effects.push([
            attributeBuff,
            ['attack', tgt, '*', factor],
            { trigger: 'updateStats', durationType: 'turn', remaining: Infinity }
        ]);
    };

    // defenceBoost
    tree.defenceBoost.execute = (tgt, lvl, log) => {
        if (tree.defenceBoost.level < 0) return owner._log(`${owner.name} 的防御提升未解锁`);
        owner._log(`${owner.name} 施展 Lv${lvl} 防御提升，防御力提高!`);
        const factor = 1.05 + 0.01 * lvl;
        tgt.effects.push([
            attributeBuff,
            ['defence', tgt, '*', factor],
            { trigger: 'updateStats', durationType: 'turn', remaining: Infinity }
        ]);
    };

    // roar
    tree.roar.execute = (tgt, lvl, log) => {
        if (tree.roar.level < 0) return owner._log(`${owner.name} 还不会哈气`);
        const factor = Math.max(0.75, 0.9 - 0.01 * lvl);
        owner._log(`${owner.name} 对 ${tgt.name} 使用了Lv${lvl}哈气！`);
        tgt.effects.push([
            attributeBuff,
            ['attack', tgt, '*', factor],
            { trigger: 'updateStats', durationType: 'turn', remaining: Math.min(5, 2 + Math.floor(0.1 * lvl)) }
        ]);
    };

    return tree;
}
