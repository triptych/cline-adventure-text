export class Item {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type; // weapon, armor, consumable, key, etc.
        this.effects = data.effects || null;
        this.usable = data.usable || false;
        this.consumable = data.consumable || false;
        this.questItem = data.questItem || false;
        this.value = data.value || 0;
        this.rarity = data.rarity || 'common';
        this.durability = data.durability || null;
        this.maxDurability = data.durability || null;
        this.requirements = data.requirements || null;
        this.stats = data.stats || null;
        this.tags = new Set(data.tags || []);
        this.state = { ...data.initialState } || {};
    }

    /**
     * Check if the item can be used
     */
    canUse(user) {
        if (!this.usable) return false;
        if (this.durability !== null && this.durability <= 0) return false;

        // Check requirements if they exist
        if (this.requirements) {
            return this.checkRequirements(user);
        }

        return true;
    }

    /**
     * Check if user meets item requirements
     */
    checkRequirements(user) {
        if (!this.requirements) return true;

        // Check level requirement
        if (this.requirements.level && user.level < this.requirements.level) {
            return false;
        }

        // Check stat requirements
        if (this.requirements.stats) {
            for (const [stat, value] of Object.entries(this.requirements.stats)) {
                if (user.stats[stat] < value) {
                    return false;
                }
            }
        }

        // Check quest requirements
        if (this.requirements.quest) {
            const quest = user.quests?.get(this.requirements.quest);
            if (!quest || !quest.isCompleted()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Use the item
     */
    use(user) {
        if (!this.canUse(user)) {
            return {
                success: false,
                message: "Cannot use this item."
            };
        }

        // Apply effects
        if (this.effects) {
            const effectResult = this.applyEffects(user);

            // Reduce durability if applicable
            if (this.durability !== null) {
                this.durability--;
            }

            // Remove if consumable
            if (this.consumable) {
                return {
                    success: true,
                    message: effectResult.message,
                    consumed: true
                };
            }

            return {
                success: true,
                message: effectResult.message,
                effects: effectResult.effects
            };
        }

        return {
            success: false,
            message: "This item has no effects."
        };
    }

    /**
     * Apply item effects to user
     */
    applyEffects(user) {
        const results = {
            message: "",
            effects: []
        };

        if (!this.effects) return results;

        // Health effects
        if (this.effects.health) {
            const healthResult = user.heal(this.effects.health);
            results.effects.push({
                type: 'health',
                value: healthResult.healAmount
            });
            results.message += `Restored ${healthResult.healAmount} health. `;
        }

        // Magic effects
        if (this.effects.magic) {
            const magicResult = user.restoreMagic(this.effects.magic);
            results.effects.push({
                type: 'magic',
                value: magicResult.restoreAmount
            });
            results.message += `Restored ${magicResult.restoreAmount} magic. `;
        }

        // Stat effects
        if (this.effects.stats) {
            for (const [stat, value] of Object.entries(this.effects.stats)) {
                if (user.stats[stat] !== undefined) {
                    user.stats[stat] += value;
                    results.effects.push({
                        type: 'stat',
                        stat: stat,
                        value: value
                    });
                    results.message += `${stat} ${value >= 0 ? 'increased' : 'decreased'} by ${Math.abs(value)}. `;
                }
            }
        }

        // Status effects
        if (this.effects.status) {
            this.effects.status.forEach(status => {
                user.applyStatusEffect(status);
                results.effects.push({
                    type: 'status',
                    status: status.name
                });
                results.message += `Applied ${status.name}. `;
            });
        }

        return results;
    }

    /**
     * Repair the item
     */
    repair(amount) {
        if (this.durability === null) return false;

        const oldDurability = this.durability;
        this.durability = Math.min(this.maxDurability, this.durability + amount);

        return {
            success: true,
            amount: this.durability - oldDurability
        };
    }

    /**
     * Check if item matches certain criteria
     */
    matches(criteria) {
        if (criteria.type && this.type !== criteria.type) return false;
        if (criteria.rarity && this.rarity !== criteria.rarity) return false;
        if (criteria.minValue && this.value < criteria.minValue) return false;
        if (criteria.tags) {
            for (const tag of criteria.tags) {
                if (!this.tags.has(tag)) return false;
            }
        }
        return true;
    }

    /**
     * Get item description including stats and effects
     */
    getFullDescription() {
        let desc = this.description + '\n';

        if (this.stats) {
            desc += '\nStats:\n';
            for (const [stat, value] of Object.entries(this.stats)) {
                desc += `${stat}: ${value > 0 ? '+' : ''}${value}\n`;
            }
        }

        if (this.effects) {
            desc += '\nEffects:\n';
            if (this.effects.health) {
                desc += `Restore ${this.effects.health} Health\n`;
            }
            if (this.effects.magic) {
                desc += `Restore ${this.effects.magic} Magic\n`;
            }
        }

        if (this.requirements) {
            desc += '\nRequirements:\n';
            if (this.requirements.level) {
                desc += `Level ${this.requirements.level}\n`;
            }
            if (this.requirements.stats) {
                for (const [stat, value] of Object.entries(this.requirements.stats)) {
                    desc += `${stat}: ${value}\n`;
                }
            }
        }

        if (this.durability !== null) {
            desc += `\nDurability: ${this.durability}/${this.maxDurability}`;
        }

        return desc;
    }

    /**
     * Serialize item data for saving
     */
    serialize() {
        return {
            id: this.id,
            durability: this.durability,
            state: { ...this.state }
        };
    }

    /**
     * Load serialized item data
     */
    loadState(data) {
        this.durability = data.durability;
        this.state = { ...data.state };
    }

    /**
     * Clone the item
     */
    clone() {
        return new Item(this.id, {
            name: this.name,
            description: this.description,
            type: this.type,
            effects: this.effects ? { ...this.effects } : null,
            usable: this.usable,
            consumable: this.consumable,
            questItem: this.questItem,
            value: this.value,
            rarity: this.rarity,
            durability: this.maxDurability,
            requirements: this.requirements ? { ...this.requirements } : null,
            stats: this.stats ? { ...this.stats } : null,
            tags: Array.from(this.tags),
            initialState: { ...this.state }
        });
    }
}
