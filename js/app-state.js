/**
 * AURA - App State Management v1.1.0
 * Gestão centralizada do estado, lógica de divisão financeira e gamificação.
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
                // Configuração de Percentagens (Soma deve ser 100)
                config: {
                    operation: 60, // Operação
                    profit: 20,    // Lucro
                    tax: 15,       // Impostos
                    investment: 5  // Investimento
                },
                // Baldes de Valor
                buckets: {
                    operation: 0,
                    profit: 0,
                    tax: 0,
                    investment: 0
                },
                // Tracker para o Bonus Vault (lucro acumulado neste nível)
                profitThisLevel: 0
            },
            health: {
                water: 0,      // ml
                workout: false // booleano
            },
            bonusVault: {
                current: 0,
                history: []
            }
        };

        this.state = JSON.parse(JSON.stringify(this.defaultState));
        this.listeners = [];
        this.loadState();
    }

    // --- Persistência ---

    loadState() {
        const savedState = localStorage.getItem('aura_state_v1');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Merge profundo simples para garantir que novas chaves existam
                this.state = {
                    ...this.state,
                    ...parsed,
                    finance: {
                        ...this.state.finance,
                        ...parsed.finance,
                        config: { ...this.state.finance.config, ...(parsed.finance?.config || {}) },
                        buckets: { ...this.state.finance.buckets, ...(parsed.finance?.buckets || {}) }
                    },
                    profile: { ...this.state.profile, ...(parsed.profile || {}) },
                    health: { ...this.state.health, ...(parsed.health || {}) }
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
        // Notificar imediatamente ao subscrever para UI sync
        listener(this.state);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Lógica Financeira ---

    /**
     * Atualiza as configurações de percentagem dos baldes
     */
    updateFinanceConfig(newConfig) {
        // Validação básica: soma deve ser 100 (ou lidar na UI)
        this.state.finance.config = { ...this.state.finance.config, ...newConfig };
        this.saveState();
    }

    /**
     * Processa uma nova entrada de rendimento (Venda)
     * Divide automaticamente pelos baldes conforme config.
     */
    processIncome(amount) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { config, buckets } = this.state.finance;

        // Cálculos
        const opOps = amount * (config.operation / 100);
        const opProfit = amount * (config.profit / 100);
        const opTax = amount * (config.tax / 100);
        const opInvest = amount * (config.investment / 100);

        // Debug simples para arredondamentos (pode ser melhorado com cents)
        buckets.operation += opOps;
        buckets.profit += opProfit;
        buckets.tax += opTax;
        buckets.investment += opInvest;

        // Tracking para Bonus Vault
        this.state.finance.profitThisLevel += opProfit;

        // Gamificação: XP por registar venda (ex: 10 XP)
        this.addXP(10);
        this.saveState();
    }

    // --- Lógica de Gamificação (Profile & Vault) ---

    addXP(amount) {
        this.state.profile.currentXP += amount;
        this.checkLevelUp();
        this.saveState();
    }

    checkLevelUp() {
        const { profile, finance } = this.state;

        if (profile.currentXP >= profile.nextLevelXP) {
            // Level Up!
            profile.level++;
            profile.currentXP = profile.currentXP - profile.nextLevelXP;
            profile.nextLevelXP = Math.floor(profile.nextLevelXP * 1.5); // Curva de dificuldade

            // Lógica Bonus Vault: Mover 5% do Lucro deste nível para o Vault
            const bonusAmount = finance.profitThisLevel * 0.05;

            if (bonusAmount > 0 && finance.buckets.profit >= bonusAmount) {
                finance.buckets.profit -= bonusAmount; // Deduz do balde de lucro
                this.state.bonusVault.current += bonusAmount;

                this.state.bonusVault.history.push({
                    level: profile.level - 1,
                    amount: bonusAmount,
                    date: new Date().toISOString()
                });
            }

            // Reset do tracker para o novo nível
            finance.profitThisLevel = 0;

            console.log(`Level Up! Bem-vindo ao nível ${profile.level}. Bonus: ${bonusAmount.toFixed(2)}€`);
        }
    }

    // --- Lógica de Saúde ---

    addWater() {
        this.state.health.water += 250;
        this.addXP(5); // 5 XP por beber água
        this.saveState();
    }

    toggleWorkout() {
        this.state.health.workout = !this.state.health.workout;
        if (this.state.health.workout) {
            this.addXP(50); // 50 XP por treinar
        } else {
            // Se desmarcar, remove XP? Por simplicidade, mantemos ou ignoramos. 
            // Vamos assumir que só marca uma vez por dia na UI real, aqui é toggle simples.
            this.addXP(-50); // Remove XP se desmarcar (undo)
        }
        this.saveState();
    }
}

export const auraState = new AuraState();
