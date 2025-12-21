/**
 * AURA - UI Render Engine v1.4.0 (Finance 2.0)
 * Interface avançada com Despesas, Custom Labels e Histórico.
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.activeTab = 'aura';
        this.timerInterval = null;
        this.transactionMode = 'income'; // 'income' (Venda) or 'expense' (Despesa)
        this.init();
    }

    init() {
        this.renderStructure();
        this.setupListeners();

        auraState.subscribe((state) => {
            this.updateUI(state);
            this.handleTimerState(state);
        });
    }

    renderStructure() {
        // Nota: A estrutura HTML agora é dinâmica baseada em labels, mas o shell inicial é fixo.
        // Os listeners precisam ser re-anexados se re-renderizarmos tudo? 
        // Sim. Vamos manter a estratégia ideal para SPA: Render inicial + Update dinâmico.

        this.appElement.innerHTML = `
            <!-- Tab ROTINA -->
            <div id="tab-aura" class="tab-content active">
                <div id="aura-orb-container"></div>
                <div class="glass-card">
                    <div class="stat-row"><span>Nível</span><span id="display-level">1</span></div>
                    <div class="stat-row"><span>XP</span><span id="display-xp">0 / 1000</span></div>
                    <div class="stat-row"><span>Bonus Vault</span><span id="display-vault" style="color: var(--accent-color)">0.00 €</span></div>
                </div>

                <div class="glass-card">
                    <h2>Rotina Diária</h2>
                    <div class="checklist-item">
                        <input type="checkbox" id="check-finance-main" data-key="financial_review">
                        <label for="check-finance-main">Revisão Financeira</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="check-workout-main" data-key="workout">
                        <label for="check-workout-main">Atividade Física</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="check-study-main" data-key="technical_study">
                        <label for="check-study-main">Estudo Técnico</label>
                    </div>
                </div>
            </div>

            <!-- Tab FINANÇA -->
            <div id="tab-finance" class="tab-content">
                <div class="glass-card">
                    <h2>Registo</h2>
                    
                    <div class="toggle-container">
                        <button class="toggle-btn active income" id="btn-mode-income">Venda (Entrada)</button>
                        <button class="toggle-btn expense" id="btn-mode-expense">Despesa (Saída)</button>
                    </div>

                    <input type="number" id="input-transaction-amount" placeholder="Valor (€)" step="0.01">
                    
                    <div id="expense-category-container" style="display: none;">
                        <label style="font-size: 0.9rem; margin-bottom: 5px; display: block; color: var(--text-muted);">De onde sai o dinheiro?</label>
                        <select id="select-expense-bucket">
                            <!-- Preenchido via JS -->
                        </select>
                    </div>

                    <button class="primary" id="btn-submit-transaction">Registar Venda</button>
                </div>

                <div class="glass-card">
                    <h2>Baldes</h2>
                    <div class="stat-row"><span id="lbl-display-op">Operação</span> <span id="val-op" class="text-success">0.00 €</span></div>
                    <div class="stat-row"><span id="lbl-display-profit">Lucro</span> <span id="val-profit" class="text-success">0.00 €</span></div>
                    <div class="stat-row"><span id="lbl-display-tax">Impostos</span> <span id="val-tax" class="text-success">0.00 €</span></div>
                    <div class="stat-row"><span id="lbl-display-invest">Investimento</span> <span id="val-invest" class="text-success">0.00 €</span></div>
                </div>

                <div class="glass-card">
                    <h2>Últimos Movimentos</h2>
                    <div id="transactions-list"></div>
                </div>

                 <div class="glass-card">
                    <h2>Configurações (%)</h2>
                    <label><input type="text" class="bucket-label-input" id="edit-lbl-op" value="Operação">: <span id="perc-op">60</span>%</label>
                    <input type="range" id="slider-op" min="0" max="100" value="60">
                    
                    <label><input type="text" class="bucket-label-input" id="edit-lbl-profit" value="Lucro">: <span id="perc-profit">20</span>%</label>
                    <input type="range" id="slider-profit" min="0" max="100" value="20">
                    
                    <label><input type="text" class="bucket-label-input" id="edit-lbl-tax" value="Impostos">: <span id="perc-tax">15</span>%</label>
                    <input type="range" id="slider-tax" min="0" max="100" value="15">
                    
                    <label><input type="text" class="bucket-label-input" id="edit-lbl-invest" value="Investimento">: <span id="perc-invest">5</span>%</label>
                    <input type="range" id="slider-invest" min="0" max="100" value="5">
                    
                    <small>Total: <span id="slider-total">100</span>%</small>
                </div>
            </div>

            <!-- Tab SAÚDE -->
            <div id="tab-health" class="tab-content">
                <div class="glass-card" style="text-align: center;">
                    <h2>Vitalidade</h2>
                    <button class="water-btn" id="btn-water">
                        +250ml<br>
                        <span id="display-water" style="font-size: 0.8rem; opacity: 0.8">0ml</span>
                    </button>
                </div>
                <!-- Checklist item sync -->
                <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between;">
                    <span>Treino do Dia</span>
                    <input type="checkbox" id="check-workout-health" data-key="workout" style="transform: scale(1.5);">
                </div>
            </div>

            <!-- Tab MENTE -->
            <div id="tab-mind" class="tab-content">
                <div class="glass-card" style="text-align: center;">
                    <h2>Estudo Técnico (20min)</h2>
                    <div id="timer-display" style="font-size: 3rem; font-family: monospace; font-weight: bold; margin: 20px 0; color: var(--accent-color);">
                        20:00
                    </div>
                    <div id="timer-controls">
                        <input type="text" id="input-study-topic" placeholder="O que vais estudar hoje?" 
                            style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
                        <button class="primary" id="btn-start-timer">Começar Sessão</button>
                    </div>
                </div>
                 <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between;">
                    <span>Estudo Realizado</span>
                    <input type="checkbox" id="check-study-mind" data-key="technical_study" style="transform: scale(1.5);">
                </div>
            </div>

            <nav class="nav-bar">
                <a class="nav-item active" data-tab="aura">
                    <span style="font-size: 1.2rem;">✨</span> Rotina
                </a>
                <a class="nav-item" data-tab="finance">
                    <span style="font-size: 1.2rem;">💰</span> Finança
                </a>
                <a class="nav-item" data-tab="health">
                    <span style="font-size: 1.2rem;">❤️</span> Saúde
                </a>
                <a class="nav-item" data-tab="mind">
                    <span style="font-size: 1.2rem;">🧠</span> Mente
                </a>
            </nav>
        `;

        this.renderOrb(document.getElementById('aura-orb-container'));
        this.setupInternalListeners();
    }

    renderOrb(container) {
        const orb = document.createElement('div');
        orb.style.cssText = `
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #4facfe, #00f2fe);
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
            animation: breathe 4s infinite ease-in-out;
            transition: box-shadow 0.3s, transform 0.3s;
        `;
        container.appendChild(orb);
    }

    setupInternalListeners() {
        // --- Navigation ---
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        // --- Finance 2.0 Logic ---
        // Toggle Buttons
        const btnIncome = document.getElementById('btn-mode-income');
        const btnExpense = document.getElementById('btn-mode-expense');
        const submitBtn = document.getElementById('btn-submit-transaction');
        const expenseContainer = document.getElementById('expense-category-container');

        const setMode = (mode) => {
            this.transactionMode = mode;
            if (mode === 'income') {
                btnIncome.classList.add('active');
                btnExpense.classList.remove('active');
                expenseContainer.style.display = 'none';
                submitBtn.textContent = 'Registar Venda';
                submitBtn.classList.remove('expense-mode');
            } else {
                btnExpense.classList.add('active');
                btnIncome.classList.remove('active');
                expenseContainer.style.display = 'block';
                submitBtn.textContent = 'Registar Despesa';
                submitBtn.classList.add('expense-mode');
            }
        };

        btnIncome.addEventListener('click', () => setMode('income'));
        btnExpense.addEventListener('click', () => setMode('expense'));

        // Submit Transaction
        submitBtn.addEventListener('click', () => {
            const amt = document.getElementById('input-transaction-amount').value;
            if (!amt) return;

            if (this.transactionMode === 'income') {
                auraState.processIncome(amt);
            } else {
                const cat = document.getElementById('select-expense-bucket').value;
                auraState.processExpense(amt, cat);
            }
            document.getElementById('input-transaction-amount').value = '';
        });

        // Label Editing (Inputs in Config)
        const labelInputs = [
            { id: 'edit-lbl-op', key: 'operation' },
            { id: 'edit-lbl-profit', key: 'profit' },
            { id: 'edit-lbl-tax', key: 'tax' },
            { id: 'edit-lbl-invest', key: 'investment' }
        ];

        labelInputs.forEach(item => {
            document.getElementById(item.id).addEventListener('change', (e) => {
                const newVal = e.target.value;
                if (newVal) auraState.updateBucketLabel(item.key, newVal);
            });
        });

        // Sliders
        const sliders = ['slider-op', 'slider-profit', 'slider-tax', 'slider-invest'];
        sliders.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.handleConfigChange());
        });

        // Transactions List Delete (Delegation)
        document.getElementById('transactions-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-delete');
            if (btn) {
                const id = parseInt(btn.getAttribute('data-id'));
                if (confirm('Reverter esta transação?')) {
                    auraState.deleteTransaction(id);
                }
            }
        });

        // Checklist
        document.querySelectorAll('input[type="checkbox"][data-key]').forEach(box => {
            box.addEventListener('change', (e) => {
                auraState.toggleChecklistItem(e.target.getAttribute('data-key'));
            });
        });

        // Others
        document.getElementById('btn-water').addEventListener('click', () => auraState.addWater());
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            const topic = document.getElementById('input-study-topic').value;
            if (!topic) { alert('Escreve o tópico!'); return; }
            auraState.startStudyTimer(topic, 20);
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-tab') === tabName) el.classList.add('active');
        });
    }

    handleConfigChange() {
        const op = parseInt(document.getElementById('slider-op').value) || 0;
        const profit = parseInt(document.getElementById('slider-profit').value) || 0;
        const tax = parseInt(document.getElementById('slider-tax').value) || 0;
        const invest = parseInt(document.getElementById('slider-invest').value) || 0;

        document.getElementById('perc-op').textContent = op;
        document.getElementById('perc-profit').textContent = profit;
        document.getElementById('perc-tax').textContent = tax;
        document.getElementById('perc-invest').textContent = invest;

        const total = op + profit + tax + invest;
        const totalEl = document.getElementById('slider-total');
        totalEl.textContent = total;
        totalEl.style.color = total === 100 ? 'var(--finance-color)' : 'red';

        if (total === 100) {
            auraState.updateFinanceConfig({ operation: op, profit: profit, tax: tax, investment: invest });
        }
    }

    handleTimerState(state) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const btn = document.getElementById('btn-start-timer');
        const display = document.getElementById('timer-display');
        const input = document.getElementById('input-study-topic');

        if (state.study.isTimerActive && state.study.endTime) {
            btn.textContent = "Cancelar";
            btn.style.background = "#ff4444";
            btn.onclick = () => auraState.cancelStudyTimer();
            input.style.display = 'none';
            this.timerInterval = setInterval(() => {
                const now = Date.now();
                const diff = state.study.endTime - now;
                if (diff <= 0) {
                    clearInterval(this.timerInterval);
                    auraState.completeStudyTimer();
                    alert("Sessão concluída!");
                    return;
                }
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }, 1000);
        } else {
            btn.textContent = "Começar Sessão";
            btn.style.background = "var(--accent-color)";
            btn.onclick = null; // Clean onclick override, relying on addEventListener
            display.textContent = "20:00";
            input.style.display = "block";
        }
    }

    updateUI(state) {
        const { labels, buckets } = state.finance;

        // update global stats
        document.getElementById('display-level').textContent = state.profile.level;
        document.getElementById('display-xp').textContent = `${state.profile.currentXP} / ${state.profile.nextLevelXP}`;
        document.getElementById('display-vault').textContent = `${state.bonusVault.current.toFixed(2)} €`;

        // sync checklists
        const checkMap = {
            'financial_review': ['check-finance-main'],
            'workout': ['check-workout-main', 'check-workout-health'],
            'technical_study': ['check-study-main', 'check-study-mind']
        };
        for (const [key, ids] of Object.entries(checkMap)) {
            const val = state.routine.checklist[key];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = val;
            });
        }

        // Finance - Update Labels in Buckets Display
        document.getElementById('lbl-display-op').textContent = labels.operation;
        document.getElementById('lbl-display-profit').textContent = labels.profit;
        document.getElementById('lbl-display-tax').textContent = labels.tax;
        document.getElementById('lbl-display-invest').textContent = labels.investment;

        // Finance - Update Values
        document.getElementById('val-op').textContent = `${buckets.operation.toFixed(2)} €`;
        document.getElementById('val-profit').textContent = `${buckets.profit.toFixed(2)} €`;
        document.getElementById('val-tax').textContent = `${buckets.tax.toFixed(2)} €`;
        document.getElementById('val-invest').textContent = `${buckets.investment.toFixed(2)} €`;

        // Finance - Update Labels in Config Inputs
        // Only update if not focused to avoid typing interruption? 
        // For simplicity, we assume single user sync. 
        const setInputValue = (id, val) => {
            const el = document.getElementById(id);
            if (document.activeElement !== el) el.value = val;
        };
        setInputValue('edit-lbl-op', labels.operation);
        setInputValue('edit-lbl-profit', labels.profit);
        setInputValue('edit-lbl-tax', labels.tax);
        setInputValue('edit-lbl-invest', labels.investment);

        // Finance - Update Expense Dropdown Labels
        const select = document.getElementById('select-expense-bucket');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = `
                <option value="operation">${labels.operation}</option>
                <option value="profit">${labels.profit}</option>
                <option value="tax">${labels.tax}</option>
                <option value="investment">${labels.investment}</option>
             `;
            if (currentVal) select.value = currentVal;
        }

        // Transactions History
        const listEl = document.getElementById('transactions-list');
        const txs = state.finance.transactions || [];
        if (txs.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; opacity: 0.5; font-size: 0.8rem; padding: 10px;">Sem movimentos recentes</div>';
        } else {
            listEl.innerHTML = txs.map(t => {
                const date = new Date(t.date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                const isExpense = t.type === 'expense';
                const sign = isExpense ? '-' : '+';
                const icon = isExpense ? '📉' : '📈';
                const colorClass = isExpense ? 'text-danger' : 'text-success';

                // Determine desc
                let desc = 'Venda';
                if (t.type === 'expense') {
                    // Get label for category
                    desc = labels[t.category] || t.category;
                } else if (t.split) {
                    desc = `Lucro: ${t.split.profit.toFixed(2)}€`;
                }

                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <span style="font-weight: bold;" class="${colorClass}">${sign}${t.amount.toFixed(2)} €</span>
                            <span class="transaction-meta">${icon} ${date} | ${desc}</span>
                        </div>
                        <button class="btn-delete" data-id="${t.id}">🗑️</button>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('display-water').textContent = `${state.health.water}ml`;
    }

    setupListeners() {
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
                }
                window.location.reload(true);
            });
        }
    }

    showUpdateNotification() {
        if (this.updateBtn) this.updateBtn.classList.add('visible');
    }
}

export const uiRenderer = new UIRenderer();
