import { auraState } from './app-state.js';

export const uiSettings = {
    renderCategoryManager(container) {
        if (!container) return;
        container.innerHTML = ''; // Fix Duplication v1.9.6

        // Header
        const header = document.createElement('h3');
        header.textContent = 'Categorias Pessoais';
        container.appendChild(header);

        // List Container
        const listContainer = document.createElement('div');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '10px';
        container.appendChild(listContainer);

        // Render List Function
        const renderList = () => {
            listContainer.innerHTML = '';
            const cats = auraState.state.finance.personalCategories || [];

            if (cats.length === 0) {
                listContainer.innerHTML = '<div style="opacity:0.6; font-style:italic;">Nenhuma categoria.</div>';
            } else {
                cats.forEach(cat => {
                    const row = document.createElement('div');
                    row.className = 'glass-card';
                    row.style.margin = '0';
                    row.style.padding = '10px 15px';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';

                    row.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:20px; height:20px; border-radius:50%; background-color:${cat.color}; border:1px solid rgba(255,255,255,0.3);"></div>
                            <span style="font-size:1rem;">${cat.name}</span>
                        </div>
                        <button class="btn-del-cat" data-id="${cat.id}" style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:1.2rem;">×</button>
                    `;

                    row.querySelector('.btn-del-cat').onclick = () => {
                        if (confirm(`Apagar "${cat.name}"?`)) {
                            auraState.removePersonalCategory(cat.id);
                            renderList();
                        }
                    };
                    listContainer.appendChild(row);
                });
            }
        };

        renderList();

        // Add New Form (Styled Footer)
        const footer = document.createElement('div');
        footer.style.marginTop = '20px';
        footer.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        footer.style.paddingTop = '15px';
        footer.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <input type="color" id="new-cat-color" value="#a358df" style="width:50px; height:40px; border:none; padding:0; background:none; cursor:pointer;">
                <input type="text" id="new-cat-name" placeholder="Nova Categoria..." style="flex:1;">
                <button class="primary" id="btn-add-cat" style="width:40px; font-size:1.2rem;">+</button>
            </div>
        `;
        container.appendChild(footer);

        // Add Logic
        const btnAdd = footer.querySelector('#btn-add-cat');
        const inputName = footer.querySelector('#new-cat-name');
        const inputColor = footer.querySelector('#new-cat-color');

        btnAdd.onclick = () => {
            const name = inputName.value.trim();
            if (name) {
                auraState.addPersonalCategory(name, inputColor.value);
                inputName.value = '';
                renderList();
            }
        };
    },

    refreshList(container) {
        // Deprecated internal method, logic moved to renderCategoryManager closure
        console.warn('refreshList is deprecated');
    },
    // v1.9.5: Dynamic Business Distribution Settings
    renderDistributionSettings(container) {
        if (!container) return;

        // Clone current state deep enough to edit without autosaving until "Save"
        // Actually, we can edit a local copy and then call saveBusinessBuckets.
        let localBuckets = JSON.parse(JSON.stringify(auraState.state.finance.businessBuckets));

        const render = () => {
            container.innerHTML = '';

            // Header
            const header = document.createElement('h3');
            header.textContent = 'Distribuição de Negócio (%)';
            container.appendChild(header);

            // Calculate Total
            const total = localBuckets.reduce((sum, b) => sum + (parseFloat(b.percent) || 0), 0);
            const isValid = Math.abs(total - 100) < 0.1; // Float tolerance

            // List of Buckets
            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '15px';
            container.appendChild(list);

            localBuckets.forEach((b, index) => {
                const row = document.createElement('div');
                row.className = 'glass-card'; // Styling
                row.style.margin = '0';
                row.style.padding = '10px';

                // Row Layout: Name | % Input | Slider | Delete
                row.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <input type="text" value="${b.name}" class="bucket-name-input" data-index="${index}" style="width:60%;" placeholder="Nome">
                        <div style="display:flex; align-items:center; gap:5px;">
                             <input type="number" value="${b.percent}" class="bucket-perc-input" data-index="${index}" style="width:50px; text-align:right;">
                             <span>%</span>
                             ${localBuckets.length > 1 ? `<button class="btn-del-bucket" data-index="${index}" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>` : ''}
                        </div>
                    </div>
                    <input type="range" class="bucket-slider" data-index="${index}" min="0" max="100" value="${b.percent}" style="width:100%;">
                `;
                list.appendChild(row);

                // Events
                const nameInp = row.querySelector('.bucket-name-input');
                const percInp = row.querySelector('.bucket-perc-input');
                const slider = row.querySelector('.bucket-slider');
                const delBtn = row.querySelector('.btn-del-bucket');

                nameInp.onchange = (e) => { localBuckets[index].name = e.target.value; };

                // Sync Logic: Input -> Slider
                percInp.oninput = (e) => {
                    let val = parseFloat(e.target.value) || 0;
                    if (val < 0) val = 0; if (val > 100) val = 100;
                    localBuckets[index].percent = val;
                    // Don't update slider immediately if typing decimals? 
                    // To keep it simple:
                    slider.value = val;
                    updateTotal();
                };

                // Sync Logic: Slider -> Input
                slider.oninput = (e) => {
                    const val = parseFloat(e.target.value);
                    localBuckets[index].percent = val;
                    percInp.value = val;
                    updateTotal();
                };

                if (delBtn) delBtn.onclick = () => {
                    if (confirm('Remover este balde? O saldo permanecerá na conta, mas a distribuição futura cessa.')) {
                        localBuckets.splice(index, 1);
                        render();
                    }
                }
            });

            // Footer: Add & Total & Save
            const footer = document.createElement('div');
            footer.style.marginTop = '20px';
            footer.style.borderTop = '1px solid rgba(255,255,255,0.1)';
            footer.style.paddingTop = '10px';
            footer.style.display = 'flex';
            footer.style.flexDirection = 'column';
            footer.style.gap = '10px';

            // Add Button
            const btnAdd = document.createElement('button');
            btnAdd.textContent = '+ Novo Balde';
            btnAdd.className = 'secondary';
            btnAdd.style.width = '100%';
            btnAdd.onclick = () => {
                localBuckets.push({ id: 'custom_' + Date.now(), name: 'Novo Balde', percent: 0, balance: 0 });
                render();
            };
            footer.appendChild(btnAdd);

            // Total Display
            const totalDisplay = document.createElement('div');
            totalDisplay.innerHTML = `Total Atual: <strong style="color: ${isValid ? '#00e676' : '#ff4444'}">${total.toFixed(1)}%</strong>`;
            totalDisplay.style.textAlign = 'right';
            footer.appendChild(totalDisplay);

            // Save Button
            const btnSave = document.createElement('button');
            btnSave.textContent = 'Salvar Distribuição';
            btnSave.className = 'primary';
            btnSave.style.width = '100%';
            btnSave.disabled = !isValid;
            btnSave.onclick = () => {
                if (isValid) {
                    auraState.saveBusinessBuckets(localBuckets);
                    alert('Distribuição Salva!');
                }
            };
            footer.appendChild(btnSave);

            container.appendChild(footer);
        };

        const updateTotal = () => {
            // Re-render whole thing is expensive (lose focus). 
            // Ideally just update Total text and Save button state.
            const total = localBuckets.reduce((sum, b) => sum + (parseFloat(b.percent) || 0), 0);
            const isValid = Math.abs(total - 100) < 0.1;

            // Update Footer text directly?
            // Simplest: Just re-render footer? Or targeted update.
            // Targeted update to avoid losing focus on inputs.
            const totalEl = container.querySelector('strong'); // hacky but likely works given structure
            if (totalEl) {
                totalEl.innerHTML = `${total.toFixed(1)}%`;
                totalEl.style.color = isValid ? '#00e676' : '#ff4444';
            }
            const saveBtn = container.lastChild.lastChild; // Button is last in footer
            if (saveBtn && saveBtn.tagName === 'BUTTON') saveBtn.disabled = !isValid;
        };

        render();
    }
};
