/**
 * AURA - App State Management v1.2.0
 * Gestão centralizada do estado, lógica de divisão financeira, gamificação e Rotinas.
 */

class AuraState {
    constructor() {
        // Estado Inicial Padrão
        this.defaultState = {
            profile: {
                level: 1,
                currentXP: 0,
                nextLevelXP: 1000
            },
            finance: {
                config: {
                    operation: 60,
                    profit: 20,
                    tax: 15,
                    investment: 5
                },
                buckets: {
                    operation: 0,
                    profit: 0,
                    tax: 0,
                    investment: 0
                },
                profitThisLevel: 0
            },
            health: {
                water: 0,
                workout: false
            },
            bonusVault: {
                current: 0,
                history: []
            },
            // NOVOS MÓDULOS v1.2.0
            routine: {
                lastDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                checklist: {
                    financial_review: false,
                    workout: false,
                    technical_study: false
                }
            },
            study: {
                isTimerActive: false,
                endTime: null,
                topic: ''
            }
        };

        // Deep copy clean state
        this.state = JSON.parse(JSON.stringify(this.defaultState));
        this.listeners = [];
        this.loadState();
        this.checkDailyReset(); // Verifica reset ao iniciar
    }

    // --- Persistência ---

    loadState() {
        const savedState = localStorage.getItem('aura_state_v1');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);

                // Merge inteligente para manter compatibilidade com v1.0/v1.1
                this.state = {
                    ...this.state,
                    ...parsed,
                    finance: {
                        ...this.state.finance,
                        ...parsed.finance,
                        config: { ...this.state.finance.config, ...(parsed.finance?.config || {}) },
                        buckets: { ...this.state.finance.buckets, ...(parsed.finance?.buckets || {}) }
                    },
                    routine: { ...this.state.routine, ...(parsed.routine || {}) },
                    study: { ...this.state.study, ...(parsed.study || {}) }
                };
            } catch (e) {
                console.error('Core: Erro ao carregar estado:', e);
            }
        }
    }

    saveState() {
        localStorage.setItem('aura_state_v1', JSON.stringify(this.state));
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        listener(this.state);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Rotinas V1.2.0 ---

    checkDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.routine.lastDate !== today) {
            console.log('Daily Reset: Novo dia detetado!');
            // Reset daily counters
            this.state.health.water = 0;
            this.state.health.workout = false;

            // Reset checklist
            this.state.routine.checklist = {
                financial_review: false,
                workout: false,
                technical_study: false
            };

            this.state.routine.lastDate = today;
            this.saveState();
        }
    }

    toggleChecklistItem(itemKey) {
        if (this.state.routine.checklist.hasOwnProperty(itemKey)) {
            const newVal = !this.state.routine.checklist[itemKey];
            this.state.routine.checklist[itemKey] = newVal;

            // Sincronizar 'workout' da checklist com health.workout
            if (itemKey === 'workout') {
                this.state.health.workout = newVal;
            }

            // XP Reward (apenas na conclusão)
            if (newVal) {
                this.addXP(20);
            } else {
                this.addXP(-20); // Remove se desmarcar
            }
            this.saveState();
        }
    }

    // --- Estudo V1.2.0 ---

    startStudyTimer(topic, durationMinutes = 20) {
        if (this.state.study.isTimerActive) return;

        const now = Date.now();
        const durationMs = durationMinutes * 60 * 1000;

        this.state.study.topic = topic;
        this.state.study.endTime = now + durationMs;
        this.state.study.isTimerActive = true;
        this.saveState();
    }

    cancelStudyTimer() {
        this.state.study.isTimerActive = false;
        this.state.study.endTime = null;
        this.saveState();
    }

    completeStudyTimer() {
        if (!this.state.study.isTimerActive) return;

        // Reward Gigante
        this.addXP(100);

        // Auto-check na lista (se existir)
        if (!this.state.routine.checklist.technical_study) {
            this.state.routine.checklist.technical_study = true;
        }

        this.state.study.isTimerActive = false;
        this.state.study.endTime = null;
        this.saveState();
    }

    // --- Core Logic (Finance & XP) ---

    processIncome(amount) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { config, buckets } = this.state.finance;
        buckets.operation += amount * (config.operation / 100);
        buckets.profit += amount * (config.profit / 100);
        buckets.tax += amount * (config.tax / 100);
        buckets.investment += amount * (config.investment / 100);

        this.state.finance.profitThisLevel += amount * (config.profit / 100);

        // Auto-check Finance Review se registar renda? (Opcional, por agora manual)
        // this.state.routine.checklist.financial_review = true;

        this.addXP(10);
        this.saveState();
    }

    updateFinanceConfig(newConfig) {
        this.state.finance.config = { ...this.state.finance.config, ...newConfig };
        this.saveState();
    }

    addXP(amount) {
        this.state.profile.currentXP += amount;
        this.checkLevelUp();
        this.saveState();
    }

    addWater() {
        this.state.health.water += 250;
        this.addXP(5);
        this.saveState();
    }

    checkLevelUp() {
        const { profile, finance } = this.state;
        if (profile.currentXP >= profile.nextLevelXP) {
            profile.level++;
            profile.currentXP = profile.currentXP - profile.nextLevelXP;
            profile.nextLevelXP = Math.floor(profile.nextLevelXP * 1.5);

            const bonusAmount = finance.profitThisLevel * 0.05;
            if (bonusAmount > 0 && finance.buckets.profit >= bonusAmount) {
                finance.buckets.profit -= bonusAmount;
                this.state.bonusVault.current += bonusAmount;
                this.state.bonusVault.history.push({
                    level: profile.level - 1,
                    amount: bonusAmount,
                    date: new Date().toISOString()
                });
            }
            finance.profitThisLevel = 0;
            console.log(`Level Up! Nível ${profile.level}. Bonus: ${bonusAmount.toFixed(2)}€`);
        }
    }
}

export const auraState = new AuraState();
