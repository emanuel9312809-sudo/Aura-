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
            // Container Flex: Chart | Legend
            const flexBox = document.createElement('div');
            flexBox.style.display = 'flex';
            flexBox.style.flexDirection = 'row'; // Side by side
            flexBox.style.alignItems = 'center';
            flexBox.style.gap = '20px';

            // 1. Canvas
            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.position = 'relative';
            canvasWrapper.style.width = '120px';
            canvasWrapper.style.height = '120px';

            const canvas = document.createElement('canvas');
            canvas.width = 240; // Retina
            canvas.height = 240;
            canvas.style.width = '120px';
            canvas.style.height = '120px';
            canvasWrapper.appendChild(canvas);
            flexBox.appendChild(canvasWrapper);

            // 2. Legend
            const legend = document.createElement('div');
            legend.style.flex = '1';
            legend.style.display = 'flex';
            legend.style.flexDirection = 'column';
            legend.style.gap = '6px';

            let currentAngle = -0.5 * Math.PI; // Start top
            const ctx = canvas.getContext('2d');
            const centerX = 120;
            const centerY = 120;
            const outerRadius = 110;
            const innerRadius = 80;

            // Sort by amount desc for aesthetics
            cats.sort((a, b) => b.allocation - a.allocation);

            let totalAllocatedMoney = 0;

            cats.forEach((c, index) => {
                if (c.allocation > 0) {
                    const amount = totalBalance * (c.allocation / 100);
                    totalAllocatedMoney += amount;

                    // A. Draw Chart Segment
                    const sliceAngle = (c.allocation / 100) * 2 * Math.PI;
                    const endAngle = currentAngle + sliceAngle;

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle);
                    ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true);
                    ctx.closePath();
                    ctx.fillStyle = c.color;
                    ctx.fill();

                    // Optional: White Border separator
                    ctx.strokeStyle = '#222';
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    // B. Draw Legend Item
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.fontSize = '0.85rem';

                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:6px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${c.color};"></div>
                            <span style="color:#ddd;">${c.name}</span>
                        </div>
                        <span style="font-weight:bold; color:white;">${amount.toFixed(0)}€</span>
                    `;
                    legend.appendChild(row);

                    // Update Angle
                    currentAngle = endAngle;
                }
            });

            // Center Text
            const centerLabel = document.createElement('div');
            centerLabel.style.position = 'absolute';
            centerLabel.style.top = '50%';
            centerLabel.style.left = '50%';
            centerLabel.style.transform = 'translate(-50%, -50%)';
            centerLabel.style.textAlign = 'center';
            centerLabel.innerHTML = `
                <div style="font-size:0.7rem; color:#aaa;">Total</div>
                <div style="font-weight:bold; font-size:0.9rem;">${totalAllocatedMoney.toFixed(0)}€</div>
            `;
            canvasWrapper.appendChild(centerLabel);

            flexBox.appendChild(legend);
            budgetContainer.appendChild(flexBox);
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
    },

    // v2.14: Metas de Poupança
    renderGoals(container) {
        if (!container) return;

        const goalsDiv = document.createElement('div');
        goalsDiv.className = 'glass-card';
        goalsDiv.style.marginBottom = '20px';
        goalsDiv.style.padding = '15px';
        container.appendChild(goalsDiv);

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '15px';
        header.innerHTML = `
            <h4 style="margin:0; color:var(--text-muted);">Metas de Poupança</h4>
            <button id="btn-add-goal" style="background:none; border:1px solid var(--accent-color); color:var(--accent-color); padding:4px 10px; border-radius:12px; font-size:0.8rem;">+ Nova Meta</button>
        `;
        goalsDiv.appendChild(header);

        // Goals List (Horizontal Scroll)
        const scrollDiv = document.createElement('div');
        scrollDiv.style.display = 'flex';
        scrollDiv.style.gap = '12px';
        scrollDiv.style.overflowX = 'auto';
        scrollDiv.style.paddingBottom = '10px';
        goalsDiv.appendChild(scrollDiv);

        const goals = auraState.state.finance.goals || [];

        if (goals.length === 0) {
            scrollDiv.innerHTML = '<div style="width:100%; text-align:center; opacity:0.5; padding:20px; font-size:0.9rem;">Define um objetivo (ex: Férias, Carro).</div>';
        } else {
            goals.forEach(g => {
                const percent = Math.min(100, (g.current / g.target) * 100);
                const card = document.createElement('div');
                card.style.minWidth = '140px';
                card.style.background = 'rgba(255,255,255,0.05)';
                card.style.borderRadius = '12px';
                card.style.padding = '12px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '8px';
                card.style.cursor = 'pointer';
                card.style.border = '1px solid rgba(255,255,255,0.05)';

                card.innerHTML = `
                    <div style="font-size:1.5rem;">${g.icon}</div>
                    <div style="font-weight:bold; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.name}</div>
                    <div style="width:100%; height:8px; background:#222; border-radius:4px; overflow:hidden;">
                        <div style="width:${percent}%; height:100%; background:${g.color}; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                        <span>${Math.round(percent)}%</span>
                        <span>${g.current}€</span>
                    </div>
                `;

                // Click to Manage
                card.onclick = async () => {
                    // Use a simple prompt for action selection first (or custom modal with buttons?)
                    // For MVP v2.14.1, let's use the InputModal for values, but maybe a simple native confirm/prompt for action selection is okay?
                    // User complained about "emanuel... says". That happens on prompt().
                    // Let's replace the Action Selection with a simple confirm/alert approach or just 3 buttons?
                    // Simplest fix: Direct prompt for "Depositar" if clicking card?
                    // Or ask "O que queres fazer?"
                    // Let's implement a 'showActionSheet' is too complex.
                    // Let's stick to prompt for Action but maybe that's the issue?
                    // Wait, the user said "pede pra eu preencher um valor". That's the value prompt.
                    // The action prompt "Gerir Meta... 1. Depositar" is also a prompt.
                    // FIX: Use a custom simple selection logic or assume Click = Deposit.
                    // Improved UX: Click = Deposit/Details. Long Press = Edit?
                    // Let's simple: Ask "Depositar (1) ou Levantar (2) ou Apagar (3)?"

                    const action = await uiRenderer.showInputModal('Gerir Meta', '1: Depositar, 2: Levantar, 3: Apagar', 'number', '1');

                    if (action === '1') {
                        const val = await uiRenderer.showInputModal('Depositar', 'Quanto queres guardar? (€)', 'number');
                        if (val) {
                            if (auraState.updateGoalProgress(g.id, val)) {
                                document.dispatchEvent(new Event('state-change'));
                            }
                        }
                    } else if (action === '2') {
                        const val = await uiRenderer.showInputModal('Levantar', 'Quanto precisas? (€)', 'number');
                        if (val) {
                            auraState.updateGoalProgress(g.id, -Math.abs(val));
                            document.dispatchEvent(new Event('state-change'));
                        }
                    } else if (action === '3') {
                        if (confirm('Tens a certeza que queres apagar?')) {
                            auraState.deleteGoal(g.id);
                            document.dispatchEvent(new Event('state-change'));
                        }
                    }
                };

                scrollDiv.appendChild(card);
            });
        }

        // Add Logic
        goalsDiv.querySelector('#btn-add-goal').onclick = async () => {
            const name = await uiRenderer.showInputModal('Nova Meta', 'Qual é o teu objetivo?');
            if (!name) return;
            const target = await uiRenderer.showInputModal('Valor Alvo', 'Quanto precisas juntar? (€)', 'number');
            if (!target) return;

            auraState.addGoal(name, target);
            document.dispatchEvent(new Event('state-change'));
        };
    }
};
