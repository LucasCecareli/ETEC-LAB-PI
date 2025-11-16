// dados de agendamento (simulados)
const agendamentos = {
    'a1': {
        id: 'a1',
        data: '2025-11-05',
        horario: '09:00 - 11:00',
        dataAgendamento: '2025-10-29',
        solicitante: 'Prof. Ricardo Alves',
        email: 'ricardo.alves@etec.edu.br',
        status: 'Pendente', 
        turma: '3º Química B',
        materiais: ['Erlenmeyer 250ml', 'Provetas', 'Solução de AgNO₃']
    },
    'a2': {
        id: 'a2',
        data: '2025-11-05',
        horario: '13:00 - 15:00',
        dataAgendamento: '2025-10-30',
        solicitante: 'Profª. Laura Mendes',
        email: 'laura.mendes@etec.edu.br',
        status: 'Pendente',
        turma: 'Técnicos',
        materiais: ['Luvas de Segurança', 'Óculos de Proteção']
    },
    'a3': {
        id: 'a3',
        data: '2025-11-07',
        horario: '08:00 - 10:00',
        dataAgendamento: '2025-10-30',
        solicitante: 'Téc. Fernando',
        email: 'fernando@etec.edu.br',
        status: 'Pendente',
        turma: 'Técnicos',
        materiais: ['Luvas de Segurança', 'Óculos de Proteção']
    }
}

// logica de tabs
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

// botao ver historico
document.addEventListener("DOMContentLoaded", () => {
    const btnVerHistorico = document.getElementById("btn-view-reports");
    const tabHistorico = document.querySelector('.tab[data-tab="historico"]');

    if (btnVerHistorico && tabHistorico) {
        btnVerHistorico.addEventListener("click", () => {
            tabHistorico.click(); 
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {

    const fecharModalGenerico = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    };
    const abrirModalGenerico = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    };
})

// logica dos modais

const btnAbrirModalAprovar = document.getElementById('btn-aprovar-agendamento');
const modalAprovar = document.getElementById('modal-approve-agendamento');

if (btnAbrirModalAprovar && modalAprovar) {
    btnAbrirModalAprovar.addEventListener('click', () => {
        abrirModalGenerico('modal-approve-agendamento');

        renderizarCardsPendentes();
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

// Unidade personalizada no novo material
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
        console.log(`Novo Material cadastrado com sucesso!`);
        formNewMaterial.reset();
        fecharModalGenerico('modal-new-material');
    });
}

// LÓGICA DE MATERIAIS 

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

const abrirModalEdicaoMaterial = (materialId) => {
    const materialData = materiais[materialId];
    if (materialData && modalEditMaterial) {
        document.getElementById('edit-material-id').value = materialId;
        document.getElementById('edit-material-name').value = materialData.item;
        document.getElementById('edit-material-quantity').value = materialData.quantidade;
        if (document.getElementById('edit-material-unit').querySelector(`option[value="${materialData.unidade}"]`)) {
            document.getElementById('edit-material-unit').value = materialData.unidade;
            customEditUnitGroup.style.display = 'none';
            customEditUnitText.removeAttribute('required');
        } else {
            document.getElementById('edit-material-unit').value = 'outro';
            customEditUnitText.value = materialData.unidade;
            customEditUnitGroup.style.display = 'block';
            customEditUnitText.setAttribute('required', 'required');
        }
        abrirModalGenerico('modal-edit-material');
    }
};

if (formEditMaterial) {
    formEditMaterial.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = document.getElementById('edit-material-id').value;
        const nome = document.getElementById('edit-material-name').value;
        const quantidade = document.getElementById('edit-material-quantity').value;
        let unidadeFinal;
        const unidadeSelecionada = selectEditUnit.value;
        if (unidadeSelecionada === 'outro') {
            unidadeFinal = customEditUnitText.value;
        } else {
            unidadeFinal = unidadeSelecionada;
        }
        materiais[id].item = nome;
        materiais[id].quantidade = parseInt(quantidade);
        materiais[id].unidade = unidadeFinal;
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

// Modal confirmar remoção 
const modalConfirm = document.getElementById('modal-confirm');
const confirmMessage = document.getElementById('confirm-message');
const btnConfirmYes = document.getElementById('btn-confirm-yes');
const btnConfirmNo = document.getElementById('btn-confirm-no');
let currentRemovalAction = null;
const showConfirmModal = (message, onConfirm) => {
    confirmMessage.textContent = message;
    currentRemovalAction = onConfirm;
    abrirModalGenerico('modal-confirm');
};
if (btnConfirmYes) {
    btnConfirmYes.addEventListener('click', () => {
        if (currentRemovalAction) currentRemovalAction();
        fecharModalGenerico('modal-confirm');
    });
}
if (btnConfirmNo) {
    btnConfirmNo.addEventListener('click', () => fecharModalGenerico('modal-confirm'));
}
if (modalConfirm) {
    modalConfirm.addEventListener('click', (event) => {
        if (event.target === modalConfirm) fecharModalGenerico('modal-confirm');
    });
}

// Material table events
const materialTableBody = document.getElementById('material-table-body');
if (materialTableBody) {
    materialTableBody.addEventListener('click', (event) => {
        if (event.target.closest('.btn-edit-material')) {
            const materialId = event.target.closest('button').getAttribute('data-material-id');
            abrirModalEdicaoMaterial(materialId);
        }
        if (event.target.closest('.btn-remove-material')) {
            const materialId = event.target.closest('button').getAttribute('data-material-id');
            const materialName = materiais[materialId].item;
            showConfirmModal(`Tem certeza que deseja remover o material "${materialName}"?`, () => {
                delete materiais[materialId];
                const rowToRemove = document.querySelector(`tr[data-material-id="${materialId}"]`);
                if (rowToRemove) rowToRemove.remove();
                console.log(`Material "${materialName}" removido.`);
            });
        }
    });
}


// logica de agendamentos 
// dados simulados
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
    (opcional); agendamentosHoje.textContent = data.length;
}
// botoes de ação dos cards
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


// modal detalhes
const modalAppointmentDetails = document.getElementById('modal-appointment-details');
const detNome = document.getElementById('det-nome');
const detEmail = document.getElementById('det-email');
const detLab = document.getElementById('det-lab');
const detDataHora = document.getElementById('det-datahora');
const detFinalidade = document.getElementById('det-finalidade');
const detObs = document.getElementById('det-observacoes');
const btnModalApprove = document.getElementById('btn-modal-approve');

let currentAppointmentInModal = null;

const openAppointmentDetails = (id) => {
    const ap = agendamentos[id];
    if (!ap) return;
    currentAppointmentInModal = id;
    document.getElementById('appointment-details-title').textContent = `Agendamento — ${ap.solicitante}`;
    detNome.textContent = ap.solicitante;
    detEmail.textContent = ap.email;
    detLab.textContent = ap.laboratorio;
    detDataHora.textContent = `${ap.data} · ${ap.horario}`;
    detFinalidade.textContent = ap.finalidade;
    detObs.textContent = ap.observacoes || '-';
    abrirModalGenerico('modal-appointment-details');
};

if (btnModalApprove) {
    btnModalApprove.addEventListener('click', () => {
        if (!currentAppointmentInModal) return;
        const id = currentAppointmentInModal;
        showConfirmModal(`Aprovar o agendamento de "${agendamentos[id].solicitante}"?`, () => {
            agendamentos[id].status = 'Aprovado';
            updateAppointmentRow(id);
            fecharModalGenerico('modal-appointment-details');
        });
    });
}

// fechar modal detalhes clicando no overlay / botão close
const closeButtons = document.querySelectorAll('[data-close="modal-appointment-details"], #modal-appointment-details .close-modal');
closeButtons.forEach(btn => btn.addEventListener('click', () => fecharModalGenerico('modal-appointment-details')));

// filtros (pesquisar e filtrar por lab)
if (searchInput) {
    searchInput.addEventListener('input', () => {
        renderAppointments({ q: searchInput.value, lab: filterLab ? filterLab.value : '' });
    });
}
if (filterLab) {
    filterLab.addEventListener('change', () => {
        renderAppointments({ q: searchInput ? searchInput.value : '', lab: filterLab.value });
    });
}

// fechar modais com botões

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-close');
        if (target) fecharModalGenerico(target);
    });
});

