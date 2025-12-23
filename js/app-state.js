/**
 * AURA - App State Management v1.5.0
 * Gestão centralizada do estado, incluindo Contas, Templates e Lógica Financeira Avançada.
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
                transactions: [],
                // v1.5.0 Modules
                accounts: [
                    { id: 'bank_main', name: 'Banco Principal', balance: 0, type: 'bank' },
                    { id: 'cash_wallet', name: 'Carteira (Físico)', balance: 0, type: 'cash' }
                ],
                // v1.9.5: Dynamic Business Buckets
                businessBuckets: [
                    { id: 'op', name: 'Operação', percent: 60, balance: 0 },
                    { id: 'profit', name: 'Lucro', percent: 20, balance: 0 },
                    { id: 'tax', name: 'Impostos', percent: 15, balance: 0 },
                    { id: 'invest', name: 'Investimento', percent: 5, balance: 0 }
                ],
                // v1.9.1: Dynamic Personal Categories
                personalCategories: [
                    { id: 'cat_essential', name: 'Essencial', color: '#ff4444' }, // Red
                    { id: 'cat_leisure', name: 'Lazer', color: '#4444ff' },     // Blue
                    { id: 'cat_invest', name: 'Investimento', color: '#44ff44' } // Green
                ],
                templates: []
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
                        labels: { ...this.state.finance.labels, ...(parsed.finance?.labels || {}) },
                        transactions: Array.isArray(parsed.finance?.transactions) ? parsed.finance.transactions : [],
                        // Fix v1.7.0: Explicit check for Array to prevent overwriting with defaults
                        accounts: Array.isArray(parsed.finance?.accounts) ? parsed.finance.accounts : this.defaultState.finance.accounts,
                        // v1.9.5: Merge businessBuckets
                        businessBuckets: Array.isArray(parsed.finance?.businessBuckets) ? parsed.finance.businessBuckets : this.defaultState.finance.businessBuckets,
                        // Legacy support: If loading old state without buckets, rely on default
                        // If user had buckets (v1.9.5), use them.
                        templates: Array.isArray(parsed.finance?.templates) ? parsed.finance.templates : []
                    },
                    health: { ...this.state.health, ...(parsed.health || {}) },
                    routine: {
                        ...this.state.routine,
                        checklist: { ...this.state.routine.checklist, ...(parsed.routine?.checklist || {}) }
                    },
                    study: {
                        ...this.state.study,
                        ...(parsed.study || {}),
                        history: parsed.study?.history || []
                    }
                };
                console.log('Core: State Loaded. Accounts:', this.state.finance.accounts);
            } catch (e) {
                console.error('Core: Erro ao carregar estado:', e);
            }
        } else {
            console.log('Core: No saved state found. Using defaults.');
        }
    }

    saveState() {
        // Debug: Log saving action
        if (this.state.finance.accounts.length === 0) console.warn('Core: WARNING - Saving EMPTY accounts array!');

        localStorage.setItem('aura_state_v1', JSON.stringify(this.state));
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        console.log('Core: New subscriber registered. Sending immediate state.');
        listener(this.state);
    }

    notify() {
        console.log(`Core: Notifying ${this.listeners.length} listeners.`);
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

    updateBucketLabel(key, newLabel) {
        if (this.state.finance.labels.hasOwnProperty(key)) {
            this.state.finance.labels[key] = newLabel;
            this.saveState();
        }
    }

    // --- Account Management v1.5.0 ---
    addAccount(name, initialBalance = 0, type = 'bank') {
        const id = 'acc_' + Date.now();
        this.state.finance.accounts.push({ id, name, balance: parseFloat(initialBalance), type });
        this.saveState();
    }

    updateAccount(id, updates) {
        const acc = this.state.finance.accounts.find(a => a.id === id);
        if (acc) {
            Object.assign(acc, updates);
            this.saveState();
        }
    }

    deleteAccount(id) {
        this.state.finance.accounts = this.state.finance.accounts.filter(a => a.id !== id);
        this.saveState();
    }

    // --- Templates Management v1.6.5 ---
    addTemplate(name, amount, day = null, auto = false) {
        this.state.finance.templates.push({
            id: Date.now(),
            name,
            amount: parseFloat(amount),
            day: day ? parseInt(day) : null,
            auto: !!auto
        });
        this.saveState();
    }

    deleteTemplate(id) {
        this.state.finance.templates = this.state.finance.templates.filter(t => t.id !== id);
        this.saveState();
    }

    // --- Core Logic (Finance & XP) v1.5.0 ---

    // v1.5.0: Process Expense (Direct Bucket Deduction + Account Deduction)
    processExpense(amount, category, accountId) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { buckets, accounts } = this.state.finance;

        // 1. Deduct from Bucket
        if (buckets.hasOwnProperty(category)) {
            buckets[category] -= amount;
        }

        // 2. Deduct from Account (if valid)
        // v1.9.5: Deduct from Business Buckets
        const bIndex = this.state.finance.businessBuckets.findIndex(b => b.id === category);
        if (bIndex >= 0) {
            this.state.finance.businessBuckets[bIndex].balance -= amount;
        } else {
            // If legacy bucket or invalid ID, warn (or personal category?)
            // Personal categories don't have balances in this array.
        }

        // 2. Deduct from Account (if valid)
        const acc = accounts.find(a => a.id === accountId);
        if (acc) {
            acc.balance -= amount;
        } else {
            console.warn('Conta não encontrada para despesa:', accountId);
        }

        // 3. Record Transaction
        if (!this.state.finance.transactions) this.state.finance.transactions = [];
        this.state.finance.transactions.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'expense',
            category: category,
            summary: this.getBucketName(category), // helper
            amount: amount,
            accountId: accountId, // Track source
            split: null
        });
        this.saveState();
    }

    getBucketName(id) {
        const b = this.state.finance.businessBuckets.find(x => x.id === id);
        return b ? b.name : id;
    }

    // v1.9.5: Process Income (Dynamic Distribution)
    processIncome(amount, accountId) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { businessBuckets, accounts } = this.state.finance;

        // 1. Calculate splits & Apply
        const splitSnapshot = {};

        businessBuckets.forEach(b => {
            const val = amount * (b.percent / 100);
            b.balance += val;
            splitSnapshot[b.id] = val; // Store for history/revert

            // Track Profit specific for Level logic (Legacy: 'profit' ID)
            if (b.id === 'profit') this.state.finance.profitThisLevel += val;
        });

        // 3. Add to Account
        const acc = accounts.find(a => a.id === accountId);
        if (acc) {
            acc.balance += amount;
        } else {
            if (accounts.length > 0) accounts[0].balance += amount;
        }

        // 4. Record Transaction
        if (!this.state.finance.transactions) this.state.finance.transactions = [];
        this.state.finance.transactions.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'income',
            category: null,
            amount: amount,
            accountId: accountId, // Track destination
            split: splitSnapshot, // { op: 100, profit: 20 ... }
            configSnapshot: null // Deprecated
        });

        if (this.state.finance.transactions.length > 50) this.state.finance.transactions.pop();

        this.addXP(10);
        this.saveState();
    }

    // v1.9.5: Delete (Revert Dynamic)
    deleteTransaction(id) {
        const { finance } = this.state;
        const index = finance.transactions.findIndex(t => t.id === id);
        if (index === -1) return;

        const t = finance.transactions[index];
        const acc = finance.accounts.find(a => a.id === t.accountId);

        if (t.type === 'expense') {
            // Revert Expense: Add back to Bucket & Account
            const b = finance.businessBuckets.find(x => x.id === t.category);
            if (b) b.balance += t.amount;
            else {
                // Try legacy check if bucket was deleted?
                // For now, if bucket gone, money lost from bucket view, but account restored.
            }

            if (acc) acc.balance += t.amount;

        } else {
            // Revert Income: Subtract from Buckets & Account
            if (t.split) {
                // t.split is object { id: amount }
                Object.entries(t.split).forEach(([bId, val]) => {
                    const b = finance.businessBuckets.find(x => x.id === bId);
                    if (b) b.balance -= val;
                });


                finance.profitThisLevel -= t.split.profit;
                if (finance.profitThisLevel < 0) finance.profitThisLevel = 0;
            }
            if (acc) acc.balance -= t.amount;
            this.addXP(-10);
        }

        finance.transactions.splice(index, 1);
        console.log(`Transação ${id} apagada. Valores revertidos v1.9.5.`);
        this.saveState();
    }

    // v1.9.5: Update Dynamic Buckets (Replaces updateFinanceConfig)
    saveBusinessBuckets(newBuckets) {
        // newBuckets array should be validated before calling (sum=100)
        this.state.finance.businessBuckets = newBuckets;
        this.saveState();
    }

    // Deprecated but kept for compatibility logic if needed
    updateFinanceConfig(newConfig) {
        console.warn('updateFinanceConfig is deprecated in v1.9.5. Use saveBusinessBuckets.');
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

            // v1.9.5: Profit logic
            const profitBucket = finance.businessBuckets.find(b => b.id === 'profit');
            if (bonusAmount > 0 && profitBucket && profitBucket.balance >= bonusAmount) {
                profitBucket.balance -= bonusAmount;
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
    // --- Visual Analytics Helpers v1.6.0 ---
    getBusinessBalance() {
        return this.state.finance.buckets.operation + this.state.finance.buckets.tax;
    }

    getPersonalBalance() {
        return this.state.finance.buckets.profit + this.state.finance.buckets.investment + this.state.bonusVault.current;
    }
    // --- Personal Finance v1.8.0 ---
    // v2.4: Added title and subcategory
    addPersonalTransaction(type, amount, category, accountId, title, subcategory) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) return;

        const { accounts } = this.state.finance;
        const acc = accounts.find(a => a.id === accountId);

        if (!acc) {
            console.error("Personal Transaction: Account not found", accountId);
            return;
        }

        if (type === 'expense') {
            acc.balance -= amount;
        } else if (type === 'income') {
            acc.balance += amount;
        }

        // Record it
        if (!this.state.finance.transactions) this.state.finance.transactions = [];
        this.state.finance.transactions.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            type: type, // 'expense' or 'income'
            category: category, // 'Essencial', 'Lazer', 'Investimento' (or null for income)
            subcategory: subcategory || null, // v2.4
            summary: category || 'Rendimento Pessoal',
            title: title || (category ? `${category}` : 'Despesa'), // v2.4
            amount: amount,
            accountId: accountId,
            split: null, // No business split
            description: title || 'Movimento Pessoal'
        });

        if (this.state.finance.transactions.length > 50) this.state.finance.transactions.pop();
        // v1.9.1: Add XP for logging
        this.addXP(5);
        this.saveState();
        console.log(`Personal Transaction: ${type} ${amount}€ (${category}) -> ${acc.name}`);
    }

    // v1.9.0: Radar Chart Data (Updated v1.9.1 for Dynamic Categories)
    getMonthlyPersonalExpenses() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // v1.9.1: Initialize totals based on current categories
        const totals = {};
        const categories = this.state.finance.personalCategories || [];

        categories.forEach(cat => {
            totals[cat.name] = 0;
        });

        if (this.state.finance.transactions) {
            this.state.finance.transactions.forEach(t => {
                const tDate = new Date(t.date);
                if (t.type === 'expense' && t.category && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                    // Normalize check due to legacy data
                    if (totals.hasOwnProperty(t.category)) {
                        totals[t.category] += t.amount;
                    } else {
                        // Fallback logic could go here, or just ignore outdated categories
                        // or add to an 'Outros' bucket if we wanted.
                    }
                }
            });
        }

        return totals;
    }

    // v1.9.1: Category Management
    addPersonalCategory(name, color) {
        if (!name) return;
        if (!this.state.finance.personalCategories) this.state.finance.personalCategories = [];

        const newCat = {
            id: 'cat_' + Date.now(),
            name: name,
            color: color || '#aaaaaa',
            subcategories: [] // v2.4
        };

        this.state.finance.personalCategories.push(newCat);
        this.saveState();
        console.log(`Category Added: ${name}`);
    }

    // v2.4: Manage Subcategories
    addSubcategory(catInd, subName) {
        // catInd might be string ID.
        const cat = this.state.finance.personalCategories.find(c => c.id === catInd);
        if (cat) {
            if (!cat.subcategories) cat.subcategories = [];
            cat.subcategories.push(subName);
            this.saveState();
        } else {
            console.error("Category not found for adding sub:", catInd);
        }
    }

    removeSubcategory(catInd, subName) {
        const cat = this.state.finance.personalCategories.find(c => c.id === catInd);
        if (cat && cat.subcategories) {
            cat.subcategories = cat.subcategories.filter(s => s !== subName);
            this.saveState();
        }
    }

    removePersonalCategory(id) {
        if (!this.state.finance.personalCategories) return;
        this.state.finance.personalCategories = this.state.finance.personalCategories.filter(c => c.id !== id);
        this.saveState();
        console.log(`Category Removed: ${id}`);
    }

    // For later: Edit Name/Color
}

export const auraState = new AuraState();
