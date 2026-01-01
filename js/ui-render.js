/**
 * AURA - UI Render Engine v1.6.5 (Refinements & Radar)
 */
import { auraState } from './app-state.js';
import { uiBusiness } from './ui-business.js';
import { uiSettings } from './ui-settings.js';
import { uiPersonal } from './ui-personal.js';

// --- Navigation Manager v2.12 ---
class NavigationManager {
    constructor() {
        this.historyStack = [];

        // Listen for Back Button
        window.addEventListener('popstate', (e) => {
            if (this.historyStack.length > 0) {
                const lastItem = this.historyStack.pop();
                if (lastItem && typeof lastItem.closeFn === 'function') {
                    console.log('Nav: Closing modal via Back Button', lastItem.id);
                    lastItem.closeFn(); // Execute the close logic
                }
            } else {
                console.log('Nav: Root reached.');
                // Default browser behavior (exit/previous page) if stack is empty
            }
        });
    }

    pushModal(id, closeFn) {
        // Add a dummy state to history so Back Button triggers popstate
        history.pushState({ modal: id }, '', `#${id}`);
        this.historyStack.push({ id, closeFn });
        console.log('Nav: Modal Pushed', id);
    }

    // Call this if closed manually (X button) to keep history clean
    popModal() {
        // Just go back; the popstate listener will handle the stack and closing.
        // Check if we actually have history to go back to (internal check)
        if (this.historyStack.length > 0) {
            history.back();
        } else {
            // Fallback: if stack is empty (e.g. reload), try to close known modals manually or just ignore.
            // For robustness, let's just try to remove 'open' class from all modals.
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
            document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); // For custom modals
        }
    }
}

