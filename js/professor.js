// Garante que o script só rode depois que todo o HTML for carregado
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os botões de aba
    const tabButtons = document.querySelectorAll('.tab');
    // Seleciona todas as seções de conteúdo
    const tabContents = document.querySelectorAll('.tab-content');

    // Itera sobre cada botão de aba para adicionar um ouvinte de evento
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Pega o ID da seção de conteúdo correspondente do atributo data-tab
            const targetId = button.getAttribute('data-tab'); // Ex: 'dashboard-content'

            // 1. Alterna o estado ATIVO dos BOTÕES
            // Remove a classe 'active' de TODOS os botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe 'active' APENAS no botão clicado
            button.classList.add('active');

            // 2. Alterna o estado ATIVO do CONTEÚDO
            // Remove a classe 'active' de TODAS as seções de conteúdo
            tabContents.forEach(content => content.classList.remove('active'));

            // Encontra a seção de conteúdo pelo ID (targetId) e adiciona a classe 'active'
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
});