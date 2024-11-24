export class Quest {
    constructor(id, data) {
        this.id = id;
        this.title = data.title;
        this.description = data.description;
        this.objectives = data.objectives.map(obj => ({
            ...obj,
            completed: false,
            progress: 0
        }));
        this.rewards = { ...data.rewards };
        this.prerequisites = [...(data.prerequisites || [])];
        this.state = 'inactive'; // inactive, active, completed, failed
        this.timeStarted = null;
        this.timeCompleted = null;
        this.hidden = data.hidden || false;
        this.optional = data.optional || false;
        this.timeLimit = data.timeLimit || null;
        this.failureConditions = data.failureConditions || [];
        this.stages = data.stages || [];
        this.currentStage = 0;
    }

    /**
     * Check if quest can be started
     */
    canStart(completedQuests) {
        if (this.state !== 'inactive') return false;

        // Check prerequisites
        if (this.prerequisites.length > 0) {
            return this.prerequisites.every(questId =>
                completedQuests.includes(questId)
            );
        }

        return true;
    }

    /**
     * Start the quest
     */
    start() {
        if (this.state !== 'inactive') {
            return false;
        }

        this.state = 'active';
        this.timeStarted = Date.now();
        this.hidden = false;

        return true;
    }

    /**
     * Update objective progress
     */
    updateObjective(type, target, amount = 1) {
        if (this.state !== 'active') return false;

        const objective = this.objectives.find(obj =>
            obj.type === type && obj.target === target && !obj.completed
        );

        if (!objective) return false;

        objective.progress += amount;

        // Check if objective is completed
        if (objective.progress >= objective.quantity) {
            objective.completed = true;
            objective.progress = objective.quantity;
        }

        // Check if all objectives are completed
        if (this.checkAllObjectivesComplete()) {
            this.complete();
        }

        return true;
    }

    /**
     * Check if all objectives are completed
     */
    checkAllObjectivesComplete() {
        return this.objectives.every(obj => obj.completed);
    }

    /**
     * Complete the quest
     */
    complete() {
        if (this.state !== 'active') {
            return false;
        }

        this.state = 'completed';
        this.timeCompleted = Date.now();

        return true;
    }

    /**
     * Fail the quest
     */
    fail(reason) {
        if (this.state !== 'active') {
            return false;
        }

        this.state = 'failed';
        this.failureReason = reason;

        return true;
    }

    /**
     * Check if quest has failed due to conditions
     */
    checkFailureConditions(gameState) {
        if (this.state !== 'active') return false;

        for (const condition of this.failureConditions) {
            if (this.evaluateFailureCondition(condition, gameState)) {
                this.fail(condition.reason);
                return true;
            }
        }

        return false;
    }

    /**
     * Evaluate a failure condition
     */
    evaluateFailureCondition(condition, gameState) {
        switch (condition.type) {
            case 'timeLimit':
                return Date.now() - this.timeStarted > condition.value;
            case 'itemLost':
                return !gameState.player.hasItem(condition.itemId);
            case 'npcDead':
                return gameState.npcs[condition.npcId]?.isDead;
            case 'locationLeft':
                return gameState.player.currentRoom !== condition.roomId;
            default:
                return false;
        }
    }

    /**
     * Advance to next stage
     */
    advanceStage() {
        if (this.state !== 'active' || this.currentStage >= this.stages.length - 1) {
            return false;
        }

        this.currentStage++;

        // Update objectives based on new stage
        if (this.stages[this.currentStage].objectives) {
            this.stages[this.currentStage].objectives.forEach(obj => {
                this.objectives.push({
                    ...obj,
                    completed: false,
                    progress: 0
                });
            });
        }

        return true;
    }

    /**
     * Get current stage data
     */
    getCurrentStage() {
        return this.stages[this.currentStage];
    }

    /**
     * Get quest progress percentage
     */
    getProgress() {
        if (this.state === 'completed') return 100;
        if (this.state === 'inactive') return 0;

        const totalObjectives = this.objectives.length;
        const completedObjectives = this.objectives.filter(obj => obj.completed).length;
        const partialProgress = this.objectives.reduce((sum, obj) => {
            if (!obj.completed) {
                return sum + (obj.progress / obj.quantity);
            }
            return sum;
        }, 0);

        return Math.floor((completedObjectives + partialProgress) / totalObjectives * 100);
    }

    /**
     * Get quest status summary
     */
    getStatus() {
        return {
            id: this.id,
            title: this.title,
            state: this.state,
            progress: this.getProgress(),
            objectives: this.objectives.map(obj => ({
                type: obj.type,
                target: obj.target,
                progress: obj.progress,
                quantity: obj.quantity,
                completed: obj.completed
            })),
            currentStage: this.currentStage,
            timeRemaining: this.timeLimit ?
                Math.max(0, this.timeLimit - (Date.now() - this.timeStarted)) :
                null
        };
    }

    /**
     * Check if quest is completed
     */
    isCompleted() {
        return this.state === 'completed';
    }

    /**
     * Reset quest to initial state
     */
    reset() {
        this.state = 'inactive';
        this.timeStarted = null;
        this.timeCompleted = null;
        this.currentStage = 0;
        this.objectives = this.objectives.map(obj => ({
            ...obj,
            completed: false,
            progress: 0
        }));
        this.hidden = this.initialHidden;
    }

    /**
     * Serialize quest data for saving
     */
    serialize() {
        return {
            id: this.id,
            state: this.state,
            objectives: this.objectives.map(obj => ({
                type: obj.type,
                target: obj.target,
                progress: obj.progress,
                completed: obj.completed
            })),
            timeStarted: this.timeStarted,
            timeCompleted: this.timeCompleted,
            currentStage: this.currentStage,
            hidden: this.hidden
        };
    }

    /**
     * Load serialized quest data
     */
    loadState(data) {
        this.state = data.state;
        this.timeStarted = data.timeStarted;
        this.timeCompleted = data.timeCompleted;
        this.currentStage = data.currentStage;
        this.hidden = data.hidden;

        // Restore objectives progress
        data.objectives.forEach((savedObj, index) => {
            if (this.objectives[index]) {
                this.objectives[index].progress = savedObj.progress;
                this.objectives[index].completed = savedObj.completed;
            }
        });
    }
}
