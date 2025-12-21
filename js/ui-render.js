/**
 * AURA - UI Render Engine v1.6.5 (Refinements & Radar)
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.activeTab = 'finance';
        this.transactionMode = 'income';
        this.financeView = 'business';
        this.timerInterval = null;
        this.init();
    }

    init() {
        this.renderStructure();
        this.setupListeners();

        console.log('UI: Init completed. Subscribing to state...');
        auraState.subscribe((state) => {
            console.log('UI: State update received. Scheduling updateUI...');
            // v1.7.9_ForceRender: Ensure DOM is ready (microtask)
            setTimeout(() => {
                this.updateUI(state);
                this.handleTimerState(state);
            }, 0);
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

                    <!-- TAB DISTRIBUIÇÃO v1.6.5 Refactor -->
                    <div id="tab-dist" class="modal-tab-content active">
                         <div class="glass-card">
                            <h3>Percentagens (%)</h3>
                            
                            <div class="slider-group">
                                <div class="slider-header">
                                    <label><input type="text" class="bucket-label-input" id="edit-lbl-op" value="Operação"></label>
                                    <span style="font-weight:bold"><span id="perc-op">60</span>%</span>
                                </div>
                                <input type="range" id="slider-op" min="0" max="100" value="60">
                            </div>

                            <div class="slider-group">
                                <div class="slider-header">
                                    <label><input type="text" class="bucket-label-input" id="edit-lbl-profit" value="Lucro"></label>
                                    <span style="font-weight:bold"><span id="perc-profit">20</span>%</span>
                                </div>
                                <input type="range" id="slider-profit" min="0" max="100" value="20">
                            </div>

                            <div class="slider-group">
                                <div class="slider-header">
                                    <label><input type="text" class="bucket-label-input" id="edit-lbl-tax" value="Impostos"></label>
                                    <span style="font-weight:bold"><span id="perc-tax">15</span>%</span>
                                </div>
                                <input type="range" id="slider-tax" min="0" max="100" value="15">
                            </div>

                            <div class="slider-group">
                                <div class="slider-header">
                                    <label><input type="text" class="bucket-label-input" id="edit-lbl-invest" value="Investimento"></label>
                                    <span style="font-weight:bold"><span id="perc-invest">5</span>%</span>
                                </div>
                                <input type="range" id="slider-invest" min="0" max="100" value="5">
                            </div>
                            
                            <small>Total: <span id="slider-total">100</span>%</small>
                        </div>
                    </div>

                    <!-- TAB CONTAS v1.6.5 Add Initial Balance -->
                    <div id="tab-acc" class="modal-tab-content">
                        <div class="glass-card">
                            <h3>Gerir Contas</h3>
                            <div id="accounts-list-settings"></div>
                            <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                                <input type="text" id="new-acc-name" placeholder="Nome (Ex: Banco X)">
                                <input type="number" id="new-acc-init" placeholder="Saldo Inicial (€)" step="0.01">
                                <button class="primary" id="btn-add-acc" style="padding: 8px;">+ Adicionar Conta</button>
                            </div>
                        </div>
                    </div>

                    <!-- TAB FONTES v1.6.5 Add Meta -->
                    <div id="tab-tmpl" class="modal-tab-content">
                        <div class="glass-card">
                            <h3>Templates Recorrentes</h3>
                            <div id="templates-list-settings"></div>
                             <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                                <input type="text" id="new-tmpl-name" placeholder="Nome (Ex: Salário)">
                                <input type="number" id="new-tmpl-amount" placeholder="Valor (€)">
                                <div style="display:flex; gap:10px;">
                                    <input type="number" id="new-tmpl-day" placeholder="Dia (1-31)" style="flex:1">
                                    <div style="display:flex; align-items:center; gap:5px; flex:1; background:rgba(0,0,0,0.2); border-radius:8px; padding:0 10px; height:46px;">
                                        <input type="checkbox" id="new-tmpl-auto"> <label for="new-tmpl-auto" style="font-size:0.8rem">Auto?</label>
                                    </div>
                                </div>
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

            <!-- Tab FINANÇA v1.6.5 Radar Chart -->
            <div id="tab-finance" class="tab-content active">
                <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                    <h2>Finanças</h2>
                    <button class="fab-settings" id="btn-open-settings" style="position:static;">⚙️</button>
                </div>

                <div class="segmented-control">
                    <button class="segment-btn active" data-view="business">🏢 Negócio</button>
                    <button class="segment-btn" data-view="personal">👤 Pessoal</button>
                </div>

                <!-- VIEW: BUSINESS -->
                <div id="view-business">
                    <!-- Energy Map Radar Chart -->
                    <div class="glass-card" style="text-align:center;">
                        <h3>Mapa de Energia (Saldo)</h3>
                        <div class="energy-map-container">
                            <svg class="radar-svg" viewBox="0 0 200 200" id="radar-chart">
                                <!-- Background Web -->
                                <circle cx="100" cy="100" r="20" class="radar-web"/>
                                <circle cx="100" cy="100" r="40" class="radar-web"/>
                                <circle cx="100" cy="100" r="60" class="radar-web"/>
                                <circle cx="100" cy="100" r="80" class="radar-web"/>
                                
                                <!-- Axes -->
                                <line x1="100" y1="100" x2="100" y2="20" class="radar-axis"/> <!-- Top -->
                                <line x1="100" y1="100" x2="169" y2="140" class="radar-axis"/> <!-- BR (30deg) -->
                                <line x1="100" y1="100" x2="31" y2="140" class="radar-axis"/> <!-- BL (150deg) -->

                                <!-- Labels -->
                                <text x="100" y="15" class="radar-label">Necessidades</text>
                                <text x="175" y="150" class="radar-label">Crescimento</text>
                                <text x="25" y="150" class="radar-label">Alma</text>

                                <!-- Data Polygon -->
                                <polygon id="radar-poly" points="100,100 100,100 100,100" class="radar-polygon"/>
                            </svg>
                        </div>
                    </div>

                    <div class="glass-card" style="text-align:center;">
                        <h3>Caixa da Empresa</h3>
                         <div style="font-size: 2rem; font-weight: bold; color: var(--accent-color);" id="business-balance-display">0.00 €</div>
                    </div>

                    <div class="glass-card">
                        <h3>ROI Clocks (Fontes)</h3>
                        <div class="roi-clocks-scroll" id="roi-clocks-container"></div>
                    </div>
                </div>

                <!-- VIEW: PERSONAL -->
                <div id="view-personal" style="display:none;">
                     <!-- v1.7.6_StructureFix: Minhas Contas Widget (Static Injection) -->
                     <div class="glass-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h3 style="margin:0;">Minhas Contas</h3>
                            <button id="btn-quick-add-acc" style="background:var(--finance-color); border:none; color:black; border-radius:50%; width:24px; height:24px; font-weight:bold; cursor:pointer;" title="Adicionar Conta">+</button>
                        </div>
                        <div class="personal-accounts-scroll" id="accounts-scroll-view">
                            <!-- Filled by JS -->
                        </div>
                     </div>

                     <div class="glass-card" style="text-align:center;">
                        <h3>Meu Património</h3>
                        <div style="font-size: 2.5rem; font-weight: bold; color: var(--finance-color);" id="personal-balance-display">0.00 €</div>
                    </div>
                    <div class="glass-card">
                         <h3>Bonus Vault (Next 1k)</h3>
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
                             <button class="primary expense-mode" id="btn-personal-spend" style="font-size:0.9rem;">🛍️ Gastar</button>
                             <button class="primary" id="btn-personal-invest" style="font-size:0.9rem;">🚀 Investir</button>
                         </div>
                    </div>
                </div>

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

            <!-- Tab SAÚDE/MENTE (kept standard) -->
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

        // --- Dual View Logic ---
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
                    setTimeout(() => this.updateRadarChart(auraState.state), 50); // Redraw
                } else {
                    viewBiz.style.display = 'none';
                    viewPers.style.display = 'block';
                }
            });
        });

        // --- Finance Actions ---
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
            if (!amt || !accId) { alert('Verifique valor e conta.'); return; }
            if (this.transactionMode === 'income') auraState.processIncome(amt, accId);
            else auraState.processExpense(amt, document.getElementById('select-expense-bucket').value, accId);
            document.getElementById('input-transaction-amount').value = '';
        });

        // ADD ACCOUNT v1.6.5
        document.getElementById('btn-add-acc').addEventListener('click', () => {
            const v = document.getElementById('new-acc-name').value;
            const bal = document.getElementById('new-acc-init').value || 0;
            if (v) {
                auraState.addAccount(v, bal);
                document.getElementById('new-acc-name').value = '';
                document.getElementById('new-acc-init').value = '';
            }
        });

        // ADD TEMPLATE v1.6.5
        document.getElementById('btn-add-tmpl').addEventListener('click', () => {
            const n = document.getElementById('new-tmpl-name').value;
            const a = document.getElementById('new-tmpl-amount').value;
            const d = document.getElementById('new-tmpl-day').value;
            const auto = document.getElementById('new-tmpl-auto').checked;

            if (n && a) {
                auraState.addTemplate(n, a, d, auto);
                document.getElementById('new-tmpl-name').value = '';
                document.getElementById('new-tmpl-amount').value = '';
                document.getElementById('new-tmpl-day').value = '';
            }
        });

        document.getElementById('quick-templates-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('tmpl-pill')) document.getElementById('input-transaction-amount').value = e.target.getAttribute('data-amount');
        });
        document.getElementById('transactions-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-delete');
            if (btn && confirm('Reverter?')) auraState.deleteTransaction(parseInt(btn.dataset.id));
        });

        // SLIDERS
        const diffs = ['op', 'profit', 'tax', 'invest'];
        diffs.forEach(k => {
            const keys = { op: 'operation', profit: 'profit', tax: 'tax', invest: 'investment' };
            document.getElementById(`edit-lbl-${k}`).addEventListener('change', (e) => auraState.updateBucketLabel(keys[k], e.target.value));
            document.getElementById(`slider-${k}`).addEventListener('input', () => this.handleConfigChange());
        });

        document.getElementById('btn-water').addEventListener('click', () => auraState.addWater());
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            const t = document.getElementById('input-study-topic').value;
            if (t) auraState.startStudyTimer(t);
        });

        // v1.7.7_HotfixButton: Robust Event Delegation
        // We attach to appElement (or document) to catch clicks even if the button was re-rendered.
        this.appElement.addEventListener('click', (e) => {
            // Check for Add Account Button (delegation)
            if (e.target.id === 'btn-quick-add-acc') {
                const name = prompt("Nome da conta:");
                if (name) {
                    const bal = parseFloat(prompt("Saldo inicial:") || "0");
                    auraState.addAccount(name, bal);
                }
            }
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
        if (tabName === 'finance' && document.getElementById('view-business').style.display !== 'none') {
            this.updateRadarChart(auraState.state);
        }
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
        document.getElementById('slider-total').textContent = total;
        if (total === 100) auraState.updateFinanceConfig({ operation: op, profit: profit, tax: tax, investment: invest });
    }

    handleTimerState(state) {
        // ... (std)
    }

    updateUI(state) {
        const { labels, buckets, accounts, templates } = state.finance;
        console.log('UI: updating. Accounts:', accounts.length);

        // --- Business View Widgets ---
        if (document.getElementById('business-balance-display')) {
            const bizBal = buckets.operation + buckets.tax;
            document.getElementById('business-balance-display').textContent = `${bizBal.toFixed(2)} €`;
            // Trigger Radar update
            this.updateRadarChart(state);
        }

        // ROI Clocks
        const clocksContainer = document.getElementById('roi-clocks-container');
        if (clocksContainer) {
            const clocksHTML = templates.map(t => {
                let color = '#ff4444'; // Low
                let p = 25;
                if (t.amount > 100) { color = '#ffcc00'; p = 50; }
                if (t.amount > 500) { color = '#00ff9d'; p = 75; }
                return `
                <div class="roi-clock">
                    <div class="gauge-circle" style="background: conic-gradient(${color} ${p}%, #333 0);">
                        <div style="position:absolute; width:50px; height:50px; background:#1e1e1e; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            ${t.amount}€
                        </div>
                    </div>
                    <span style="font-size:0.7rem; color:#aaa;">${t.name}</span>
                </div>`;
            }).join('');
            clocksContainer.innerHTML = clocksHTML || '<span style="color:#555; font-size:0.8rem;">Sem templates</span>';
        }

        // --- Personal View Widgets ---
        if (document.getElementById('personal-balance-display')) {
            const persBal = buckets.profit + buckets.investment + state.bonusVault.current;
            document.getElementById('personal-balance-display').textContent = `${persBal.toFixed(2)} €`;

            // v1.7.8_UIFix: Accounts Rendering
            const pacContainer = document.getElementById('accounts-scroll-view');
            if (pacContainer) {
                if (Array.isArray(accounts) && accounts.length > 0) {
                    console.log(`UI: Rendering ${accounts.length} accounts.`);
                    pacContainer.innerHTML = accounts.map(a => {
                        // Safe parse
                        const bal = typeof a.balance === 'number' ? a.balance : parseFloat(a.balance || 0);
                        return `
                        <div class="personal-account-card">
                            <div class="pac-name">${a.name}</div>
                            <div class="pac-balance">${bal.toFixed(2)}€</div>
                        </div>`;
                    }).join('');
                } else {
                    console.log('UI: No accounts to render.');
                    pacContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; padding:10px;">Sem contas. Clique em +</div>';
                }
            } else {
                console.error('UI: Critical structure error - #accounts-scroll-view not found');
            }

            document.getElementById('vault-current').textContent = `${state.bonusVault.current.toFixed(0)} €`;
            const current = state.bonusVault.current;
            const nextGoal = (Math.floor(current / 1000) + 1) * 1000;
            document.getElementById('vault-target').textContent = `${nextGoal} €`;
            const fill = document.getElementById('vault-progress-fill');
            if (fill) fill.style.width = `${(current % 1000) / 1000 * 100}%`;
        }

        // --- Standard Updates ---
        // v1.7.5_fix Transaction Dropdown Logic
        const accSelect = document.getElementById('select-account-transaction');
        // Note: we want to preserve selection if possible, but options might change.
        // Simplified: Just render.
        if (accSelect) {
            const currentVal = accSelect.value;
            accSelect.innerHTML = accounts.map(a => `<option value="${a.id}">${a.name} (${parseFloat(a.balance).toFixed(2)}€)</option>`).join('');
            // Restore if valid
            if (currentVal && accounts.find(a => a.id === currentVal)) {
                accSelect.value = currentVal;
            }
        }

        // Also update the Settings list while we are here
        const settingsList = document.getElementById('accounts-list-settings');
        if (settingsList) {
            settingsList.innerHTML = accounts.map(a =>
                `<div class="account-item"><span>${a.name} (${parseFloat(a.balance).toFixed(2)}€)</span><button class="btn-del-acc" data-id="${a.id}" style="color:red; background:none; border:none;">🗑️</button></div>`
            ).join('');
        }

        document.getElementById('templates-list-settings').innerHTML = templates.map(t => `<div class="account-item"><span>${t.name} (${t.amount}€)</span><button class="btn-del-tmpl" data-id="${t.id}" style="color:red; background:none; border:none;">×</button></div>`).join('');

        const quickHTML = templates.map(t =>
            `<button class="tmpl-pill" data-amount="${t.amount}" style="white-space:nowrap; background:rgba(255,255,255,0.1); border:1px solid #444; padding:5px 10px; border-radius:15px; color:#fff; cursor:pointer;">${t.name}</button>`
        ).join('');
        document.getElementById('quick-templates-container').innerHTML = quickHTML;

        // Transaction List... (abbreviated, same as before)
        const listEl = document.getElementById('transactions-list');
        const txs = state.finance.transactions || [];
        if (listEl) {
            if (txs.length === 0) { listEl.innerHTML = '<div style="opacity:0.5; text-align:center;">Sem movimentos</div>'; }
            else {
                listEl.innerHTML = txs.map(t => {
                    const date = new Date(t.date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit' });
                    const isExpense = t.type === 'expense';
                    const sign = isExpense ? '-' : '+';
                    const classColor = isExpense ? 'text-danger' : 'text-success';
                    return `<div class="transaction-item"><div class="transaction-info"><span class="${classColor}" style="font-weight:bold">${sign}${t.amount.toFixed(2)} €</span><span class="transaction-meta">${date} • ${t.category || 'Venda'}</span></div><button class="btn-delete" data-id="${t.id}">🗑️</button></div>`;
                }).join('');
            }
        }
    }

    updateRadarChart(state) {
        const poly = document.getElementById('radar-poly');
        if (!poly) return;

        const b = state.finance.buckets;

        // 1. Calculate Values
        const valNeeds = b.operation + b.tax; // Top
        const valGrow = b.investment;        // Right
        const valSoul = b.profit + state.bonusVault.current; // Left

        // 2. Normalize (Scale of 0-80px)
        const maxVal = Math.max(valNeeds, valGrow, valSoul, 100); // 100 min
        const scale = (v) => (v / maxVal) * 80;

        const rNeeds = scale(valNeeds);
        const rGrow = scale(valGrow);
        const rSoul = scale(valSoul);

        // 3. Coordinates (Center 100,100)
        // Top (-90 deg): x=100, y=100 - r
        const x1 = 100;
        const y1 = 100 - rNeeds;

        // BR (30 deg): x=100 + cos(30)*r, y=100 + sin(30)*r
        const rad30 = 30 * Math.PI / 180;
        const x2 = 100 + Math.cos(rad30) * rGrow;
        const y2 = 100 + Math.sin(rad30) * rGrow;

        // BL (150 deg): x=100 + cos(150)*r, y=100 + sin(150)*r
        const rad150 = 150 * Math.PI / 180;
        const x3 = 100 + Math.cos(rad150) * rSoul;
        const y3 = 100 + Math.sin(rad150) * rSoul;

        poly.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
    }
}

export const uiRenderer = new UIRenderer();
