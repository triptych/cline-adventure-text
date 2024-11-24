export class Player {
    constructor(data) {
        this.health = data.health || 100;
        this.maxHealth = data.maxHealth || 100;
        this.magic = data.magic || 50;
        this.maxMagic = data.maxMagic || 50;
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.inventory = data.inventory || [];
        this.equipment = data.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.stats = data.stats || {
            attack: 10,
            defense: 5,
            magicPower: 8
        };
        this.nextLevelExp = this.calculateNextLevelExp();
    }

    calculateNextLevelExp() {
        // Experience needed for next level increases exponentially
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }

    gainExperience(amount) {
        this.experience += amount;

        // Check for level up
        while (this.experience >= this.nextLevelExp) {
            this.levelUp();
        }

        return {
            currentExp: this.experience,
            nextLevel: this.nextLevelExp
        };
    }

    levelUp() {
        this.level++;
        this.experience -= this.nextLevelExp;
        this.nextLevelExp = this.calculateNextLevelExp();

        // Increase stats
        this.maxHealth += 10;
        this.maxMagic += 5;
        this.health = this.maxHealth;
        this.magic = this.maxMagic;

        // Increase combat stats
        this.stats.attack += 2;
        this.stats.defense += 1;
        this.stats.magicPower += 2;

        return {
            level: this.level,
            stats: this.stats
        };
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.stats.defense);
        this.health = Math.max(0, this.health - actualDamage);
        return {
            damage: actualDamage,
            currentHealth: this.health,
            isDead: this.health <= 0
        };
    }

    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHealth - this.health);
        this.health = Math.min(this.maxHealth, this.health + actualHeal);
        return {
            healAmount: actualHeal,
            currentHealth: this.health
        };
    }

    useMagic(cost) {
        if (this.magic < cost) {
            return false;
        }
        this.magic -= cost;
        return true;
    }

    restoreMagic(amount) {
        const actualRestore = Math.min(amount, this.maxMagic - this.magic);
        this.magic = Math.min(this.maxMagic, this.magic + actualRestore);
        return {
            restoreAmount: actualRestore,
            currentMagic: this.magic
        };
    }

    addItem(itemId) {
        this.inventory.push(itemId);
        return true;
    }

    removeItem(itemId) {
        const index = this.inventory.indexOf(itemId);
        if (index !== -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }

    equipItem(item) {
        if (!item.type || !this.equipment.hasOwnProperty(item.type)) {
            return false;
        }

        // Unequip current item if any
        const currentItem = this.equipment[item.type];
        if (currentItem) {
            this.unequipItem(item.type);
        }

        // Equip new item
        this.equipment[item.type] = item.id;
        this.removeItem(item.id);

        // Apply item stats
        if (item.stats) {
            Object.keys(item.stats).forEach(stat => {
                if (this.stats.hasOwnProperty(stat)) {
                    this.stats[stat] += item.stats[stat];
                }
            });
        }

        return true;
    }

    unequipItem(slot) {
        const itemId = this.equipment[slot];
        if (!itemId) {
            return false;
        }

        // Remove stats from equipped item
        const item = this.equipment[slot];
        if (item.stats) {
            Object.keys(item.stats).forEach(stat => {
                if (this.stats.hasOwnProperty(stat)) {
                    this.stats[stat] -= item.stats[stat];
                }
            });
        }

        // Move item back to inventory
        this.addItem(itemId);
        this.equipment[slot] = null;

        return true;
    }

    applyEffects(effects) {
        if (effects.health) {
            if (effects.health > 0) {
                this.heal(effects.health);
            } else {
                this.takeDamage(-effects.health);
            }
        }

        if (effects.magic) {
            if (effects.magic > 0) {
                this.restoreMagic(effects.magic);
            } else {
                this.useMagic(-effects.magic);
            }
        }

        // Apply any other effects (buffs, debuffs, etc.)
        if (effects.stats) {
            Object.keys(effects.stats).forEach(stat => {
                if (this.stats.hasOwnProperty(stat)) {
                    this.stats[stat] += effects.stats[stat];
                }
            });
        }
    }

    getStats() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            magic: this.magic,
            maxMagic: this.maxMagic,
            level: this.level,
            experience: this.experience,
            nextLevel: this.nextLevelExp,
            stats: { ...this.stats }
        };
    }

    serialize() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            magic: this.magic,
            maxMagic: this.maxMagic,
            level: this.level,
            experience: this.experience,
            inventory: [...this.inventory],
            equipment: { ...this.equipment },
            stats: { ...this.stats }
        };
    }
}
