// tecnico.js
// Conteúdo: seu JS original (modals, materiais, usuários) + Agendamentos integrados

const protocolo = "http://";
const baseURL = "127.0.0.1:3000";

// Função para atualizar as estatísticas
function atualizarEstatisticasMateriais() {
    const totalMateriais = Object.keys(materiais).length;

    // Atualizar stats do dashboard
    const statTotalMateriais = document.getElementById('stat-total-materiais');
    if (statTotalMateriais) {
        statTotalMateriais.textContent = totalMateriais;
    }

    // Atualizar stats da seção de materiais
    const statsMateriais = document.querySelector('#materiais .kits-stats');
    if (statsMateriais) {
        statsMateriais.innerHTML = `
            <span>Total de Itens: <strong>${totalMateriais}</strong></span>
            <span>Itens críticos: <strong class="text-amber">0</strong></span>
        `;
    }
}


// Aba Materiais Funcional

// Materiais 

// Verifica se o material já existe
async function verificarMaterialExistente(nome, descricao) {
    try {
        const resposta = await axios.get("http://localhost:3000/materiais");
        const todosMateriais = resposta.data;

        // Verificar duplicata exata (mesmo nome E mesma descrição/ambas vazias)
        const duplicataExata = todosMateriais.find(material => {
            const mesmoNome = material.item.toLowerCase() === nome.toLowerCase();
            const mesmaDescricao = material.descricao.toLowerCase() === (descricao || "").toLowerCase();
            return mesmoNome && mesmaDescricao;
        });

        if (duplicataExata) {
            return duplicataExata;
        }

        // Verificar se existe material com mesmo nome mas descrição diferente
        const mesmoNomeDescricaoDiferente = todosMateriais.find(material =>
            material.item.toLowerCase() === nome.toLowerCase() &&
            material.descricao.toLowerCase() !== (descricao || "").toLowerCase()
        );

        if (mesmoNomeDescricaoDiferente) {
            const descricaoExistente = mesmoNomeDescricaoDiferente.descricao || "(sem descrição)";
            const novaDescricao = descricao || "(sem descrição)";

            const confirmar = confirm(
                `⚠️ Atenção!\n\nJá existe um material com o nome "${mesmoNomeDescricaoDiferente.item}" mas com descrição diferente.\n\n` +
                `Existente: ${descricaoExistente}\n` +
                `Novo: ${novaDescricao}\n\n` +
                `Deseja cadastrar mesmo assim?`
            );
            return confirmar ? null : mesmoNomeDescricaoDiferente;
        }

        return null;

    } catch (erro) {
        console.error("❌ Erro ao verificar duplicatas:", erro);
        return null;
    }
}

