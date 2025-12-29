import { auraState } from './app-state.js';

export const uiBusiness = {
    transactionMode: 'expense',

    init() {
        console.log('[UI Business] Initialized');
        this.setupListeners();
        this.renderInventory();

        // Subscribe to state updates to refresh inventory
        auraState.subscribe(() => this.renderInventory());
    },

    setupListeners() {
        // --- Finance Actions ---
        const btnIncome = document.getElementById('btn-mode-income');
        const btnExpense = document.getElementById('btn-mode-expense');
        const submitBtn = document.getElementById('btn-submit-transaction');
        const expenseContainer = document.getElementById('expense-category-container');
        const lblAcc = document.getElementById('lbl-acc-select');

        // Check if elements exist to avoid null errors
        if (!btnIncome || !btnExpense || !submitBtn) return;

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
                // v2.9.3: Terminology Update
                lblAcc.textContent = 'Distribuição'; // Was 'Origem'
            }
        };

        btnIncome.addEventListener('click', () => setMode('income'));
        btnExpense.addEventListener('click', () => setMode('expense'));

        submitBtn.addEventListener('click', () => {
            const amt = document.getElementById('input-transaction-amount').value;
            const accId = document.getElementById('select-account-transaction').value;

            if (!amt || !accId) {
                alert('Verifique valor e conta.');
                return;
            }

            if (this.transactionMode === 'income') {
                auraState.processIncome(amt, accId);
            } else {
                const bucketId = document.getElementById('select-expense-bucket').value;
                auraState.processExpense(amt, bucketId, accId);
            }

            document.getElementById('input-transaction-amount').value = '';
        });
    },

    // v2.11: Inventory UI
    renderInventory() {
        const container = document.getElementById('business-inventory-container');
        if (!container) return;

        container.innerHTML = '';
        const inventory = auraState.state.finance.inventory || [];

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2>Inventário</h2>
                <button id="btn-add-prod" style="background:var(--finance-color); border:none; border-radius:50%; width:30px; height:30px; color:white; font-weight:bold;">+</button>
            </div>
            
            <!-- Add Form (Hidden by default) -->
            <div id="inv-add-form" style="display:none; background:#222; padding:15px; border-radius:10px; margin-bottom:15px;">
                <h4 style="margin-bottom:10px;">Novo Produto</h4>
                <input type="text" id="inv-name" placeholder="Nome do Produto" style="width:100%; padding:8px; margin-bottom:8px; border-radius:5px; border:none;">
                <div style="display:flex; gap:10px;">
                    <input type="number" id="inv-cost" placeholder="Custo Compra (€)" style="flex:1; padding:8px; border-radius:5px; border:none;">
                    <input type="number" id="inv-price" placeholder="Preço Venda (€)" style="flex:1; padding:8px; border-radius:5px; border:none;">
                </div>
                <input type="number" id="inv-stock" placeholder="Quantidade Inicial" style="width:100%; padding:8px; margin-top:8px; margin-bottom:8px; border-radius:5px; border:none;">
                <button id="btn-save-prod" class="primary" style="width:100%; padding:8px;">Guardar</button>
            </div>

            <div id="inv-list" style="display:flex; flex-direction:column; gap:10px;">
                ${inventory.length === 0 ? '<div style="opacity:0.6; text-align:center;">Sem produtos. Adiciona no +</div>' : ''}
            </div>
        `;

        // Render Items
        const listContainer = card.querySelector('#inv-list');
        inventory.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.background = 'rgba(255,255,255,0.05)';
            row.style.padding = '10px';
            row.style.borderRadius = '8px';

            row.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${item.name}</div>
                    <div style="font-size:0.8rem; color:#aaa;">Stock: <span style="color:white;">${item.stock}</span> | Compra: ${item.cost}€</div>
                </div>
                <div style="text-align:right;">
                    <div style="color:var(--success-color); font-weight:bold;">${item.price}€</div>
                    <button class="btn-del-inv" data-id="${item.id}" style="background:none; border:none; opacity:0.5; font-size:0.9rem; cursor:pointer;">❌</button>
                </div>
            `;
            listContainer.appendChild(row);
        });

        container.appendChild(card);

        // Listeners for Form
        const btnAdd = card.querySelector('#btn-add-prod');
        const form = card.querySelector('#inv-add-form');
        const btnSave = card.querySelector('#btn-save-prod');

        btnAdd.onclick = () => {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        };

        btnSave.onclick = () => {
            const name = card.querySelector('#inv-name').value;
            const cost = card.querySelector('#inv-cost').value;
            const price = card.querySelector('#inv-price').value;
            const stock = card.querySelector('#inv-stock').value;

            if (name && cost && price && stock) {
                auraState.addInventoryItem(name, cost, price, stock);
                form.style.display = 'none'; // Re-render will hide it anyway, but state triggers re-render
            } else {
                alert('Preencha todos os campos.');
            }
        };

        // Listeners for Delete
        card.querySelectorAll('.btn-del-inv').forEach(btn => {
            btn.onclick = (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Apagar produto?')) {
                    auraState.deleteInventoryItem(id);
                }
            };
        });
    }
};
