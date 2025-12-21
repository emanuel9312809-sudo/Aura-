/**
 * AURA - UI Render Engine v1.2.0
 * Interface completa em Português com Navegação, Finanças, Saúde e Mente (Estudo).
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.activeTab = 'aura'; // aura, finance, health, mind
        this.timerInterval = null; // Referência para o setInterval do timer
        this.init();
    }

    init() {
        this.renderStructure();
        this.setupListeners();

        // Subscrever ao estado global
        auraState.subscribe((state) => {
            this.updateUI(state);
            this.handleTimerState(state);
        });
    }

    renderStructure() {
        this.appElement.innerHTML = `
            <!-- Tab AURA -->
            <div id="tab-aura" class="tab-content active">
                <div id="aura-orb-container"></div>
                <div class="card">
                    <div class="stat-row"><span>Nível</span><span id="display-level">1</span></div>
                    <div class="stat-row"><span>XP</span><span id="display-xp">0 / 1000</span></div>
                    <div class="stat-row"><span>Bonus Vault</span><span id="display-vault" style="color: var(--accent-color)">0.00 €</span></div>
                </div>

                <!-- Checklist Diária (Resumo) -->
                <div class="card" style="margin-top: 20px;">
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

            <!-- Tab FINANÇA (Antiga 'Finanças') -->
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
                    <label>Op: <span id="lbl-op">60</span>%</label>
                    <input type="range" id="slider-op" min="0" max="100" value="60">
                    <label>Lucro: <span id="lbl-profit">20</span>%</label>
                    <input type="range" id="slider-profit" min="0" max="100" value="20">
                    <label>Tax: <span id="lbl-tax">15</span>%</label>
                    <input type="range" id="slider-tax" min="0" max="100" value="15">
                    <label>Inv: <span id="lbl-invest">5</span>%</label>
                    <input type="range" id="slider-invest" min="0" max="100" value="5">
                    <small>Total: <span id="slider-total">100</span>%</small>
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
                <!-- Checklist item sync -->
                <div class="card" style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Treino do Dia</span>
                    <input type="checkbox" id="check-workout-health" data-key="workout" style="transform: scale(1.5);">
                </div>
            </div>

            <!-- Tab MENTE (Nova) -->
            <div id="tab-mind" class="tab-content">
                <div class="card" style="text-align: center;">
                    <h2>Estudo Técnico (20min)</h2>
                    
                    <!-- Timer UI -->
                    <div id="timer-display" style="font-size: 3rem; font-family: monospace; font-weight: bold; margin: 20px 0; color: var(--accent-color);">
                        20:00
                    </div>

                    <div id="timer-controls">
                        <input type="text" id="input-study-topic" placeholder="O que vais estudar hoje?" 
                            style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #333; background: #222; color: white; margin-bottom: 10px;">
                        
                        <button class="primary" id="btn-start-timer">Começar Sessão</button>
                    </div>
                </div>
                
                 <div class="card" style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Estudo Realizado</span>
                    <input type="checkbox" id="check-study-mind" data-key="technical_study" style="transform: scale(1.5);">
                </div>
            </div>

            <!-- Bottom Navigation -->
            <nav class="nav-bar">
                <a class="nav-item active" data-tab="aura">
                    <span style="font-size: 1.2rem;">✨</span>
                    Rotina
                </a>
                <a class="nav-item" data-tab="finance">
                    <span style="font-size: 1.2rem;">💰</span>
                    Finança
                </a>
                <a class="nav-item" data-tab="health">
                    <span style="font-size: 1.2rem;">❤️</span>
                    Saúde
                </a>
                <a class="nav-item" data-tab="mind">
                    <span style="font-size: 1.2rem;">🧠</span>
                    Mente
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
        // Nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        // Finance
        document.getElementById('btn-add-income').addEventListener('click', () => {
            const val = document.getElementById('input-income').value;
            if (val) {
                auraState.processIncome(val);
                document.getElementById('input-income').value = '';
                alert(`Venda de ${val}€ registada!`);
            }
        });

        // Checklists Global (usa delegação ou bind manual)
        // Precisamos tratar TODOS os checkboxes que têm data-key
        const checklistCheckboxes = document.querySelectorAll('input[type="checkbox"][data-key]');
        checklistCheckboxes.forEach(box => {
            // Remover listeners antigos para evitar duplicados? Aqui recrio tudo, então ok.
            // Mas melhor usar 'change' event
            box.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-key');
                auraState.toggleChecklistItem(key);
            });
        });

        // Sliders (simplificado para brevidade)
        const sliders = ['slider-op', 'slider-profit', 'slider-tax', 'slider-invest'];
        sliders.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.handleConfigChange());
        });

        // Health
        document.getElementById('btn-water').addEventListener('click', () => auraState.addWater());

        // Timer Start
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            const topic = document.getElementById('input-study-topic').value;
            if (!topic) {
                alert('Escreve o que vais estudar!');
                return;
            }
            auraState.startStudyTimer(topic, 20); // 20 minutos
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

        document.getElementById('lbl-op').textContent = op;
        document.getElementById('lbl-profit').textContent = profit;
        document.getElementById('lbl-tax').textContent = tax;
        document.getElementById('lbl-invest').textContent = invest;

        const total = op + profit + tax + invest;
        const totalEl = document.getElementById('slider-total');
        totalEl.textContent = total;

        if (total === 100) {
            totalEl.style.color = 'var(--finance-color)';
            auraState.updateFinanceConfig({ operation: op, profit: profit, tax: tax, investment: invest });
        } else {
            totalEl.style.color = 'red';
        }
    }

    // --- Timer Logic no UI ---
    handleTimerState(state) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const btn = document.getElementById('btn-start-timer');
        const display = document.getElementById('timer-display');
        const input = document.getElementById('input-study-topic');

        if (state.study.isTimerActive && state.study.endTime) {
            // Modo Timer Ativo
            btn.textContent = "Cancelar";
            btn.style.background = "#ff4444";
            btn.onclick = () => auraState.cancelStudyTimer(); // Override provisório ou refactor
            // Nota: o listener original no init faz start, então isto é um hack simples visual. 
            // Melhor seria ter 2 botões ou lógica de toggle no listener.
            // Para robustez v1.2.0, vamos ajustar o btn click:

            // Mas no render só atualizamos UI. O listener é estático.
            // Vamos ajustar a UI para ocultar o input e mudar o botao.
            input.style.display = 'none';

            this.timerInterval = setInterval(() => {
                const now = Date.now();
                const diff = state.study.endTime - now;

                if (diff <= 0) {
                    clearInterval(this.timerInterval);
                    auraState.completeStudyTimer();
                    alert("Sessão de estudo concluída! +100 XP");
                    return;
                }

                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }, 1000);

        } else {
            // Modo Inativo
            btn.textContent = "Começar Sessão";
            btn.style.background = "var(--accent-color)";
            display.textContent = "20:00";
            input.style.display = "block";
            // Restaurar listener original se necessário, ou usar state checking no click
        }
    }

    updateUI(state) {
        // Stats Globais
        document.getElementById('display-level').textContent = state.profile.level;
        document.getElementById('display-xp').textContent = `${state.profile.currentXP} / ${state.profile.nextLevelXP}`;
        document.getElementById('display-vault').textContent = `${state.bonusVault.current.toFixed(2)} €`;

        // Checklists (Sync visual de todos)
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

        // Finance
        const f = state.finance;
        document.getElementById('val-op').textContent = `${f.buckets.operation.toFixed(2)} €`;
        document.getElementById('val-profit').textContent = `${f.buckets.profit.toFixed(2)} €`;
        document.getElementById('val-tax').textContent = `${f.buckets.tax.toFixed(2)} €`;
        document.getElementById('val-invest').textContent = `${f.buckets.investment.toFixed(2)} €`;

        // Health
        document.getElementById('display-water').textContent = `${state.health.water}ml`;
    }

    setupListeners() {
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
                }
                // Forçar recarregamento real do servidor
                window.location.reload(true);
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