// cadastro de materiais
async function cadastrarMaterial() {
    const nome = document.getElementById("material-name").value.trim();
    const descricao = document.getElementById("material-description").value.trim();
    const categoria = document.getElementById("material-category").value;
    const quantidade = parseInt(document.getElementById("material-quantity").value);
    const unidadeSelect = document.getElementById("material-unit");
    const unidade = unidadeSelect.value === 'outro'
        ? document.getElementById("custom-unit-text").value.trim()
        : unidadeSelect.value;
    const quantidadeMinima = parseInt(document.getElementById("material-min-quantity").value);

    // Validações básicas - DESCRIÇÃO NÃO É MAIS OBRIGATÓRIA
    if (!nome || !categoria || isNaN(quantidade) || !unidade || isNaN(quantidadeMinima)) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    if (quantidade < 0 || quantidadeMinima < 0) {
        alert("Quantidade e quantidade mínima não podem ser negativas.");
        return;
    }

    // Validação da unidade personalizada
    if (unidadeSelect.value === 'outro' && !unidade) {
        alert("Por favor, especifique a unidade personalizada.");
        return;
    }

    try {
        console.log("📤 Enviando dados do material:", {
            nome, descricao, categoria, quantidade, unidade, quantidadeMinima
        });

        // Verificação de duplicatas (atualizada para descrição opcional)
        const materialExistente = await verificarMaterialExistente(nome, descricao);
        if (materialExistente) {
            alert(`❌ Material já cadastrado!\n\nItem: ${materialExistente.item}\nDescrição: ${materialExistente.descricao || '(sem descrição)'}\nQuantidade atual: ${materialExistente.quantidade} ${materialExistente.unidade}`);
            return;
        }

        const resposta = await axios.post("http://localhost:3000/materiais", {
            item: nome,
            descricao: descricao || "", // Se vazio, envia string vazia
            categoria: categoria,
            quantidade: quantidade,
            unidade: unidade,
            quantidadeMinima: quantidadeMinima
        });

        console.log("✅ Material cadastrado:", resposta.data);
        alert("Material cadastrado com sucesso!");

        // Recarregar a lista de materiais
        await carregarMateriais();

        // Limpar formulário e fechar modal
        document.getElementById("form-new-material").reset();
        fecharModal("modal-new-material");

    } catch (erro) {
        console.error("❌ Erro ao cadastrar material:", erro);

        let mensagemErro = "Erro ao cadastrar material.";

        if (erro.response) {
            console.error("Status:", erro.response.status);
            console.error("Dados:", erro.response.data);

            switch (erro.response.status) {
                case 400:
                    mensagemErro = "Dados inválidos. Verifique as informações.";
                    break;
                case 500:
                    mensagemErro = "Erro interno do servidor. Tente novamente.";
                    break;
                default:
                    mensagemErro = `Erro ${erro.response.status}: ${erro.response.data?.error || 'Erro no servidor'}`;
            }
        } else if (erro.request) {
            mensagemErro = "Erro de conexão. Verifique se o servidor está rodando.";
        } else {
            mensagemErro = "Erro de configuração: " + erro.message;
        }

        alert(mensagemErro);
    }
}

async function carregarMateriais() {
    try {
        const resposta = await axios.get("http://localhost:3000/materiais");
        console.log("Materiais carregados:", resposta.data);

        // Converter array para objeto com IDs
        materiais = {};
        resposta.data.forEach(material => {
            materiais[material._id] = material;
        });

        // Atualizar a tabela
        atualizarTabelaMateriais();
        atualizarEstatisticasMateriais();

        return materiais;
    } catch (erro) {
        console.error("❌ Erro ao carregar materiais:", erro);
        alert("Erro ao carregar materiais do servidor.");
        return {};
    }
}

function atualizarTabelaMateriais() {
    const tbody = document.getElementById('material-table-body');
    if (!tbody) return;

    tbody.innerHTML = ''; // Limpar tabela

    Object.keys(materiais).forEach(materialId => {
        const material = materiais[materialId];
        const linha = criarLinhaMaterial(materialId, material);
        tbody.appendChild(linha);
    });
}

function criarLinhaMaterial(materialId, material) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-material-id', materialId);

    tr.innerHTML = `
        <td data-label="Item" class="material-item-name">${material.item}</td>
        <td data-label="Quantidade" class="material-quantity">${material.quantidade}</td>
        <td data-label="Unidade" class="material-unit">${material.unidade}</td>
        <td data-label="Laboratorio">${material.laboratorio || 'Depósito Química'}</td>
        <td data-label="Ações" class="kit-actions-compact actions-cell">
            <button class="btn btn-light btn-edit-material" data-material-id="${materialId}">
                ✏️ Editar
            </button>
            <button class="btn btn-remove-material" data-material-id="${materialId}">
                🗑️ Remover
            </button>
        </td>
    `;

    return tr;
}



// Função para abrir modal de edição de material
const abrirModalEdicaoMaterial = (materialId) => {
    const material = materiais[materialId];
    if (!material) {
        console.error("Material não encontrado:", materialId);
        return;
    }

    console.log("📝 Editando material:", material);

    document.getElementById('edit-material-id').value = materialId;
    document.getElementById('edit-material-name').value = material.item;
    document.getElementById('edit-material-quantity').value = material.quantidade;

    const select = document.getElementById('edit-material-unit');
    const customGroup = document.getElementById('custom-edit-unit-group');
    const customInput = document.getElementById('custom-edit-unit-text');

    if (select.querySelector(`option[value="${material.unidade}"]`)) {
        select.value = material.unidade;
        customGroup.style.display = 'none';
        customInput.removeAttribute('required');
    } else {
        select.value = 'outro';
        customInput.value = material.unidade;
        customGroup.style.display = 'block';
        customInput.setAttribute('required', 'required');
    }

    abrirModal('modal-edit-material');
};

