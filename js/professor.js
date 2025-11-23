document.addEventListener('DOMContentLoaded', function () {
    // Sobrescrever a função problemática com uma versão segura
    if (typeof window.mudaTamanho === 'function') {
        // Guardar a função original
        const originalMudaTamanho = window.mudaTamanho;

        // Substituir por uma versão segura
        window.mudaTamanho = function (elemento, incremento) {
            const elementoAlvo = document.querySelector(elemento);
            if (!elementoAlvo) {
                console.warn('Elemento não encontrado:', elemento);
                return;
            }

            // Chamar a função original se o elemento existir
            return originalMudaTamanho.call(this, elemento, incremento);
        };

        console.log('✅ Função mudaTamanho corrigida com sucesso!');
    } else {
        console.warn('⚠️ Função mudaTamanho não encontrada');
    }
});

const API_BASE_URL = 'http://localhost:3000';

// Recuperar usuário do localStorage
let usuarioLogado = JSON.parse(localStorage.getItem('user'));

// Verificar se está logado e é professor
if (!usuarioLogado || usuarioLogado.perfil !== 'Professor') {
    window.location.href = 'index.html';
    throw new Error('Acesso não autorizado');
}

console.log('👤 Professor logado:', usuarioLogado);

// Função para fazer requisições à API
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            // Tenta obter mais detalhes do erro
            let errorDetails = '';
            try {
                const errorData = await response.json();
                errorDetails = errorData.error || errorData.message || '';
            } catch (e) {
                // Se não conseguir parsear JSON, usa o texto da resposta
                errorDetails = await response.text();
            }

            throw new Error(`Erro ${response.status}: ${response.statusText}. ${errorDetails}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Erro na requisição API:', error);
        console.error('🔍 Endpoint:', endpoint);
        console.error('📦 Options:', options);
        throw error;
    }
}

// Funções específicas para Kits
const kitAPI = {
    // Criar kit
    criarKit: (kitData) => apiRequest('/kits', {
        method: 'POST',
        body: JSON.stringify(kitData)
    }),

    // Listar kits do professor
    listarKitsProfessor: (professorId) => apiRequest(`/kits/professor/${professorId}`),

    // Listar todos os kits (para seleção)
    listarKits: () => apiRequest('/kits'),

    // Editar kit
    editarKit: (id, dados) => apiRequest(`/kits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
    }),

    // Deletar kit
    deletarKit: (id) => apiRequest(`/kits/${id}`, {
        method: 'DELETE'
    })
};

