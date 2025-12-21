/**
 * AURA - UI Render Engine v1.5.0 (Accounts & Org)
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.activeTab = 'finance'; // Default for testing
        this.transactionMode = 'income';
        this.timerInterval = null;
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
        this.appElement.innerHTML = `
            <!-- MODAL OVERLAY (v1.5.0) -->
            <div id="settings-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Configurações</h2>
                        <button class="modal-close" id="btn-close-modal">×</button>
                    </div>
                    
                    <div class="modal-tabs">
                        <div class="modal-tab active" data-target="tab-dist">Distribuição</div>
                        <div class="modal-tab" data-target="tab-acc">Contas</div>
                        <div class="modal-tab" data-target="tab-tmpl">Fontes</div>
                    </div>

                    <!-- TAB DISTRIBUIÇÃO -->
                    <div id="tab-dist" class="modal-tab-content active">
                         <div class="glass-card">
                            <h3>Percentagens (%)</h3>
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

                    <!-- TAB CONTAS -->
                    <div id="tab-acc" class="modal-tab-content">
                        <div class="glass-card">
                            <h3>Gerir Contas</h3>
                            <div id="accounts-list-settings"></div>
                            <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                                <input type="text" id="new-acc-name" placeholder="Nome da Nova Conta">
                                <button class="primary" id="btn-add-acc" style="padding: 8px;">+ Adicionar Conta</button>
                            </div>
                        </div>
                    </div>

                    <!-- TAB FONTES -->
                    <div id="tab-tmpl" class="modal-tab-content">
                        <div class="glass-card">
                            <h3>Templates Recorrentes</h3>
                            <div id="templates-list-settings"></div>
                             <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                                <input type="text" id="new-tmpl-name" placeholder="Nome (Ex: Salário)">
                                <input type="number" id="new-tmpl-amount" placeholder="Valor (€)">
                                <button class="primary" id="btn-add-tmpl" style="padding: 8px;">+ Criar Template</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab ROTINA -->
            <div id="tab-aura" class="tab-content">
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
                </div>
            </div>

            <!-- Tab FINANÇA -->
            <div id="tab-finance" class="tab-content active">
                <div style="position: relative;">
                    <h2>Finanças</h2>
                    <button class="fab-settings" id="btn-open-settings">⚙️</button>
                </div>

                <div class="glass-card">
                    <h2>Resumo Global</h2>
                    <div id="accounts-summary-widget">
                        <!-- Filled by JS -->
                    </div>
                    <div class="stat-row" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top:5px;">
                        <span style="font-weight:bold;">Total Líquido</span>
                        <span id="total-net-worth" style="font-weight:bold; color: var(--accent-color);">0.00 €</span>
                    </div>
                </div>

                <div class="glass-card">
                    <h2>Registo</h2>
                    
                    <div class="toggle-container">
                        <button class="toggle-btn active income" id="btn-mode-income">Venda (Entrada)</button>
                        <button class="toggle-btn expense" id="btn-mode-expense">Despesa (Saída)</button>
                    </div>
                    
                    <!-- Quick Load Templates (Horizontal Scroll) -->
                    <div id="quick-templates-container" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom: 8px;">
                    </div>

                    <input type="number" id="input-transaction-amount" placeholder="Valor (€)" step="0.01">
                    
                    <!-- v1.5.0: Account Selection -->
                    <label id="lbl-acc-select" style="font-size: 0.8rem; color: var(--text-muted);">Destino (Onde entra?)</label>
                    <select id="select-account-transaction"></select>

                    <div id="expense-category-container" style="display: none; margin-top: 10px;">
                        <label style="font-size: 0.8rem; color: var(--text-muted);">Categoria (Qual balde?)</label>
                        <select id="select-expense-bucket">
                            <!-- Preenchido via JS -->
                        </select>
                    </div>

                    <button class="primary" id="btn-submit-transaction" style="margin-top: 15px;">Registar Venda</button>
                </div>

                <div class="glass-card">
                    <h2>Baldes (Lógico)</h2>
                    <div class="stat-row"><span id="lbl-display-op">Operação</span> <span id="val-op" class="text-success">0.00 €</span></div>
                    <div class="stat-row"><span id="lbl-display-profit">Lucro</span> <span id="val-profit" class="text-success">0.00 €</span></div>
                    <div class="stat-row"><span id="lbl-display-tax">Impostos</span> <span id="val-tax" class="text-success">0.00 €</span></div>
                    <div class="stat-row"><span id="lbl-display-invest">Investimento</span> <span id="val-invest" class="text-success">0.00 €</span></div>
                </div>

                <div class="glass-card">
                    <h2>Últimos Movimentos</h2>
                    <div id="transactions-list"></div>
                </div>
            </div>

            <!-- Tab SAÚDE -->
            <div id="tab-health" class="tab-content">
                <div class="glass-card" style="text-align: center;">
                    <h2>Vitalidade</h2>
                    <button class="water-btn" id="btn-water">+250ml</button>
                    <div style="margin-top: 10px">Total: <span id="display-water">0ml</span></div>
                </div>
                <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between;">
                    <span>Treino do Dia</span>
                    <input type="checkbox" id="check-workout-health" data-key="workout">
                </div>
            </div>

            <!-- Tab MENTE -->
            <div id="tab-mind" class="tab-content">
                <div class="glass-card" style="text-align: center;">
                    <h2>Estudo Técnico (20min)</h2>
                    <div id="timer-display" style="font-size: 3rem; font-family: monospace; color: var(--accent-color);">20:00</div>
                    <div id="timer-controls">
                        <input type="text" id="input-study-topic" placeholder="Tópico">
                        <button class="primary" id="btn-start-timer">Começar</button>
                    </div>
                </div>
            </div>

            <nav class="nav-bar">
                <a class="nav-item" data-tab="aura"><span>✨</span> Rotina</a>
                <a class="nav-item active" data-tab="finance"><span>💰</span> Finança</a>
                <a class="nav-item" data-tab="health"><span>❤️</span> Saúde</a>
                <a class="nav-item" data-tab="mind"><span>🧠</span> Mente</a>
            </nav>
        `;

        this.renderOrb(document.getElementById('aura-orb-container'));
        this.setupInternalListeners();
    }

    renderOrb(container) {
        if (!container) return;
        const orb = document.createElement('div');
        orb.style.cssText = `
            width: 150px; height: 150px; border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #4facfe, #00f2fe);
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
            animation: breathe 4s infinite ease-in-out;
        `;
        container.appendChild(orb);
    }

    setupInternalListeners() {
        // --- Navigation ---
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e.currentTarget.getAttribute('data-tab')));
        });

        // --- Modal Logic ---
        const modal = document.getElementById('settings-modal');
        document.getElementById('btn-open-settings').addEventListener('click', () => modal.classList.add('open'));
        document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.remove('open'));

        // Modal Tabs
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.getAttribute('data-target')).classList.add('active');
            });
        });

        // --- Finance v1.5.0 Logic ---
        // Toggle Buttons
        const btnIncome = document.getElementById('btn-mode-income');
        const btnExpense = document.getElementById('btn-mode-expense');
        const submitBtn = document.getElementById('btn-submit-transaction');
        const expenseContainer = document.getElementById('expense-category-container');
        const lblAcc = document.getElementById('lbl-acc-select');

        const setMode = (mode) => {
            this.transactionMode = mode;
            if (mode === 'income') {
                btnIncome.classList.add('active');
                btnExpense.classList.remove('active');
                expenseContainer.style.display = 'none';
                submitBtn.textContent = 'Registar Venda';
                submitBtn.classList.remove('expense-mode');
                lblAcc.textContent = 'Destino (Onde entra?)';
            } else {
                btnExpense.classList.add('active');
                btnIncome.classList.remove('active');
                expenseContainer.style.display = 'block';
                submitBtn.textContent = 'Registar Despesa';
                submitBtn.classList.add('expense-mode');
                lblAcc.textContent = 'Origem (De onde sai?)';
            }
        };
        btnIncome.addEventListener('click', () => setMode('income'));
        btnExpense.addEventListener('click', () => setMode('expense'));

        // Submit Transaction
        submitBtn.addEventListener('click', () => {
            const amt = document.getElementById('input-transaction-amount').value;
            const accId = document.getElementById('select-account-transaction').value;

            if (!amt || !accId) { alert('Verifique valor e conta.'); return; }

            if (this.transactionMode === 'income') {
                auraState.processIncome(amt, accId);
            } else {
                const cat = document.getElementById('select-expense-bucket').value;
                auraState.processExpense(amt, cat, accId);
            }
            document.getElementById('input-transaction-amount').value = '';
        });

        // Add Account
        document.getElementById('btn-add-acc').addEventListener('click', () => {
            const name = document.getElementById('new-acc-name').value;
            if (name) {
                auraState.addAccount(name);
                document.getElementById('new-acc-name').value = '';
            }
        });

        // Add Template
        document.getElementById('btn-add-tmpl').addEventListener('click', () => {
            const name = document.getElementById('new-tmpl-name').value;
            const amt = document.getElementById('new-tmpl-amount').value;
            if (name && amt) {
                auraState.addTemplate(name, amt);
                document.getElementById('new-tmpl-name').value = '';
                document.getElementById('new-tmpl-amount').value = '';
            }
        });

        // Template Quick Load (Delegation)
        document.getElementById('quick-templates-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('tmpl-pill')) {
                document.getElementById('input-transaction-amount').value = e.target.getAttribute('data-amount');
            }
        });

        // Bucket Labels & Sliders (Inside Modal)
        const diffs = ['op', 'profit', 'tax', 'invest'];
        diffs.forEach(k => {
            const keys = { op: 'operation', profit: 'profit', tax: 'tax', invest: 'investment' };
            document.getElementById(`edit-lbl-${k}`).addEventListener('change', (e) =>
                auraState.updateBucketLabel(keys[k], e.target.value));
            document.getElementById(`slider-${k}`).addEventListener('input', () => this.handleConfigChange());
        });

        // Transaction Delete
        document.getElementById('transactions-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-delete');
            if (btn && confirm('Reverter?')) auraState.deleteTransaction(parseInt(btn.dataset.id));
        });

        // Account Delete (Settings)
        document.getElementById('accounts-list-settings').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-del-acc')) {
                if (confirm('Apagar conta?')) auraState.deleteAccount(e.target.dataset.id);
            }
        });

        // Template Delete
        document.getElementById('templates-list-settings').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-del-tmpl')) {
                if (confirm('Apagar template?')) auraState.deleteTemplate(parseInt(e.target.dataset.id));
            }
        });

        // Others
        document.getElementById('btn-water').addEventListener('click', () => auraState.addWater());
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            const topic = document.getElementById('input-study-topic').value;
            if (topic) auraState.startStudyTimer(topic);
        });
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                if (navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
                window.location.reload(true);
            });
        }
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
        /* Same as before, abbreviated */
        const display = document.getElementById('timer-display');
        const btn = document.getElementById('btn-start-timer');
        if (state.study.isTimerActive && state.study.endTime) {
            btn.textContent = "Cancelar";
            if (!this.timerInterval) this.timerInterval = setInterval(() => {
                const diff = state.study.endTime - Date.now();
                if (diff <= 0) { clearInterval(this.timerInterval); auraState.completeStudyTimer(); return; }
                const m = Math.floor(diff / 60000); const s = Math.floor((diff % 60000) / 1000);
                display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            }, 1000);
        } else {
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.timerInterval = null;
            btn.textContent = "Começar";
            display.textContent = "20:00";
        }
    }

    updateUI(state) {
        const { labels, buckets, accounts, templates } = state.finance;

        // 1. Buckets Display
        document.getElementById('lbl-display-op').textContent = labels.operation;
        document.getElementById('lbl-display-profit').textContent = labels.profit;
        document.getElementById('lbl-display-tax').textContent = labels.tax;
        document.getElementById('lbl-display-invest').textContent = labels.investment;

        document.getElementById('val-op').textContent = `${buckets.operation.toFixed(2)} €`;
        document.getElementById('val-profit').textContent = `${buckets.profit.toFixed(2)} €`;
        document.getElementById('val-tax').textContent = `${buckets.tax.toFixed(2)} €`;
        document.getElementById('val-invest').textContent = `${buckets.investment.toFixed(2)} €`;

        // 2. Accounts Selects
        const accSelect = document.getElementById('select-account-transaction');
        // Preserve selection if possible
        const curAcc = accSelect.value;
        accSelect.innerHTML = accounts.map(a => `<option value="${a.id}">${a.name} (${a.balance.toFixed(2)}€)</option>`).join('');
        if (curAcc && accounts.find(a => a.id === curAcc)) accSelect.value = curAcc;

        // 3. Accounts Widget (Dashboard)
        const accSummary = document.getElementById('accounts-summary-widget');
        accSummary.innerHTML = accounts.map(a =>
            `<div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
                <span>${a.name}</span>
                <span>${a.balance.toFixed(2)} €</span>
             </div>`).join('');

        const totalNet = accounts.reduce((sum, a) => sum + a.balance, 0);
        document.getElementById('total-net-worth').textContent = `Total: ${totalNet.toFixed(2)} €`;

        // 4. Settings: Accounts List
        document.getElementById('accounts-list-settings').innerHTML = accounts.map(a => `
            <div class="account-item">
                <span>${a.name}</span>
                <button class="btn-del-acc" data-id="${a.id}" style="color:red; background:none; border:none;">🗑️</button>
            </div>
        `).join('');

        // 5. Settings: Templates + Quick Load
        const tmplHTML = templates.map(t => `<div class="account-item"><span>${t.name} (${t.amount}€)</span><button class="btn-del-tmpl" data-id="${t.id}" style="color:red; background:none; border:none;">×</button></div>`).join('');
        document.getElementById('templates-list-settings').innerHTML = tmplHTML || 'Sem templates';

        const quickHTML = templates.map(t =>
            `<button class="tmpl-pill" data-amount="${t.amount}" style="white-space:nowrap; background:rgba(255,255,255,0.1); border:1px solid #444; padding:5px 10px; border-radius:15px; color:#fff; cursor:pointer;">${t.name}</button>`
        ).join('');
        document.getElementById('quick-templates-container').innerHTML = quickHTML;


        // 6. Expense Buckets Dropdown
        const expenseSelect = document.getElementById('select-expense-bucket');
        expenseSelect.innerHTML = `
            <option value="operation">${labels.operation}</option>
            <option value="profit">${labels.profit}</option>
            <option value="tax">${labels.tax}</option>
            <option value="investment">${labels.investment}</option>
        `;

        // 7. Transactions History
        const listEl = document.getElementById('transactions-list');
        const txs = state.finance.transactions || [];
        if (txs.length === 0) {
            listEl.innerHTML = '<div style="opacity:0.5; text-align:center;">Sem movimentos</div>';
        } else {
            listEl.innerHTML = txs.map(t => {
                const date = new Date(t.date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit' });
                const isExpense = t.type === 'expense';
                const sign = isExpense ? '-' : '+';
                const classColor = isExpense ? 'text-danger' : 'text-success';
                let desc = isExpense ? (labels[t.category] || t.category) : 'Venda';

                // Show Account Name if possible (lookup from state, costly in render? meh it's small)
                const tAcc = accounts.find(a => a.id === t.accountId);
                const accName = tAcc ? tAcc.name : 'Unknown';

                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <span style="font-weight: bold;" class="${classColor}">${sign}${t.amount.toFixed(2)} €</span>
                            <span class="transaction-meta">${date} • ${desc} • ${accName}</span>
                        </div>
                        <button class="btn-delete" data-id="${t.id}">🗑️</button>
                    </div>
                `;
            }).join('');
        }

        // Sync Inputs if needed
        const setInputValue = (id, val) => {
            const el = document.getElementById(id);
            if (document.activeElement !== el && el) el.value = val;
        };
        setInputValue('edit-lbl-op', labels.operation);
        setInputValue('edit-lbl-profit', labels.profit);
        // ... others
    }
}

export const uiRenderer = new UIRenderer();