// Fechar ao clicar fora em modals genéricos
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModalGenerico(modal.id);
        }
    });
});

// Funcionalidade para a tela de histórico
document.addEventListener('DOMContentLoaded', function () {
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

    // Botão "Ver Detalhes"
    const viewDetailsButtons = document.querySelectorAll('.btn-view-details');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function () {
            const historyItem = this.closest('.history-item');
            const teacherName = historyItem.querySelector('.teacher-info h3').textContent;
            const className = historyItem.querySelector('.class-info').textContent;
            const date = historyItem.querySelector('.date-time strong').textContent.replace('Data do Agendamento: ', '');
            const time = historyItem.querySelector('.time-slot span').textContent;

            alert(`Detalhes do Agendamento:\n\nProfessor: ${teacherName}\nTurma: ${className}\nData: ${date}\nHorário: ${time}`);
        });
    });
});

// Simulação de dados 
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

function toggleSelecionado(card) {
    const id = parseInt(card.dataset.id);
    const index = selectedCards.indexOf(id);
    if (index >= 0) {
        selectedCards.splice(index, 1);
        card.classList.remove('selected');
    } else {
        selectedCards.push(id);
        card.classList.add('selected');
    }
    approveSelectedBtn.disabled = selectedCards.length === 0;
}

function aprovarAgendamento(id) {
    mostrarToast();
    setTimeout(() => {
        const index = agendamentosPendentes.findIndex(a => a.id === id);
        if (index >= 0) {
            agendamentosPendentes.splice(index, 1);
            carregarAgendamentos();
        }
    }, 1000);
}

approveSelectedBtn.addEventListener('click', () => {
    selectedCards.forEach(id => aprovarAgendamento(id));
    selectedCards = [];
    multipleSelectMode = false;
    selectMultipleBtn.textContent = 'Selecionar múltiplos';
    approveSelectedBtn.disabled = true;
});

selectMultipleBtn.addEventListener('click', () => {
    multipleSelectMode = !multipleSelectMode;
    selectMultipleBtn.textContent = multipleSelectMode ? 'Cancelar seleção' : 'Selecionar múltiplos';
    selectedCards = [];
    approveSelectedBtn.disabled = true;
});

function mostrarToast() {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Abertura e fechamento do modal
btnApprove.addEventListener('click', () => {
    modalApprove.style.display = 'block';
    carregarAgendamentos();
});

closeApprove.addEventListener('click', () => {
    modalApprove.style.display = 'none';
});

