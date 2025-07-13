// data/challenges.js
import { Character } from '../core/character';
import { attributeBuff, randomDo } from '../utils/effects'

export const challenges = [
    {
        id: 'jm',
        name: '键帽',
        bosses: [
            {
                name: '键帽',
                avatar: '',
                level: 15,
                effects: [
                    [attributeBuff, ['attack', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],
                    [attributeBuff, ['defence', null, '*', 1.5], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            }
        ],
        reward: '技能点 +100，装备一件',
        onVictory(store) {
            store._log('求求别打了，我给你走还不行吗');
            if (store.playerParty.length === 1) {
                store.playerParty.push(new Character("豪猫", "", 15));
            }
            store.level += 1;
            store.playerParty[0].skillRate += 500;
            store.getRandomEquipment(); // 添加奖励
        }
    },
    {
        id: 'mdld',
        name: '耄耋:六道',
        bosses: [
            {
                name: '天道',
                avatar: 'skymd.png',
                level: 35,
                effects: [
                    [attributeBuff, ['attack', null, '*', 1.8], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],
                    [attributeBuff, ['maxHealth', null, '*', 2.0], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            },
            {
                name: '畜生道',
                avatar: 'animalmd.png',
                level: 30,
                effects: [
                    [attributeBuff, ['health', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],
                    [attributeBuff, ['defence', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            },
            {
                name: '修罗道',
                avatar: 'demigodmd.png',
                level: 30,
                effects: [
                    [attributeBuff, ['attack', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            },
            {
                name: '地狱道',
                avatar: 'hellmd.png',
                level: 30,
                effects: [
                    [attributeBuff, ['attack', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            },
            {
                name: '人间道',
                avatar: 'manmd.png',
                level: 30,
                effects: [
                    [attributeBuff, ['attack', null, '*', 1.5], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],
                    [attributeBuff, ['defence', null, '*', 1.5], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            },
            {
                name: '饿鬼道',
                avatar: 'hungrymd.png',
                level: 30,
                effects: [
                    [attributeBuff, ['defence', null, '*', 4], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }]
                ]
            },
        ],
        reward: '技能点 +150，获得2件装备',
        onVictory(store) {
            store._log('欺负69岁老猫还不讲武德，还爆装备了，赔我医药费！');
            store.playerParty.forEach(p => p.skillRate -= 1500);
            store.playerParty.forEach(p => {
                p.equipmentList.push(
                    { "name": "圆脸", "equipmentClass": "armor", "healthPlus": 750, "healthMult": 1.4, "defPlus": 200, "defMult": 1.4, "effect": [], "skillRate": 750, "rary": '耄耋' }
                );
                p.equipmentList.push(
                    { "name": "强化普攻之爪", "equipmentClass": "weapon", "atkPlus": 35, "atkMult": 1.6, "effect": [["exAttack", 60], ["exBoost", 15]], "skillRate": 750, "rary": '耄耋' }
                );
            })
        }
    },
    {
        id: 'md',
        name: '耄耋本尊',
        bosses: [
            {
                name: '耄耋',
                avatar: '',
                level: 60,
                effects: [
                    [attributeBuff, ['attack', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],
                    [attributeBuff, ['defence', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],
                    [attributeBuff, ['maxHealth', null, '*', 2], { trigger: 'onTurnStart', durationType: 'turn', remaining: Infinity }],

                ]
            }
        ],
        reward: '技能点 +100，装备一件',
        onVictory(store) {
            store._log('求求别打了，我给你走还不行吗');
            if (store.playerParty.length === 1) {
                store.playerParty.push(new Character("豪猫", "", 15));
            }
            store.level += 1;
            store.playerParty[0].skillRate += 500;
            store.getRandomEquipment(); // 添加奖励
        }
    },
];
