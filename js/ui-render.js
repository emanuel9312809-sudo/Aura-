/**
 * AURA - UI Render Engine v1.6.0 (Biz vs Personal)
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.activeTab = 'finance';
        this.transactionMode = 'income';
        this.financeView = 'business'; // 'business' | 'personal'
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
                <!-- ... existing routine content ... -->
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

            <!-- Tab FINANÇA v1.6.0 Dual View -->
            <div id="tab-finance" class="tab-content active">
                <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                    <h2>Finanças</h2>
                    <button class="fab-settings" id="btn-open-settings" style="position:static;">⚙️</button>
                </div>

                <!-- Seg. Control v1.6.0 -->
                <div class="segmented-control">
                    <button class="segment-btn active" data-view="business">🏢 Negócio</button>
                    <button class="segment-btn" data-view="personal">👤 Pessoal</button>
                </div>

                <!-- VIEW: BUSINESS -->
                <div id="view-business">
                    <!-- Wealth Triangle Widget -->
                    <div class="glass-card" style="text-align:center;">
                        <h3>Caixa da Empresa</h3>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--accent-color); margin-bottom: 10px;" id="business-balance-display">0.00 €</div>
                        
                        <div class="wealth-triangle-container">
                            <svg class="triangle-svg" viewBox="0 0 200 180">
                                <!-- Triangle Path -->
                                <path id="triangle-base" d="M100 20 L180 160 L20 160 Z" class="triangle-path" style="stroke: rgba(255,255,255,0.2);"></path>
                                <path id="triangle-glow" d="M100 20 L180 160 L20 160 Z" class="triangle-path"></path>
                                
                                <text x="100" y="45" class="triangle-label">Faturação (Mês)</text>
                                <text x="100" y="65" class="triangle-value" id="tri-val-top">0€</text>

                                <text x="40" y="150" class="triangle-label" style="fill:#ff6b6b">Custos</text>
                                <text x="40" y="170" class="triangle-value" style="fill:#ff6b6b" id="tri-val-left">0€</text>

                                <text x="160" y="150" class="triangle-label" style="fill:#00ff9d">Lucro</text>
                                <text x="160" y="170" class="triangle-value" style="fill:#00ff9d" id="tri-val-right">0€</text>
                            </svg>
                        </div>
                    </div>

                    <!-- ROI Clocks -->
                    <div class="glass-card">
                        <h3>ROI Clocks (Fontes)</h3>
                        <div class="roi-clocks-scroll" id="roi-clocks-container">
                            <!-- Filled by JS -->
                        </div>
                    </div>
                </div>

                <!-- VIEW: PERSONAL -->
                <div id="view-personal" style="display:none;">
                     <div class="glass-card" style="text-align:center;">
                        <h3>Meu Património</h3>
                        <div style="font-size: 2.5rem; font-weight: bold; color: var(--finance-color);" id="personal-balance-display">0.00 €</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Lucro + Investimento + Bonus Vault</div>
                    </div>

                    <div class="glass-card">
                         <h3>Bonus Vault Goal (Next 1k)</h3>
                         <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span id="vault-current">0 €</span>
                            <span id="vault-target">1000 €</span>
                         </div>
                         <div class="personal-progress-bar">
                             <div class="personal-progress-fill" id="vault-progress-fill"></div>
                         </div>
                    </div>

                    <div class="glass-card">
                         <h3>Ações Rápidas</h3>
                         <div style="display:flex; gap:10px;">
                             <button class="primary expense-mode" id="btn-personal-spend" 
                                style="font-size:0.9rem;">🛍️ Gastar (Lucro)</button>
                             <button class="primary" id="btn-personal-invest" 
                                style="font-size:0.9rem;">🚀 Investir</button>
                         </div>
                    </div>
                </div>

                <!-- Common: Registo & Transactions (Always Visible or Conditional? User asked for clean views. Keep Registo for Action but maybe slightly simpler) -->
                 <div class="glass-card">
                    <h2>Registo</h2>
                    <div class="toggle-container">
                        <button class="toggle-btn active income" id="btn-mode-income">Venda</button>
                        <button class="toggle-btn expense" id="btn-mode-expense">Despesa</button>
                    </div>
                    <div id="quick-templates-container" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom: 8px;"></div>
                    <input type="number" id="input-transaction-amount" placeholder="Valor (€)" step="0.01">
                    <label id="lbl-acc-select" style="font-size: 0.8rem; color: var(--text-muted);">Destino</label>
                    <select id="select-account-transaction"></select>
                    <div id="expense-category-container" style="display: none; margin-top: 10px;">
                        <label style="font-size: 0.8rem; color: var(--text-muted);">Categoria</label>
                        <select id="select-expense-bucket"></select>
                    </div>
                    <button class="primary" id="btn-submit-transaction" style="margin-top: 15px;">Registar</button>
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

        // --- Modal ---
        const modal = document.getElementById('settings-modal');
        document.getElementById('btn-open-settings').addEventListener('click', () => modal.classList.add('open'));
        document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.remove('open'));
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.getAttribute('data-target')).classList.add('active');
            });
        });

        // --- Dual View Logic v1.6.0 ---
        const viewBtns = document.querySelectorAll('.segment-btn');
        const viewBiz = document.getElementById('view-business');
        const viewPers = document.getElementById('view-personal');

        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.dataset.view;
                viewBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                if (target === 'business') {
                    viewBiz.style.display = 'block';
                    viewPers.style.display = 'none';
                } else {
                    viewBiz.style.display = 'none';
                    viewPers.style.display = 'block';
                }
            });
        });

        // --- Finance Logic (Same as v1.5.0 but re-attached) ---
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
                lblAcc.textContent = 'Destino';
            } else {
                btnExpense.classList.add('active');
                btnIncome.classList.remove('active');
                expenseContainer.style.display = 'block';
                submitBtn.textContent = 'Registar Despesa';
                submitBtn.classList.add('expense-mode');
                lblAcc.textContent = 'Origem';
            }
        };
        btnIncome.addEventListener('click', () => setMode('income'));
        btnExpense.addEventListener('click', () => setMode('expense'));

        submitBtn.addEventListener('click', () => {
            const amt = document.getElementById('input-transaction-amount').value;
            const accId = document.getElementById('select-account-transaction').value;
            // Animate Triangle if Business View & Income
            if (this.transactionMode === 'income' && document.getElementById('view-business').style.display !== 'none') {
                this.triggerPulse();
            }

            if (!amt || !accId) { alert('Verifique valor e conta.'); return; }
            if (this.transactionMode === 'income') auraState.processIncome(amt, accId);
            else auraState.processExpense(amt, document.getElementById('select-expense-bucket').value, accId);

            document.getElementById('input-transaction-amount').value = '';
        });

        // Add Account/Template/Delete Handlers (Abbreviated, same logic)
        document.getElementById('btn-add-acc').addEventListener('click', () => {
            const v = document.getElementById('new-acc-name').value;
            if (v) { auraState.addAccount(v); document.getElementById('new-acc-name').value = ''; }
        });
        document.getElementById('btn-add-tmpl').addEventListener('click', () => {
            const n = document.getElementById('new-tmpl-name').value;
            const a = document.getElementById('new-tmpl-amount').value;
            if (n && a) { auraState.addTemplate(n, a); document.getElementById('new-tmpl-name').value = ''; document.getElementById('new-tmpl-amount').value = ''; }
        });
        document.getElementById('quick-templates-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('tmpl-pill')) document.getElementById('input-transaction-amount').value = e.target.getAttribute('data-amount');
        });
        document.getElementById('transactions-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-delete');
            if (btn && confirm('Reverter?')) auraState.deleteTransaction(parseInt(btn.dataset.id));
        });

        // Settings Inputs
        const diffs = ['op', 'profit', 'tax', 'invest'];
        diffs.forEach(k => {
            const keys = { op: 'operation', profit: 'profit', tax: 'tax', invest: 'investment' };
            document.getElementById(`edit-lbl-${k}`).addEventListener('change', (e) => auraState.updateBucketLabel(keys[k], e.target.value));
            document.getElementById(`slider-${k}`).addEventListener('input', () => this.handleConfigChange());
        });

        // Water/Timer
        document.getElementById('btn-water').addEventListener('click', () => auraState.addWater());
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            const t = document.getElementById('input-study-topic').value;
            if (t) auraState.startStudyTimer(t);
        });
    }

    triggerPulse() {
        const p = document.getElementById('triangle-glow');
        if (p) {
            p.style.animation = 'none';
            p.offsetHeight; /* trigger reflow */
            p.style.animation = 'pulsePath 1.5s ease-out';
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
        /* Abbreviated - same slider logic */
        const op = parseInt(document.getElementById('slider-op').value) || 0;
        const profit = parseInt(document.getElementById('slider-profit').value) || 0;
        const tax = parseInt(document.getElementById('slider-tax').value) || 0;
        const invest = parseInt(document.getElementById('slider-invest').value) || 0;
        document.getElementById('perc-op').textContent = op;
        document.getElementById('perc-profit').textContent = profit;
        document.getElementById('perc-tax').textContent = tax;
        document.getElementById('perc-invest').textContent = invest;
        const total = op + profit + tax + invest;
        document.getElementById('slider-total').textContent = total;
        if (total === 100) auraState.updateFinanceConfig({ operation: op, profit: profit, tax: tax, investment: invest });
    }

    handleTimerState(state) {
        /* Abbreviated - same timer logic */
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

        // --- Common ---
        document.getElementById('display-level').textContent = state.profile.level;
        // ... other global stats ...

        // --- Business View Widgets ---
        if (document.getElementById('business-balance-display')) {
            const bizBal = buckets.operation + buckets.tax;
            document.getElementById('business-balance-display').textContent = `${bizBal.toFixed(2)} €`;

            // Triangle Values (Estimativa baseada em transactions recentes ou apenas buckets?)
            // Para "Faturação", precisamos de somar income recente?
            // Simplificação: Faturação = Soma dos Income Transactions do Mês (Too complex).
            // Vamos usar Totais de Buckets para os cantos:
            // Top: Faturação (Vamos usar 0 placeholder ou calcular? Vamos deixar 0 por agora ou usar total assets como proxy)
            // Left: Custos (Operation + Tax Buckets)
            // Right: Lucro (Profit + Invest Buckets)
            const costs = buckets.operation + buckets.tax;
            const profits = buckets.profit + buckets.investment;
            document.getElementById('tri-val-left').textContent = `${costs.toFixed(0)}€`;
            document.getElementById('tri-val-right').textContent = `${profits.toFixed(0)}€`;
            document.getElementById('tri-val-top').textContent = `${(costs + profits).toFixed(0)}€`; // Total Vol
        }

        // ROI Clocks
        const clocksContainer = document.getElementById('roi-clocks-container');
        if (clocksContainer) {
            const clocksHTML = templates.map(t => {
                let color = '#ff4444'; // Low
                let p = 25;
                if (t.amount > 100) { color = '#ffcc00'; p = 50; } // Mid
                if (t.amount > 500) { color = '#00ff9d'; p = 75; } // High

                return `
                <div class="roi-clock">
                    <div class="gauge-circle" style="background: conic-gradient(${color} ${p}%, #333 0);">
                        <div style="position:absolute; width:50px; height:50px; background:#1e1e1e; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            ${t.amount}€
                        </div>
                    </div>
                    <span style="font-size:0.7rem; color:#aaa; max-width:70px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${t.name}</span>
                </div>`;
            }).join('');
            clocksContainer.innerHTML = clocksHTML || '<span style="color:#555; font-size:0.8rem;">Sem templates</span>';
        }

        // --- Personal View Widgets ---
        if (document.getElementById('personal-balance-display')) {
            const persBal = buckets.profit + buckets.investment + state.bonusVault.current;
            document.getElementById('personal-balance-display').textContent = `${persBal.toFixed(2)} €`;

            // Bonus Vault Progress
            document.getElementById('vault-current').textContent = `${state.bonusVault.current.toFixed(0)} €`;
            // Goal logic: Next 1k
            const current = state.bonusVault.current;
            const nextGoal = (Math.floor(current / 1000) + 1) * 1000;
            document.getElementById('vault-target').textContent = `${nextGoal} €`;

            const progress = (current % 1000) / 1000 * 100;
            const fill = document.getElementById('vault-progress-fill');
            if (fill) fill.style.width = `${progress}%`;
        }

        // --- Standard Updates (Accounts Selects, Lists, etc) ---
        // Same as v1.5.0 ...
        const accSelect = document.getElementById('select-account-transaction');
        const curAcc = accSelect.value;
        accSelect.innerHTML = accounts.map(a => `<option value="${a.id}">${a.name} (${a.balance.toFixed(2)}€)</option>`).join('');
        if (curAcc && accounts.find(a => a.id === curAcc)) accSelect.value = curAcc;

        document.getElementById('accounts-list-settings').innerHTML = accounts.map(a =>
            `<div class="account-item"><span>${a.name}</span><button class="btn-del-acc" data-id="${a.id}" style="color:red; background:none; border:none;">🗑️</button></div>`
        ).join('');

        document.getElementById('templates-list-settings').innerHTML = templates.map(t => `<div class="account-item"><span>${t.name} (${t.amount}€)</span><button class="btn-del-tmpl" data-id="${t.id}" style="color:red; background:none; border:none;">×</button></div>`).join('');

        const quickHTML = templates.map(t =>
            `<button class="tmpl-pill" data-amount="${t.amount}" style="white-space:nowrap; background:rgba(255,255,255,0.1); border:1px solid #444; padding:5px 10px; border-radius:15px; color:#fff; cursor:pointer;">${t.name}</button>`
        ).join('');
        document.getElementById('quick-templates-container').innerHTML = quickHTML;

        const expenseSelect = document.getElementById('select-expense-bucket');
        expenseSelect.innerHTML = `
            <option value="operation">${labels.operation}</option>
            <option value="profit">${labels.profit}</option>
            <option value="tax">${labels.tax}</option>
            <option value="investment">${labels.investment}</option>
        `;

        const listEl = document.getElementById('transactions-list');
        const txs = state.finance.transactions || [];
        if (txs.length === 0) { listEl.innerHTML = '<div style="opacity:0.5; text-align:center;">Sem movimentos</div>'; }
        else {
            listEl.innerHTML = txs.map(t => {
                const date = new Date(t.date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit' });
                const isExpense = t.type === 'expense';
                const sign = isExpense ? '-' : '+';
                const classColor = isExpense ? 'text-danger' : 'text-success';
                let desc = isExpense ? (labels[t.category] || t.category) : 'Venda';
                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <span style="font-weight: bold;" class="${classColor}">${sign}${t.amount.toFixed(2)} €</span>
                            <span class="transaction-meta">${date} • ${desc}</span>
                        </div>
                        <button class="btn-delete" data-id="${t.id}">🗑️</button>
                    </div>
                `;
            }).join('');
        }
    }
}

export const uiRenderer = new UIRenderer();
