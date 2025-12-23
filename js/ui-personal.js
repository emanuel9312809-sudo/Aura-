import { auraState } from './app-state.js';

export const uiPersonal = {
    renderPersonalHeader(container) {
        if (!container) return;

        // 1. Saldo Total Card
        let totalBalance = 0;
        if (auraState.state.finance.accounts) {
            totalBalance = auraState.state.finance.accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
        }

        const balanceCard = document.createElement('div');
        balanceCard.className = 'glass-card';
        balanceCard.style.textAlign = 'center';
        balanceCard.style.marginBottom = '15px';
        balanceCard.innerHTML = `
            <h3 style="margin-bottom: 5px; color: var(--text-muted);">Saldo Total</h3>
            <div style="font-size: 2.5rem; font-weight: bold; color: var(--finance-color);">${totalBalance.toFixed(2)} €</div>
        `;
        container.appendChild(balanceCard);

        // 2. Orçamento Disponível (v2.7)
        const budgetContainer = document.createElement('div');
        budgetContainer.className = 'glass-card';
        budgetContainer.style.marginBottom = '20px';
        budgetContainer.style.padding = '15px';

        const bHeader = document.createElement('h4');
        bHeader.textContent = 'Orçamento Disponível';
        bHeader.style.marginBottom = '10px';
        bHeader.style.color = 'var(--text-muted)';
        budgetContainer.appendChild(bHeader);

        const cats = auraState.state.finance.personalCategories || [];
        const hasBudget = cats.some(c => c.allocation > 0);

        if (!hasBudget) {
            budgetContainer.innerHTML += '<div style="opacity:0.6; font-size:0.9rem;">Configure a distribuição nas definições.</div>';
        } else {
            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '8px';

            cats.forEach(c => {
                if (c.allocation > 0) {
                    const amount = totalBalance * (c.allocation / 100);
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.fontSize = '0.9rem';

                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${c.color};"></div>
                            <span>${c.name} <span style="font-size:0.8rem; color:#666;">(${c.allocation}%)</span></span>
                        </div>
                        <span style="font-weight:bold;">${amount.toFixed(2)} €</span>
                    `;
                    list.appendChild(row);
                }
            });
            budgetContainer.appendChild(list);
        }
        container.appendChild(budgetContainer);

        // 3. Categories Guide
        const catContainer = document.createElement('div');
        catContainer.style.marginBottom = '20px';

        const catHeader = document.createElement('h4');
        catHeader.textContent = 'As Tuas Categorias';
        catHeader.style.marginLeft = '5px';
        catHeader.style.marginBottom = '10px';
        catContainer.appendChild(catHeader);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        grid.style.gap = '10px';

        // const cats = auraState.state.finance.personalCategories || []; // Already declared above

        if (cats.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; opacity:0.6;">Sem categorias. Adiciona nas Definições.</div>';
        } else {
            cats.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'glass-card'; // Mini card
                item.style.padding = '10px';
                item.style.textAlign = 'center';
                item.style.margin = '0'; // Override glass-card margin
                item.style.borderLeft = `3px solid ${cat.color}`;

                item.innerHTML = `
                    <div style="font-weight:bold; font-size:0.9rem;">${cat.name}</div>
                    <div style="width: 8px; height: 8px; background: ${cat.color}; border-radius: 50%; margin: 5px auto;"></div>
                `;
                grid.appendChild(item);
            });
        }

        catContainer.appendChild(grid);
        container.appendChild(catContainer);
    },

    // v1.9.8: Transaction History Preview (Part A)
    renderTransactionPreview(container) {
        if (!container) return;
        container.innerHTML = ''; // Clear

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';
        header.innerHTML = `
            <h3>Últimos Movimentos</h3>
            <button id="btn-view-all-history" style="background:none; border:none; color:var(--accent-color); font-size:0.9rem; cursor:pointer;">Ver Tudo</button>
        `;
        container.appendChild(header);

        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';

        // Get Transactions, sort desc, take top 5
        const txs = [...(auraState.state.finance.transactions || [])]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (txs.length === 0) {
            list.innerHTML = '<div style="opacity:0.6; text-align:center; padding:10px;">Sem movimentos recentes.</div>';
        } else {
            txs.forEach(t => {
                const isExpense = t.type === 'expense';
                const color = isExpense ? '#ff4444' : '#00e676';
                const sign = isExpense ? '-' : '+';
                const dateStr = new Date(t.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });

                // Find Category Color if possible
                let catColor = color;
                if (t.category) {
                    const pCat = (auraState.state.finance.personalCategories || []).find(c => c.name === t.category);
                    if (pCat) catColor = pCat.color;
                }

                const item = document.createElement('div');
                item.className = 'glass-card';
                item.style.margin = '0 0 10px 0';
                item.style.padding = '10px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:10px; height:10px; border-radius:50%; background:${catColor};"></div>
                        <div style="display:flex; flex-direction:column;">
                             <span style="font-size:0.9rem; font-weight:bold;">${t.title || (isExpense ? 'Despesa' : 'Rendimento')}</span>
                             <span style="font-size:0.75rem; color:#aaa;">
                                ${t.category ? t.category : ''}
                                ${t.subcategory ? ` > ${t.subcategory}` : ''}
                             </span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="color:${color}; font-weight:bold;">${sign}${t.amount.toFixed(2)}€</span>
                        <button class="btn-del-hist" data-id="${t.id}" style="background:none; border:none; opacity:0.5; font-size:1rem; cursor:pointer;">🗑️</button>
                    </div>
                `;

                // Delete Logic (Shared)
                item.querySelector('.btn-del-hist').onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('Apagar movimento? O valor será revertido para a conta.')) {
                        auraState.deleteTransaction(t.id);
                        // UI will auto-update via state subscription
                    }
                };

                list.appendChild(item);
            });
        }
        container.appendChild(list);
    }
};
