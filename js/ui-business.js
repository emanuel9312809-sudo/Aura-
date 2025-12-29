import { auraState } from './app-state.js';

export const uiBusiness = {
    transactionMode: 'expense',

    init() {
        console.log('[UI Business] Initialized');
        this.setupListeners();
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
    }
};
