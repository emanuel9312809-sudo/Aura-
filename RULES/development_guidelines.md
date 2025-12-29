# Regras de Desenvolvimento AURA

Estas regras são MANDATÓRIAS para qualquer alteração no projeto.

## 1. Preservação de Funcionalidade
> **Nunca remover funcionalidades que não foram explicitamente pedidas.**
Antes de remover ou alterar código existente, verifique se ele suporta uma funcionalidade ativa. Se tiver dúvida, PERGUNTE.

## 2. Modularidade e Separação de Domínios
> **Separe as funcionalidades por Domínio (Ficheiros Isolados).**
Para garantir que alterações num domínio não afetam outro:
- **Finanças Negócio** deve estar em `ui-business.js`.
- **Finanças Pessoal** deve estar em `ui-personal.js`.
- **Módulos Secundários** (Saúde, Mente, Rotina) devem ter os seus próprios ficheiros ou namespaces isolados.
- **Renderização Core** (`ui-render.js`) deve apenas orquestrar, nunca conter lógica de negócio específica.

## 3. Verificação e Cuidado
> **Sempre pensar 2 vezes antes de fazer qualquer alteração para não cometer erros.**
- Analise o impacto da mudança em *todo* o ficheiro.
- Verifique se variáveis ou funções reutilizadas não são afetadas.
- Confirme se os *Event Listeners* são reinicializados corretamente após re-renderizações.
