// Seleciona todas as abas
const tabs = document.querySelectorAll('.tab');

// Adiciona o evento de clique para cada aba
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove a classe 'active' de todas as abas
    tabs.forEach(t => t.classList.remove('active'));

    // Adiciona a classe 'active' apenas na aba clicada
    tab.classList.add('active');
  });
});
