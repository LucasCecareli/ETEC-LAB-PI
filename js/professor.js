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


    btnSchedule.addEventListener('click', () => {
        const selectedTimes = Array.from(
            document.querySelectorAll('#time-select-container input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        const selectedKit = document.getElementById('kit-select').value;
        let materialsToUse = [];

        if (selectedKit === 'Nenhum') {
            // Inclui materiais manuais, validando nome e quantidade mínima
            materialsToUse = manualMaterials
                .filter(mat => mat.name.trim() !== '' && mat.quantity >= 1)
                .map(mat => ({ name: mat.name.trim(), quantity: mat.quantity, unit: 'unidade' })); // Adicionado unidade padrão
        } else {
            // Aqui, em um sistema real, você buscaria os itens do Kit no banco
            materialsToUse = [`Kit: ${selectedKit}`];
        }


        if (selectedTimes.length === 0 || selectedTimes.length > MAX_SCHEDULES) {
            console.error("Erro de validação: Número de horários incorreto.");
            return;
        }

        const agendamento = {
            data: selectedDate,
            laboratorio: labSelect.value,
            horarios: selectedTimes,
            kit: selectedKit,
            materiais_solicitados: materialsToUse
        };

        console.log('Agendamento Enviado:', agendamento);
        // Usamos uma mensagem personalizada em vez de alert() conforme a regra
        const messageBox = document.createElement('div');
        messageBox.className = 'limit-message';
        messageBox.style.marginTop = '15px';
        messageBox.style.backgroundColor = '#d1f7d6';
        messageBox.style.borderColor = '#1b9b46';
        messageBox.style.color = '#1b9b46';
        messageBox.textContent = `Agendamento criado para ${agendamento.data} no ${agendamento.laboratorio} nos horários: ${agendamento.horarios.join(', ')}.`;

        document.querySelector('.modal-body').prepend(messageBox);
        setTimeout(() => messageBox.remove(), 5000); // Remove a mensagem após 5 segundos

        closeAppointmentModal();
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
    kitForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const kitData = {
            name: kitNameInput.value.trim(),
            description: kitDescriptionInput.value.trim(),
            // Filtra e limpa os dados antes de salvar
            items: kitItems
                .filter(item => item.name.trim() !== '' && item.quantity >= 1)
                .map(item => ({ name: item.name.trim(), quantity: item.quantity, unit: item.unit }))
        };

        if (kitData.items.length === 0) {
            // Usamos um console error para simular o erro em vez de alert()
            console.error('O kit deve ter pelo menos um item válido.');
            return;
        }

        // Simulação do envio (código real de Firebase/Backend aqui)
        console.log('Kit Criado (Dados Finais):', kitData);

        const messageBox = document.createElement('div');
        messageBox.className = 'limit-message';
        messageBox.style.marginTop = '15px';
        messageBox.style.backgroundColor = '#d1f7d6';
        messageBox.style.borderColor = '#1b9b46';
        messageBox.style.color = '#1b9b46';
        messageBox.textContent = `Kit "${kitData.name}" criado com sucesso! (${kitData.items.length} itens registrados)`;

        document.querySelector('#new-kit-modal .modal-body').prepend(messageBox);
        setTimeout(() => messageBox.remove(), 5000); // Remove a mensagem após 5 segundos


        // Fechar o modal
        closeKitModal();
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
    let kitsData = [
        {
            id: 1,
            name: "Kit Titulação Básica",
            description: "Kit completo para aulas de titulação ácido-base com indicadores.",
            items: 8,
            uses: 5,
            status: "ativo",
            createdDate: "10/01/2025",
            materials: [
                { name: "Béquer 50ml", quantity: 8, unit: "unidade" },
                { name: "Pipeta", quantity: 8, unit: "unidade" },
                { name: "Indicador Fenolftaleína", quantity: 1, unit: "frasco" }
            ]
        },
        {
            id: 2,
            name: "Kit Síntese Orgânica",
            description: "Materiais para síntese de compostos orgânicos simples.",
            items: 12,
            uses: 3,
            status: "ativo",
            createdDate: "08/01/2025",
            materials: [
                { name: "Balão de Fundo Redondo", quantity: 12, unit: "unidade" },
                { name: "Condensador", quantity: 12, unit: "unidade" },
                { name: "Termômetro", quantity: 12, unit: "unidade" }
            ]
        },
        {
            id: 3,
            name: "Kit Medidas Elétricas",
            description: "Instrumentos para medições elétricas básicas.",
            items: 15,
            uses: 15,
            status: "ativo",
            createdDate: "20/12/2024",
            materials: [
                { name: "Multímetro Digital", quantity: 15, unit: "unidade" },
                { name: "Fios Jumper", quantity: 45, unit: "unidade" },
                { name: "Protoboard", quantity: 15, unit: "unidade" }
            ]
        },
        {
            id: 4,
            name: "Kit Desmontagem PC",
            description: "Ferramentas para desmontagem e manutenção de computadores.",
            items: 5,
            uses: 0,
            status: "rascunho",
            createdDate: "01/03/2025",
            materials: [
                { name: "Chave Phillips", quantity: 15, unit: "unidade" },
                { name: "Pulseira Anti-estática", quantity: 15, unit: "unidade" },
                { name: "Alicate", quantity: 15, unit: "unidade" }
            ]
        },
        {
            id: 5,
            name: "Kit Introdução à Biologia",
            description: "Materiais para aulas introdutórias de biologia celular.",
            items: 22,
            uses: 22,
            status: "arquivado",
            createdDate: "01/10/2024",
            materials: [
                { name: "Microscópio Óptico", quantity: 15, unit: "unidade" },
                { name: "Lâminas e Lamínulas", quantity: 150, unit: "conjunto" },
                { name: "Corantes Biológicos", quantity: 8, unit: "kit" }
            ]
        }
    ];

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

    function setupViewKitButtons() {
        document.querySelectorAll('.kit-actions-compact .btn-light:first-child').forEach(button => {
            button.addEventListener('click', function () {
                const row = this.closest('tr');
                const kitName = row.querySelector('td[data-label="Nome do Kit"]').textContent;

                // Encontrar o kit nos dados
                const kit = kitsData.find(k => k.name === kitName);
                if (kit) {
                    openViewKitModal(kit);
                }
            });
        });
    }

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

    function setupEditKitButtons() {
        document.querySelectorAll('.kit-actions-compact .btn-light:nth-child(2)').forEach(button => {
            button.addEventListener('click', function () {
                const row = this.closest('tr');
                const kitName = row.querySelector('td[data-label="Nome do Kit"]').textContent;

                // Encontrar o kit nos dados
                const kit = kitsData.find(k => k.name === kitName);
                if (kit) {
                    openEditKitModal(kit);
                }
            });
        });
    }

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
                const row = this.closest('tr');
                const kitName = row.querySelector('td[data-label="Nome do Kit"]').textContent;

                // Mostrar modal de confirmação igual ao dos agendamentos
                showRemoveKitConfirmation(kitName, row);
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
            removeKit(kitName);
            document.body.removeChild(modal);
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    function removeKit(kitName) {
        // Remover o kit dos dados
        kitsData = kitsData.filter(k => k.name !== kitName);

        // Atualizar a tabela
        updateKitTable();

        // Mostrar mensagem de sucesso
        showNotification('Kit removido com sucesso!', 'success');
    }

    // =======================================================
    // 7.4 ATUALIZAR TABELA DE KITS - COM NOVO ESTILO DO BOTÃO REMOVER
    // =======================================================

    function updateKitTable() {
        const tbody = document.querySelector('#kits-content tbody');
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
            <td data-label="Nome do Kit">${kit.name}</td>
            <td data-label="Itens">${kit.items}</td>
            <td data-label="Usos">${kit.uses}</td>
            <td data-label="Status"><span class="badge ${statusClass}">${formatStatusForDisplay(kit.status)}</span></td>
            <td data-label="Criado em">${kit.createdDate}</td>
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

        // Reconfigurar os event listeners dos botões
        setupViewKitButtons();
        setupEditKitButtons();
        setupRemoveKitButtons();
    }

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

});