// Configurar formulário de edição de material
const setupFormEditMaterial = () => {
    const form = document.getElementById('form-edit-material');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const materialId = document.getElementById('edit-material-id').value;

        const dadosAtualizados = {
            item: document.getElementById('edit-material-name').value,
            quantidade: parseInt(document.getElementById('edit-material-quantity').value),
            unidade: document.getElementById('edit-material-unit').value === 'outro'
                ? document.getElementById('custom-edit-unit-text').value
                : document.getElementById('edit-material-unit').value
        };

        try {
            const resposta = await axios.put(`http://localhost:3000/materiais/${materialId}`, dadosAtualizados);

            // Atualizar localmente
            materiais[materialId] = { ...materiais[materialId], ...dadosAtualizados };
            atualizarTabelaMateriais();

            console.log("✅ Material atualizado:", resposta.data);
            alert("Material atualizado com sucesso!");
            fecharModal('modal-edit-material');
        } catch (erro) {
            console.error("❌ Erro ao atualizar material:", erro);
            alert("Erro ao atualizar material.");
        }
    });
};


// Função para carregar todos os dados do dashboard
async function carregarDashboard() {
    try {
        await Promise.all([
            carregarUsuarios(),
            carregarMateriais(),
            carregarEstatisticasAgendamentos()
        ]);
        console.log("✅ Dashboard carregado com sucesso!");
    } catch (erro) {
        console.error("❌ Erro ao carregar dashboard:", erro);
    }
}

// ======================= FUNÇÕES GERAIS =======================

// Abrir modal genérico
const abrirModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
};

// Fechar modal genérico
const fecharModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
};

// Lógica principal de Tabs 
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

// LÓGICA DE AGENDAMENTOS
// AGENDAMENTOS 
// Dados simulados (substituir pelos que vêm do backend ou JSON)
const appointments = [
    {
        professor: "Prof. Maria Silva",
        turma: "2º Química A",
        dataAgendamento: "15/09/2025",
        dataAula: "18/09/2025",
        horario: "08:00 - 10:00",
        materiais: ["Béquer 250mL", "Reagentes", "Vidraria"],
        status: "Pendente"
    },
    {
        professor: "Prof. João Santos",
        turma: "3º Química B",
        dataAgendamento: "14/09/2025",
        dataAula: "19/09/2025",
        horario: "14:00 - 16:00",
        materiais: ["Erlenmeyer 250mL", "AgNO₃ 0,1M", "Bureta"],
        status: "Pendente"
    }
];

// Elementos principais
const cardsContainer = document.getElementById("appointments-cards");
const totalAgendamentos = document.getElementById("total-agendamentos");
const agendamentosHoje = document.getElementById("agendamentos-hoje");
const searchInput = document.getElementById("filter-search");

