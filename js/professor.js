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

    // Abre o modal de agendamento
    if (btnNovoAgendamento) {
        btnNovoAgendamento.addEventListener('click', () => {
            appointmentModal.style.display = 'flex';
            generateCalendar(); // Chama a função para gerar o calendário ao abrir
        });
    }

    // Fecha o modal de agendamento
    const closeAppointmentModal = () => {
        appointmentModal.style.display = 'none';
        // Limpar seleção ao fechar
        labSelect.value = "";
        selectedDate = null; 
        timeSelectContainer.innerHTML = '<p class="placeholder-msg">Selecione uma data e um laboratório.</p>';
        btnSchedule.disabled = true;
        timeLimitMessage.classList.add('hidden');
    };

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

        if (selectedTimes.length === 0 || selectedTimes.length > MAX_SCHEDULES) {
             console.error("Erro de validação: Número de horários incorreto.");
             return;
        }

        const agendamento = {
            data: selectedDate,
            laboratorio: labSelect.value,
            horarios: selectedTimes, 
            kit: document.getElementById('kit-select').value || 'Nenhum'
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
                    .map(item => ({name: item.name.trim(), quantity: item.quantity, unit: item.unit}))
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

});
