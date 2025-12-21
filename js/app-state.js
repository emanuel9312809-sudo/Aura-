/**
 * AURA - App State Management
 * Gestão centralizada do estado da aplicação.
 */

class AuraState {
    constructor() {
        this.state = {
            finance: {
                balance: 0,
                transactions: []
            },
            health: {
                steps: 0,
                water: 0,
                sleep: 0
            },
            routine: {
                tasks: [],
                streak: 0
            },
            learning: {
                skills: [],
                progress: 0
            },
            bonusVault: {
                current: 0,
                history: []
            }
        };

        this.listeners = [];
        this.loadState();
    }

    // Carregar estado do localStorage para persistência
    loadState() {
        const savedState = localStorage.getItem('aura_state_v1');
        if (savedState) {
            try {
                this.state = { ...this.state, ...JSON.parse(savedState) };
            } catch (e) {
                console.error('Erro ao carregar estado:', e);
            }
        }
    }

    // Salvar estado
    saveState() {
        localStorage.setItem('aura_state_v1', JSON.stringify(this.state));
        this.notify();
    }

    // Adicionar listener para mudanças de estado
    subscribe(listener) {
        this.listeners.push(listener);
    }

    // Notificar listeners
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Métodos de Ação (Actions)
    updateFinance(amount) {
        this.state.finance.balance += amount;
        this.saveState();
    }

    // Exemplo: Método para debug
    getState() {
        return this.state;
    }
}

// Instância global única (Singleton pattern simples)
export const auraState = new AuraState();
