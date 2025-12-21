/**
 * AURA - UI Render Engine
 * Responsável por renderizar o Orbe e a interface do utilizador.
 */
import { auraState } from './app-state.js';

class UIRenderer {
    constructor() {
        this.appElement = document.getElementById('app');
        this.updateBtn = document.getElementById('update-btn');
        this.init();
    }

    init() {
        this.renderOrb();
        this.setupListeners();

        // Subscrever a alterações de estado para re-renderizar se necessário
        auraState.subscribe((state) => {
            console.log('Estado atualizado:', state);
            // Aqui poderiamos atualizar stats na UI
        });
    }

    renderOrb() {
        const orbContainer = document.createElement('div');
        orbContainer.style.cssText = `
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: var(--accent-color);
        `;

        // Simulação do SVG Orb com um círculo CSS simples por enquanto
        // No futuro, substituir por SVG complexo conforme pedido
        const orb = document.createElement('div');
        orb.style.cssText = `
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #4facfe, #00f2fe);
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
            animation: breathe 4s infinite ease-in-out;
        `;

        // Adicionando keyframes dinamicamente para a animação
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            @keyframes breathe {
                0% { transform: scale(1); box-shadow: 0 0 30px rgba(0, 212, 255, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(0, 212, 255, 0.6); }
                100% { transform: scale(1); box-shadow: 0 0 30px rgba(0, 212, 255, 0.4); }
            }
        `;
        document.head.appendChild(styleSheet);

        orbContainer.appendChild(orb);
        this.appElement.appendChild(orbContainer);

        const title = document.createElement('h1');
        title.innerText = "AURA";
        title.style.cssText = `
            position: absolute;
            top: 10%;
            width: 100%;
            text-align: center;
            font-weight: 300;
            letter-spacing: 4px;
            opacity: 0.8;
            font-size: 1.2rem;
        `;
        this.appElement.appendChild(title);
    }

    setupListeners() {
        // Listener para o botão de update
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }

    showUpdateNotification() {
        if (this.updateBtn) {
            this.updateBtn.classList.add('visible');
            console.log('Botão de nova versão exibido.');
        }
    }
}

export const uiRenderer = new UIRenderer();