// Função para renderizar os cards
function renderAppointmentCards(data) {
    cardsContainer.innerHTML = "";
    data.forEach(item => {
        // Cria o card
        const card = document.createElement("div");
        card.classList.add("appointment-card");

        // Cabeçalho (professor, turma e status)
        card.innerHTML = `
      <div class="appointment-header">
        <div class="appointment-info">
          <h3>${item.professor}</h3>
          <a href="#" class="class">${item.turma}</a>
        </div>
        <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
      </div>

      <div class="appointment-details">
        <div><strong>Data do Agendamento:</strong> ${item.dataAgendamento}</div>
        <div><strong>Data da Aula:</strong> ${item.dataAula}</div>
        <div><strong>Horário:</strong> ${item.horario}</div>
      </div>

      <div class="materials">
        <strong>Materiais Solicitados</strong>
        <div class="material-tags">
          ${item.materiais.map(mat => `<span class="material-tag">${mat}</span>`).join("")}
        </div>
      </div>

      <div class="card-actions">
        <button class="btn btn-approve">Aprovar</button>
        <button class="btn btn-deny">Rejeitar</button>
      </div>
    `;

        cardsContainer.appendChild(card);
    });

    totalAgendamentos.textContent = data.length;
}
//  BOTÕES DE AÇÃO DOS CARDS 
cardsContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".appointment-card");
    if (!card) return;

    // Seleciona tipo de botão clicado
    const isApprove = e.target.classList.contains("btn-approve");
    const isDeny = e.target.classList.contains("btn-deny");

    if (isApprove || isDeny) {
        const modal = document.getElementById("confirmation-modal");
        const modalMsg = document.getElementById("modal-message");
        const confirmYes = document.getElementById("confirm-yes");
        const confirmNo = document.getElementById("confirm-no");
        const toast = document.getElementById("toast");

        // Mensagem dinâmica
        modalMsg.textContent = isApprove
            ? "Tem certeza que deseja aprovar este agendamento?"
            : "Tem certeza que deseja rejeitar este agendamento?";

        modal.style.display = "flex";

        // Confirmar
        confirmYes.onclick = () => {
            modal.style.display = "none";
            toast.textContent = isApprove
                ? "✅ Agendamento aprovado com sucesso!"
                : "❌ Agendamento rejeitado com sucesso!";
            toast.className = `toast show ${isApprove ? "" : "error"}`;
            setTimeout(() => (toast.className = "toast"), 3000);
        };

        // Cancelar
        confirmNo.onclick = () => {
            modal.style.display = "none";
        };
    }
})


// Filtro de busca
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = appointments.filter(a =>
        a.professor.toLowerCase().includes(term)
    );
    renderAppointmentCards(filtered);
});

// Render inicial
renderAppointmentCards(appointments);

// filtros (pesquisar e filtrar por lab)
if (searchInput) {
    searchInput.addEventListener('input', () => {
        renderAppointments({ q: searchInput.value, lab: filterLab ? filterLab.value : '' });
    });
}

// Funcionalidade para a tela de histórico
// Filtro de busca de professor
const searchTeacher = document.getElementById('search-teacher');
const filterStatus = document.getElementById('filter-status');
const historyItems = document.querySelectorAll('.history-item');

if (searchTeacher) {
    searchTeacher.addEventListener('input', filterHistory);
}

if (filterStatus) {
    filterStatus.addEventListener('change', filterHistory);
}

