class EtecLabAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.usuarioLogado = this.getUsuarioLogado();
    }

    // Editar agendamento
    async editarAgendamento(id, agendamentoData) {
        return this.fazerRequisicao(`/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(agendamentoData)
        });
    }

    // Excluir agendamento  
    async excluirAgendamento(id) {
        return this.fazerRequisicao(`/agendamentos/${id}`, {
            method: 'DELETE'
        });
    }

    // Excluir kit
    async deletarKit(id) {
        return this.fazerRequisicao(`/kits/${id}`, {
            method: 'DELETE'
        });
    }

    // Cancelar agendamento (já existe, mas confirmando)
    async cancelarAgendamento(id) {
        return this.fazerRequisicao(`/agendamentos/${id}/cancelar`, {
            method: 'PUT'
        });
    }

    async listarLaboratorios() {
        const data = await this.fazerRequisicao('/laboratorios');
        return data.laboratorios;
    }

    async listarKitsDisponiveis() {
        const data = await this.fazerRequisicao('/kits');
        return data.kits;
    }

    getUsuarioLogado() {
        // ✅ VERIFIQUE se está buscando da chave correta:
        const usuarioSalvo = localStorage.getItem('user'); // ← DEVE SER 'user'
        console.log('🔍 Debug - usuarioSalvo:', usuarioSalvo); // ← DEBUG

        if (usuarioSalvo) {
            const usuario = JSON.parse(usuarioSalvo);
            console.log('🔍 Debug - usuário parseado:', usuario); // ← DEBUG

            if (usuario.perfil === 'Professor') {
                return usuario;
            }
        }

        console.log('🔒 Nenhum usuário professor logado - redirecionando...');
        window.location.href = 'index.html';
        return null;
    }

    salvarUsuarioLogado(usuario) {
        this.usuarioLogado = usuario;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    }

    async fazerRequisicao(endpoint, options = {}) {
        try {
            console.log(`🔍 Fazendo requisição para: ${this.baseURL}${endpoint}`);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            // ✅ DEBUG ADICIONADO AQUI:
            console.log('🔍 Resposta da API:', {
                endpoint,
                status: response.status,
                success: data.success,
                data: data
            });

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('❌ Erro detalhado na API:', error);
            throw error;
        }
    }

    // Kits
    async criarKit(kitData) {
        return this.fazerRequisicao('/kits', {
            method: 'POST',
            body: JSON.stringify({
                ...kitData,
                professorId: this.usuarioLogado.id,  // ← MUDE _id para id
                professorNome: this.usuarioLogado.nome
            })
        });
    }

    async listarKitsProfessor() {
        const data = await this.fazerRequisicao(`/kits/professor/${this.usuarioLogado.id}`); // ← id
        return data.kits;
    }

    // Agendamentos
    async criarAgendamento(agendamentoData) {
        return this.fazerRequisicao('/agendamentos', {
            method: 'POST',
            body: JSON.stringify({
                ...agendamentoData,
                professorId: this.usuarioLogado.id,  // ← id
                professorNome: this.usuarioLogado.nome
            })
        });
    }

    async listarAgendamentosProfessor() {
        const data = await this.fazerRequisicao(`/agendamentos/professor/${this.usuarioLogado.id}`); // ← id
        return data.agendamentos;
    }

    // Estatísticas
    async buscarEstatisticas() {
        const data = await this.fazerRequisicao(`/professor/${this.usuarioLogado.id}/estatisticas`); // ← id
        return data.estatisticas;
    }
}

// Função para carregar agendamentos na tabela
let agendamentos = [];

// Função para carregar agendamentos do backend
async function carregarAgendamentos() {
    try {
        const agendamentosBackend = await api.listarAgendamentosProfessor();
        agendamentos = agendamentosBackend;

        const listaAgendamentos = document.getElementById('lista-agendamentos');
        if (!listaAgendamentos) return;

        listaAgendamentos.innerHTML = '';

        agendamentos.forEach(agendamento => {
            const linha = document.createElement('tr');

            // Formatar data e horário
            const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
            const horarioFormatado = agendamento.horarios ? agendamento.horarios.join(', ') : agendamento.horario;

            linha.innerHTML = `
                <td>${dataFormatada} (${horarioFormatado})</td>
                <td>${agendamento.laboratorio || agendamento.laboratorio_nome}</td>
                <td>${agendamento.kit || agendamento.kit_nome || 'Nenhum kit'}</td>
                <td class="${agendamento.status === 'pendente' ? 'status-pendente' : agendamento.status === 'confirmado' ? 'status-confirmado' : 'status-negado'}">
                    ${formatarStatusAgendamento(agendamento.status)}
                </td>
                <td class="acoes-agendamento">
                    <button class="botao-editar" onclick="editarAgendamentoFrontend('${agendamento._id || agendamento.id}')">Editar</button>
                    <button class="botao-excluir" onclick="excluirAgendamentoFrontend('${agendamento._id || agendamento.id}')">Excluir</button>
                </td>
            `;

            listaAgendamentos.appendChild(linha);
        });

        atualizarContadoresAgendamentos();
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        // Fallback para dados locais se o backend falhar
        carregarAgendamentosLocais();
    }
}

// Fallback com dados locais
function carregarAgendamentosLocais() {
    const agendamentosLocais = [
        {
            id: 1,
            data: "12/11/2025",
            horario: "13:00 - 13:50",
            laboratorio: "química-1",
            kit: "kit-síntese",
            status: "Pendente"
        },
        {
            id: 2,
            data: "12/11/2025",
            horario: "13:00 - 13:50",
            laboratorio: "Laboratório de Informática 1",
            kit: "kit 2 121",
            status: "Pendente"
        }
    ];

    const listaAgendamentos = document.getElementById('lista-agendamentos');
    if (!listaAgendamentos) return;

    listaAgendamentos.innerHTML = '';

    agendamentosLocais.forEach(agendamento => {
        const linha = document.createElement('tr');

        linha.innerHTML = `
            <td>${agendamento.data} (${agendamento.horario})</td>
            <td>${agendamento.laboratorio}</td>
            <td>${agendamento.kit}</td>
            <td class="${agendamento.status === 'Pendente' ? 'status-pendente' : 'status-confirmado'}">${agendamento.status}</td>
            <td class="acoes-agendamento">
                <button class="botao-editar" onclick="editarAgendamentoFrontend(${agendamento.id})">Editar</button>
                <button class="botao-excluir" onclick="excluirAgendamentoFrontend(${agendamento.id})">Excluir</button>
            </td>
        `;

        listaAgendamentos.appendChild(linha);
    });

    atualizarContadoresAgendamentos();
}

// Função para atualizar contadores
function atualizarContadoresAgendamentos() {
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    if (!listaAgendamentos) return;

    const total = listaAgendamentos.querySelectorAll('tr').length;
    const confirmados = listaAgendamentos.querySelectorAll('.status-confirmado').length;
    const pendentes = listaAgendamentos.querySelectorAll('.status-pendente').length;

    const totalElement = document.getElementById('total-agendamentos');
    const confirmadosElement = document.getElementById('confirmados');
    const pendentesElement = document.getElementById('pendentes');

    if (totalElement) totalElement.textContent = total;
    if (confirmadosElement) confirmadosElement.textContent = confirmados;
    if (pendentesElement) pendentesElement.textContent = pendentes;
}

// Função para formatar status
function formatarStatusAgendamento(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'negado': 'Negado',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
}

// Função para atualizar os contadores de status
function atualizarContadores() {
    const total = agendamentos.length;
    const confirmados = agendamentos.filter(a => a.status === 'Confirmado').length;
    const pendentes = agendamentos.filter(a => a.status === 'Pendente').length;

    const totalElement = document.getElementById('total-agendamentos');
    const confirmadosElement = document.getElementById('confirmados');
    const pendentesElement = document.getElementById('pendentes');

    if (totalElement) totalElement.textContent = total;
    if (confirmadosElement) confirmadosElement.textContent = confirmados;
    if (pendentesElement) pendentesElement.textContent = pendentes;
}

// Função para editar um agendamento
function editarAgendamento(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    if (agendamento) {
        // Aqui você pode implementar a lógica para editar o agendamento
        alert(`Editando agendamento: ${agendamento.laboratorio} - ${agendamento.data}`);

        // Exemplo de alteração de status (apenas para demonstração)
        // agendamento.status = agendamento.status === 'Pendente' ? 'Confirmado' : 'Pendente';
        // carregarAgendamentos();
    }
}

// Instância global da API
const api = new EtecLabAPI();


document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Debug - Iniciando carregamento...');
    const usuario = api.getUsuarioLogado();
    console.log('🔧 Debug - Usuário:', usuario);

    if (!usuario) return;

    // Debug do carregamento
    carregarDadosIniciais().then(() => {
        console.log('🔧 Debug - Dados carregados completos');
    });


    // =======================================================
    // 0. INICIALIZAÇÃO E CARREGAMENTO DE DADOS DO BACKEND
    // =======================================================

    async function carregarDadosIniciais() {
        try {
            await carregarEstatisticas();
            await carregarKits();
            await carregarAgendamentos();
            await carregarLaboratorios();
            await carregarKitsDisponiveis();
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    async function carregarEstatisticas() {
        try {
            const estatisticas = await api.buscarEstatisticas();

            // Atualizar a interface
            const confirmadasEl = document.querySelector('#aulas-confirmadas');
            const pendentesEl = document.querySelector('#aulas-pendentes');
            const kitsEl = document.querySelector('#kits-criados');

            if (confirmadasEl) confirmadasEl.textContent = estatisticas.aulasConfirmadas;
            if (pendentesEl) pendentesEl.textContent = estatisticas.aulasPendentes;
            if (kitsEl) kitsEl.textContent = estatisticas.kitsCriados;

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async function carregarKits() {
        try {
            console.log('📦 Carregando kits do backend...');
            const kits = await api.listarKitsProfessor();
            console.log('✅ Kits carregados:', kits);
            atualizarTabelaKits(kits);
        } catch (error) {
            console.error('❌ Erro ao carregar kits:', error);
            showNotification('Erro ao carregar kits', 'error');
        }
    }

    async function carregarAgendamentos() {
        try {
            const agendamentos = await api.listarAgendamentosProfessor();
            atualizarTabelaAgendamentos(agendamentos);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        }
    }

    async function carregarLaboratorios() {
        try {
            const laboratorios = await api.listarLaboratorios();
            atualizarSelectLaboratorios(laboratorios);
        } catch (error) {
            console.error('Erro ao carregar laboratórios:', error);
        }
    }

    async function carregarKitsDisponiveis() {
        try {
            const kits = await api.listarKitsDisponiveis();
            atualizarSelectKits(kits);
        } catch (error) {
            console.error('Erro ao carregar kits disponíveis:', error);
        }
    }

    // =======================================================
    // FUNÇÕES AUXILIARES PARA ATUALIZAR A INTERFACE
    // =======================================================

    function atualizarSelectLaboratorios(laboratorios) {
        const labSelect = document.getElementById('lab-select');
        if (!labSelect) return;

        // Limpa options existentes (mantendo o primeiro)
        while (labSelect.options.length > 1) {
            labSelect.remove(1);
        }

        // Adiciona os laboratórios do backend
        laboratorios.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.nome;
            option.textContent = lab.nome;
            labSelect.appendChild(option);
        });
    }

    function atualizarSelectKits(kits) {
        const kitSelect = document.getElementById('kit-select');
        if (!kitSelect) return;

        // Limpa options existentes (mantendo os primeiros)
        while (kitSelect.options.length > 1) {
            kitSelect.remove(1);
        }

        // Adiciona os kits do backend
        kits.forEach(kit => {
            const option = document.createElement('option');
            option.value = kit.nome;
            option.textContent = kit.nome;
            option.dataset.id = kit._id;
            kitSelect.appendChild(option);
        });
    }

    function atualizarTabelaKits(kits) {
        const tbody = document.querySelector('#kits-content tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        kits.forEach(kit => {
            const row = document.createElement('tr');

            const statusClass = {
                'ativo': 'status-active',
                'rascunho': 'status-draft',
                'arquivado': 'status-disabled'
            }[kit.status] || 'status-draft';

            const dataCriacao = new Date(kit.dataCriacao).toLocaleDateString('pt-BR');

            row.innerHTML = `
                <td data-label="Nome do Kit">${kit.nome}</td>
                <td data-label="Itens">${kit.materiais.length}</td>
                <td data-label="Usos">${kit.usos}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${formatStatusForDisplay(kit.status)}</span></td>
                <td data-label="Criado em">${dataCriacao}</td>
                <td data-label="Ações" class="kit-actions-compact">
                    <button class="btn btn-light" data-kit-id="${kit._id}">👁️ Ver</button>
                    <button class="btn btn-light" data-kit-id="${kit._id}">✏️ Editar</button>
                    <button class="btn-remover" data-kit-id="${kit._id}" style="background: #b9080f; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
                        🗑️ Remover
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Reconfigurar os event listeners
        // setupViewKitButtons();
        // setupEditKitButtons();
        // setupRemoveKitButtons();
    }

    function atualizarTabelaAgendamentos(agendamentos) {
        const tbody = document.querySelector('#agendamentos-content tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        agendamentos.forEach(agendamento => {
            const row = document.createElement('tr');

            const statusClass = {
                'confirmado': 'status-active',
                'pendente': 'status-draft',
                'negado': 'status-denied',
                'cancelado': 'status-disabled'
            }[agendamento.status] || 'status-draft';

            // Formatar data e horários para exibição
            const dataFormatada = new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR');
            const horariosFormatados = agendamento.horarios.join(', ');
            const displayDataHora = `${dataFormatada} (${horariosFormatados})`;

            // Determinar texto do kit/material
            let kitMaterialTexto = 'Nenhum kit';
            if (agendamento.kitNome) {
                kitMaterialTexto = agendamento.kitNome;
            } else if (agendamento.materiaisManuais && agendamento.materiaisManuais.length > 0) {
                kitMaterialTexto = `${agendamento.materiaisManuais.length} materiais manuais`;
            }

            row.innerHTML = `
                <td data-label="Data e Hora">${displayDataHora}</td>
                <td data-label="Laboratório">${agendamento.laboratorio}</td>
                <td data-label="Kit/Material Solicitado">${kitMaterialTexto}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${formatStatusAgendamento(agendamento.status)}</span></td>
                <td data-label="Ações" class="kit-actions-compact">
                    ${agendamento.status === 'confirmado' ? '<button class="btn btn-light">👁️ Ver</button>' : ''}
                    ${agendamento.status === 'pendente' ? '<button class="btn btn-light">✏️ Editar</button><button class="btn-danger btn-remover-agendamento" data-agendamento-id="${agendamento._id}">❌ Cancelar</button>' : ''}
                    ${agendamento.status === 'negado' ? '<button class="btn btn-light">❓ Motivo</button>' : ''}
                </td>
            `;

            tbody.appendChild(row);
        });

        // Configurar event listeners para cancelar agendamentos
        setupCancelarAgendamentoButtons();
    }

    function formatStatusAgendamento(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'confirmado': 'Confirmado',
            'negado': 'Negado',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    function setupCancelarAgendamentoButtons() {
        document.querySelectorAll('.btn-remover-agendamento').forEach(button => {
            button.addEventListener('click', function () {
                const agendamentoId = this.dataset.agendamentoId;
                showCancelarAgendamentoConfirmation(agendamentoId, this.closest('tr'));
            });
        });
    }

    async function showCancelarAgendamentoConfirmation(agendamentoId, row) {
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
                    <button class="btn-danger confirmar-cancelamento" style="background: #b9080f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Sim, cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const btnNao = modal.querySelector('.btn-secondary');
        const btnSim = modal.querySelector('.confirmar-cancelamento');

        btnNao.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        btnSim.addEventListener('click', async function () {
            try {
                await api.cancelarAgendamento(agendamentoId);
                showNotification('Agendamento cancelado com sucesso!', 'success');
                row.remove();
                document.body.removeChild(modal);
                await carregarEstatisticas(); // Atualiza estatísticas
            } catch (error) {
                showNotification(`Erro ao cancelar agendamento: ${error.message}`, 'error');
                document.body.removeChild(modal);
            }
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }


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

    let selectedDate = null; // Variável para armazenar a data selecionada
    const MAX_SCHEDULES = 4;

    // NOVO: Função para resetar o estado do formulário de agendamento
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

    // Função de fechar o modal (agora apenas esconde e chama o reset)
    const closeAppointmentModal = () => {
        appointmentModal.style.display = 'none';
        resetAppointmentState();
    };

    // Abre o modal de agendamento
    if (btnNovoAgendamento) {
        btnNovoAgendamento.addEventListener('click', () => {
            appointmentModal.style.display = 'flex';
            resetAppointmentState(); // Garante o reset antes de abrir
            generateCalendar(); // Chama a função para gerar o calendário ao abrir
        });
    }

    if (btnCloseAppointmentModal) {
        btnCloseAppointmentModal.addEventListener('click', closeAppointmentModal);
    }
    if (btnCancelAppointmentModal) {
        btnCancelAppointmentModal.addEventListener('click', closeAppointmentModal);
    }

    // Fecha o modal ao clicar no overlay (fora do conteúdo)
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
        calendarContainer.innerHTML = ''; // Limpa o conteúdo anterior

        let currentDate = new Date();
        let currentMonth = -1;

        // Garante que o calendário esteja limpo e pronto para a nova seleção
        selectedDate = null;
        timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione uma data e um laboratório.</p>';

        for (let i = 0; i < 30; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);

            const dayOfMonth = date.getDate();
            const dayOfWeekIndex = date.getDay();
            const month = date.getMonth();

            const dayName = daysOfWeek[dayOfWeekIndex];

            // Rastreia a mudança de mês e insere um separador
            if (month !== currentMonth) {
                currentMonth = month;
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('current-month-label');
                monthLabel.textContent = `${monthNames[month]} de ${date.getFullYear()}`;
                calendarContainer.appendChild(monthLabel);
            }

            // Cria o elemento do dia
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');

            // Adiciona classe para fim de semana (Sáb/Dom - 0 e 6)
            if (dayOfWeekIndex === 0 || dayOfWeekIndex === 6) {
                dayElement.classList.add('weekend');
            }

            // Conteúdo do dia
            dayElement.innerHTML = `
                <span class="day-number">${dayOfMonth}</span>
                <span class="day-name">${dayName}</span>
            `;

            // Adiciona a data como atributo para fácil acesso
            dayElement.dataset.date = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD

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

        // Armazena a data selecionada e reseta a seleção de laboratório/horário
        selectedDate = selectedDay.dataset.date;
        labSelect.value = "";
        timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione um laboratório.</p>';
        btnSchedule.disabled = true;
        timeLimitMessage.classList.add('hidden');

        console.log(`Data selecionada: ${selectedDate}`);
    }

    // =======================================================
    // 4. LÓGICA DE SELEÇÃO DE LABORATÓRIO E HORÁRIO MÚLTIPLO (Agendamento)
    // =======================================================

    // Simulação de Horários Disponíveis por Laboratório (Geral)
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
            // Em um app real, aqui você faria uma requisição para checar a disponibilidade do Lab/Data
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

            // Adiciona o listener de seleção para cada checkbox
            checkbox.addEventListener('change', handleTimeSelection);

            timeSelectContainer.appendChild(checkboxItem);
        });

        // Verifica a necessidade de desabilitar horários imediatamente (se houver seleção anterior)
        handleTimeSelection();
    }

    function handleTimeSelection() {
        const timeCheckboxes = document.querySelectorAll('#time-select-container input[type="checkbox"]');
        const selectedTimes = Array.from(timeCheckboxes).filter(cb => cb.checked);
        const selectedCount = selectedTimes.length;

        // 1. Aplica a limitação de 1 a 4
        if (selectedCount >= MAX_SCHEDULES) {
            timeLimitMessage.classList.remove('hidden');
            // Desabilita os não selecionados para evitar ultrapassar o limite
            timeCheckboxes.forEach(cb => {
                const parent = cb.closest('.checkbox-item');
                if (!cb.checked) {
                    cb.disabled = true;
                    parent.classList.add('disabled-limit');
                }
            });
        } else {
            timeLimitMessage.classList.add('hidden');
            // Habilita todos os não selecionados (se o limite não foi atingido)
            timeCheckboxes.forEach(cb => {
                const parent = cb.closest('.checkbox-item');
                cb.disabled = false;
                parent.classList.remove('disabled-limit');
            });
        }

        // 2. Atualiza a classe visual dos itens
        timeCheckboxes.forEach(cb => {
            const parent = cb.closest('.checkbox-item');
            if (cb.checked) {
                parent.classList.add('selected');
            } else {
                parent.classList.remove('selected');
            }
        });

        // 3. Habilita o botão Agendar
        if (selectedDate && labSelect.value && selectedCount >= 1 && selectedCount <= MAX_SCHEDULES) {
            btnSchedule.disabled = false;
        } else {
            btnSchedule.disabled = true;
        }
    }


    btnSchedule.addEventListener('click', async () => {
        console.log('🔍 Debug - Dados do agendamento:', {
            selectedDate,
            laboratorio: labSelect.value,
            horarios: Array.from(document.querySelectorAll('#time-select-container input[type="checkbox"]:checked')).map(cb => cb.value),
            kit: document.getElementById('kit-select').value
        });

        const selectedTimes = Array.from(
            document.querySelectorAll('#time-select-container input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        const selectedKitElement = document.getElementById('kit-select');
        const selectedKit = selectedKitElement.value;
        const selectedKitOption = selectedKitElement.options[selectedKitElement.selectedIndex];
        const selectedKitId = selectedKitOption.dataset.id;

        let materiaisManuais = [];

        if (selectedKit === 'Nenhum') {
            materiaisManuais = manualMaterials
                .filter(mat => mat.name.trim() !== '' && mat.quantity >= 1)
                .map(mat => ({
                    nome: mat.name.trim(),
                    quantidade: mat.quantity,
                    unidade: 'unidade'
                }));
        }
        
        if (selectedTimes.length === 0 || selectedTimes.length > MAX_SCHEDULES) {
            showNotification("Selecione entre 1 e 4 horários.", 'error');
            return;
        }

        const agendamentoData = {
            data: selectedDate,
            laboratorio: labSelect.value,
            horarios: selectedTimes,
            kitId: selectedKitId || null,
            kitNome: selectedKit !== 'Nenhum' ? selectedKit : null,
            materiaisManuais: materiaisManuais
        };

        try {
            const resultado = await api.criarAgendamento(agendamentoData);

            showNotification(`Agendamento criado para ${agendamentoData.data} com sucesso!`, 'success');

            // Recarrega os dados
            await carregarAgendamentos();
            await carregarEstatisticas();

            closeAppointmentModal();

        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            showNotification(`Erro ao criar agendamento: ${error.message}`, 'error');
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

    let kitItems = []; // Array para armazenar os objetos dos itens do kit

    // --- Funções de Abertura/Fechamento ---
    const openKitModal = () => {
        kitModal.style.display = 'flex';
        kitItems = []; // Reseta a lista de itens
        kitForm.reset();
        addNewKitItem(); // Garante que haja pelo menos 1 item ao abrir
        checkKitFormValidity();
    };

    const closeKitModal = () => {
        kitModal.style.display = 'none';
        kitItems = [];
        kitForm.reset();
        renderKitItems(); // Renderiza vazio
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

    // --- Lógica de Itens Dinâmicos ---

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

            // Usando placeholders e values para preencher o formulário
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

            // Adiciona listeners de input para atualizar o array kitItems em tempo real
            itemElement.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', updateKitItem);
            });

            kitItemsContainer.appendChild(itemElement);
        });

        // Adiciona listeners para os botões de exclusão
        kitItemsContainer.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', deleteKitItem);
            // Desabilita o botão de delete se for o último item
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
            // Converte quantidade para número e garante mínimo de 1
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
        // Só permite exclusão se houver mais de 1 item
        if (kitItems.length > 1) {
            kitItems = kitItems.filter(item => item.id !== itemId);
            renderKitItems();
        } else {
            console.warn("Não é possível excluir o último item do kit. O kit deve ter pelo menos um item.");
        }
    }

    // Adicionar novo item
    btnAddKitItem.addEventListener('click', addNewKitItem);

    // --- Lógica de Validação e Envio (Kit) ---

    function checkKitFormValidity() {
        const isNameValid = kitNameInput.value.trim().length > 0;
        const isDescriptionValid = kitDescriptionInput.value.trim().length > 0;

        // Verifica se há pelo menos um item válido
        const validItems = kitItems.filter(item => item.name.trim() !== '' && item.quantity >= 1);
        const hasValidItem = validItems.length >= 1;

        const isFormValid = isNameValid && isDescriptionValid && hasValidItem;
        btnSaveKit.disabled = !isFormValid;
    }

    // Listeners para validação dos campos principais
    kitNameInput.addEventListener('input', checkKitFormValidity);
    kitDescriptionInput.addEventListener('input', checkKitFormValidity);

    // Submissão do Formulário
    kitForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const kitData = {
            nome: kitNameInput.value.trim(),
            descricao: kitDescriptionInput.value.trim(),
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
            const resultado = await api.criarKit(kitData);

            showNotification(`Kit "${kitData.nome}" criado com sucesso!`, 'success');

            // Recarrega os dados
            await carregarKits();
            await carregarEstatisticas();
            await carregarKitsDisponiveis();

            closeKitModal();

        } catch (error) {
            console.error('❌ Erro detalhado ao criar kit:', error);
            console.log('📨 Resposta completa:', error.message);
            showNotification(`Erro ao criar kit: ${error.message}`, 'error');
        }
    });

    // Chamada inicial
    renderKitItems();

    // =======================================================
    // 6. LÓGICA DE ADIÇÃO MANUAL DE MATERIAIS (Quando "Nenhum kit" é selecionado)
    // =======================================================

    const kitSelect = document.getElementById('kit-select');
    const manualSection = document.getElementById('manual-materials-section');
    const addMaterialBtn = document.getElementById('add-material-btn');
    const materialsContainer = document.getElementById('manual-materials-container');

    let manualMaterials = []; // Armazena os itens adicionados manualmente

    // Exibe/esconde a seção conforme a escolha do usuário
    if (kitSelect) {
        kitSelect.addEventListener('change', () => {
            if (kitSelect.value === 'Nenhum') {
                manualSection.classList.remove('hidden');
            } else {
                manualSection.classList.add('hidden');
                manualMaterials = []; // Limpa os materiais se um kit for selecionado
                renderManualMaterials();
            }
        });
    }

    // Função para renderizar os materiais manuais
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

            // Atualiza os valores no array quando o usuário digita
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

            // Botão de remoção
            row.querySelector('.btn-remove-material').addEventListener('click', () => {
                manualMaterials = manualMaterials.filter(m => m.id !== mat.id);
                renderManualMaterials();
            });

            materialsContainer.appendChild(row);
        });
    }

    // Adiciona novo material manual
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
    // 7. LÓGICA DOS BOTÕES VER, EDITAR E REMOVER KITS
    // =======================================================

    // Dados de exemplo para os kits (simulando um banco de dados)
    // let kitsData = [
    //     {
    //         id: 1,
    //         name: "Kit Titulação Básica",
    //         description: "Kit completo para aulas de titulação ácido-base com indicadores.",
    //         items: 8,
    //         uses: 5,
    //         status: "ativo",
    //         createdDate: "10/01/2025",
    //         materials: [
    //             { name: "Béquer 50ml", quantity: 8, unit: "unidade" },
    //             { name: "Pipeta", quantity: 8, unit: "unidade" },
    //             { name: "Indicador Fenolftaleína", quantity: 1, unit: "frasco" }
    //         ]
    //     },
    //     {
    //         id: 2,
    //         name: "Kit Síntese Orgânica",
    //         description: "Materiais para síntese de compostos orgânicos simples.",
    //         items: 12,
    //         uses: 3,
    //         status: "ativo",
    //         createdDate: "08/01/2025",
    //         materials: [
    //             { name: "Balão de Fundo Redondo", quantity: 12, unit: "unidade" },
    //             { name: "Condensador", quantity: 12, unit: "unidade" },
    //             { name: "Termômetro", quantity: 12, unit: "unidade" }
    //         ]
    //     },
    //     {
    //         id: 3,
    //         name: "Kit Medidas Elétricas",
    //         description: "Instrumentos para medições elétricas básicas.",
    //         items: 15,
    //         uses: 15,
    //         status: "ativo",
    //         createdDate: "20/12/2024",
    //         materials: [
    //             { name: "Multímetro Digital", quantity: 15, unit: "unidade" },
    //             { name: "Fios Jumper", quantity: 45, unit: "unidade" },
    //             { name: "Protoboard", quantity: 15, unit: "unidade" }
    //         ]
    //     },
    //     {
    //         id: 4,
    //         name: "Kit Desmontagem PC",
    //         description: "Ferramentas para desmontagem e manutenção de computadores.",
    //         items: 5,
    //         uses: 0,
    //         status: "rascunho",
    //         createdDate: "01/03/2025",
    //         materials: [
    //             { name: "Chave Phillips", quantity: 15, unit: "unidade" },
    //             { name: "Pulseira Anti-estática", quantity: 15, unit: "unidade" },
    //             { name: "Alicate", quantity: 15, unit: "unidade" }
    //         ]
    //     },
    //     {
    //         id: 5,
    //         name: "Kit Introdução à Biologia",
    //         description: "Materiais para aulas introdutórias de biologia celular.",
    //         items: 22,
    //         uses: 22,
    //         status: "arquivado",
    //         createdDate: "01/10/2024",
    //         materials: [
    //             { name: "Microscópio Óptico", quantity: 15, unit: "unidade" },
    //             { name: "Lâminas e Lamínulas", quantity: 150, unit: "conjunto" },
    //             { name: "Corantes Biológicos", quantity: 8, unit: "kit" }
    //         ]
    //     }
    // ];

    // Modais
    const viewKitModal = document.getElementById('view-kit-modal');
    const editKitModal = document.getElementById('edit-kit-modal');

    // Função para formatar materiais para exibição
    function formatMaterialsForDisplay(materials) {
        return materials.map(material =>
            `${material.name} (${material.quantity} ${material.unit})`
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
    // 7.1 FUNCIONALIDADE VER KIT
    // =======================================================

    // function setupViewKitButtons() {
    //     document.querySelectorAll('.kit-actions-compact .btn-light:first-child').forEach(button => {
    //         button.addEventListener('click', function () {
    //             const row = this.closest('tr');
    //             const kitName = row.querySelector('td[data-label="Nome do Kit"]').textContent;

    //             // Encontrar o kit nos dados
    //             const kit = kitsData.find(k => k.name === kitName);
    //             if (kit) {
    //                 openViewKitModal(kit);
    //             }
    //         });
    //     });
    // }

    function openViewKitModal(kit) {
        // Preencher os dados no modal
        document.getElementById('view-kit-name').textContent = kit.name;
        document.getElementById('view-kit-description').textContent = kit.description;
        document.getElementById('view-kit-items').textContent = `${kit.items} itens`;
        document.getElementById('view-kit-uses').textContent = kit.uses;
        document.getElementById('view-kit-status').textContent = formatStatusForDisplay(kit.status);
        document.getElementById('view-kit-date').textContent = kit.createdDate;

        // Mostrar o modal
        viewKitModal.classList.remove('hidden');
    }

    // Fechar modal Ver Kit
    document.getElementById('close-view-kit').addEventListener('click', function () {
        viewKitModal.classList.add('hidden');
    });

    // =======================================================
    // 7.2 FUNCIONALIDADE EDITAR KIT
    // =======================================================

    // function setupEditKitButtons() {
    //     document.querySelectorAll('.kit-actions-compact .btn-light:nth-child(2)').forEach(button => {
    //         button.addEventListener('click', function () {
    //             const row = this.closest('tr');
    //             const kitName = row.querySelector('td[data-label="Nome do Kit"]').textContent;

    //             // Encontrar o kit nos dados
    //             const kit = kitsData.find(k => k.name === kitName);
    //             if (kit) {
    //                 openEditKitModal(kit);
    //             }
    //         });
    //     });
    // }

    function openEditKitModal(kit) {
        // Preencher os dados no formulário de edição
        document.getElementById('edit-kit-name').value = kit.name;
        document.getElementById('edit-kit-description').value = kit.description;
        document.getElementById('edit-kit-items').value = kit.materials.map(m => m.name).join(', ');
        document.getElementById('edit-kit-uses').value = kit.uses;
        document.getElementById('edit-kit-status').value = kit.status;

        // Mostrar o modal
        editKitModal.classList.remove('hidden');
    }

    // Salvar edição do kit
    document.getElementById('save-edit-kit').addEventListener('click', function () {
        const kitName = document.getElementById('edit-kit-name').value;
        const kitDescription = document.getElementById('edit-kit-description').value;
        const kitItems = document.getElementById('edit-kit-items').value;
        const kitUses = parseInt(document.getElementById('edit-kit-uses').value);
        const kitStatus = document.getElementById('edit-kit-status').value;

        // Encontrar e atualizar o kit nos dados
        const kitIndex = kitsData.findIndex(k => k.name === kitName);
        if (kitIndex !== -1) {
            kitsData[kitIndex].description = kitDescription;
            kitsData[kitIndex].uses = kitUses;
            kitsData[kitIndex].status = kitStatus;

            // Atualizar a tabela
            updateKitTable();

            // Mostrar mensagem de sucesso
            showNotification('Kit atualizado com sucesso!', 'success');
        }

        // Fechar modal
        editKitModal.classList.add('hidden');
    });

    // Cancelar edição
    document.getElementById('cancel-edit-kit').addEventListener('click', function () {
        editKitModal.classList.add('hidden');
    });

    // =======================================================
    // 7.3 FUNCIONALIDADE REMOVER KIT - ATUALIZADA
    // =======================================================

    function setupRemoveKitButtons() {
        document.querySelectorAll('.btn-remover').forEach(button => {
            button.addEventListener('click', function () {
                const kitId = this.dataset.kitId;
                const kitName = this.closest('tr').querySelector('td[data-label="Nome do Kit"]').textContent;

                // Usar a nova função de exclusão
                excluirKitFrontend(kitId, kitName);
            });
        });
    }

    function showRemoveKitConfirmation(kitName, row) {
        // Criar modal de confirmação similar ao dos agendamentos
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
                    Tem certeza de que deseja remover o kit "<strong>${kitName}</strong>"?
                </p>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn-secondary" style="background: #f2f2f3; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        Não
                    </button>
                    <button class="btn-danger" style="background: #b9080f; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Sim, remover
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Configurar botões do modal
        const btnNao = modal.querySelector('.btn-secondary');
        const btnSim = modal.querySelector('.btn-danger');

        btnNao.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        btnSim.addEventListener('click', function () {
            removeKit(kitId, kitName); // Agora passa o ID
            document.body.removeChild(modal);
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async function removeKit(kitId, kitName) {
        try {
            await api.deletarKit(kitId);
            showNotification('Kit removido com sucesso!', 'success');
            await carregarKits();
            await carregarEstatisticas();
            await carregarKitsDisponiveis();
        } catch (error) {
            showNotification(`Erro ao remover kit: ${error.message}`, 'error');
        }
    }

    // =======================================================
    // 7.4 ATUALIZAR TABELA DE KITS - COM NOVO ESTILO DO BOTÃO REMOVER
    // =======================================================

    // function updateKitTable() {
    //     const tbody = document.querySelector('#kits-content tbody');
    //     tbody.innerHTML = '';

    //     kitsData.forEach(kit => {
    //         const row = document.createElement('tr');

    //         // Mapear status para classes CSS
    //         const statusClass = {
    //             'ativo': 'status-active',
    //             'rascunho': 'status-draft',
    //             'arquivado': 'status-disabled'
    //         }[kit.status] || 'status-draft';

    //         row.innerHTML = `
    //         <td data-label="Nome do Kit">${kit.name}</td>
    //         <td data-label="Itens">${kit.items}</td>
    //         <td data-label="Usos">${kit.uses}</td>
    //         <td data-label="Status"><span class="badge ${statusClass}">${formatStatusForDisplay(kit.status)}</span></td>
    //         <td data-label="Criado em">${kit.createdDate}</td>
    //         <td data-label="Ações" class="kit-actions-compact">
    //             <button class="btn btn-light">👁️ Ver</button>
    //             <button class="btn btn-light">✏️ Editar</button>
    //             <button class="btn-remover" style="background: #b9080f; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
    //                 🗑️ Remover
    //             </button>
    //         </td>
    //     `;

    //         tbody.appendChild(row);
    //     });

    //     // Reconfigurar os event listeners dos botões
    //     setupViewKitButtons();
    //     setupEditKitButtons();
    //     setupRemoveKitButtons();
    // }

    // =======================================================
    // 7.5 FUNÇÃO DE NOTIFICAÇÃO
    // =======================================================

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Estilos da notificação
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

        // Cores baseadas no tipo
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



    // Inicializar funcionalidades dos kits
    setupViewKitButtons();
    setupEditKitButtons();
    setupRemoveKitButtons();

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
    // 8. LÓGICA DOS BOTÕES VER, EDITAR E CANCELAR AGENDAMENTOS
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

    // =======================================================
    // 8.2 MODAL EDITAR AGENDAMENTO - NOVA VERSÃO ORGANIZADA
    // =======================================================

    function setupModalEditarAgendamento() {
        // Configurar botões da tabela de agendamentos - Editar
        document.querySelectorAll('#agendamentos-content .kit-actions-compact button').forEach(botao => {
            botao.addEventListener('click', function (e) {
                e.preventDefault();
                const linha = this.closest('tr');
                const acao = this.textContent.trim();

                // Pegando dados da linha
                const dataHora = linha.cells[0].textContent;
                const lab = linha.cells[1].textContent;
                const kit = linha.cells[2].textContent;
                const status = linha.cells[3].textContent.trim();

                // 👁️ VER
                if (acao.includes('👁️')) {
                    document.getElementById('verAgendamentoInfo').innerHTML = `
                    <p><strong>Data e Hora:</strong> ${dataHora}</p>
                    <p><strong>Laboratório:</strong> ${lab}</p>
                    <p><strong>Kit/Material:</strong> ${kit}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <p><strong>Professor:</strong> Você</p>
                    <p><strong>Data do Agendamento:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                `;
                    abrirModal(modalVerAgendamento);
                }

                // ✏️ EDITAR - NOVA VERSÃO ORGANIZADA
                if (acao.includes('✏️')) {
                    // Extrair data e hora do texto
                    const [data, horario] = dataHora.split(' (');
                    const horaFormatada = horario ? horario.replace(')', '') : '';

                    // Preencher formulário com dados atuais de forma organizada
                    document.getElementById('editarData').value = data || '';
                    document.getElementById('editarHora').value = horaFormatada || '';
                    document.getElementById('editarLab').value = lab || '';
                    document.getElementById('editarKit').value = kit || '';

                    abrirModal(modalEditarAgendamento);
                }

                // ❌ CANCELAR
                if (acao.includes('❌')) {
                    abrirModal(modalCancelarAgendamento);

                    // Configurar confirmação de cancelamento
                    document.getElementById('confirmarCancelamento').onclick = function () {
                        linha.remove();
                        showNotification('Agendamento cancelado com sucesso!', 'success');
                        fecharModal(modalCancelarAgendamento);
                    };
                }

                // ❓ MOTIVO
                if (acao.includes('❓')) {
                    document.getElementById('motivoTexto').textContent =
                        "O laboratório estava indisponível na data solicitada devido a manutenção programada.";
                    abrirModal(modalMotivoAgendamento);
                }
            });
        });

        // Submissão do formulário de edição
        document.getElementById('formEditarAgendamento').addEventListener('submit', function (e) {
            e.preventDefault();

            // Coletar dados do formulário
            const novaData = document.getElementById('editarData').value;
            const novoHorario = document.getElementById('editarHora').value;
            const novoLab = document.getElementById('editarLab').value;
            const novoKit = document.getElementById('editarKit').value;

            // Validar dados
            if (!novaData || !novoHorario || !novoLab || !novoKit) {
                showNotification('Por favor, preencha todos os campos!', 'error');
                return;
            }

            // Aqui você implementaria a lógica para atualizar o agendamento no banco de dados
            console.log('Agendamento atualizado:', {
                data: novaData,
                horario: novoHorario,
                laboratorio: novoLab,
                kit: novoKit
            });

            showNotification('Agendamento atualizado com sucesso!', 'success');
            fecharModal(modalEditarAgendamento);

            // Atualizar a interface (em uma implementação real, você recarregaria os dados)
            // updateAgendamentosTable();
        });

        // Botão "Não" do modal de cancelamento
        document.getElementById('fecharCancelar').addEventListener('click', function () {
            fecharModal(modalCancelarAgendamento);
        });
    }

    // =======================================================
    // 8.3 ATUALIZAR ESTILOS DO MODAL EDITAR AGENDAMENTO
    // =======================================================



    // Inicializar botões de agendamento
    setupModalEditarAgendamento();
    setupBotoesFecharAgendamentos();

    // Inicializar a tabela de kits
    updateKitTable();


    // =======================================================
    // 8.4 NOVA LÓGICA DO MODAL EDITAR AGENDAMENTO - VERSÃO COMPLETA
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

        // Preencher formulário com dados do agendamento
        function preencherFormularioEditar(agendamento) {
            limparFormularioEditar();

            // Preencher data
            document.getElementById('editarData').value = agendamento.data || '';

            // Preencher horários
            if (agendamento.horarios && agendamento.horarios.length > 0) {
                horariosContainer.innerHTML = '';
                horariosCount = 0;

                agendamento.horarios.forEach(horario => {
                    const [inicio, fim] = horario.split(' - ');
                    adicionarHorarioEditar(inicio, fim);
                });
            }

            // Preencher laboratório
            document.getElementById('editarLab').value = agendamento.laboratorio || '';

            // Preencher materiais
            if (agendamento.kit && agendamento.kit !== 'Nenhum') {
                selectKitExistente.value = agendamento.kit;
            } else if (agendamento.materiais_solicitados) {
                materiaisManuais = agendamento.materiais_solicitados.map(mat => ({
                    nome: typeof mat === 'string' ? mat.replace('Kit: ', '') : mat.name,
                    quantidade: mat.quantity || 1
                }));
                renderizarMateriaisEditar();
            }
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
        formEditar.addEventListener('submit', function (e) {
            e.preventDefault();

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
            let materiais = [];
            if (kitExistente) {
                materiais = [`Kit: ${kitExistente}`];
            } else {
                materiais = materiaisManuais
                    .filter(mat => mat.nome.trim() !== '')
                    .map(mat => ({
                        name: mat.nome.trim(),
                        quantity: mat.quantidade,
                        unit: 'unidade'
                    }));
            }

            // Validar
            if (!data || !laboratorio || horarios.length === 0 || (!kitExistente && materiais.length === 0)) {
                showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
                return;
            }

            // Criar objeto do agendamento atualizado
            const agendamentoAtualizado = {
                data: data,
                laboratorio: laboratorio,
                horarios: horarios,
                kit: kitExistente || 'Nenhum',
                materiais_solicitados: materiais
            };

            console.log('Agendamento atualizado:', agendamentoAtualizado);

            // Aqui você implementaria a lógica para salvar no banco de dados
            showNotification('Agendamento atualizado com sucesso!', 'success');
            fecharModal(modalEditar);

            // Em uma implementação real, você atualizaria a interface aqui
            // updateAgendamentosTable();
        });

        // Configurar botões da tabela de agendamentos - Editar
        document.querySelectorAll('#agendamentos-content .kit-actions-compact button').forEach(botao => {
            botao.addEventListener('click', function (e) {
                e.preventDefault();
                const linha = this.closest('tr');
                const acao = this.textContent.trim();

                if (acao.includes('✏️')) {
                    // Simular dados do agendamento (em um sistema real, você buscaria do banco)
                    const dataHora = linha.cells[0].textContent;
                    const lab = linha.cells[1].textContent;
                    const kit = linha.cells[2].textContent;

                    // Extrair data e horários do texto
                    const [data, horarioTexto] = dataHora.split(' (');
                    const horarios = horarioTexto ? [horarioTexto.replace(')', '')] : [];

                    const agendamento = {
                        data: data || '',
                        laboratorio: lab || '',
                        kit: kit || '',
                        horarios: horarios,
                        materiais_solicitados: kit !== 'Nenhum' ? [`Kit: ${kit}`] : []
                    };

                    preencherFormularioEditar(agendamento);
                    abrirModal(modalEditar);
                }
            });
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

    // Inicializar o modal de edição completo
    setupModalEditarAgendamentoCompleto();

    // Inicia o carregamento dos dados
    carregarDadosIniciais();

});