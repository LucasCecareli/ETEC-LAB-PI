// --- DADOS DE SIMULAÇÃO (Substituir pela integração com Firestore ou API) ---

// Mapeamento de dados de laboratório (SIMULAÇÃO)
const laboratorios = {
    '1': { nome: 'Laboratório 1', descricao: 'Química Geral', capacidade: 20 },
    '2': { nome: 'Laboratório 2', descricao: 'Química Orgânica', capacidade: 18 },
    '3': { nome: 'Laboratório 3', descricao: 'Análise Quantitativa', capacidade: 16 }
};

// Mapeamento de dados de materiais (SIMULAÇÃO)
const materiais = {
    'm1': { id: 'm1', item: 'Béquer 50ml', quantidade: 24, unidade: 'unidade', laboratorio: 'Depósito Química' },
    'm2': { id: 'm2', item: 'Ácido Sulfúrico', quantidade: 5, unidade: 'litro', laboratorio: 'Depósito Química' },
    'm3': { id: 'm3', item: 'Pipeta Graduada', quantidade: 10, unidade: 'unidade', laboratorio: 'Laboratório 1' },
};

// Mapeamento de dados de usuários (SIMULAÇÃO)
const usuarios = {
    'u1': { id: 'u1', nome: 'Mariana Silva', perfil: 'Professora', email: 'mariana@etec.edu.br', status: 'Ativo' },
    'u2': { id: 'u2', nome: 'João Ferreira', perfil: 'Técnico', email: 'joao.f@etec.edu.br', status: 'Ativo' },
    'u3': { id: 'u3', nome: 'Ana Costa', perfil: 'Administradora', email: 'ana.c@etec.edu.br', status: 'Desativado' },
};


// ---------------------------------------------------------------------------------

// Lógica principal de Tabs (fora do DOMContentLoaded)
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        tabContents.forEach((content) => {
            content.classList.remove("active");
        });

        const target = tab.getAttribute("data-tab");
        const targetContent = document.getElementById(target);

        if (targetContent) {
            targetContent.classList.add("active");
        }
    });
});