function filterHistory() {
    const searchTerm = searchTeacher ? searchTeacher.value.toLowerCase() : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';

    historyItems.forEach(item => {
        const teacherName = item.querySelector('.teacher-info h3').textContent.toLowerCase();
        const status = item.querySelector('.status-badge').classList.contains('status-completed') ? 'completed' : 'cancelled';

        const matchesSearch = teacherName.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        if (matchesSearch && matchesStatus) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Simulação de dados — use depois sua integração real
const agendamentosPendentes = [
    { id: 1, professor: 'Maria Silva', turma: '3ºA', aula: 'Química Geral', horario: '08:00 - 10:00', materiais: 'Becker, Pipeta' },
    { id: 2, professor: 'João Souza', turma: '2ºB', aula: 'Química Orgânica', horario: '10:00 - 12:00', materiais: 'Tubo de ensaio, Bico de Bunsen' },
    { id: 3, professor: 'Ana Lima', turma: '1ºC', aula: 'Laboratório I', horario: '13:00 - 15:00', materiais: 'Álcool, Termômetro' }
];

// Gera os cards na tela
function carregarAgendamentos() {
    agendamentoList.innerHTML = '';
    agendamentosPendentes.forEach(ag => {
        const card = document.createElement('div');
        card.className = 'agendamento-card';
        card.dataset.id = ag.id;

        card.innerHTML = `
          <h3>Agendamento #${ag.id}</h3>
          <p class="agendamento-info"><strong>Professor:</strong> ${ag.professor}</p>
          <p class="agendamento-info"><strong>Turma:</strong> ${ag.turma}</p>
          <p class="agendamento-info"><strong>Aula:</strong> ${ag.aula}</p>
          <p class="agendamento-info"><strong>Horário:</strong> ${ag.horario}</p>
          <p class="agendamento-info"><strong>Materiais:</strong> ${ag.materiais}</p>
          <div style="text-align: right; margin-top: 10px;">
            <button class="btn-primary btn-aprovar">Aprovar</button>
          </div>
        `;

        const btnAprovar = card.querySelector('.btn-aprovar');
        btnAprovar.addEventListener('click', () => aprovarAgendamento(ag.id));

        card.addEventListener('click', () => {
            if (multipleSelectMode) toggleSelecionado(card);
        });

        agendamentoList.appendChild(card);
    });
}

// function toggleSelecionado(card) {
//     const id = parseInt(card.dataset.id);
//     const index = selectedCards.indexOf(id);
//     if (index >= 0) {
//         selectedCards.splice(index, 1);
//         card.classList.remove('selected');
//     } else {
//         selectedCards.push(id);
//         card.classList.add('selected');
//     }
//     approveSelectedBtn.disabled = selectedCards.length === 0;
// }

// function aprovarAgendamento(id) {
//     mostrarToast();
//     setTimeout(() => {
//         const index = agendamentosPendentes.findIndex(a => a.id === id);
//         if (index >= 0) {
//             agendamentosPendentes.splice(index, 1);
//             carregarAgendamentos();
//         }
//     }, 1000);
// }

// approveSelectedBtn.addEventListener('click', () => {
//     selectedCards.forEach(id => aprovarAgendamento(id));
//     selectedCards = [];
//     multipleSelectMode = false;
//     selectMultipleBtn.textContent = 'Selecionar múltiplos';
//     approveSelectedBtn.disabled = true;
// });

// selectMultipleBtn.addEventListener('click', () => {
//     multipleSelectMode = !multipleSelectMode;
//     selectMultipleBtn.textContent = multipleSelectMode ? 'Cancelar seleção' : 'Selecionar múltiplos';
//     selectedCards = [];
//     approveSelectedBtn.disabled = true;
// });

// function mostrarToast() {
//     toast.classList.add('show');
//     setTimeout(() => toast.classList.remove('show'), 2500);
// }

// Abertura e fechamento do modal
// btnApprove.addEventListener('click', () => {
//     modalApprove.style.display = 'block';
//     carregarAgendamentos();
// });

// closeApprove.addEventListener('click', () => {
//     modalApprove.style.display = 'none';
// });

const setupFormEditUsuario = () => {
    const form = document.getElementById('form-edit-user');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuarioId = document.getElementById('edit-user-id').value;
        const novaSenha = document.getElementById('edit-user-password').value;
        const confirmarSenha = document.getElementById('edit-user-confirm-password').value;

        // Validação de senha
        if (novaSenha || confirmarSenha) {
            if (novaSenha !== confirmarSenha) {
                alert("❌ As senhas não coincidem. Por favor, verifique.");
                return;
            }

            if (novaSenha.length < 6) {
                alert("❌ A senha deve ter pelo menos 6 caracteres.");
                return;
            }
        }

        const dadosAtualizados = {
            nome: document.getElementById('edit-user-name').value,
            email: document.getElementById('edit-user-email').value,
            perfil: document.getElementById('edit-user-profile').value
        };

        // Adiciona a senha apenas se foi preenchida
        if (novaSenha) {
            dadosAtualizados.password = novaSenha;
        }

        try {
            // Enviar para o backend
            const resposta = await axios.put(`http://localhost:3000/usuarios/${usuarioId}`, dadosAtualizados);

            // Atualizar localmente
            usuarios[usuarioId] = { ...usuarios[usuarioId], ...dadosAtualizados };
            atualizarTabelaUsuarios();

            console.log("✅ Usuário atualizado:", resposta.data);
            alert("✅ Usuário atualizado com sucesso!");

            // Limpar campos de senha
            document.getElementById('edit-user-password').value = '';
            document.getElementById('edit-user-confirm-password').value = '';

            fecharModal('modal-edit-user');
        } catch (erro) {
            console.error("❌ Erro ao atualizar usuário:", erro);

            let mensagemErro = "Erro ao atualizar usuário.";
            if (erro.response) {
                switch (erro.response.status) {
                    case 400:
                        mensagemErro = "Dados inválidos. Verifique as informações.";
                        break;
                    case 404:
                        mensagemErro = "Usuário não encontrado.";
                        break;
                    case 500:
                        mensagemErro = "Erro interno do servidor.";
                        break;
                }
            }
            alert(mensagemErro);
        }
    });
};



document.addEventListener('DOMContentLoaded', async () => {

    // ======================= MODAIS =======================

    await carregarMateriais()

    // ===== Modais simples =====
    const modais = document.querySelectorAll('.modal-overlay');
    modais.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(modal.id); });
        modal.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => fecharModal(btn.dataset.close));
        });
        setupFormEditUsuario();
    });


    // Fechar todos modais com ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay[aria-hidden="false"]').forEach(m => fecharModal(m.id));
        }
    });

    // ===== Seleção de unidade "Outro" =====
    const setupUnitSelect = (selectId, customGroupId, customInputId) => {
        const select = document.getElementById(selectId);
        const customGroup = document.getElementById(customGroupId);
        const customInput = document.getElementById(customInputId);

        if (select && customGroup && customInput) {
            select.addEventListener('change', () => {
                if (select.value === 'outro') {
                    customGroup.style.display = 'block';
                    customInput.setAttribute('required', 'required');
                } else {
                    customGroup.style.display = 'none';
                    customInput.removeAttribute('required');
                    customInput.value = '';
                }
            });

            // Inicializar estado
            if (select.value !== 'outro') {
                customGroup.style.display = 'none';
                customInput.removeAttribute('required');
            }
        }
        // Configurar formulários de edição
        setupFormEditUsuario();
        setupFormEditMaterial();
    };
    setupUnitSelect('material-unit', 'custom-unit-group', 'custom-unit-text');
    setupUnitSelect('edit-material-unit', 'custom-edit-unit-group', 'custom-edit-unit-text');

    // ================== FORMULÁRIOS ==================

    // --- Novo Material ---
    const formNewMaterial = document.getElementById('form-new-material');
    if (formNewMaterial) {
        formNewMaterial.addEventListener('submit', e => {
            e.preventDefault();
            console.log("Novo Material cadastrado com sucesso!");
            formNewMaterial.reset();
            fecharModal('modal-new-material');
        });
    }

    // ================== MODAIS DE EDIÇÃO DADOS ==================

    // ================== FORMULÁRIOS DE EDIÇÃO ==================
    const setupFormEdit = (formId, dataObj, updateRowCallback) => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', e => {
            e.preventDefault();
            const id = form.querySelector('[id$="-id"]').value;
            const fields = Array.from(form.querySelectorAll('[id^="edit-"]')).filter(f => !f.id.endsWith('-id') && !f.id.endsWith('-title'));

            fields.forEach(f => {
                const key = f.id.replace(/edit-[^-]+-?/, '');
                dataObj[id][key] = f.value;
            });

            updateRowCallback && updateRowCallback(id, dataObj[id]);
            console.log(`${formId} atualizado com sucesso!`);
            fecharModal(form.closest('.modal-overlay').id);
        });
    };


    // --- Editar Material ---
    const formEditMaterial = document.getElementById('form-edit-material')
    if (formEditMaterial) {
        formEditMaterial.addEventListener('submit', async (e) => {
            e.preventDefault()

            const materialId = document.getElementById('edit-material-id').value
            const dadosAtualizados = {
                item: document.getElementById('edit-material-name').value,
                quantidade: parseInt(document.getElementById('edit-material-quantity').value),
                unidade: document.getElementById('edit-material-unit').value === 'outro'
                    ? document.getElementById('custom-edit-unit-text').value
                    : document.getElementById('edit-material-unit').value
            }

            try {
                const resposta = await axios.put(`http://localhost:3000/materiais/${materialId}`, dadosAtualizados)

                materiais[materialId] = { ...materiais[materialId], ...dadosAtualizados }

                const row = document.querySelector(`tr[data-material-id="${materialId}"]`)
                if (row) {
                    row.querySelector('.material-item-name').textContent = dadosAtualizados.item
                    row.querySelector('.material-quantity').textContent = dadosAtualizados.quantidade
                    row.querySelector('.material-unit').textContent = dadosAtualizados.unidade
                }

                exibirAlerta('.alert-modal-edit-material', "Material atualizado com sucesso!!!", ['show', 'alert-success'], ['d-none'], 2000)

                setTimeout(() => {
                    fecharModal('modal-edit-material')
                }, 2000)

            } catch (erro) {
                console.error("Erro ao atualizar material:", erro)
                exibirAlerta('.alert-modal-edit-material', "Erro ao atualizar material.", ['show', 'alert-danger'], ['d-none'], 2000)
            }
        })
    }

    // Confirmação Editar Material
    const modalConfirm = document.getElementById('modal-confirm')
    const confirmMessage = document.getElementById('confirm-message')
    let currentAction = null
    let currentActionParams = null

    const showConfirm = (msg, action, params = null) => {
        confirmMessage.textContent = msg
        currentAction = action
        currentActionParams = params
        abrirModal('modal-confirm')
    }

    document.getElementById('btn-confirm-yes')?.addEventListener('click', async () => {
        if (currentAction) {
            fecharModal('modal-confirm')
            await currentAction(currentActionParams)
        }
    })

    document.getElementById('btn-confirm-no')?.addEventListener('click', () => fecharModal('modal-confirm'))

    modalConfirm?.addEventListener('click', e => {
        if (e.target === modalConfirm) fecharModal('modal-confirm')
    })
    // Eventos de tabela Materiais
    document.getElementById('material-table-body')?.addEventListener('click', e => {
        const btn = e.target.closest('button')
        if (!btn) return
        const id = btn.dataset.materialId

        if (btn.classList.contains('btn-edit-material')) abrirModalEdicaoMaterial(id)
        if (btn.classList.contains('btn-remove-material')) {
            showConfirm(`Deseja remover o material "${materiais[id].item}"?`, async () => {
                try {
                    const resposta = await axios.delete(`http://localhost:3000/materiais/${id}`)

                    delete materiais[id]

                    document.querySelector(`tr[data-material-id="${id}"]`)?.remove()

                    atualizarEstatisticasMateriais()

                    console.log(`Material "${materiais[id]?.item || id}" removido com sucesso.`)

                    exibirAlerta('.alert-modal-novo-material', "Material removido com sucesso!", ['show', 'alert-success'], ['d-none'], 2000)

                } catch (error) {
                    console.error('Erro ao remover material:', error)

                    let mensagemErro = "Erro ao remover material"
                    if (error.response?.status === 404) {
                        mensagemErro = "Material não encontrado"
                    } else if (error.response?.data?.error) {
                        mensagemErro = error.response.data.error
                    }

                    exibirAlerta('.alert-modal-novo-material', mensagemErro, ['show', 'alert-danger'], ['d-none'], 3000)
                }
            })
        }
    })

    // LÓGICA GERAL DE MODAIS (Aprovar Agendamento e Adicionar Material)

    // A. Modal "Aprovar Agendamento"



    // B. Modal "Novo Material"



    // Unidade personalizada no novo material

    // BOTÃO "VER HISTÓRICO"

    const btnVerHistorico = document.getElementById("btn-view-reports");
    const tabHistorico = document.querySelector('.tab[data-tab="historico"]');

    if (btnVerHistorico && tabHistorico) {
        btnVerHistorico.addEventListener("click", () => {
            tabHistorico.click(); // Abre a aba Histórico
        });
    }


});

