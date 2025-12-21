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
                // CUSTOM LABELS v1.4.0
                labels: {
                    operation: 'Operação',
                    profit: 'Lucro',
                    tax: 'Impostos',
                    investment: 'Investimento'
                },
                profitThisLevel: 0,
                transactions: [] // History
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
                topic: '',
                history: [] // Log de estudos
            }
        };

        // Deep copy
        this.state = JSON.parse(JSON.stringify(this.defaultState));
        this.listeners = [];
        this.loadState();
        this.checkDailyReset();
    }

    // --- Persistência ---

    loadState() {
        const savedState = localStorage.getItem('aura_state_v1');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);

                // Merge inteligente
                this.state = {
                    ...this.state,
                    ...parsed,
                    finance: {
                        ...this.state.finance,
                        ...parsed.finance,
                        config: { ...this.state.finance.config, ...(parsed.finance?.config || {}) },
                        buckets: { ...this.state.finance.buckets, ...(parsed.finance?.buckets || {}) },
                        labels: { ...this.state.finance.labels, ...(parsed.finance?.labels || {}) }, // Merge Labels
                        transactions: parsed.finance?.transactions || [] // Ensure array
                    },
                    routine: { ...this.state.routine, ...(parsed.routine || {}) },
                    study: {
                        ...this.state.study,
                        ...(parsed.study || {}),
                        history: parsed.study?.history || []
                    }
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

    // --- Rotinas ---

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

    // --- Estudo ---

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

        // Log History
        if (!this.state.study.history) this.state.study.history = [];
        this.state.study.history.push({
            date: new Date().toISOString(),
            topic: this.state.study.topic,
            duration: 20
        });

        // Auto-check na lista (se existir)
        if (!this.state.routine.checklist.technical_study) {
            this.state.routine.checklist.technical_study = true;
        }

        this.state.study.isTimerActive = false;
        this.state.study.endTime = null;
        this.saveState();
    }

    // --- Core Logic (Finance & XP) v1.4.0 ---

    updateBucketLabel(key, newLabel) {
        if (this.state.finance.labels.hasOwnProperty(key)) {
            this.state.finance.labels[key] = newLabel;
            this.saveState();
        }
    }

    // Novo método para Despesas
    processExpense(amount, category) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { buckets } = this.state.finance;

        if (buckets.hasOwnProperty(category)) {
            buckets[category] -= amount;
            // Record Transaction (Expense)
            if (!this.state.finance.transactions) this.state.finance.transactions = [];
            this.state.finance.transactions.unshift({
                id: Date.now(),
                date: new Date().toISOString(),
                type: 'expense', // v1.4.0
                category: category,
                amount: amount,
                // Split é null para despesa direta, mas podemos guardar snapshot se quisermos
                split: null
            });
            this.saveState();
        }
    }

    processIncome(amount) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { config, buckets } = this.state.finance;

        // Calculate splits
        const opOps = amount * (config.operation / 100);
        const opProfit = amount * (config.profit / 100);
        const opTax = amount * (config.tax / 100);
        const opInvest = amount * (config.investment / 100);

        // Apply to buckets
        buckets.operation += opOps;
        buckets.profit += opProfit;
        buckets.tax += opTax;
        buckets.investment += opInvest;

        this.state.finance.profitThisLevel += opProfit;

        // Record Transaction (Income)
        if (!this.state.finance.transactions) this.state.finance.transactions = [];
        this.state.finance.transactions.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'income', // v1.4.0
            category: null, // Global
            amount: amount,
            split: {
                operation: opOps,
                profit: opProfit,
                tax: opTax,
                investment: opInvest
            },
            configSnapshot: { ...config }
        });

        // Limit history size (optional, e.g., 50 last)
        if (this.state.finance.transactions.length > 50) this.state.finance.transactions.pop();

        this.addXP(10);
        this.saveState();
    }

    deleteTransaction(id) {
        const { finance } = this.state;
        const index = finance.transactions.findIndex(t => t.id === id);

        if (index === -1) return; // Not found

        const t = finance.transactions[index];

        if (t.type === 'expense') {
            // Reverter Despesa = Devolver dinheiro ao balde
            if (finance.buckets.hasOwnProperty(t.category)) {
                finance.buckets[t.category] += t.amount;
                console.log(`Despesa revertida. ${t.amount}€ devolvidos a ${t.category}`);
            }
        } else {
            // Revert Buckets (Income)
            if (t.split) { // Ensure it's an income transaction with split data
                finance.buckets.operation -= t.split.operation;
                finance.buckets.profit -= t.split.profit;
                finance.buckets.tax -= t.split.tax;
                finance.buckets.investment -= t.split.investment;

                // Revert Profit Level Tracker
                finance.profitThisLevel -= t.split.profit;
                if (finance.profitThisLevel < 0) finance.profitThisLevel = 0; // Safety floor
            }
            // Revert XP (Simple reversion of 10 XP for income)
            this.addXP(-10);
        }

        // Remove from history
        finance.transactions.splice(index, 1);

        console.log(`Transação ${id} apagada. Valores revertidos.`);
        this.saveState();
    }

    updateFinanceConfig(newConfig) {
        this.state.finance.config = { ...this.state.finance.config, ...newConfig };
        this.saveState();
    }

    addXP(amount) {
        this.state.profile.currentXP += amount;
        // Prevent negative XP (edge case on delete)
        if (this.state.profile.currentXP < 0) this.state.profile.currentXP = 0;

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
