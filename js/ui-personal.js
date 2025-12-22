import { auraState } from './app-state.js';

export const uiPersonal = {
    renderPersonalHeader(container) {
        if (!container) return;

        // Clear previous header content if creating fresh, but usually we overwrite or update specific IDs.
        // For simplicity in this refactor, we will expect the container to be cleared or we append specific elements.

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

        // 2. Categories Guide
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

        const cats = auraState.state.finance.personalCategories || [];

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

                // Calculate total for this category (optional/advanced, but cool)
                // For now, just listing them as requested "Note: For now, just list them visually."

                item.innerHTML = `
                    <div style="font-weight:bold; font-size:0.9rem;">${cat.name}</div>
                    <div style="width: 8px; height: 8px; background: ${cat.color}; border-radius: 50%; margin: 5px auto;"></div>
                `;
                grid.appendChild(item);
            });
        }

        catContainer.appendChild(grid);
        container.appendChild(catContainer);
    }
};
