const pfList = ["铁制", "精致的", "黑色的", "火焰的", "恶魔的", "蓝色的", "神圣的", "红色的", "金色的", "暗黑的", "神秘的", "绿色的", "水晶的", "神奇的", "龙鳞的", "神话的", "神器的", "神力的", "神光的", "神速的", "狂暴的", "魔法的", "冰冷的", "风暴的", "毁灭的", "战斗的", "生命的", "死亡的", "狩猎的", "隐秘的", "巨人的", "精灵的", "狼人的", "龙的", "狮子的", "蛇的", "熊的", "猛虎的", "猛鹫的", "邪恶的", "正义的", "勇敢的", "荣耀的", "智慧的", "诅咒的", "恐怖的", "疯狂的", "疾病的", "魔毒的", "毒蛇的", "暴风的", "雷霆的", "寒冰的", "地震的", "岩石的", "沙漠的", "海洋的", "灼热的", "奥术的", "元素的"];
const weaponNameList = ['长剑', '短剑', '刀', '匕首', '斧头', '大锤', '钉锤', '链锤', '钩镰', '长弓', '短弓', '弩', '长枪', '短枪', '长矛', '短矛', '长棍', '短棍', '弯刀', '战斧', '飞刀', '镰刀', '长鞭', '短鞭', '拳套', '钢爪', '飞镖', '法杖', '魔杖', '魔法书', '魔法卷轴', '火枪', '冰枪', '光剑'];
const armorNameList = ['布甲', '皮甲', '棉甲', '锁子甲', '板甲', '重甲', '鳞甲', '长袍', '法袍', '袈裟', '防弹衣', '链甲', '札甲', '藤甲', '骨甲', '革甲', '鳞袍', '轻甲', '胸甲', '护心甲', '铁衣'];
export function randomEquipPf(rarity) {
    const prefixes = [];
    while (prefixes.length < rarity) {
        const pf = pfList[Math.floor(Math.random() * pfList.length)];
        if (!prefixes.includes(pf)) {
            prefixes.push(pf);
        }
    }
    return prefixes;
}

export function randomWeaponEffect(rarity) {
    const effectPool = ['exAttack', 'exHeal', 'exBoost', 'exDefBoost'];
    const effectMap = {};

    for (let i = 0; i < rarity; i++) {
        const eff = effectPool[Math.floor(Math.random() * effectPool.length)];

        let value = 0;
        switch (eff) {
            case 'exAttack':
                value = Math.random() * 100;
                break;
            case 'exHeal':
                value = Math.random() * 10;
                break;
            case 'exBoost':
                value = Math.random() * 0.25;
                break;
            case 'exDefBoost':
                value = Math.random() * 0.25;
                break;
        }

        if (!effectMap[eff]) effectMap[eff] = 0;
        effectMap[eff] += value;
    }

    return Object.entries(effectMap).map(([eff, val]) => [eff, parseFloat(val.toFixed(2))]);
}

export function randomArmorEffect(rarity) {
    // 当前无护甲效果设计，如需未来拓展，可按上述逻辑编写
    return [];
}

// utils/equipment.js
export function generateWeapon(level = 1) {
    const rarity = Math.floor(Math.log(1 - Math.random()) / Math.log(0.3));
    const pfs = randomEquipPf(rarity);
    const baseName = weaponNameList[Math.floor(Math.random() * weaponNameList.length)];
    const name = pfs.join('') + baseName;
    const eff = randomWeaponEffect(rarity);

    const atkPlus = Math.floor((0.5 + 0.5 * Math.random()) * (Math.pow(1.05, level) + level));
    const atkMult = parseFloat((1 + rarity * 0.2 + 0.2 * Math.random()).toFixed(2));
    const skillRate = Math.floor(Math.pow(1.03, level) * rarity * 5 + level);

    return {
        name,
        equipmentClass: 'weapon',
        atkPlus,
        atkMult,
        effect: eff,
        skillRate,
        rary: rarity
    };
}


export function generateArmor(level = 1) {
    const rarity = Math.floor(Math.log(1 - Math.random()) / Math.log(0.3));
    const pfs = randomEquipPf(rarity);
    const baseName = armorNameList[Math.floor(Math.random() * armorNameList.length)];
    const name = pfs.join('') + baseName;
    const eff = randomArmorEffect(rarity);

    const healthPlus = Math.floor(10 * (0.5 + 0.5 * Math.random()) * (Math.pow(1.05, level) + level));
    const healthMult = parseFloat((1 + rarity * 0.2 + 0.2 * Math.random()).toFixed(2));
    const defPlus = Math.floor((0.5 + 0.5 * Math.random()) * Math.pow(level, 1.5));
    const defMult = parseFloat((1 + rarity * 0.2 + 0.2 * Math.random()).toFixed(2));
    const skillRate = Math.floor(Math.pow(1.03, level) * rarity * 5 + level);

    return {
        name,
        equipmentClass: 'armor',
        healthPlus,
        healthMult,
        defPlus,
        defMult,
        effect: eff,
        skillRate,
        rary: rarity
    };
}
