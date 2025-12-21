/**
 * AURA - UI Render Engine v1.1.0
 * Interface completa em Português com Navegação, Finanças e Saúde.
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.activeTab = 'aura'; // aura, finance, health
        this.init();
    }

    init() {
        this.renderStructure();
        this.setupListeners();

        // Subscrever ao estado global
        auraState.subscribe((state) => {
            this.updateUI(state);
        });
    }

    renderStructure() {
        this.appElement.innerHTML = `
            <!-- Tab AURA -->
            <div id="tab-aura" class="tab-content active">
                <div id="aura-orb-container">
                    <!-- Injetado via JS -->
                </div>
                <div class="card">
                    <div class="stat-row"><span>Nível</span><span id="display-level">1</span></div>
                    <div class="stat-row"><span>XP</span><span id="display-xp">0 / 1000</span></div>
                    <div class="stat-row"><span>Bonus Vault</span><span id="display-vault" style="color: var(--accent-color)">0.00 €</span></div>
                </div>
            </div>

            <!-- Tab FINANÇAS -->
            <div id="tab-finance" class="tab-content">
                <div class="card">
                    <h2>Registo de Venda</h2>
                    <input type="number" id="input-income" placeholder="Valor (€)" step="0.01">
                    <button class="primary" id="btn-add-income">Registar Venda</button>
                </div>

                <div class="card" style="margin-top: 20px;">
                    <h2>Baldes de Rendimento</h2>
                    <div class="stat-row"><span>Operação (<span id="perc-op">60</span>%)</span><span id="val-op">0.00 €</span></div>
                    <div class="stat-row"><span>Lucro (<span id="perc-profit">20</span>%)</span><span id="val-profit">0.00 €</span></div>
                    <div class="stat-row"><span>Impostos (<span id="perc-tax">15</span>%)</span><span id="val-tax">0.00 €</span></div>
                    <div class="stat-row"><span>Investimento (<span id="perc-invest">5</span>%)</span><span id="val-invest">0.00 €</span></div>
                </div>

                <div class="card" style="margin-top: 20px;">
                    <h2>Configurações (%)</h2>
                    <label>Operação: <span id="lbl-op">60</span>%</label>
                    <input type="range" id="slider-op" min="0" max="100" value="60" data-bucket="operation">
                    
                    <label>Lucro: <span id="lbl-profit">20</span>%</label>
                    <input type="range" id="slider-profit" min="0" max="100" value="20" data-bucket="profit">
                    
                    <label>Impostos: <span id="lbl-tax">15</span>%</label>
                    <input type="range" id="slider-tax" min="0" max="100" value="15" data-bucket="tax">
                    
                    <label>Investimento: <span id="lbl-invest">5</span>%</label>
                    <input type="range" id="slider-invest" min="0" max="100" value="5" data-bucket="investment">
                    
                    <small style="color: var(--text-muted); display: block; margin-top: 8px;">Total: <span id="slider-total">100</span>%</small>
                </div>
            </div>

            <!-- Tab SAÚDE -->
            <div id="tab-health" class="tab-content">
                <div class="card" style="text-align: center;">
                    <h2>Vitalidade</h2>
                    <button class="water-btn" id="btn-water">
                        +250ml<br>
                        <span id="display-water" style="font-size: 0.8rem; opacity: 0.8">0ml</span>
                    </button>
                </div>

                <div class="card" style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Treino do Dia</span>
                    <input type="checkbox" id="check-workout" style="transform: scale(1.5);">
                </div>
            </div>

            <!-- Bottom Navigation -->
            <nav class="nav-bar">
                <a class="nav-item active" data-tab="aura">
                    <span style="font-size: 1.2rem;">✨</span>
                    Aura
                </a>
                <a class="nav-item" data-tab="finance">
                    <span style="font-size: 1.2rem;">💰</span>
                    Finanças
                </a>
                <a class="nav-item" data-tab="health">
                    <span style="font-size: 1.2rem;">❤️</span>
                    Saúde
                </a>
            </nav>
        `;

        this.renderOrb(document.getElementById('aura-orb-container'));
        this.setupInternalListeners();
    }

    renderOrb(container) {
        // Orb Visual - Simples por enquanto
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
        // Navigation Switching
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        // Finance Action
        document.getElementById('btn-add-income').addEventListener('click', () => {
            const val = document.getElementById('input-income').value;
            if (val) {
                auraState.processIncome(val);
                document.getElementById('input-income').value = '';
                alert(`Venda de ${val}€ registada com sucesso!`);
            }
        });

        // Finance Config Sliders
        const sliders = ['slider-op', 'slider-profit', 'slider-tax', 'slider-invest'];
        sliders.forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.handleConfigChange());
            document.getElementById(id).addEventListener('input', () => this.handleConfigChange());
        });

        // Health Actions
        document.getElementById('btn-water').addEventListener('click', () => {
            auraState.addWater();
        });

        document.getElementById('check-workout').addEventListener('change', () => {
            auraState.toggleWorkout();
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;

        // Atualizar Tab Contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Atualizar Nav Icons
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

        const total = op + profit + tax + invest;

        // Atualizar labels em tempo real
        document.getElementById('lbl-op').textContent = op;
        document.getElementById('lbl-profit').textContent = profit;
        document.getElementById('lbl-tax').textContent = tax;
        document.getElementById('lbl-invest').textContent = invest;

        const totalEl = document.getElementById('slider-total');
        totalEl.textContent = total;
        totalEl.style.color = total === 100 ? 'var(--finance-color)' : 'red';

        // Só salvar se total for 100
        if (total === 100) {
            auraState.updateFinanceConfig({
                operation: op,
                profit: profit,
                tax: tax,
                investment: invest
            });
        }
    }

    updateUI(state) {
        // Aura Tab
        document.getElementById('display-level').textContent = state.profile.level;
        document.getElementById('display-xp').textContent = `${state.profile.currentXP} / ${state.profile.nextLevelXP}`;
        document.getElementById('display-vault').textContent = `${state.bonusVault.current.toFixed(2)} €`;

        // Finance Tab - Buckets
        document.getElementById('val-op').textContent = `${state.finance.buckets.operation.toFixed(2)} €`;
        document.getElementById('val-profit').textContent = `${state.finance.buckets.profit.toFixed(2)} €`;
        document.getElementById('val-tax').textContent = `${state.finance.buckets.tax.toFixed(2)} €`;
        document.getElementById('val-invest').textContent = `${state.finance.buckets.investment.toFixed(2)} €`;

        // Finance Tab - Config Percs (Static display in buckets list)
        document.getElementById('perc-op').textContent = state.finance.config.operation;
        document.getElementById('perc-profit').textContent = state.finance.config.profit;
        document.getElementById('perc-tax').textContent = state.finance.config.tax;
        document.getElementById('perc-invest').textContent = state.finance.config.investment;

        // Health Tab
        document.getElementById('display-water').textContent = `${state.health.water}ml`;
        document.getElementById('check-workout').checked = state.health.workout;
    }

    setupListeners() {
        // Listener para o botão de update global (fora das tabs)
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                // Post message to SW to skip waiting
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
                }
                window.location.reload();
            });
        }
    }

    showUpdateNotification() {
        if (this.updateBtn) {
            this.updateBtn.classList.add('visible');
        }
    }
}

export const uiRenderer = new UIRenderer();