// Funções específicas para Agendamentos
const agendamentoAPI = {
    // Criar agendamento
    criarAgendamento: (agendamentoData) => apiRequest('/agendamentos', {
        method: 'POST',
        body: JSON.stringify(agendamentoData)
    }),

    // Listar agendamentos do professor
    listarAgendamentosProfessor: (professorId) => apiRequest(`/agendamentos/professor/${professorId}`),

    // Editar agendamento
    editarAgendamento: (id, dados) => apiRequest(`/agendamentos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
    }),

    // Cancelar agendamento
    cancelarAgendamento: (id) => apiRequest(`/agendamentos/${id}/cancelar`, {
        method: 'PATCH'
    })
};

// Funções para estatísticas
const estatisticasAPI = {
    getEstatisticasProfessor: (professorId) => apiRequest(`/professor/${professorId}/estatisticas`)
};

// Dados globais
let kitsData = [];
let agendamentosData = [];

document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // 1. LÓGICA DE TROCA DE ABAS
    // =======================================================
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e conteúdos
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Adiciona a classe 'active' ao botão clicado
            tab.classList.add('active');

            // Exibe o conteúdo correspondente
            const targetId = tab.dataset.tab;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // =======================================================
    // 2. LÓGICA DO MODAL DE NOVO AGENDAMENTO
    // =======================================================
    const appointmentModal = document.getElementById('new-appointment-modal');
    const btnNovoAgendamento = document.getElementById('btn-novo-agendamento');
    const btnCloseAppointmentModal = document.getElementById('close-modal-btn');
    const btnCancelAppointmentModal = document.getElementById('modal-cancel-btn');

    const labSelect = document.getElementById('lab-select');
    const timeSelectContainer = document.getElementById('time-select-container');
    const timeLimitMessage = document.getElementById('time-limit-message');
    const btnSchedule = document.getElementById('modal-schedule-btn');
    const calendarContainer = document.getElementById('calendar-container');

    let selectedDate = null;
    const MAX_SCHEDULES = 4;

    // Função para resetar o estado do formulário de agendamento
    const resetAppointmentState = () => {
        labSelect.value = "";
        selectedDate = null;
        timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione uma data e um laboratório.</p>';
        btnSchedule.disabled = true;
        timeLimitMessage.classList.add('hidden');
        // Limpa também o estado dos materiais manuais
        manualMaterials = [];
        if (kitSelect) kitSelect.value = 'Nenhum';
        if (manualSection) manualSection.classList.remove('hidden');
        renderManualMaterials();
    };

    // Função de fechar o modal
    const closeAppointmentModal = () => {
        appointmentModal.style.display = 'none';
        resetAppointmentState();
    };

    // Abre o modal de agendamento
    if (btnNovoAgendamento) {
        btnNovoAgendamento.addEventListener('click', () => {
            appointmentModal.style.display = 'flex';
            resetAppointmentState();
            generateCalendar();
        });
    }

    if (btnCloseAppointmentModal) {
        btnCloseAppointmentModal.addEventListener('click', closeAppointmentModal);
    }
    if (btnCancelAppointmentModal) {
        btnCancelAppointmentModal.addEventListener('click', closeAppointmentModal);
    }

    // Fecha o modal ao clicar no overlay
    appointmentModal.addEventListener('click', (e) => {
        if (e.target === appointmentModal) {
            closeAppointmentModal();
        }
    });

    // =======================================================
    // 3. LÓGICA DO CALENDÁRIO DINÂMICO (Agendamento)
    // =======================================================
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    function generateCalendar() {
        calendarContainer.innerHTML = '';

        let currentDate = new Date();
        let currentMonth = -1;

        selectedDate = null;
        timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione uma data e um laboratório.</p>';

        for (let i = 0; i < 30; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);

            // CORREÇÃO: Garantir que a data seja calculada corretamente
            const dayOfMonth = date.getDate();
            const dayOfWeekIndex = date.getDay();
            const month = date.getMonth();
            const year = date.getFullYear();

            const dayName = daysOfWeek[dayOfWeekIndex];

            // Rastreia a mudança de mês
            if (month !== currentMonth) {
                currentMonth = month;
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('current-month-label');
                monthLabel.textContent = `${monthNames[month]} de ${year}`;
                calendarContainer.appendChild(monthLabel);
            }

            // Cria o elemento do dia
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');

            // Adiciona classe para fim de semana
            if (dayOfWeekIndex === 0 || dayOfWeekIndex === 6) {
                dayElement.classList.add('weekend');
            }

            // Conteúdo do dia
            dayElement.innerHTML = `
            <span class="day-number">${dayOfMonth}</span>
            <span class="day-name">${dayName}</span>
        `;

            // CORREÇÃO: Usar formato de data consistente YYYY-MM-DD
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
            dayElement.dataset.date = formattedDate;

            // Adiciona listener para seleção
            dayElement.addEventListener('click', handleDateSelection);

            calendarContainer.appendChild(dayElement);
        }
    }

    function handleDateSelection(event) {
        // Remove a seleção de todos os dias
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('day-selected');
        });

        const selectedDay = event.currentTarget;

        // Adiciona a classe de seleção ao dia clicado
        selectedDay.classList.add('day-selected');

        // CORREÇÃO: Garantir que a data seja tratada corretamente sem problemas de fuso horário
        const dateString = selectedDay.dataset.date; // Formato YYYY-MM-DD
        const [year, month, day] = dateString.split('-');

        // Criar data no fuso horário local para garantir que seja o dia correto
        const localDate = new Date(year, month - 1, day);
        const formattedDate = localDate.toISOString().split('T')[0]; // Manter formato YYYY-MM-DD

        selectedDate = formattedDate;
        labSelect.value = "";
        timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione um laboratório.</p>';
        btnSchedule.disabled = true;
        timeLimitMessage.classList.add('hidden');

        console.log(`Data selecionada: ${selectedDate} (original: ${dateString})`);
    }

    // =======================================================
    // 4. LÓGICA DE SELEÇÃO DE LABORATÓRIO E HORÁRIO MÚLTIPLO
    // =======================================================
    const availableTimes = [
        '07:10 - 08:00',
        '08:00 - 08:50',
        '08:50 - 09:40',
        '10:00 - 10:50',
        '10:50 - 11:40',
        '11:40 - 12:30',
        '13:00 - 13:50',
        '13:50 - 14:40',
        '14:40 - 15:30',
        '15:50 - 16:40',
        '16:40 - 17:30',
        '17:30 - 18:20',
        '18:50 - 20:45',
        '21:00 - 22:50'
    ];

    labSelect.addEventListener('change', () => {
        if (selectedDate && labSelect.value) {
            renderTimeCheckboxes(availableTimes);
        } else if (selectedDate) {
            timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione um laboratório.</p>';
            btnSchedule.disabled = true;
        }
    });

    function renderTimeCheckboxes(times) {
        timeSelectContainer.innerHTML = '';
        timeLimitMessage.classList.add('hidden');

        times.forEach((time, index) => {
            const itemId = `time-${index}`;
            const checkboxItem = document.createElement('label');
            checkboxItem.classList.add('checkbox-item');
            checkboxItem.setAttribute('for', itemId);

            checkboxItem.innerHTML = `
                <span class="checkbox-label">${time}</span>
                <input type="checkbox" id="${itemId}" value="${time}" data-time="${time}">
            `;


            const checkbox = checkboxItem.querySelector('input');
            checkbox.addEventListener('change', handleTimeSelection);

            timeSelectContainer.appendChild(checkboxItem);
        });


        handleTimeSelection();
    }

    function handleTimeSelection() {
        const timeCheckboxes = document.querySelectorAll('#time-select-container input[type="checkbox"]');
        const selectedTimes = Array.from(timeCheckboxes).filter(cb => cb.checked);
        const selectedCount = selectedTimes.length;

        // Aplica a limitação de 1 a 4
        if (selectedCount >= MAX_SCHEDULES) {
            timeLimitMessage.classList.remove('hidden');
            timeCheckboxes.forEach(cb => {
                const parent = cb.closest('.checkbox-item');
                if (!cb.checked) {
                    cb.disabled = true;
                    parent.classList.add('disabled-limit');
                }
            });
        } else {
            timeLimitMessage.classList.add('hidden');
            timeCheckboxes.forEach(cb => {
                const parent = cb.closest('.checkbox-item');
                cb.disabled = false;
                parent.classList.remove('disabled-limit');
            });
        }

        // Atualiza a classe visual dos itens
        timeCheckboxes.forEach(cb => {
            const parent = cb.closest('.checkbox-item');
            if (cb.checked) {
                parent.classList.add('selected');
            } else {
                parent.classList.remove('selected');
            }
        });

        // Habilita o botão Agendar
        if (selectedDate && labSelect.value && selectedCount >= 1 && selectedCount <= MAX_SCHEDULES) {
            btnSchedule.disabled = false;
        } else {
            btnSchedule.disabled = true;
        }
    }

    btnSchedule.addEventListener('click', async () => {
        const selectedTimes = Array.from(
            document.querySelectorAll('#time-select-container input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        const selectedKit = document.getElementById('kit-select').value;
        let kitId = null;
        let kitNome = null;
        let materiaisManuais = [];

        if (selectedKit === 'Nenhum') {
            materiaisManuais = manualMaterials
                .filter(mat => mat.name.trim() !== '' && mat.quantity >= 1)
                .map(mat => ({
                    nome: mat.name.trim(),
                    quantidade: mat.quantity,
                    unidade: 'unidade'
                }));
        } else {
            const kitSelecionado = kitsData.find(kit => kit.nome === selectedKit);
            if (kitSelecionado) {
                kitId = kitSelecionado._id;
                kitNome = kitSelecionado.nome;
            }
        }

        if (selectedTimes.length === 0 || selectedTimes.length > MAX_SCHEDULES) {
            showNotification("Selecione entre 1 e 4 horários.", "error");
            return;
        }

        // CORREÇÃO: Garantir que a data seja válida
        if (!selectedDate) {
            showNotification("Por favor, selecione uma data válida.", "error");
            return;
        }

        const agendamentoData = {
            data: selectedDate,
            laboratorio: labSelect.value,
            horarios: selectedTimes,
            professorId: usuarioLogado.id,
            professorNome: usuarioLogado.nome,
            kitId: kitId,
            kitNome: kitNome,
            materiaisManuais: materiaisManuais
        };

        console.log('📤 Dados do agendamento a serem enviados:', agendamentoData);

        try {
            const response = await agendamentoAPI.criarAgendamento(agendamentoData);

            if (response.success) {
                showNotification(`Agendamento criado com sucesso para ${agendamentoData.data}!`, 'success');
                closeAppointmentModal();
                await carregarAgendamentosDoProfessor();
            }

        } catch (error) {
            console.error('Erro detalhado ao criar agendamento:', error);

            // CORREÇÃO: Mensagem mais específica para conflitos
            if (error.message.includes('409')) {
                showNotification('Conflito de agendamento: algum dos horários já está reservado. Por favor, escolha outros horários.', 'error');
            } else {
                showNotification('Erro ao criar agendamento. Tente novamente.', 'error');
            }
        }
    });

    // =======================================================
    // 5. LÓGICA DO MODAL DE CRIAÇÃO DE KIT
    // =======================================================
    const kitModal = document.getElementById('new-kit-modal');
    const btnCreateKitDashboard = document.getElementById('btn-create-kit-dashboard');
    const btnCreateKitKits = document.getElementById('btn-create-kit-kits');
    const btnCloseKitModal = document.getElementById('close-kit-modal-btn');
    const btnCancelKitModal = document.getElementById('kit-modal-cancel-btn');
    const btnAddKitItem = document.getElementById('add-kit-item-btn');
    const kitItemsContainer = document.getElementById('kit-items-container');
    const kitForm = document.getElementById('kit-form');
    const btnSaveKit = document.getElementById('kit-modal-save-btn');
    const kitNameInput = document.getElementById('kit-name');
    const kitDescriptionInput = document.getElementById('kit-description');

    let kitItems = [];

    // Funções de Abertura/Fechamento
    const openKitModal = () => {
        kitModal.style.display = 'flex';
        kitItems = [];
        kitForm.reset();
        addNewKitItem();
        checkKitFormValidity();
    };

    const closeKitModal = () => {
        kitModal.style.display = 'none';
        kitItems = [];
        kitForm.reset();
        renderKitItems();
    };

    if (btnCreateKitDashboard) {
        btnCreateKitDashboard.addEventListener('click', openKitModal);
    }
    if (btnCreateKitKits) {
        btnCreateKitKits.addEventListener('click', openKitModal);
    }
    if (btnCloseKitModal) {
        btnCloseKitModal.addEventListener('click', closeKitModal);
    }
    if (btnCancelKitModal) {
        btnCancelKitModal.addEventListener('click', closeKitModal);
    }
    kitModal.addEventListener('click', (e) => {
        if (e.target === kitModal) {
            closeKitModal();
        }
    });

    // Lógica de Itens Dinâmicos
    function renderKitItems() {
        kitItemsContainer.innerHTML = '';

        if (kitItems.length === 0) {
            kitItemsContainer.innerHTML = '<p class="input-helper" style="color:var(--muted); text-align:center;">Adicione o primeiro material para começar.</p>';
            checkKitFormValidity();
            return;
        }

        kitItems.forEach((item) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('kit-item-row');
            itemElement.dataset.id = item.id;

            itemElement.innerHTML = `
                <div class="kit-item-name">
                    <input type="text" data-field="name" value="${item.name}" placeholder="Nome do Material (Ex: Béquer 50ml)" required>
                </div>
                <div class="kit-item-qty">
                    <input type="number" data-field="quantity" value="${item.quantity}" min="1" required>
                </div>
                <div class="kit-item-unit">
                    <select data-field="unit">
                        <option value="unidade" ${item.unit === 'unidade' ? 'selected' : ''}>Unidade</option>
                        <option value="ml" ${item.unit === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>Gramas (g)</option>
                        <option value="caixa" ${item.unit === 'caixa' ? 'selected' : ''}>Caixa</option>
                        <option value="kit" ${item.unit === 'kit' ? 'selected' : ''}>Kit</option>
                    </select>
                </div>
                <button type="button" class="btn btn-danger btn-delete-item" data-id="${item.id}" aria-label="Remover item">🗑️</button>
            `;

            itemElement.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', updateKitItem);
            });

            kitItemsContainer.appendChild(itemElement);
        });

        kitItemsContainer.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', deleteKitItem);
            if (kitItems.length === 1) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });

        checkKitFormValidity();
    }

    function addNewKitItem() {
        const newItem = {
            id: Date.now(),
            name: '',
            quantity: 1,
            unit: 'unidade'
        };
        kitItems.push(newItem);
        renderKitItems();
    }

    function updateKitItem(event) {
        const target = event.target;
        const itemId = parseInt(target.closest('.kit-item-row').dataset.id);
        const field = target.dataset.field;
        let value = target.value;

        const itemIndex = kitItems.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            if (field === 'quantity') {
                value = parseInt(value) || 1;
                if (value < 1) value = 1;
            }
            kitItems[itemIndex][field] = value;
        }

        checkKitFormValidity();
    }

    function deleteKitItem(event) {
        const itemId = parseInt(event.currentTarget.dataset.id);
        if (kitItems.length > 1) {
            kitItems = kitItems.filter(item => item.id !== itemId);
            renderKitItems();
        }
    }

    btnAddKitItem.addEventListener('click', addNewKitItem);

    // Lógica de Validação e Envio (Kit)
    function checkKitFormValidity() {
        const isNameValid = kitNameInput.value.trim().length > 0;
        const isDescriptionValid = kitDescriptionInput.value.trim().length > 0;

        const validItems = kitItems.filter(item => item.name.trim() !== '' && item.quantity >= 1);
        const hasValidItem = validItems.length >= 1;

        const isFormValid = isNameValid && isDescriptionValid && hasValidItem;
        btnSaveKit.disabled = !isFormValid;
    }

    kitNameInput.addEventListener('input', checkKitFormValidity);
    kitDescriptionInput.addEventListener('input', checkKitFormValidity);

    kitForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const kitData = {
            nome: kitNameInput.value.trim(),
            descricao: kitDescriptionInput.value.trim(),
            professorId: usuarioLogado.id,
            professorNome: usuarioLogado.nome,
            materiais: kitItems
                .filter(item => item.name.trim() !== '' && item.quantity >= 1)
                .map(item => ({
                    nome: item.name.trim(),
                    quantidade: item.quantity,
                    unidade: item.unit
                }))
        };

        if (kitData.materiais.length === 0) {
            showNotification('O kit deve ter pelo menos um item válido.', 'error');
            return;
        }

        try {
            const response = await kitAPI.criarKit(kitData);
            showNotification(`Kit "${kitData.nome}" criado com sucesso!`, 'success');
            closeKitModal();

            await carregarKitsDoProfessor();

        } catch (error) {
            showNotification('Erro ao criar kit. Tente novamente.', 'error');
            console.error('Erro ao criar kit:', error);
        }
    });

    renderKitItems();

    // =======================================================
    // 6. LÓGICA DE ADIÇÃO MANUAL DE MATERIAIS
    // =======================================================
    const kitSelect = document.getElementById('kit-select');
    const manualSection = document.getElementById('manual-materials-section');
    const addMaterialBtn = document.getElementById('add-material-btn');
    const materialsContainer = document.getElementById('manual-materials-container');

    let manualMaterials = [];

    if (kitSelect) {
        kitSelect.addEventListener('change', () => {
            if (kitSelect.value === 'Nenhum') {
                manualSection.classList.remove('hidden');
            } else {
                manualSection.classList.add('hidden');
                manualMaterials = [];
                renderManualMaterials();
            }
        });
    }

    function renderManualMaterials() {
        materialsContainer.innerHTML = '';

        if (manualMaterials.length === 0) {
            materialsContainer.innerHTML = `
            <p class="input-helper">Nenhum material adicionado ainda.</p>
        `;
            return;
        }

        manualMaterials.forEach((mat) => {
            const row = document.createElement('div');
            row.classList.add('manual-item-row');
            row.dataset.id = mat.id;

            row.innerHTML = `
            <input type="text" data-field="name" placeholder="Nome do material" value="${mat.name}" required>
            <input type="number" data-field="quantity" min="1" value="${mat.quantity}" required>
            <button type="button" class="btn-remove-material" aria-label="Remover material">🗑️</button>
        `;

            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const field = e.target.dataset.field;
                    const value = e.target.value;
                    const index = manualMaterials.findIndex(m => m.id === mat.id);
                    if (index > -1) {
                        manualMaterials[index][field] = field === 'quantity' ? Math.max(1, parseInt(value) || 1) : value;
                    }
                });
            });

            row.querySelector('.btn-remove-material').addEventListener('click', () => {
                manualMaterials = manualMaterials.filter(m => m.id !== mat.id);
                renderManualMaterials();
            });

            materialsContainer.appendChild(row);
        });
    }

    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', () => {
            const newMaterial = {
                id: Date.now(),
                name: '',
                quantity: 1
            };
            manualMaterials.push(newMaterial);
            renderManualMaterials();
        });
    }

    // =======================================================
    // 7. LÓGICA DOS BOTÕES VER, EDITAR E REMOVER KITS (ATUALIZADO)
    // =======================================================

    // Modais
    const viewKitModal = document.getElementById('view-kit-modal');
    const editKitModal = document.getElementById('edit-kit-modal');

    // Função para formatar materiais para exibição
    function formatMaterialsForDisplay(materials) {
        return materials.map(material =>
            `${material.nome} (${material.quantidade} ${material.unidade})`
        ).join(', ');
    }

    // Função para formatar status para exibição
    function formatStatusForDisplay(status) {
        const statusMap = {
            'ativo': 'Ativo',
            'rascunho': 'Rascunho',
            'arquivado': 'Arquivado'
        };
        return statusMap[status] || status;
    }

    // =======================================================
    // 7.1 FUNCIONALIDADE VER KIT (ATUALIZADO)
    // =======================================================

    function setupViewKitButtons() {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('.kit-actions-compact .btn-light');
            if (!target) return;

            if (target.textContent.includes('👁️')) {
                const row = e.target.closest('tr');
                if (!row) return;

                const kitNameCell = row.querySelector('td[data-label="Nome do Kit"]');
                if (!kitNameCell) return;

                const kitName = kitNameCell.textContent;

                // Encontrar o kit nos dados
                const kit = kitsData.find(k => k.nome === kitName);
                if (kit) {
                    openViewKitModal(kit);
                }
            }
        });
    }

    function openViewKitModal(kit) {
        // Preencher os dados no modal
        document.getElementById('view-kit-name').textContent = kit.nome;
        document.getElementById('view-kit-description').textContent = kit.descricao;
        document.getElementById('view-kit-items-count').textContent = `${kit.materiais ? kit.materiais.length : 0} itens`;
        document.getElementById('view-kit-uses').textContent = kit.usos || 0;
        document.getElementById('view-kit-status').textContent = formatStatusForDisplay(kit.status);
        document.getElementById('view-kit-date').textContent = new Date(kit.dataCriacao).toLocaleDateString('pt-BR');

        // Preencher materiais
        const materialsContainer = document.getElementById('view-kit-materials');
        materialsContainer.innerHTML = '';

        if (kit.materiais && kit.materiais.length > 0) {
            kit.materiais.forEach(material => {
                const materialElement = document.createElement('div');
                materialElement.className = 'material-item';
                materialElement.textContent = `${material.nome} (${material.quantidade} ${material.unidade})`;
                materialsContainer.appendChild(materialElement);
            });
        } else {
            materialsContainer.innerHTML = '<p class="input-helper">Nenhum material cadastrado.</p>';
        }

        // Mostrar o modal
        viewKitModal.classList.remove('hidden');
    }

    // =======================================================
    // 7.2 FUNCIONALIDADE EDITAR KIT (ATUALIZADO)
    // =======================================================

    function setupEditKitButtons() {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('.kit-actions-compact .btn-light');
            if (!target) return;

            if (target.textContent.includes('✏️')) {
                const row = e.target.closest('tr');
                if (!row) return;

                const kitNameCell = row.querySelector('td[data-label="Nome do Kit"]');
                if (!kitNameCell) return;

                const kitName = kitNameCell.textContent;

                // Encontrar o kit nos dados
                const kit = kitsData.find(k => k.nome === kitName);
                if (kit) {
                    openEditKitModal(kit);
                }
            }
        });
    }

    function openEditKitModal(kit) {
        // Preencher os dados no formulário de edição
        document.getElementById('edit-kit-name').value = kit.nome;
        document.getElementById('edit-kit-description').value = kit.descricao;
        document.getElementById('edit-kit-status').value = kit.status;

        // Armazenar o ID do kit para referência
        document.getElementById('edit-kit-form').dataset.kitId = kit._id;

        // Mostrar o modal
        editKitModal.classList.remove('hidden');
    }

    // Salvar edição do kit
    document.getElementById('save-edit-kit').addEventListener('click', async function () {
        const kitId = document.getElementById('edit-kit-form').dataset.kitId;
        const kitName = document.getElementById('edit-kit-name').value;
        const kitDescription = document.getElementById('edit-kit-description').value;
        const kitStatus = document.getElementById('edit-kit-status').value;

        if (!kitName || !kitDescription) {
            showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }

        try {
            const dadosAtualizados = {
                nome: kitName,
                descricao: kitDescription,
                status: kitStatus
            };

            const response = await kitAPI.editarKit(kitId, dadosAtualizados);

            if (response.success) {
                showNotification('Kit atualizado com sucesso!', 'success');
                editKitModal.classList.add('hidden');

                // Recarregar a lista de kits
                await carregarKitsDoProfessor();
            }

        } catch (error) {
            console.error('Erro ao atualizar kit:', error);
            showNotification('Erro ao atualizar kit. Tente novamente.', 'error');
        }
    });

    // =======================================================
    // 7.3 FUNCIONALIDADE REMOVER KIT (ATUALIZADO)
    // =======================================================

    function setupRemoveKitButtons() {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('.btn-remover');
            if (!target) return;

            const row = e.target.closest('tr');
            if (!row) return;

            const kitNameCell = row.querySelector('td[data-label="Nome do Kit"]');
            if (!kitNameCell) return;

            const kitName = kitNameCell.textContent;

            // Encontrar o kit nos dados
            const kit = kitsData.find(k => k.nome === kitName);
            if (kit) {
                showRemoveKitConfirmation(kit);
            }
        });
    }

    function showRemoveKitConfirmation(kit) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 16px 0; color: var(--text-primary);">Remover Kit</h3>
                <p style="margin: 0 0 24px 0; color: var(--text-secondary);">
                    Tem certeza de que deseja remover o kit "<strong>${kit.nome}</strong>"?
                </p>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn-secondary" style="background: #f2f2f3; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        Não
                    </button>
                    <button class="btn-danger confirm-remove" style="background: #b9080f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Sim, remover
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Configurar botões do modal
        const btnNao = modal.querySelector('.btn-secondary');
        const btnSim = modal.querySelector('.confirm-remove');

        btnNao.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        btnSim.addEventListener('click', async function () {
            try {
                const response = await kitAPI.deletarKit(kit._id);

                if (response.success) {
                    showNotification('Kit removido com sucesso!', 'success');
                    document.body.removeChild(modal);

                    // Recarregar a lista de kits
                    await carregarKitsDoProfessor();
                }
            } catch (error) {
                console.error('Erro ao remover kit:', error);
                showNotification('Erro ao remover kit. Tente novamente.', 'error');
                document.body.removeChild(modal);
            }
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Cancelar edição
    document.getElementById('cancel-edit-kit').addEventListener('click', function () {
        editKitModal.classList.add('hidden');
    });

    // Fechar modais ao clicar fora
    viewKitModal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });

    editKitModal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });

    // =======================================================
    // 8. LÓGICA DOS BOTÕES VER, EDITAR E CANCELAR AGENDAMENTOS (ATUALIZADO)
    // =======================================================

    // Modais de agendamento
    const modalVerAgendamento = document.getElementById("modalVerAgendamento");
    const modalEditarAgendamento = document.getElementById("modalEditarAgendamento");
    const modalCancelarAgendamento = document.getElementById("modalCancelarAgendamento");
    const modalMotivoAgendamento = document.getElementById("modalMotivoAgendamento");

    // Funções para abrir/fechar modais
    function abrirModal(modal) {
        modal.classList.remove("hidden");
    }

    function fecharModal(modal) {
        modal.classList.add("hidden");
    }

    // Fechar modais ao clicar no X
    document.querySelectorAll(".modal .close").forEach(botao => {
        botao.addEventListener("click", function () {
            const modal = this.closest(".modal");
            fecharModal(modal);
        });
    });

    // Fechar modais ao clicar fora
    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                fecharModal(modal);
            }
        });
    });

    // =======================================================
    // 8.1 CONFIGURAÇÃO DOS BOTÕES FECHAR DOS MODAIS DE AGENDAMENTO
    // =======================================================

    function setupBotoesFecharAgendamentos() {
        // Botão Fechar do modal Ver Agendamento
        const btnFecharVer = modalVerAgendamento?.querySelector('.btn-secondary');
        if (btnFecharVer) {
            btnFecharVer.addEventListener('click', function () {
                fecharModal(modalVerAgendamento);
            });
        }

        // Botão Fechar do modal Editar Agendamento  
        const btnFecharEditar = modalEditarAgendamento?.querySelector('.btn-secondary');
        if (btnFecharEditar) {
            btnFecharEditar.addEventListener('click', function () {
                fecharModal(modalEditarAgendamento);
            });
        }

        // Botão Fechar do modal Cancelar Agendamento
        const btnFecharCancelar = modalCancelarAgendamento?.querySelector('.btn-secondary');
        if (btnFecharCancelar) {
            btnFecharCancelar.addEventListener('click', function () {
                fecharModal(modalCancelarAgendamento);
            });
        }

        // Botão Fechar do modal Motivo
        const btnFecharMotivo = modalMotivoAgendamento?.querySelector('.btn-secondary');
        if (btnFecharMotivo) {
            btnFecharMotivo.addEventListener('click', function () {
                fecharModal(modalMotivoAgendamento);
            });
        }
    }

    function setupAgendamentoButtons() {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('.kit-actions-compact button');
            if (!target) return;

            const linha = target.closest('tr');
            if (!linha) return;

            const acao = target.textContent.trim();

            // Pegando dados da linha com verificações de segurança
            const dataHoraCell = linha.cells[0];
            const labCell = linha.cells[1];
            const kitCell = linha.cells[2];
            const statusCell = linha.cells[3];

            if (!dataHoraCell || !labCell || !kitCell || !statusCell) return;

            const dataHora = dataHoraCell.textContent;
            const lab = labCell.textContent;
            const kit = kitCell.textContent;
            const status = statusCell.textContent.trim();

            console.log('🔍 Buscando agendamento:', { dataHora, lab, kit, status });

            // MÉTODO MELHORADO: Encontrar o agendamento nos dados
            let agendamento = null;

            // Tentativa 1: Buscar por data completa e laboratório
            const dataPart = dataHora.split(' (')[0];
            agendamento = agendamentosData.find(a =>
                a.data === dataPart &&
                a.laboratorio === lab
            );

            // Tentativa 2: Se não encontrou, buscar apenas por laboratório e kit
            if (!agendamento) {
                agendamento = agendamentosData.find(a =>
                    a.laboratorio === lab &&
                    a.kitNome === kit
                );
            }

            // Tentativa 3: Se ainda não encontrou, buscar por qualquer correspondência
            if (!agendamento) {
                agendamento = agendamentosData.find(a =>
                    a.laboratorio.includes(lab) || lab.includes(a.laboratorio)
                );
            }

            if (!agendamento) {
                console.error('❌ Agendamento não encontrado para:', { dataHora, lab, kit });
                console.log('📋 Agendamentos disponíveis:', agendamentosData.map(a => ({
                    data: a.data,
                    laboratorio: a.laboratorio,
                    kitNome: a.kitNome,
                    id: a._id
                })));
                showNotification('Erro: Agendamento não encontrado.', 'error');
                return;
            }

            console.log('✅ Agendamento encontrado:', agendamento._id);

            // 👁️ VER
            if (acao.includes('👁️')) {
                openViewAgendamentoModal(agendamento);
            }

            // ✏️ EDITAR
            if (acao.includes('✏️')) {
                openEditAgendamentoModal(agendamento);
            }

            // ❌ CANCELAR
            if (acao.includes('❌')) {
                openCancelAgendamentoModal(agendamento);
            }

            // ❓ MOTIVO
            if (acao.includes('❓')) {
                openMotivoAgendamentoModal(agendamento);
            }
        });
    }

    // =======================================================
    // 8.2 MODAL VER AGENDAMENTO (ATUALIZADO)
    // =======================================================

    function openViewAgendamentoModal(agendamento) {
        document.getElementById('verAgendamentoInfo').innerHTML = `
            <p><strong>Data:</strong> ${agendamento.data}</p>
            <p><strong>Horários:</strong> ${agendamento.horarios.join(', ')}</p>
            <p><strong>Laboratório:</strong> ${agendamento.laboratorio}</p>
            <p><strong>Kit/Material:</strong> ${agendamento.kitNome || 'Materiais manuais'}</p>
            <p><strong>Status:</strong> ${agendamento.status}</p>
            <p><strong>Professor:</strong> ${agendamento.professorNome}</p>
            <p><strong>Data do Agendamento:</strong> ${new Date(agendamento.dataCriacao).toLocaleDateString('pt-BR')}</p>
        `;
        abrirModal(modalVerAgendamento);
    }

    // =======================================================
    // 8.3 MODAL EDITAR AGENDAMENTO (ATUALIZADO)
    // =======================================================

    function openEditAgendamentoModal(agendamento) {
        // Preencher dados básicos
        document.getElementById('editarData').value = agendamento.data;
        document.getElementById('editarLab').value = agendamento.laboratorio;

        // Preencher horários
        const horariosContainer = document.getElementById('editarHorariosContainer');
        horariosContainer.innerHTML = '';

        agendamento.horarios.forEach(horario => {
            const [inicio, fim] = horario.split(' - ');
            adicionarHorarioEditar(inicio, fim);
        });

        // Preencher materiais
        if (agendamento.kitNome) {
            document.getElementById('editarSelectKitExistente').value = agendamento.kitNome;
        } else {
            document.getElementById('editarSelectKitExistente').value = '';
            // Preencher materiais manuais se existirem
            if (agendamento.materiaisManuais && agendamento.materiaisManuais.length > 0) {
                materiaisManuais = [...agendamento.materiaisManuais];
                renderizarMateriaisEditar();
            }
        }

        // Armazenar ID do agendamento
        document.getElementById('formEditarAgendamento').dataset.agendamentoId = agendamento._id;

        abrirModal(modalEditarAgendamento);
    }

    // =======================================================
    // 8.4 MODAL CANCELAR AGENDAMENTO (ATUALIZADO)
    // =======================================================

    function openCancelAgendamentoModal(agendamento) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

        modal.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
            <h3 style="margin: 0 0 16px 0; color: var(--text-primary);">Cancelar Agendamento</h3>
            <p style="margin: 0 0 24px 0; color: var(--text-secondary);">
                Tem certeza de que deseja cancelar este agendamento?
            </p>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn-secondary" style="background: #f2f2f3; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                    Não
                </button>
                <button class="btn-danger confirm-cancel" style="background: #b9080f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Sim, cancelar
                </button>
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        // Configurar botões do modal
        const btnNao = modal.querySelector('.btn-secondary');
        const btnSim = modal.querySelector('.confirm-cancel');

        btnNao.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        btnSim.addEventListener('click', async function () {
            try {
                console.log('🔄 Iniciando cancelamento do agendamento:', agendamento._id);

                // Desabilitar botão para evitar múltiplos cliques
                btnSim.disabled = true;
                btnSim.textContent = 'Cancelando...';
                btnSim.style.opacity = '0.7';

                const response = await agendamentoAPI.cancelarAgendamento(agendamento._id);

                if (response.success) {
                    showNotification('Agendamento cancelado com sucesso!', 'success');
                    document.body.removeChild(modal);

                    // REMOVER LOCALMENTE para feedback imediato
                    const index = agendamentosData.findIndex(a => a._id === agendamento._id);
                    if (index > -1) {
                        agendamentosData.splice(index, 1);
                        console.log('✅ Agendamento removido localmente');
                    }

                    // Pequeno delay para garantir processamento no backend
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // FORÇAR recarregamento completo do servidor
                    console.log('🔄 Forçando recarregamento completo...');
                    await carregarAgendamentosDoProfessor();

                    // Atualizar estatísticas
                    await atualizarEstatisticasDashboard();

                } else {
                    throw new Error('Resposta não sucedida da API');
                }
            } catch (error) {
                console.error('❌ Erro detalhado ao cancelar agendamento:', error);
                showNotification('Erro ao cancelar agendamento. Tente novamente.', 'error');

                // Re-habilitar botão em caso de erro
                btnSim.disabled = false;
                btnSim.textContent = 'Sim, cancelar';
                btnSim.style.opacity = '1';
            }
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // =======================================================
    // 8.5 MODAL MOTIVO AGENDAMENTO (ATUALIZADO)
    // =======================================================

    function openMotivoAgendamentoModal(agendamento) {
        document.getElementById('motivoTexto').textContent =
            agendamento.motivoNegacao || "Nenhum motivo específico informado.";
        abrirModal(modalMotivoAgendamento);
    }

    // =======================================================
    // 9. NOVA LÓGICA DO MODAL EDITAR AGENDAMENTO - VERSÃO COMPLETA
    // =======================================================

    function setupModalEditarAgendamentoCompleto() {
        const modalEditar = document.getElementById('modalEditarAgendamento');
        const formEditar = document.getElementById('formEditarAgendamento');
        const btnAddHorario = document.getElementById('btnAddHorarioEditar');
        const btnAddMaterial = document.getElementById('btnAddMaterialEditar');
        const horariosContainer = document.getElementById('editarHorariosContainer');
        const materiaisContainer = document.getElementById('editarMateriaisContainer');
        const selectKitExistente = document.getElementById('editarSelectKitExistente');
        const timeLimitMessage = document.getElementById('editarTimeLimitMessage');

        let horariosCount = 1;
        let materiaisManuais = [];

        // Função para adicionar horário
        function adicionarHorarioEditar(horaInicio = '', horaFim = '') {
            if (horariosCount >= 4) {
                timeLimitMessage.classList.remove('hidden');
                return;
            }

            const horarioDiv = document.createElement('div');
            horarioDiv.className = 'horario-item-editar';
            horarioDiv.innerHTML = `
            <div class="time-inputs">
                <input type="time" class="hora-inicio" value="${horaInicio}" placeholder="Início" required>
                <span>até</span>
                <input type="time" class="hora-fim" value="${horaFim}" placeholder="Fim" required>
            </div>
            <button type="button" class="btn-remove-horario">×</button>
        `;

            horariosContainer.appendChild(horarioDiv);
            horariosCount++;

            // Atualizar visibilidade dos botões de remover
            atualizarBotoesRemoverHorario();
        }

        // Função para remover horário
        function removerHorarioEditar(botao) {
            if (horariosCount > 1) {
                botao.closest('.horario-item-editar').remove();
                horariosCount--;
                timeLimitMessage.classList.add('hidden');
                atualizarBotoesRemoverHorario();
            }
        }

        // Atualizar visibilidade dos botões de remover horário
        function atualizarBotoesRemoverHorario() {
            const botoesRemover = horariosContainer.querySelectorAll('.btn-remove-horario');
            botoesRemover.forEach(botao => {
                botao.style.display = horariosCount > 1 ? 'block' : 'none';
            });
        }

        // Função para renderizar materiais manuais
        function renderizarMateriaisEditar() {
            materiaisContainer.innerHTML = '';

            if (materiaisManuais.length === 0) {
                materiaisContainer.innerHTML = '<p class="input-helper">Nenhum material adicionado ainda.</p>';
                return;
            }

            materiaisManuais.forEach((material, index) => {
                const materialDiv = document.createElement('div');
                materialDiv.className = 'manual-item-row';
                materialDiv.innerHTML = `
                <input type="text" placeholder="Nome do material" value="${material.nome}" required>
                <input type="number" placeholder="Qtd" min="1" value="${material.quantidade}" required>
                <button type="button" class="btn-remove-material">🗑️</button>
            `;

                // Event listeners para atualizar o array
                const inputs = materialDiv.querySelectorAll('input');
                inputs[0].addEventListener('input', (e) => {
                    materiaisManuais[index].nome = e.target.value;
                });
                inputs[1].addEventListener('input', (e) => {
                    materiaisManuais[index].quantidade = parseInt(e.target.value) || 1;
                });

                // Botão remover
                materialDiv.querySelector('.btn-remove-material').addEventListener('click', () => {
                    materiaisManuais.splice(index, 1);
                    renderizarMateriaisEditar();
                });

                materiaisContainer.appendChild(materialDiv);
            });
        }

        // Adicionar material manual
        function adicionarMaterialEditar() {
            materiaisManuais.push({
                nome: '',
                quantidade: 1
            });
            renderizarMateriaisEditar();
        }

        // Limpar formulário ao abrir
        function limparFormularioEditar() {
            horariosContainer.innerHTML = '';
            materiaisManuais = [];
            horariosCount = 0;

            // Adicionar primeiro horário vazio
            adicionarHorarioEditar();

            renderizarMateriaisEditar();
            selectKitExistente.value = '';
            timeLimitMessage.classList.add('hidden');
        }

        // Event Listeners
        btnAddHorario.addEventListener('click', () => adicionarHorarioEditar());
        btnAddMaterial.addEventListener('click', adicionarMaterialEditar);

        // Delegation para botões de remover horário
        horariosContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-horario')) {
                removerHorarioEditar(e.target);
            }
        });

        // Quando selecionar kit existente, limpar materiais manuais
        selectKitExistente.addEventListener('change', function () {
            if (this.value) {
                materiaisManuais = [];
                renderizarMateriaisEditar();
            }
        });

        // Submit do formulário
        formEditar.addEventListener('submit', async function (e) {
            e.preventDefault();

            const agendamentoId = this.dataset.agendamentoId;

            // Coletar dados do formulário
            const data = document.getElementById('editarData').value;
            const laboratorio = document.getElementById('editarLab').value;
            const kitExistente = selectKitExistente.value;

            // Coletar horários
            const horarios = Array.from(horariosContainer.querySelectorAll('.horario-item-editar')).map(horarioDiv => {
                const inicio = horarioDiv.querySelector('.hora-inicio').value;
                const fim = horarioDiv.querySelector('.hora-fim').value;
                return `${inicio} - ${fim}`;
            });

            // Coletar materiais
            let kitId = null;
            let kitNome = null;
            let materiaisManuaisEnvio = [];

            if (kitExistente) {
                const kitSelecionado = kitsData.find(kit => kit.nome === kitExistente);
                if (kitSelecionado) {
                    kitId = kitSelecionado._id;
                    kitNome = kitSelecionado.nome;
                }
            } else {
                materiaisManuaisEnvio = materiaisManuais
                    .filter(mat => mat.nome.trim() !== '')
                    .map(mat => ({
                        nome: mat.nome.trim(),
                        quantidade: mat.quantidade,
                        unidade: 'unidade'
                    }));
            }

            // Validar
            if (!data || !laboratorio || horarios.length === 0 || (!kitExistente && materiaisManuaisEnvio.length === 0)) {
                showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
                return;
            }

            try {
                const dadosAtualizados = {
                    data: data,
                    laboratorio: laboratorio,
                    horarios: horarios,
                    kitId: kitId,
                    kitNome: kitNome,
                    materiaisManuais: materiaisManuaisEnvio
                };

                const response = await agendamentoAPI.editarAgendamento(agendamentoId, dadosAtualizados);

                if (response.success) {
                    showNotification('Agendamento atualizado com sucesso!', 'success');
                    fecharModal(modalEditar);

                    // Recarregar a lista de agendamentos
                    await carregarAgendamentosDoProfessor();
                }

            } catch (error) {
                console.error('Erro ao atualizar agendamento:', error);
                showNotification('Erro ao atualizar agendamento. Tente novamente.', 'error');
            }
        });

        // Botão cancelar
        document.getElementById('fecharEditar').addEventListener('click', function () {
            fecharModal(modalEditar);
        });

        // Fechar modal com X
        modalEditar.querySelector('.close-btn').addEventListener('click', function () {
            fecharModal(modalEditar);
        });
    }

    // =======================================================
    // 10. FUNÇÕES DE CARREGAMENTO DE DADOS
    // =======================================================

    async function carregarKitsDoProfessor() {
        try {
            const professorId = usuarioLogado?.id || 'professor-temporario';
            const response = await kitAPI.listarKitsProfessor(professorId);

            if (response.success) {
                kitsData = response.kits;

                // DEBUG: Verificar estrutura dos kits
                console.log('📦 Kits carregados:', kitsData);
                if (kitsData.length > 0) {
                    console.log('🔍 Primeiro kit:', kitsData[0]);
                    console.log('📝 Propriedades do primeiro kit:', Object.keys(kitsData[0]));
                }

                atualizarTabelaKits();
                atualizarDropdownKits();
            }
        } catch (error) {
            console.error('Erro ao carregar kits:', error);
            showNotification('Erro ao carregar kits.', 'error');
        }
    }

    async function carregarAgendamentosDoProfessor() {
        try {
            const professorId = usuarioLogado?.id || 'professor-temporario';
            console.log('🔄 Carregando agendamentos para professor:', professorId);

            const response = await agendamentoAPI.listarAgendamentosProfessor(professorId);

            if (response.success) {
                agendamentosData = response.agendamentos;
                console.log('✅ Agendamentos carregados:', agendamentosData.length);

                // DEBUG: Verificar status dos agendamentos
                agendamentosData.forEach((agendamento, index) => {
                    console.log(`📋 Agendamento ${index + 1}:`, {
                        data: agendamento.data,
                        laboratorio: agendamento.laboratorio,
                        status: agendamento.status,
                        id: agendamento._id
                    });
                });

                debugAgendamentos();

                atualizarTabelaAgendamentos();
            } else {
                console.error('❌ Erro na resposta da API:', response);
                showNotification('Erro ao carregar agendamentos.', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar agendamentos:', error);
            showNotification('Erro ao carregar agendamentos.', 'error');
        }
    }

    // Função para debug - mostrar todos os agendamentos
    function debugAgendamentos() {
        console.log('🐛 DEBUG - Agendamentos atuais:', agendamentosData.length);
        agendamentosData.forEach((agendamento, index) => {
            console.log(`  ${index + 1}. ID: ${agendamento._id}, Data: ${agendamento.data}, Lab: ${agendamento.laboratorio}, Status: ${agendamento.status}`);
        });
    }

    // Função para atualizar estatísticas do dashboard
    async function atualizarEstatisticasDashboard() {
        try {
            const professorId = usuarioLogado?.id || 'professor-temporario';
            const response = await estatisticasAPI.getEstatisticasProfessor(professorId);

            if (response.success) {
                const stats = response.estatisticas;

                // Atualizar os números no dashboard
                const aulasConfirmadasElement = document.querySelector('.stat-number.text-green');
                const aulasPendentesElement = document.querySelector('.stat-number.text-amber');
                const kitsCriadosElement = document.querySelector('.stat-number.text-blue');

                if (aulasConfirmadasElement) aulasConfirmadasElement.textContent = stats.aulasConfirmadas || 0;
                if (aulasPendentesElement) aulasPendentesElement.textContent = stats.aulasPendentes || 0;
                if (kitsCriadosElement) kitsCriadosElement.textContent = stats.kitsCriados || 0;

                console.log('📊 Estatísticas atualizadas:', stats);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }

    // Função para atualizar dropdown de kits no agendamento
    function atualizarDropdownKits() {
        const kitSelect = document.getElementById('kit-select');
        const editKitSelect = document.getElementById('editarSelectKitExistente');

        if (kitSelect) {
            // Limpa opções exceto "Nenhum"
            while (kitSelect.children.length > 1) {
                kitSelect.removeChild(kitSelect.lastChild);
            }

            // Adiciona kits do banco apenas se existirem
            if (kitsData && kitsData.length > 0) {
                kitsData.forEach(kit => {
                    const option = document.createElement('option');
                    option.value = kit.nome;
                    option.textContent = kit.nome;
                    kitSelect.appendChild(option);
                });
            }
        }

        // Repete para o dropdown de edição se existir
        if (editKitSelect) {
            while (editKitSelect.children.length > 1) {
                editKitSelect.removeChild(editKitSelect.lastChild);
            }

            if (kitsData && kitsData.length > 0) {
                kitsData.forEach(kit => {
                    const option = document.createElement('option');
                    option.value = kit.nome;
                    option.textContent = kit.nome;
                    editKitSelect.appendChild(option);
                });
            }
        }
    }

    function atualizarTabelaAgendamentos() {
        const tbody = document.querySelector('#agendamentos-content tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Ordenar agendamentos por data (mais recentes primeiro)
        const agendamentosOrdenados = [...agendamentosData].sort((a, b) => {
            return new Date(b.dataCriacao) - new Date(a.dataCriacao);
        });

        agendamentosOrdenados.forEach(agendamento => {
            const row = document.createElement('tr');

            // Formatar data e horários
            const dataFormatada = agendamento.data;
            const horariosFormatados = agendamento.horarios.join(', ');

            // Determinar status e ações
            let statusBadge = '';
            let acoes = '';

            switch (agendamento.status) {
                case 'confirmado':
                    statusBadge = '<span class="badge status-active">Confirmado</span>';
                    acoes = '<button class="btn btn-light">👁️ Ver</button>';
                    break;
                case 'pendente':
                    statusBadge = '<span class="badge status-draft">Pendente</span>';
                    acoes = '<button class="btn btn-light">👁️ Ver</button><button class="btn btn-light">✏️ Editar</button><button class="btn-danger btn-remover">❌ Cancelar</button>';
                    break;
                case 'negado':
                    statusBadge = '<span class="badge status-denied">Negado</span>';
                    acoes = '<button class="btn btn-light">👁️ Ver</button><button class="btn btn-light">❓ Motivo</button>';
                    break;
                case 'cancelado':
                    statusBadge = '<span class="badge status-disabled">Cancelado</span>';
                    acoes = '<button class="btn btn-light">👁️ Ver</button>';
                    break;
                default:
                    statusBadge = '<span class="badge status-draft">Pendente</span>';
                    acoes = '<button class="btn btn-light">👁️ Ver</button><button class="btn btn-light">✏️ Editar</button><button class="btn-danger btn-remover">❌ Cancelar</button>';
            }

            row.innerHTML = `
            <td data-label="Data e Hora">${dataFormatada} (${horariosFormatados})</td>
            <td data-label="Laboratório">${agendamento.laboratorio}</td>
            <td data-label="Kit/Material Solicitado">${agendamento.kitNome || 'Materiais manuais'}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Ações" class="kit-actions-compact">${acoes}</td>
        `;

            tbody.appendChild(row);
        });

        console.log('📊 Tabela de agendamentos atualizada. Total:', agendamentosData.length);
        console.log('📋 Agendamentos:', agendamentosData.map(a => ({
            data: a.data,
            status: a.status,
            laboratorio: a.laboratorio
        })));
    }

    function atualizarTabelaKits() {
        const tbody = document.querySelector('#kits-content tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        kitsData.forEach(kit => {
            const row = document.createElement('tr');

            // Mapear status para classes CSS
            const statusClass = {
                'ativo': 'status-active',
                'rascunho': 'status-draft',
                'arquivado': 'status-disabled'
            }[kit.status] || 'status-draft';

            row.innerHTML = `
            <td data-label="Nome do Kit">${kit.nome}</td>
            <td data-label="Itens">${kit.materiais ? kit.materiais.length : 0}</td>
            <td data-label="Usos">${kit.usos || 0}</td>
            <td data-label="Status"><span class="badge ${statusClass}">${formatStatusForDisplay(kit.status)}</span></td>
            <td data-label="Criado em">${new Date(kit.dataCriacao).toLocaleDateString('pt-BR')}</td>
            <td data-label="Ações" class="kit-actions-compact">
                <button class="btn btn-light">👁️ Ver</button>
                <button class="btn btn-light">✏️ Editar</button>
                <button class="btn-remover" style="background: #b9080f; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
                    🗑️ Remover
                </button>
            </td>
        `;

            tbody.appendChild(row);
        });
    }

    // =======================================================
    // 11. FUNÇÃO DE NOTIFICAÇÃO
    // =======================================================

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

        const colors = {
            success: '#1b9b46',
            error: '#b9080f',
            info: '#2b6ef6',
            warning: '#db8a00'
        };

        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // =======================================================
    // 12. INICIALIZAÇÃO FINAL
    // =======================================================

    // Inicializar funcionalidades dos kits
    setupViewKitButtons();
    setupEditKitButtons();
    setupRemoveKitButtons();

    // Inicializar botões de agendamento
    setupAgendamentoButtons();
    setupBotoesFecharAgendamentos();
    setupModalEditarAgendamentoCompleto();

    // Carregar dados iniciais
    carregarKitsDoProfessor();
    carregarAgendamentosDoProfessor();
    atualizarEstatisticasDashboard();

    // Atualizar nome do professor na interface
    const professorNomeElement = document.getElementById('professor-nome');
    if (professorNomeElement) {
        professorNomeElement.textContent = usuarioLogado.nome;
    }

    window.addEventListener('error', function (e) {
        console.error('❌ Erro global capturado:', e.error);
        console.error('📄 Em:', e.filename, 'linha:', e.lineno);
    });

    // Tratamento de promises não capturadas
    window.addEventListener('unhandledrejection', function (e) {
        console.error('❌ Promise rejeitada não capturada:', e.reason);
        e.preventDefault();
    });
});