document.addEventListener('DOMContentLoaded', () => {

    // Função genérica para fechar modal (recebe o ID do modal como string)
    const fecharModalGenerico = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none'; // Oculta o modal
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Restaura o scroll da página
        }
    };

    // Função genérica para abrir modal (recebe o ID do modal como string)
    const abrirModalGenerico = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex'; // Torna visível
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Evita scroll da página principal
        }
    };

    // ====================================================================
    // 1. LÓGICA GERAL DE MODAIS (Novo Usuário, Novo Material, Editar Lab)
    // ====================================================================

    // A. Modal "Novo Usuário"
    const btnAbrirUser = document.getElementById('btn-new-user');
    const modalUser = document.getElementById('modal-new-user');
    const btnsFecharUser = document.querySelectorAll('[data-close="modal-new-user"]');
    const formNewUser = document.getElementById('form-new-user');

    if (btnAbrirUser) {
        btnAbrirUser.addEventListener('click', () => abrirModalGenerico('modal-new-user'));
    }
    btnsFecharUser.forEach(button => {
        button.addEventListener('click', () => fecharModalGenerico('modal-new-user'));
    });
    if (modalUser) {
        modalUser.addEventListener('click', (event) => {
            if (event.target === modalUser) {
                fecharModalGenerico('modal-new-user');
            }
        });
    }

    if (formNewUser) {
        formNewUser.addEventListener('submit', (event) => {
            event.preventDefault();
            // ... (Lógica de envio de Novo Usuário) ...
            console.log(`Usuário cadastrado com sucesso!`);
            formNewUser.reset();
            fecharModalGenerico('modal-new-user');
        });
    }

    // B. Modal "Novo Material"
    const btnAbrirMaterial = document.getElementById('btn-add-material');
    const modalMaterial = document.getElementById('modal-new-material');
    const btnsFecharMaterial = document.querySelectorAll('[data-close="modal-new-material"]');
    const formNewMaterial = document.getElementById('form-new-material');

    if (btnAbrirMaterial) {
        btnAbrirMaterial.addEventListener('click', () => abrirModalGenerico('modal-new-material'));
    }
    btnsFecharMaterial.forEach(button => {
        button.addEventListener('click', () => fecharModalGenerico('modal-new-material'));
    });
    if (modalMaterial) {
        modalMaterial.addEventListener('click', (event) => {
            if (event.target === modalMaterial) {
                fecharModalGenerico('modal-new-material');
            }
        });
    }

    // Lógica para Unidade Personalizada ("Outro") no Modal Novo Material
    const selectUnit = document.getElementById('material-unit');
    const customUnitGroup = document.getElementById('custom-unit-group');
    const customUnitText = document.getElementById('custom-unit-text');

    if (selectUnit && customUnitGroup && customUnitText) {
        selectUnit.addEventListener('change', () => {
            if (selectUnit.value === 'outro') {
                customUnitGroup.style.display = 'block';
                customUnitText.setAttribute('required', 'required');
            } else {
                customUnitGroup.style.display = 'none';
                customUnitText.removeAttribute('required');
                customUnitText.value = '';
            }
        });
    }

    if (formNewMaterial && selectUnit && customUnitText) {
        formNewMaterial.addEventListener('submit', (event) => {
            event.preventDefault();
            // ... (Lógica de envio de Novo Material com unidade) ...
            console.log(`Novo Material cadastrado com sucesso!`);
            formNewMaterial.reset();
            fecharModalGenerico('modal-new-material');
        });
    }

    // C. Modal "Editar Laboratório"
    const modalEditLab = document.getElementById('modal-edit-lab');
    const btnsAbrirEditLab = document.querySelectorAll('[data-open="modal-edit-lab"]');
    const btnsFecharEditLab = document.querySelectorAll('[data-close="modal-edit-lab"]');
    const formEditLab = document.getElementById('form-edit-lab');

    const abrirModalEdicaoLab = (labId) => {
        if (modalEditLab) {
            const labData = laboratorios[labId];
            if (labData) {
                document.getElementById('edit-lab-title').textContent = `Editar ${labData.nome}`;
                document.getElementById('edit-lab-id').value = labId;
                document.getElementById('edit-lab-name').value = labData.nome;
                document.getElementById('edit-lab-desc').value = labData.descricao;
                document.getElementById('edit-lab-capacity').value = labData.capacidade;
                abrirModalGenerico('modal-edit-lab');
            }
        }
    };

    btnsAbrirEditLab.forEach(button => {
        button.addEventListener('click', (event) => {
            const labId = event.currentTarget.getAttribute('data-lab-id');
            abrirModalEdicaoLab(labId);
        });
    });

    btnsFecharEditLab.forEach(button => {
        button.addEventListener('click', () => fecharModalGenerico('modal-edit-lab'));
    });

    if (modalEditLab) {
        modalEditLab.addEventListener('click', (event) => {
            if (event.target === modalEditLab) {
                fecharModalGenerico('modal-edit-lab');
            }
        });
    }

    if (formEditLab) {
        formEditLab.addEventListener('submit', (event) => {
            event.preventDefault();
            // ... (Lógica de envio de Edição de Laboratório) ...
            console.log(`Laboratório atualizado.`);
            fecharModalGenerico('modal-edit-lab');
        });
    }


    // ====================================================================
    // 2. LÓGICA DE BOTÕES DA ABA MATERIAIS
    // ====================================================================

    // D. Modal "Editar Material"
    const modalEditMaterial = document.getElementById('modal-edit-material');
    const formEditMaterial = document.getElementById('form-edit-material');
    const btnsFecharEditMaterial = document.querySelectorAll('[data-close="modal-edit-material"]');

    btnsFecharEditMaterial.forEach(button => {
        button.addEventListener('click', () => fecharModalGenerico('modal-edit-material'));
    });
    if (modalEditMaterial) {
        modalEditMaterial.addEventListener('click', (event) => {
            if (event.target === modalEditMaterial) {
                fecharModalGenerico('modal-edit-material');
            }
        });
    }

    // Lógica para Unidade Personalizada ("Outro") no Modal EDITAR Material
    const selectEditUnit = document.getElementById('edit-material-unit');
    const customEditUnitGroup = document.getElementById('custom-edit-unit-group');
    const customEditUnitText = document.getElementById('custom-edit-unit-text');

    if (selectEditUnit && customEditUnitGroup && customEditUnitText) {
        selectEditUnit.addEventListener('change', () => {
            if (selectEditUnit.value === 'outro') {
                customEditUnitGroup.style.display = 'block';
                customEditUnitText.setAttribute('required', 'required');
            } else {
                customEditUnitGroup.style.display = 'none';
                customEditUnitText.removeAttribute('required');
                customEditUnitText.value = '';
            }
        });
    }


    // Função que preenche e abre o modal de Edição de Material
    const abrirModalEdicaoMaterial = (materialId) => {
        const materialData = materiais[materialId];

        if (materialData && modalEditMaterial) {
            // 1. Preenche campos
            document.getElementById('edit-material-id').value = materialId;
            document.getElementById('edit-material-name').value = materialData.item;
            document.getElementById('edit-material-quantity').value = materialData.quantidade;
            // O campo "unidade" requer mais lógica devido à opção 'outro'
            if (document.getElementById('edit-material-unit').querySelector(`option[value="${materialData.unidade}"]`)) {
                document.getElementById('edit-material-unit').value = materialData.unidade;
                customEditUnitGroup.style.display = 'none';
                customEditUnitText.removeAttribute('required');
            } else {
                // Se a unidade não estiver na lista (é uma unidade customizada)
                document.getElementById('edit-material-unit').value = 'outro';
                customEditUnitText.value = materialData.unidade;
                customEditUnitGroup.style.display = 'block';
                customEditUnitText.setAttribute('required', 'required');
            }

            // 2. Abre o modal
            abrirModalGenerico('modal-edit-material');
        }
    };

    // Lógica de envio do formulário de Edição de Material
    if (formEditMaterial) {
        formEditMaterial.addEventListener('submit', (event) => {
            event.preventDefault();

            const id = document.getElementById('edit-material-id').value;
            const nome = document.getElementById('edit-material-name').value;
            const quantidade = document.getElementById('edit-material-quantity').value;
            
            // Determina a unidade final
            let unidadeFinal;
            const unidadeSelecionada = selectEditUnit.value;
            if (unidadeSelecionada === 'outro') {
                unidadeFinal = customEditUnitText.value;
            } else {
                unidadeFinal = unidadeSelecionada;
            }

            // ** SIMULAÇÃO DE SALVAMENTO: Atualiza o objeto JS **
            materiais[id].item = nome;
            materiais[id].quantidade = parseInt(quantidade);
            materiais[id].unidade = unidadeFinal;

            // ** Atualiza a linha na tabela (Precisa do ID na linha) **
            const row = document.querySelector(`tr[data-material-id="${id}"]`);
            if (row) {
                row.querySelector('.material-item-name').textContent = nome;
                row.querySelector('.material-quantity').textContent = quantidade;
                row.querySelector('.material-unit').textContent = unidadeFinal;
            }

            console.log(`Material ${nome} atualizado com sucesso!`);
            fecharModalGenerico('modal-edit-material');
        });
    }

    // E. Modal "Confirmar Remoção" (Reutilizado para Desativar/Reativar)
    const modalConfirm = document.getElementById('modal-confirm');
    const confirmMessage = document.getElementById('confirm-message');
    const btnConfirmYes = document.getElementById('btn-confirm-yes');
    const btnConfirmNo = document.getElementById('btn-confirm-no');

    // Variável para armazenar a ação de remoção
    let currentRemovalAction = null;

    // Função para mostrar o modal de confirmação
    const showConfirmModal = (message, onConfirm) => {
        confirmMessage.textContent = message;
        currentRemovalAction = onConfirm; // Armazena a função de callback
        abrirModalGenerico('modal-confirm');
    };

    // Lógica do botão SIM no modal de confirmação
    if (btnConfirmYes) {
        btnConfirmYes.addEventListener('click', () => {
            if (currentRemovalAction) {
                currentRemovalAction(); // Executa a ação
            }
            fecharModalGenerico('modal-confirm');
        });
    }

    // Lógica do botão NÃO no modal de confirmação
    if (btnConfirmNo) {
        btnConfirmNo.addEventListener('click', () => fecharModalGenerico('modal-confirm'));
    }
    
    // Fechar ao clicar fora
    if (modalConfirm) {
        modalConfirm.addEventListener('click', (event) => {
            if (event.target === modalConfirm) {
                fecharModalGenerico('modal-confirm');
            }
        });
    }


    // F. Gerenciamento de Cliques na Tabela de Materiais
    const materialTableBody = document.getElementById('material-table-body');

    if (materialTableBody) {
        materialTableBody.addEventListener('click', (event) => {
            // Verifica se o botão "Editar" foi clicado
            if (event.target.closest('.btn-edit-material')) {
                const materialId = event.target.closest('button').getAttribute('data-material-id');
                abrirModalEdicaoMaterial(materialId);
            }

            // Verifica se o botão "Remover" foi clicado
            if (event.target.closest('.btn-remove-material')) {
                const materialId = event.target.closest('button').getAttribute('data-material-id');
                const materialName = materiais[materialId].item;
                
                showConfirmModal(`Tem certeza que deseja remover o material "${materialName}"?`, () => {
                    // AÇÃO DE REMOÇÃO:
                    delete materiais[materialId]; // Remove do objeto de simulação
                    
                    // Remove a linha da tabela
                    const rowToRemove = document.querySelector(`tr[data-material-id="${materialId}"]`);
                    if (rowToRemove) {
                        rowToRemove.remove();
                    }
                    console.log(`Material "${materialName}" removido.`);
                });
            }
        });
    }

    // ====================================================================
    // 3. LÓGICA DE TECLAS GERAIS E USUÁRIOS (NOVAS ADIÇÕES)
    // ====================================================================

    // G. Modal "Editar Usuário" (NOVO)
    const modalEditUser = document.getElementById('modal-edit-user');
    const formEditUser = document.getElementById('form-edit-user');
    const btnsFecharEditUser = document.querySelectorAll('[data-close="modal-edit-user"]');

    btnsFecharEditUser.forEach(button => {
        button.addEventListener('click', () => fecharModalGenerico('modal-edit-user'));
    });
    if (modalEditUser) {
        modalEditUser.addEventListener('click', (event) => {
            if (event.target === modalEditUser) {
                fecharModalGenerico('modal-edit-user');
            }
        });
    }

    // Função que preenche e abre o modal de Edição de Usuário
    const abrirModalEdicaoUsuario = (userId) => {
        const userData = usuarios[userId];

        if (userData && modalEditUser) {
            // 1. Preenche campos
            document.getElementById('edit-user-id').value = userId;
            document.getElementById('edit-user-title').textContent = `Editar ${userData.nome}`;
            document.getElementById('edit-user-name').value = userData.nome;
            document.getElementById('edit-user-email').value = userData.email;
            document.getElementById('edit-user-profile').value = userData.perfil;
            
            // 2. Abre o modal
            abrirModalGenerico('modal-edit-user');
        }
    };

    // Lógica de envio do formulário de Edição de Usuário
    if (formEditUser) {
        formEditUser.addEventListener('submit', (event) => {
            event.preventDefault();

            const id = document.getElementById('edit-user-id').value;
            const nome = document.getElementById('edit-user-name').value;
            const email = document.getElementById('edit-user-email').value;
            const perfil = document.getElementById('edit-user-profile').value;
            
            // ** SIMULAÇÃO DE SALVAMENTO: Atualiza o objeto JS **
            usuarios[id].nome = nome;
            usuarios[id].email = email;
            usuarios[id].perfil = perfil;

            // ** Atualiza a linha na tabela (Sincroniza o DOM) **
            const row = document.querySelector(`tr[data-user-id="${id}"]`);
            if (row) {
                row.querySelector('.user-name').textContent = nome;
                row.querySelector('.user-email').textContent = email;
                row.querySelector('.user-profile').textContent = perfil;
            }

            console.log(`Usuário ${nome} atualizado com sucesso!`);
            fecharModalGenerico('modal-edit-user');
        });
    }

    // H. Gerenciamento de Cliques na Tabela de Usuários (NOVO)
    const userTableBody = document.getElementById('users-table-body');

    if (userTableBody) {
        userTableBody.addEventListener('click', (event) => {
            
            // --- 1. Botão "Editar" ---
            if (event.target.closest('.btn-edit-user')) {
                const userId = event.target.closest('button').getAttribute('data-user-id');
                abrirModalEdicaoUsuario(userId);
            }

            // --- 2. Botão "Desativar/Ativar" (Reutiliza modal-confirm) ---
            if (event.target.closest('.btn-remove-user')) {
                const userId = event.target.closest('button').getAttribute('data-user-id');
                const userName = usuarios[userId].nome;
                const currentStatus = usuarios[userId].status;
                
                // Determina a ação e a mensagem baseada no status atual
                const newStatus = currentStatus === 'Ativo' ? 'Desativado' : 'Ativo';
                const actionText = currentStatus === 'Ativo' ? 'Desativar' : 'Reativar';
                const statusClass = newStatus === 'Ativo' ? 'status-active' : 'status-disabled';

                showConfirmModal(`Tem certeza que deseja ${actionText.toLowerCase()} o usuário "${userName}"?`, () => {
                    // AÇÃO DE ATIVAÇÃO/DESATIVAÇÃO:
                    usuarios[userId].status = newStatus; // Atualiza o objeto de simulação
                    
                    // Atualiza a linha da tabela
                    const rowToUpdate = document.querySelector(`tr[data-user-id="${userId}"]`);
                    if (rowToUpdate) {
                        // Atualiza o texto do status e a classe do badge
                        const statusSpan = rowToUpdate.querySelector('.user-status');
                        statusSpan.textContent = newStatus;
                        
                        // Remove todas as classes de status e adiciona a nova
                        statusSpan.classList.remove('status-active', 'status-disabled', 'status-denied', 'status-draft');
                        statusSpan.classList.add(statusClass);
                        
                        // Atualiza o texto do botão de ação
                        const actionButton = rowToUpdate.querySelector('.btn-remove-user');
                        actionButton.textContent = newStatus === 'Ativo' ? 'Desativar' : 'Reativar';
                    }
                    console.log(`Usuário "${userName}" agora está ${newStatus}.`);
                });
            }
        });
    }


    // I. Fechar qualquer modal ao pressionar a tecla ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay[aria-hidden="false"]');
            openModals.forEach(modal => fecharModalGenerico(modal.id));
        }
    });

});