const navManager = new NavigationManager();

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

    // v2.14: Generic Custom Prompt
    showInputModal(title, msg, type = 'text', defaultValue = '') {
        return new Promise((resolve) => {
            let modal = document.getElementById('aura-input-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'aura-input-modal';
                modal.className = 'modal-overlay';
                modal.style.zIndex = '9999';
                modal.innerHTML = `
                    <div class="glass-card" style="width:90%; max-width:320px; padding:20px; text-align:center; background:#1e1e1e; border:1px solid rgba(255,255,255,0.1);">
                        <h3 id="aim-title" style="margin-bottom:10px;">Title</h3>
                        <p id="aim-msg" style="margin-bottom:15px; color:#ccc; font-size:0.9rem;">Message</p>
                        <input id="aim-input" style="width:100%; padding:10px; border-radius:8px; border:1px solid #444; background:#111; color:white; margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; gap:10px;">
                            <button id="aim-cancel" style="flex:1; padding:10px; background:none; border:1px solid #555; color:#aaa; border-radius:8px; cursor:pointer;">Cancelar</button>
                            <button id="aim-confirm" style="flex:1; padding:10px; background:var(--accent-color); border:none; color:#121212; font-weight:bold; border-radius:8px; cursor:pointer;">Confirmar</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            const titleEl = modal.querySelector('#aim-title');
            const msgEl = modal.querySelector('#aim-msg');
            const inputEl = modal.querySelector('#aim-input');
            const btnCancel = modal.querySelector('#aim-cancel');
            const btnConfirm = modal.querySelector('#aim-confirm');

            titleEl.textContent = title;
            msgEl.textContent = msg;
            inputEl.type = type;
            inputEl.value = defaultValue;
            inputEl.placeholder = ''; // Reset

            modal.style.display = 'flex';
            inputEl.focus();

            const close = (val) => {
                modal.style.display = 'none';
                btnConfirm.onclick = null;
                btnCancel.onclick = null;
                inputEl.onkeyup = null;
                resolve(val);
            };

            btnConfirm.onclick = () => close(inputEl.value);
            btnConfirm.style.background = 'var(--accent-color)'; // Reset visual state
            btnCancel.onclick = () => close(null);

            inputEl.onkeyup = (e) => {
                if (e.key === 'Enter') close(inputEl.value);
            };
        });
    }

    // v2.14.2: Generic Options Modal (Action Sheet style)
    showOptionsModal(title, options) {
        // options: [{ label: 'Depositar', value: 'deposit', class: 'primary' }, ...]
        return new Promise((resolve) => {
            let modal = document.getElementById('aura-options-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'aura-options-modal';
                modal.className = 'modal-overlay';
                modal.style.zIndex = '9999';
                modal.innerHTML = `
                    <div class="glass-card" style="width:90%; max-width:320px; padding:20px; text-align:center; background:#1e1e1e; border:1px solid rgba(255,255,255,0.1);">
                        <h3 id="aom-title" style="margin-bottom:20px;">Title</h3>
                        <div id="aom-buttons" style="display:flex; flex-direction:column; gap:10px;"></div>
                        <button id="aom-cancel" style="margin-top:15px; width:100%; padding:10px; background:none; border:none; color:#aaa; cursor:pointer;">Cancelar</button>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            const titleEl = modal.querySelector('#aom-title');
            const buttonsDiv = modal.querySelector('#aom-buttons');
            const btnCancel = modal.querySelector('#aom-cancel');

            titleEl.textContent = title;
            buttonsDiv.innerHTML = '';

            modal.style.display = 'flex';

            const close = (val) => {
                modal.style.display = 'none';
                resolve(val);
            };

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.textContent = opt.label;
                btn.style.padding = '12px';
                btn.style.borderRadius = '8px';
                btn.style.border = 'none';
                btn.style.cursor = 'pointer';
                btn.style.fontWeight = 'bold';
                btn.style.width = '100%';

                if (opt.class === 'primary') {
                    btn.style.background = 'var(--accent-color)';
                    btn.style.color = '#121212';
                } else if (opt.class === 'danger') {
                    btn.style.background = 'rgba(255, 68, 68, 0.2)';
                    btn.style.color = '#ff4444';
                    btn.style.border = '1px solid #ff4444';
                } else {
                    btn.style.background = '#333';
                    btn.style.color = 'white';
                }

                btn.onclick = () => close(opt.value);
                buttonsDiv.appendChild(btn);
            });

            btnCancel.onclick = () => close(null);
        });
    }

    init() {
        console.log("System Recovered");
        this.renderStructure();
        // this.setupListeners(); 

        console.log('UI: Init completed. Subscribing to state...');
        auraState.subscribe((state) => {
            // Hotfix v1.9.8: Prevent Crash
            if (!state.finance.transactions) state.finance.transactions = [];

            console.log('UI: State update received. Scheduling updateUI...');
            setTimeout(() => {
                this.updateUI(state);
                this.handleTimerState(state);
            }, 0);
        });
    }

    renderStructure() {
        this.appElement.innerHTML = `
            <!-- TRANSACTION MODAL v1.8.0 -->
            <div id="transaction-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="trans-modal-title">Registar Movimento</h2>
                        <button class="modal-close" id="btn-close-trans-modal">×</button>
                    </div>
                    <div style="margin-top:20px;">
                        <input type="number" id="p-trans-amount" placeholder="Valor (€)" step="0.01" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px; border:1px solid #333; background:#222; color:white;">
                        
                        <div id="p-trans-cat-container" style="margin-bottom:15px;">
                             <label style="color:#aaa; font-size:0.8rem;">Baldes de Gastos (Distribuição)</label>
                             <select id="p-trans-category" style="width:100%; padding:10px; border-radius:8px; border:1px solid #333; background:#222; color:white; margin-bottom:10px;">
                                <option value="Essencial">Essencial</option>
                             </select>
                             
                             <label style="color:#aaa; font-size:0.8rem;">Mapa de Energia (Categoria)</label> 
                             <select id="p-trans-expense-cat" style="width:100%; padding:10px; border-radius:8px; border:1px solid #333; background:#222; color:white; margin-bottom:10px;">
                                <option value="">Sem Categoria</option>
                             </select>

                             <label style="color:#aaa; font-size:0.8rem;">Subcategoria (Detalhe)</label>
                             <select id="p-trans-subcategory" style="width:100%; padding:10px; border-radius:8px; border:1px solid #333; background:#222; color:white;">
                                <option value="">Sem Subcategorias</option>
                             </select>
                        </div>

                        <input type="text" id="p-trans-title" placeholder="Detalhe / Opcional" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px; border:1px solid #333; background:#222; color:white;">

                        <label style="color:#aaa; font-size:0.8rem;" id="p-trans-acc-label">Conta</label>
                        <select id="p-trans-account" style="width:100%; padding:10px; border-radius:8px; border:1px solid #333; background:#222; color:white; margin-bottom:20px;">
                            <!-- Generic -->
                        </select>

                        <button id="btn-confirm-p-trans" class="primary" style="width:100%; padding:12px;">Confirmar</button>
                    </div>
                </div>
            </div>

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
                        <div class="modal-tab" data-target="tab-cats">Categorias</div>
                        <div class="modal-tab" data-target="tab-tmpl">Fontes</div>
                    </div>

                    <!-- TAB DISTRIBUIÇÃO v1.6.5 Refactor -->
                    <!-- TAB DISTRIBUIÇÃO v1.9.5 Refactor -->
                    <div id="tab-dist" class="modal-tab-content">
                         <div class="glass-card">
                            <div id="settings-buckets-container"></div>
                            <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:20px 0;">
                            <div id="settings-alloc-container"></div>
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


                    <!-- TAB CATEGORIAS v1.9.1 -->
                    <div id="tab-cats" class="modal-tab-content">
                        <div class="glass-card">
                             <div id="settings-cats-container"></div>
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



            <!-- HISTORY MODAL v1.9.8 -->
            <div id="history-modal" class="modal-overlay">
                <div class="modal-content" style="max-height: 90vh;">
                    <div class="modal-header">
                        <h2>Histórico Completo</h2>
                        <button class="modal-close" id="btn-close-history">×</button>
                    </div>
                    <div id="full-history-list" style="display:flex; flex-direction:column; gap:10px; padding-bottom:20px;"></div>
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
                        <h3>Caixa da Empresa</h3>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--accent-color);" id="business-balance-display">0.00 €</div>
                    </div>

                    <div class="glass-card">
                        <h3>ROI Clocks (Fontes)</h3>
                        <div class="roi-clocks-scroll" id="roi-clocks-container"></div>
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
                     
                     <!-- v2.11: Inventory Placeholder -->
                     <div id="business-inventory-container"></div>
                     
                     <div class="glass-card">
                        <h2>Últimos Movimentos</h2>
                        <div id="transactions-list"></div>
                    </div>
                </div>

                <!-- VIEW: PERSONAL -->
                <div id="view-personal" style="display:none;">
                     <!-- v1.9.1: Dynamic Header (Balance + Categories) -->
                     <div id="personal-dynamic-header"></div>

                     <!-- v1.9.0: Mapa de Energia Financeira -->
                     <div class="glass-card" style="text-align:center;">
                        <h3>Mapa de Energia (Mês)</h3>
                        <div style="display:flex; justify-content:center; padding:10px;">
                            <canvas id="personal-radar-canvas" width="220" height="200"></canvas>
                        </div>
                     </div>




                    
                    <!-- Bonus Vault Removed v1.8.0 -->

                     <!-- v2.9: FAB Action Container (Floating) -->
                     <div class="fab-container" id="fab-personal-container">
                        <div class="fab-options">
                            <button class="fab-btn" id="btn-fab-income">
                                <span class="fab-label">Rendimento</span>
                                <div class="fab-icon" style="background:var(--success-color, #00C853);">📈</div>
                            </button>
                            <button class="fab-btn" id="btn-fab-expense">
                                <span class="fab-label">Despesa</span>
                                <div class="fab-icon" style="background:var(--expense-color);">📉</div>
                            </button>
                        </div>
                        <button class="fab-main" id="btn-fab-main">+</button>
                     </div>

                     <!-- v1.9.8: History Preview -->
                     <div id="personal-history-preview" style="margin-top: 20px;"></div>
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

        const histModal = document.getElementById('history-modal');
        const btnCloseHist = document.getElementById('btn-close-history');
        if (btnCloseHist) {
            btnCloseHist.addEventListener('click', () => navManager.popModal()); // v2.12 Nav
        }

        // --- Modal ---
        const modal = document.getElementById('settings-modal');
        document.getElementById('btn-open-settings').addEventListener('click', () => {
            modal.classList.add('open');
            navManager.pushModal('settings', () => modal.classList.remove('open')); // v2.12 Nav
            if (uiSettings) {
                // Tab Distribuição: Buckets + Allocations
                uiSettings.renderCategoryManager(document.getElementById('settings-buckets-container'));
                uiSettings.renderPersonalAllocation(document.getElementById('settings-alloc-container'));

                // Tab Categorias: Energy Map
                uiSettings.renderExpenseCategoryManager(document.getElementById('settings-cats-container'));
            }
        });
        document.getElementById('btn-close-modal').addEventListener('click', () => {
            // v2.12: Use manager to pop history (which triggers close)
            // If user clicks X, we go back in history.
            navManager.popModal();
        });

        // v2.5: Event Delegation for Settings Modal (Fixes broken listeners)
        modal.addEventListener('click', (e) => {
            // Delete Account
            if (e.target.matches('.btn-del-acc') || e.target.closest('.btn-del-acc')) {
                const btn = e.target.closest('.btn-del-acc');
                if (confirm('Apagar conta?')) auraState.deleteAccount(btn.dataset.id);
            }
            // Edit Account
            if (e.target.matches('.btn-edit-acc') || e.target.closest('.btn-edit-acc')) {
                const btn = e.target.closest('.btn-edit-acc');
                const id = btn.dataset.id;
                const acc = auraState.state.finance.accounts.find(a => a.id === id);
                if (acc) {
                    const newName = prompt('Novo nome da conta:', acc.name);
                    if (newName) {
                        auraState.updateAccount(id, { name: newName });
                    }
                }
            }
            // Delete Template
            if (e.target.matches('.btn-del-tmpl') || e.target.closest('.btn-del-tmpl')) {
                const btn = e.target.closest('.btn-del-tmpl');
                if (confirm('Apagar template?')) auraState.deleteTemplate(parseInt(btn.dataset.id));
            }
            // Edit Template
            if (e.target.matches('.btn-edit-tmpl') || e.target.closest('.btn-edit-tmpl')) {
                const btn = e.target.closest('.btn-edit-tmpl');
                const id = parseInt(btn.dataset.id);
                const tmpl = auraState.state.finance.templates.find(t => t.id === id);
                if (tmpl) {
                    const newName = prompt('Nome:', tmpl.name);
                    const newAmt = prompt('Valor:', tmpl.amount);
                    if (newName && newAmt) {
                        auraState.updateTemplate(id, { name: newName, amount: parseFloat(newAmt) });
                    }
                }
            }
        });

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
                    if (document.getElementById('fab-personal-container')) document.getElementById('fab-personal-container').style.display = 'none'; // v2.9
                } else {
                    viewBiz.style.display = 'none';
                    viewPers.style.display = 'block';
                    if (document.getElementById('fab-personal-container')) document.getElementById('fab-personal-container').style.display = 'flex'; // v2.9
                }
            });
        });

        // --- Finance Actions (Business) ---
        // v2.9.3: Logic moved to ui-business.js
        if (typeof uiBusiness !== 'undefined') {
            uiBusiness.init();
        } else {
            // Fallback if not loaded globally, or use dynamic import if needed, 
            // but since we will add script tag with module type, we can import it.
            // However, to avoid large diffs, I'll just skip the logic here and assume index.html loads it or I add import at top.
            // BETTER: I will add `import { uiBusiness } from './ui-business.js';` at top of file in next step.
            // For now, I will just call it assuming I'll fix imports.
            uiBusiness.init();
        }

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
        // v1.9.5 Removed Sliders logic (Controlled by renderDistributionSettings)

        document.getElementById('btn-water').addEventListener('click', () => auraState.addWater());
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            const t = document.getElementById('input-study-topic').value;
            if (t) auraState.startStudyTimer(t);
        });

        // --- Personal Quick Actions v1.8.0 ---
        // --- Personal Quick Actions v1.8.0 ---
        const transModal = document.getElementById('transaction-modal');
        const pTransAmount = document.getElementById('p-trans-amount');
        const pTransTitle = document.getElementById('p-trans-title'); // v2.4
        const pTransCat = document.getElementById('p-trans-category');
        const pTransExpCat = document.getElementById('p-trans-expense-cat'); // v2.15
        const pTransSub = document.getElementById('p-trans-subcategory'); // v2.4
        const pTransAcc = document.getElementById('p-trans-account');
        const pTransCatContainer = document.getElementById('p-trans-cat-container');
        const pTransModalTitle = document.getElementById('trans-modal-title');
        let currentPTransType = 'expense';

        const openPTransModal = (type) => {
            currentPTransType = type;
            transModal.classList.add('open');
            navManager.pushModal('transaction', () => transModal.classList.remove('open')); // v2.12 Nav
            pTransAmount.value = '';
            pTransTitle.value = ''; // v2.4: Reset Title

            // Populate Accounts
            const accounts = auraState.state.finance.accounts;
            pTransAcc.innerHTML = accounts.map(a => `<option value="${a.id}">${a.name} (${parseFloat(a.balance || 0).toFixed(2)}€)</option>`).join('');

            // Populate Categories v1.9.1
            // Populate Categories v1.9.1 (Distribution)
            const cats = auraState.state.finance.personalCategories || [];
            if (cats.length > 0) {
                pTransCat.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } else {
                pTransCat.innerHTML = '<option value="Outros">Outros</option>';
            }

            // Populate Subcategories v2.16 (Global)
            const subs = auraState.state.finance.subcategories || [];
            if (subs.length > 0) {
                pTransSub.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
            } else {
                pTransSub.innerHTML = '<option value="">Sem Subcategorias</option>';
            }

            // Populate Expense Categories v2.15 (Energy Map)
            const expCats = auraState.state.finance.expenseCategories || [];
            if (expCats.length > 0) {
                pTransExpCat.innerHTML = expCats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } else {
                pTransExpCat.innerHTML = '<option value="">Outros</option>';
            }

            if (type === 'expense') {
                pTransModalTitle.textContent = 'Registar Despesa';
                pTransModalTitle.style.color = '#ff4444';
                pTransCatContainer.style.display = 'block';
                document.getElementById('p-trans-acc-label').textContent = 'Conta de Origem';
            } else {
                pTransModalTitle.textContent = 'Registar Rendimento';
                pTransModalTitle.style.color = 'var(--success-color, #00C853)';
                pTransCatContainer.style.display = 'none'; // No category for simple income
                document.getElementById('p-trans-acc-label').textContent = 'Conta de Destino';
            }
        };



        // v2.9: FAB Logic
        const fabContainer = document.getElementById('fab-personal-container');
        const fabMain = document.getElementById('btn-fab-main');

        fabMain.addEventListener('click', () => {
            fabContainer.classList.toggle('active');
            fabMain.classList.toggle('active');
        });

        document.getElementById('btn-fab-expense').addEventListener('click', () => {
            openPTransModal('expense');
            fabContainer.classList.remove('active');
            fabMain.classList.remove('active');
        });

        document.getElementById('btn-fab-income').addEventListener('click', () => {
            openPTransModal('income');
            fabContainer.classList.remove('active');
            fabMain.classList.remove('active');
        });
        document.getElementById('btn-close-trans-modal').addEventListener('click', () => navManager.popModal()); // v2.12

        document.getElementById('btn-confirm-p-trans').addEventListener('click', () => {
            const amt = pTransAmount.value;
            let title = pTransTitle.value.trim(); // v2.4
            const accId = pTransAcc.value;
            const cat = currentPTransType === 'expense' ? pTransCat.value : null;
            const expCat = currentPTransType === 'expense' ? pTransExpCat.value : null; // v2.15
            const sub = currentPTransType === 'expense' ? pTransSub.value : null; // v2.4

            // v2.8: Title is now optional (Detail)
            if (!title) {
                if (currentPTransType === 'expense') title = sub || expCat || cat || 'Despesa';
                else title = 'Rendimento';
            }

            if (amt && accId) {
                auraState.addPersonalTransaction(currentPTransType, amt, cat, accId, title, sub, expCat);
                navManager.popModal(); // v2.12: Close & Sync History
            } else {
                alert('Preencha o valor e selecione uma conta.');
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

        }
    }

    // Deprecated v1.9.5

    handleTimerState(state) {
        // ... (std)
    }

    updateUI(state) {
        const { labels, buckets, accounts, templates } = state.finance;
        console.log('UI: updating. Accounts:', accounts.length);

        // --- Business View Widgets ---
        // --- Business View Widgets ---
        if (document.getElementById('business-balance-display')) {
            // v1.9.5: Sum of all Business Buckets
            const totalBiz = state.finance.businessBuckets.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);
            document.getElementById('business-balance-display').textContent = `${totalBiz.toFixed(2)} €`;
        }

        // v1.9.5: Populate Expense Dropdown
        const expSelect = document.getElementById('select-expense-bucket');
        if (expSelect) {
            const currentVal = expSelect.value;
            expSelect.innerHTML = state.finance.businessBuckets.map(b =>
                `<option value="${b.id}">${b.name} (${parseFloat(b.balance).toFixed(2)}€)</option>`
            ).join('');
            if (currentVal && state.finance.businessBuckets.find(b => b.id === currentVal)) expSelect.value = currentVal;
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
        // --- Personal View Widgets (Replaced by New UI Module v1.9.1) ---
        // --- Personal View Widgets ---
        // --- Personal View Widgets ---
        // --- Personal View Widgets (Replaced by New UI Module v1.9.1) ---
        const pHeader = document.getElementById('personal-dynamic-header');
        if (pHeader) {
            pHeader.innerHTML = '';
            uiPersonal.renderPersonalHeader(pHeader);
            // v2.14: Render Goals (Integrated into Header Container for now or create new container?)
            // The header container in index.html might strictly be for header.
            // Let's check where it renders. renderPersonalHeader adds Balance Card + Budget Card.
            // We can append Goals directly to pHeader as well, or create a specific container.
            // Since UI Personal renders modularly, we can just call it on pHeader which acts as a wrapper.
            uiPersonal.renderGoals(pHeader);
        }

        // v1.9.8: Preview History
        const pHistory = document.getElementById('personal-history-preview');
        if (pHistory) {
            uiPersonal.renderTransactionPreview(pHistory);
            // Attach Listener (dynamic element)
            const btnViewAll = document.getElementById('btn-view-all-history');
            if (btnViewAll) {
                btnViewAll.onclick = () => this.openFullHistoryModal();
            }
        }


        // v1.9.0: Update Radar Chart
        this.drawPersonalRadar(auraState.getMonthlyPersonalExpenses());

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
                `<div class="account-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${a.name} (${parseFloat(a.balance).toFixed(2)}€)</span>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-edit-acc" data-id="${a.id}" style="color:#aaa; background:none; border:none; cursor:pointer;">✏️</button>
                        <button class="btn-del-acc" data-id="${a.id}" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
                    </div>
                </div>`
            ).join('');
        }

        document.getElementById('templates-list-settings').innerHTML = templates.map(t => `
            <div class="account-item" style="display:flex; justify-content:space-between; align-items:center;">
                <span>${t.name} (${t.amount}€)</span>
                <div style="display:flex; gap:10px;">
                     <button class="btn-edit-tmpl" data-id="${t.id}" style="color:#aaa; background:none; border:none; cursor:pointer;">✏️</button>
                     <button class="btn-del-tmpl" data-id="${t.id}" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
                </div>
            </div>
        `).join('');

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



    // v1.9.1: Dynamic Personal Radar Chart (N-gon)
    drawPersonalRadar(data) {
        const canvas = document.getElementById('personal-radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(width, height) / 2 - 30; // 30px padding for labels

        ctx.clearRect(0, 0, width, height);

        const categories = Object.keys(data);
        const numAxes = categories.length;
        if (numAxes < 3) return; // Need at least 3 for a polygon

        const angleSlice = (Math.PI * 2) / numAxes;

        // 1. Draw Web
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;

        for (let r = 0.2; r <= 1.0; r += 0.2) {
            ctx.beginPath();
            for (let i = 0; i <= numAxes; i++) {
                const angle = i * angleSlice - Math.PI / 2;
                const radius = maxRadius * r;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 2. Draw Axes & Labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        categories.forEach((cat, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x = cx + Math.cos(angle) * maxRadius;
            const y = cy + Math.sin(angle) * maxRadius;

            // Axis line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Label
            const labelDist = maxRadius + 15;
            const lx = cx + Math.cos(angle) * labelDist;
            const ly = cy + Math.sin(angle) * labelDist;
            ctx.fillText(cat, lx, ly);
        });

        // 3. Draw Data
        const values = Object.values(data);
        const maxData = Math.max(...values, 100); // Scale relative to max or 100 min

        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        categories.forEach((cat, i) => {
            const val = data[cat];
            const r = (val / maxData) * maxRadius;
            const angle = i * angleSlice - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    // v1.9.8: Full History Modal
    openFullHistoryModal() {
        const modal = document.getElementById('history-modal');
        const container = document.getElementById('full-history-list');
        if (!modal || !container) return;

        container.innerHTML = '';
        const txs = [...(auraState.state.finance.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (txs.length === 0) {
            container.innerHTML = '<div style="opacity:0.6; text-align:center;">Sem movimentos registados.</div>';
        } else {
            txs.forEach(t => {
                const isExpense = t.type === 'expense';
                const color = isExpense ? '#ff4444' : '#00e676';
                const sign = isExpense ? '-' : '+';
                const dateStr = new Date(t.date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit' });

                // Colors Matching Personal Cats
                let catColor = color;
                if (t.category) {
                    const pCat = (auraState.state.finance.personalCategories || []).find(c => c.name === t.category);
                    if (pCat) catColor = pCat.color;
                }

                const item = document.createElement('div');
                item.className = 'glass-card';
                item.style.margin = '0 auto';
                item.style.width = '100%';
                item.style.padding = '12px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';

                item.innerHTML = `
                   <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:12px; height:12px; border-radius:50%; background:${catColor};"></div>
                        <div style="display:flex; flex-direction:column;">
                             <span style="font-weight:bold; font-size:1rem;">${t.title || t.summary || (isExpense ? 'Despesa' : 'Rendimento')}</span>
                             <span style="font-size:0.8rem; color:#aaa;">
                                ${dateStr}
                                ${t.category ? ` • ${t.category}` : ''}
                                ${t.subcategory ? ` > ${t.subcategory}` : ''}
                             </span>
                        </div>
                   </div>
                   <div style="display:flex; align-items:center; gap:15px;">
                        <span style="color:${color}; font-weight:bold; font-size:1.1rem;">${sign}${t.amount.toFixed(2)}€</span>
                        <button class="btn-del-full" data-id="${t.id}" style="background:none; border:none; color:#ff4444; font-size:1.2rem; cursor:pointer;">🗑️</button>
                   </div>
                `;

                // Delete Logic
                item.querySelector('.btn-del-full').onclick = () => {
                    if (confirm('Apagar movimento permanentemente?')) {
                        auraState.deleteTransaction(t.id);
                        this.openFullHistoryModal(); // Refresh Modal List
                    }
                };

                container.appendChild(item);
            });
        }



        modal.classList.add('open');
        navManager.pushModal('history', () => modal.classList.remove('open')); // v2.12 Nav
    }
}

export const uiRenderer = new UIRenderer();

// Auto-Init logic to start the app
// Safe to run if DOM is already loaded, or wait for it.
// Since modules are deferred by default, DOM is usually ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uiRenderer.init());
} else {
    uiRenderer.init();
}

// Expose to window for index.html inline scripts (Service Worker)
window.uiRenderer = uiRenderer;
