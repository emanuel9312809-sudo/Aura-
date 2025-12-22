import { auraState } from './app-state.js';

export const uiSettings = {
    renderCategoryManager(container) {
        if (!container) return;

        // Header
        const header = document.createElement('h3');
        header.textContent = 'Gerir Categorias Pessoais';
        container.appendChild(header);

        // List Container
        const listContainer = document.createElement('div');
        listContainer.id = 'settings-cat-list';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '8px';
        container.appendChild(listContainer);

        // Add New Form
        const addForm = document.createElement('div');
        addForm.style.marginTop = '15px';
        addForm.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        addForm.style.paddingTop = '10px';
        addForm.innerHTML = `
            <div style="display:flex; gap:5px;">
                <input type="text" id="new-cat-name" placeholder="Nova Categoria..." style="flex:2;">
                <input type="color" id="new-cat-color" value="#a358df" style="width:40px; border:none; padding:0; height:42px;">
                <button class="primary" id="btn-add-cat" style="flex:1;">+</button>
            </div>
        `;
        container.appendChild(addForm);

        // Event for Add
        setTimeout(() => {
            const btnAdd = container.querySelector('#btn-add-cat');
            const inputName = container.querySelector('#new-cat-name');
            const inputColor = container.querySelector('#new-cat-color');

            if (btnAdd) {
                btnAdd.onclick = () => {
                    const name = inputName.value.trim();
                    if (name) {
                        auraState.addPersonalCategory(name, inputColor.value);
                        inputName.value = '';
                        this.refreshList(listContainer);
                    }
                };
            }
        }, 0);

        // Initial List Render
        this.refreshList(listContainer);
    },

    refreshList(container) {
        if (!auraState.state.finance.personalCategories) auraState.state.finance.personalCategories = [];
        const cats = auraState.state.finance.personalCategories;

        container.innerHTML = '';
        if (cats.length === 0) {
            container.innerHTML = '<div style="color:#666; font-size:0.8rem;">Nenhuma categoria definida.</div>';
            return;
        }

        cats.forEach(cat => {
            const row = document.createElement('div');
            row.className = 'glass-card'; // Reuse style but smaller
            row.style.padding = '8px';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.margin = '0';

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:16px; height:16px; border-radius:50%; background-color:${cat.color};"></div>
                    <span>${cat.name}</span>
                </div>
                <button class="small-btn-delete" data-id="${cat.id}" style="background:none; border:none; color:#ff4444; font-weight:bold;">✕</button>
            `;

            // Delete Event
            row.querySelector('.small-btn-delete').onclick = () => {
                if (confirm(`Apagar categoria "${cat.name}"?`)) {
                    auraState.removePersonalCategory(cat.id);
                    this.refreshList(container);
                }
            };

            container.appendChild(row);
        });
    }
};
