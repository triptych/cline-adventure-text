export class Enemy {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.description = data.description;
        this.health = data.health;
        this.maxHealth = data.health;
        this.attack = data.attack;
        this.defense = data.defense;
        this.loot = [...(data.loot || [])];
        this.experience = data.experience;
        this.level = data.level || 1;
        this.initialState = { ...data };

        // Combat stats
        this.stats = {
            accuracy: data.stats?.accuracy || 80,
            criticalChance: data.stats?.criticalChance || 10,
            criticalMultiplier: data.stats?.criticalMultiplier || 1.5,
            evasion: data.stats?.evasion || 5
        };

        // Special abilities
        this.abilities = data.abilities || [];

        // Status effects
        this.statusEffects = new Map();

        // Behavior patterns
        this.behavior = data.behavior || 'aggressive';
        this.aggression = data.aggression || 1.0;

        // Current state
        this.isStunned = false;
        this.isDefeated = false;
    }

    /**
     * Calculate damage output
     */
    calculateDamage() {
        let damage = this.attack;

        // Apply status effects that modify damage
        this.statusEffects.forEach(effect => {
            if (effect.modifyDamage) {
                damage = effect.modifyDamage(damage);
            }
        });

        // Critical hit calculation
        if (this.rollCritical()) {
            damage *= this.stats.criticalMultiplier;
            return { damage, isCritical: true };
        }

        return { damage, isCritical: false };
    }

    /**
     * Roll for critical hit
     */
    rollCritical() {
        return Math.random() * 100 < this.stats.criticalChance;
    }

    /**
     * Take damage from an attack
     */
    takeDamage(amount) {
        // Calculate actual damage after defense
        const actualDamage = Math.max(1, amount - this.defense);

        // Apply damage
        this.health = Math.max(0, this.health - actualDamage);

        // Check if defeated
        if (this.health <= 0) {
            this.isDefeated = true;
        }

        return {
            damage: actualDamage,
            currentHealth: this.health,
            isDefeated: this.isDefeated
        };
    }

    /**
     * Heal the enemy
     */
    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHealth - this.health);
        this.health = Math.min(this.maxHealth, this.health + actualHeal);

        return {
            healAmount: actualHeal,
            currentHealth: this.health
        };
    }

    /**
     * Choose and use an ability
     */
    useAbility() {
        if (this.isStunned || this.abilities.length === 0) {
            return null;
        }

        // Filter available abilities
        const availableAbilities = this.abilities.filter(ability =>
            !ability.cooldown || !ability.currentCooldown
        );

        if (availableAbilities.length === 0) {
            return null;
        }

        // Choose ability based on behavior pattern
        const ability = this.chooseAbility(availableAbilities);

        // Apply cooldown
        if (ability.cooldown) {
            ability.currentCooldown = ability.cooldown;
        }

        return ability;
    }

    /**
     * Choose an ability based on behavior pattern
     */
    chooseAbility(availableAbilities) {
        switch (this.behavior) {
            case 'defensive':
                // Prefer healing/defensive abilities when health is low
                if (this.health < this.maxHealth * 0.3) {
                    const defensiveAbility = availableAbilities.find(a => a.type === 'heal' || a.type === 'defense');
                    if (defensiveAbility) return defensiveAbility;
                }
                break;

            case 'aggressive':
                // Prefer high damage abilities
                const damageAbilities = availableAbilities.filter(a => a.type === 'damage');
                if (damageAbilities.length > 0) {
                    return damageAbilities[Math.floor(Math.random() * damageAbilities.length)];
                }
                break;

            case 'tactical':
                // Use abilities based on situation
                if (this.health < this.maxHealth * 0.5) {
                    const healAbility = availableAbilities.find(a => a.type === 'heal');
                    if (healAbility) return healAbility;
                }
                break;
        }

        // Default to random ability if no specific choice was made
        return availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
    }

    /**
     * Apply a status effect
     */
    applyStatusEffect(effect) {
        this.statusEffects.set(effect.id, {
            ...effect,
            duration: effect.duration
        });
    }

    /**
     * Remove a status effect
     */
    removeStatusEffect(effectId) {
        return this.statusEffects.delete(effectId);
    }

    /**
     * Update status effects
     */
    updateStatusEffects() {
        for (const [effectId, effect] of this.statusEffects) {
            // Apply effect
            if (effect.onTick) {
                effect.onTick(this);
            }

            // Decrease duration
            effect.duration--;

            // Remove expired effects
            if (effect.duration <= 0) {
                this.statusEffects.delete(effectId);
            }
        }
    }

    /**
     * Check if enemy can act
     */
    canAct() {
        return !this.isStunned && !this.isDefeated;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            isStunned: this.isStunned,
            isDefeated: this.isDefeated,
            statusEffects: Array.from(this.statusEffects.values())
        };
    }

    /**
     * Reset enemy to initial state
     */
    reset() {
        const data = this.initialState;
        this.health = data.health;
        this.maxHealth = data.health;
        this.attack = data.attack;
        this.defense = data.defense;
        this.isStunned = false;
        this.isDefeated = false;
        this.statusEffects.clear();

        // Reset ability cooldowns
        this.abilities.forEach(ability => {
            ability.currentCooldown = 0;
        });
    }

    /**
     * Serialize enemy data for saving
     */
    serialize() {
        return {
            id: this.id,
            health: this.health,
            isStunned: this.isStunned,
            isDefeated: this.isDefeated,
            statusEffects: Array.from(this.statusEffects.entries()),
            abilities: this.abilities.map(ability => ({
                ...ability,
                currentCooldown: ability.currentCooldown || 0
            }))
        };
    }

    /**
     * Load serialized enemy data
     */
    loadState(data) {
        this.health = data.health;
        this.isStunned = data.isStunned;
        this.isDefeated = data.isDefeated;

        // Restore status effects
        this.statusEffects.clear();
        data.statusEffects.forEach(([id, effect]) => {
            this.statusEffects.set(id, effect);
        });

        // Restore ability cooldowns
        data.abilities.forEach(savedAbility => {
            const ability = this.abilities.find(a => a.id === savedAbility.id);
            if (ability) {
                ability.currentCooldown = savedAbility.currentCooldown;
            }
        });
    }
}
