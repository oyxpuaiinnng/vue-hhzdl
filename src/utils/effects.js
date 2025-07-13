// src/utils/effects.js

/**
 * attributeBuff(attr, obj, op, val)
 * 用于属性类 Buff，在 'updateStats' 阶段调用
 */
export function attributeBuff(attr, obj, op, val) {
    if (!obj || !attr) return;
    switch (op) {
      case '+': obj[attr] += val; break;
      case '*': obj[attr] *= val; break;
    }
  }
  
  /**
   * randomDo(p, obj, fn, args)
   * 以概率 p 调用 fn.apply(obj, args)
   */
  export function randomDo(p, obj, fn, args) {
    if (Math.random() < p) fn.apply(obj, args);
  }
  
  /**
   * addTimedAutoSkillTrigger
   * 每回合开始时有概率自动触发一次某技能
   */
  export function addTimedAutoSkillTrigger(character, skillKey, skillArgs, turns, chance=1, expireLog='') {
    character.effects.push([
      randomDo,
      [chance, character, character.skillTree[skillKey].execute.bind(character.skillTree[skillKey]), skillArgs],
      {
        trigger: 'onTurnStart',
        durationType: 'turn',
        remaining: turns,
        onExpire() {
          if (expireLog) character._log(expireLog);
        }
      }
    ]);
  }
  

export function exAttack(amount) {
    if (!this.enemyParty) return;
    const target = this.enemyParty.find(e => e.health > 0);
    if (target) {
        this.attackEnemy(target, amount, true);
    }
}

export function exHeal(amount) {
    const healAmount = Math.floor(this.maxHealth * amount * 0.01);
    this.health = Math.min(this.maxHealth, this.health + healAmount);
    this._log?.(`${this.name} 被动恢复了 ${healAmount} 点生命`);
}

export function exBoost(prob) {
    if (Math.random() < prob) {
        this.skillTree.boost?.execute?.(this, this.skillTree.boost.level, true);
    }
}

export function exDefBoost(prob) {
    if (Math.random() < prob) {
        this.skillTree.defenceBoost?.execute?.(this, this.skillTree.defenceBoost.level, true);
    }
}

export const globalEffectMapping = { exAttack, exHeal, exBoost, exDefBoost };