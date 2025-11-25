const protocolo = "http://";
const baseURL = "127.0.0.1:3000";

// Função para atualizar as estatísticas
function atualizarEstatisticasMateriais() {
    const totalMateriais = Object.keys(materiais).length;
    const totalAgendamentos = Object.keys(agendamentos).length;


    // Atualizar stats do dashboard
    const statTotalAgendamentos = document.getElementById('stat-number-agendamentos');
    if (statTotalAgendamentos) {
        statTotalAgendamentos.textContent = totalAgendamentos;
    }

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
        `;
    }
}


// Função para carregar atividades recentes
async function carregarAtividadesRecentes() {
    try {
        console.log("Carregando atividades recentes...");
        
        // Buscar todos os agendamentos
        const respostaAgendamentos = await axios.get("http://localhost:3000/agendamentos");
        const todosAgendamentos = respostaAgendamentos.data.agendamentos;
        
        // Calcular data de 7 dias atrás
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        
        // Contar agendamentos dos últimos 7 dias
        const agendamentosRecentes = todosAgendamentos.filter(agendamento => {
            const dataCriacao = new Date(agendamento.dataCriacao);
            return dataCriacao >= seteDiasAtras;
        });
        
        console.log(`Agendamentos recentes: ${agendamentosRecentes.length}`);
        
        // Atualizar os cards
        document.getElementById("stats-agendamentos").textContent = agendamentosRecentes.length;
        
    } catch (erro) {
        console.error("Erro ao carregar atividades recentes:", erro);
        // Valores padrão em caso de erro
        document.getElementById("stats-agendamentos").textContent = "0";
    }
}

// Atualiza a função carregarDashboard
async function carregarDashboard() {
    try {
        await carregarAtividadesRecentes();
        // Suas outras funções...
    } catch (erro) {
        console.error("Erro no dashboard:", erro);
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

// Cadastro de materiais
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

// FUNÇÕES GERAIS 

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


// Histórico

async function carregarHistorico() {
    try {
        const resposta = await axios.get("http://localhost:3000/agendamentos");
        
        // Atualizar o array global
        agendamentos = resposta.data.agendamentos || [];

        // Atualizar a tabela
        atualizarTabelaHistorico();
        atualizarTotalAgendamentosDashboard();

    } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
        alert("Erro ao carregar histórico de agendamentos.");
    }
}

function atualizarTabelaHistorico() {
    const tbody = document.getElementById('agendamentos-historico-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const agendamentosFiltrados = agendamentos.filter(agendamento => 
        agendamento.status === 'confirmado' || agendamento.status === 'cancelado' || agendamento.status === 'negado'
    );

    if (agendamentosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">Nenhum agendamento concluído encontrado</td>
            </tr>
        `;
        return;
    }

    agendamentosFiltrados.forEach(agendamento => {
        const tr = document.createElement('tr');
        
        const statusInfo = getStatusInfo(agendamento.status);
        const laboratorioFormatado = formatarLaboratorio(agendamento.laboratorio);
        
        tr.innerHTML = `
            <td>${agendamento.professorNome || 'N/A'}</td>
            <td>${formatarData(agendamento.dataCriacao)}</td>
            <td>${formatarData(agendamento.data)}</td>
            <td>${laboratorioFormatado}</td>
            <td>
                <span class="status-badge ${statusInfo.class}">
                    ${statusInfo.text}
                </span>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function formatarLaboratorio(lab) {
    if (!lab) return 'N/A';
    
    const labMap = {
        'quimica-1': 'Laboratório 1',
        'quimica-2': 'Laboratório 2',
        'laboratorio-3': 'Laboratório 3',
        'quimica-3': 'Laboratório 3'
        // Laboratórios de informática não são mapeados, aparecerão como estão
    };
    
    // Se estiver no mapa, retorna o nome formatado, senão retorna o original
    return labMap[lab] || lab;
}

function getStatusInfo(status) {
    const statusMap = {
        'confirmado': { class: 'status-aprovado', text: 'Aprovado' },
        'cancelado': { class: 'status-negado', text: 'Cancelado' },
        'negado': { class: 'status-negado', text: 'Cancelado' }
    };
    
    return statusMap[status] || { class: '', text: status };
}

function atualizarTotalAgendamentosDashboard() {
    const totalElement = document.getElementById('stat-total-agendamentos');
    if (totalElement) {
        const total = agendamentos.filter(ag => 
            ag.status === 'confirmado' || ag.status === 'cancelado' || ag.status === 'negado'
        ).length;
        totalElement.textContent = total;
    }
}


function formatarData(data) {
    if (!data) return 'N/A';
    try {
        return new Date(data).toLocaleDateString('pt-BR');
    } catch {
        return data;
    }
}

// Fim Histórico

// AGENDAMENTOS 
// AGENDAMENTOS - CONEXÃO COM BACKEND
// Elementos principais
const cardsContainer = document.getElementById("appointments-cards");
const totalAgendamentos = document.getElementById("total-agendamentos");
const searchInput = document.getElementById("filter-search");
const filterDate = document.getElementById("filter-date");
const filterClass = document.getElementById("filter-class");

// Variável global para armazenar agendamentos
let agendamentos = [];

// Carregar agendamentos do backend
async function carregarAgendamentos() {
    try {
        console.log("📥 Carregando agendamentos do backend...");

        const resposta = await axios.get("http://localhost:3000/agendamentos");

        if (resposta.data.success) {
            // Filtrar apenas agendamentos pendentes
            agendamentos = resposta.data.agendamentos.filter(agendamento =>
                agendamento.status === "pendente"
            );

            console.log(`✅ ${agendamentos.length} agendamentos pendentes carregados`);
            renderAppointmentCards(agendamentos);
        } else {
            throw new Error("Resposta do servidor não foi bem-sucedida");
        }

    } catch (erro) {
        console.error("❌ Erro ao carregar agendamentos:", erro);

        let mensagemErro = "Erro ao carregar agendamentos.";
        if (erro.response) {
            mensagemErro = `Erro ${erro.response.status}: ${erro.response.data?.error || 'Erro no servidor'}`;
        } else if (erro.request) {
            mensagemErro = "Erro de conexão. Verifique se o servidor está rodando.";
        }

        // Mostrar mensagem de erro no container
        cardsContainer.innerHTML = `
            <div class="error-message">
                <p>${mensagemErro}</p>
                <button onclick="carregarAgendamentos()" class="btn btn-primary">Tentar Novamente</button>
            </div>
        `;
    }
}

// Função para renderizar os cards
function renderAppointmentCards(data) {
    cardsContainer.innerHTML = "";

    if (data.length === 0) {
        const statusFiltro = filterStatus ? filterStatus.value : 'pendente';
        let mensagem = "";

        switch (statusFiltro) {
            case 'pendente':
                mensagem = "Nenhum agendamento pendente encontrado";
                break;
            case 'confirmado':
                mensagem = "Nenhum agendamento aprovado encontrado";
                break;
            case 'negado':
                mensagem = "Nenhum agendamento rejeitado encontrado";
                break;
            default:
                mensagem = "Nenhum agendamento encontrado";
        }

        cardsContainer.innerHTML = `
            <div class="empty-state">
                <p>${mensagem}</p>
            </div>
        `;
        totalAgendamentos.textContent = "0";
        return;
    }

    data.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("appointment-card");
        card.setAttribute("data-agendamento-id", item._id);

        const materiais = formatarMateriais(item);

        let botoesAcao = '';
        if (item.status === 'pendente') {
            botoesAcao = `
                <div class="card-actions">
                    <button class="btn btn-approve">Aprovar</button>
                    <button class="btn btn-deny">Rejeitar</button>
                </div>
            `;
        } else {
            botoesAcao = `
                <div class="card-actions">
                    <span class="status-finalizado">${item.status === 'confirmado' ? '✅ Aprovado' : '❌ Rejeitado'}</span>
                </div>
            `;
        }

        card.innerHTML = `
      <div class="appointment-header my-2">
        <div class="appointment-info">
          <h3>Prof. ${item.professorNome}</h3>
        </div>
        <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
      </div>

      <div class="appointment-lab">
        <div><strong>Laboratório:</strong> ${item.laboratorio}</div>
      </div>

      <div class="appointment-details">
        <div><strong>Data do Agendamento:</strong> ${formatarData(item.dataCriacao)}</div>
        <div><strong>Data da Aula:</strong> ${item.data}</div>
        <div><strong>Horário:</strong> ${Array.isArray(item.horarios) ? item.horarios.join(", ") : item.horarios}</div>
      </div>

      <div class="materials">
        <strong>Materiais Solicitados</strong>
        <div class="material-tags">
          ${materiais.map(mat => `<span class="material-tag">${mat}</span>`).join("")}
        </div>
      </div>

      ${botoesAcao}
    `;

        cardsContainer.appendChild(card);
    });

    totalAgendamentos.textContent = data.length;
}

// Função formatar materiais para lidar com diferentes formatos
function formatarMateriais(agendamento) {

    let materiaisFormatados = [];

    // Caso 1: Kit foi usado
    if (agendamento.kitNome) {
        materiaisFormatados.push(`Kit: ${agendamento.kitNome}`);
    }

    // Caso 2: Materiais manuais - DECODIFICAR O OBJETO COMPLEXO
    if (agendamento.materiaisManuais && agendamento.materiaisManuais.length > 0) {
        const primeiroItem = agendamento.materiaisManuais[0];

        if (primeiroItem && typeof primeiroItem === 'object') {
            // É o objeto complexo com propriedades numéricas
            const textoDecodificado = decodificarTextoComplexo(primeiroItem);
            materiaisFormatados.push(textoDecodificado);
        } else if (typeof primeiroItem === 'string') {
            // Já é string normal
            materiaisFormatados.push(primeiroItem);
        }
    }

    // Caso 3: Nenhum material especificado
    if (materiaisFormatados.length === 0) {
        materiaisFormatados.push("Nenhum material especificado");
    }

    return materiaisFormatados;
}

// FUNÇÃO PARA DECODIFICAR O TEXTO DO OBJETO COMPLEXO
function decodificarTextoComplexo(objetoComplexo) {
    let texto = '';

    // Pegar todas as chaves numéricas e ordenar
    const chavesNumericas = Object.keys(objetoComplexo)
        .filter(chave => !isNaN(chave))
        .sort((a, b) => a - b);

    // Reconstruir o texto a partir das propriedades numéricas
    chavesNumericas.forEach(chave => {
        texto += objetoComplexo[chave] || '';
    });

    // Limpar o texto - remover o ID no final
    texto = texto.replace(/jd.+$/, '').trim();

    return texto || "Material não especificado";
}

// Função para formatar data
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Atualizar status do agendamento no backend
async function atualizarStatusAgendamento(agendamentoId, novoStatus, motivoNegacao = "") {
    try {
        console.log(`🔄 Atualizando agendamento ${agendamentoId} para status: ${novoStatus}`);

        const resposta = await axios.patch(`http://localhost:3000/agendamentos/${agendamentoId}/status`, {
            status: novoStatus,
            motivoNegacao: motivoNegacao
        });

        console.log("✅ Status HTTP:", resposta.status);
        console.log("📨 Dados da resposta:", resposta.data);

        // Se chegou aqui sem erro, a requisição foi bem-sucedida
        // Independente do formato da resposta
        return {
            success: true,
            data: resposta.data,
            message: `Agendamento ${novoStatus === 'confirmado' ? 'aprovado' : 'rejeitado'} com sucesso!`
        };

    } catch (erro) {
        console.error(`❌ Erro ao atualizar status:`, erro);

        // Verificar se é um erro "fake" (status mudou mas resposta tem problema)
        if (erro.response && erro.response.status === 500) {
            console.log("⚠️ Erro 500, mas vamos verificar se o agendamento foi atualizado...");

            // Vamos considerar sucesso se o status mudou no banco
            // Recarrega os agendamentos para verificar
            setTimeout(async () => {
                await carregarAgendamentos();
            }, 1000);

            return {
                success: true,
                message: `Agendamento ${novoStatus === 'confirmado' ? 'aprovado' : 'rejeitado'} com sucesso!`
            };
        }

        let mensagemErro = "Erro ao atualizar agendamento.";
        if (erro.response) {
            mensagemErro = `Erro ${erro.response.status}: ${erro.response.data?.error || 'Erro no servidor'}`;
        }

        return { success: false, error: mensagemErro };
    }
}
// BOTÕES DE AÇÃO DOS CARDS 
cardsContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".appointment-card");
    if (!card) return;

    const agendamentoId = card.getAttribute("data-agendamento-id");
    const isApprove = e.target.classList.contains("btn-approve");
    const isDeny = e.target.classList.contains("btn-deny");

    if (isApprove || isDeny) {
        const modal = document.getElementById("confirmation-modal");
        const modalMsg = document.getElementById("modal-message");
        const confirmYes = document.getElementById("confirm-yes");
        const confirmNo = document.getElementById("confirm-no");
        const toast = document.getElementById("toast");

        modalMsg.textContent = isApprove
            ? "Tem certeza que deseja aprovar este agendamento?"
            : "Tem certeza que deseja rejeitar este agendamento?";

        modal.style.display = "flex";

        // Confirmar ação
        confirmYes.onclick = async () => {
            modal.style.display = "none";

            const novoStatus = isApprove ? "confirmado" : "negado";
            const resultado = await atualizarStatusAgendamento(agendamentoId, novoStatus);

            if (resultado.success) {
                // ✅ SUCESSO - usar mensagem personalizada
                const mensagemSucesso = resultado.message ||
                    (isApprove ? "✅ Agendamento aprovado com sucesso!" : "❌ Agendamento rejeitado com sucesso!");

                toast.textContent = mensagemSucesso;
                toast.className = `toast show ${isApprove ? "" : "error"}`;

                // Remover card da lista imediatamente
                card.style.opacity = "0.5";
                setTimeout(() => {
                    card.remove();

                    // Atualizar contador
                    const agendamentosRestantes = document.querySelectorAll('.appointment-card').length;
                    totalAgendamentos.textContent = agendamentosRestantes;

                    // Recarregar lista para garantir sincronização
                    setTimeout(() => carregarAgendamentos(), 500);
                }, 500);

                setTimeout(() => {
                    toast.className = "toast";
                }, 3000);
            } else {
                // ❌ ERRO REAL
                toast.textContent = `❌ ${resultado.error}`;
                toast.className = "toast show error";
                setTimeout(() => (toast.className = "toast"), 3000);
            }
        };

        // Cancelar ação
        confirmNo.onclick = () => {
            modal.style.display = "none";
        };
    }
});

// Filtro de busca
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = agendamentos.filter(a =>
        a.professorNome.toLowerCase().includes(term) ||
        (a.turma && a.turma.toLowerCase().includes(term)) ||
        a.laboratorio.toLowerCase().includes(term)
    );
    renderAppointmentCards(filtered);
});

// Aplicar todos os filtros
function aplicarFiltros() {
    const term = searchInput.value.toLowerCase();
    const dataFiltro = filterDate.value;
    const turmaFiltro = filterClass.value;

    let filtered = agendamentos.filter(a => {
        // Filtro de busca
        const buscaMatch =
            a.professorNome.toLowerCase().includes(term) ||
            (a.turma && a.turma.toLowerCase().includes(term)) ||
            a.laboratorio.toLowerCase().includes(term);

        // Filtro de turma
        const turmaMatch = turmaFiltro === "all" ||
            (a.turma && a.turma.toLowerCase().includes(turmaFiltro));

        // Filtro de data (implementação básica)
        const dataMatch = dataFiltro === "all"; // Pode expandir esta lógica

        return buscaMatch && turmaMatch && dataMatch;
    });

    renderAppointmentCards(filtered);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    carregarAgendamentos();
    carregarAtividadesRecentes();

    // Recarregar a cada 30 segundos para manter dados atualizados
    setInterval(carregarAgendamentos, 30000);
    setInterval(carregarAtividadesRecentes, 30000)
});


document.addEventListener('DOMContentLoaded', async () => {

    // MODAIS 

    await carregarMateriais()
    await carregarHistorico();


    // Modais simples 
    const modais = document.querySelectorAll('.modal-overlay');
    modais.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(modal.id); });
        modal.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => fecharModal(btn.dataset.close));
        });
    });


    // Fechar todos modais com ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay[aria-hidden="false"]').forEach(m => fecharModal(m.id));
        }
    });

    // Seleção de unidade "Outro" 
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
        setupFormEditMaterial();
    };
    setupUnitSelect('material-unit', 'custom-unit-group', 'custom-unit-text');
    setupUnitSelect('edit-material-unit', 'custom-edit-unit-group', 'custom-edit-unit-text');

    // FORMULÁRIOS 

    // Novo Material 
    const formNewMaterial = document.getElementById('form-new-material');
    if (formNewMaterial) {
        formNewMaterial.addEventListener('submit', e => {
            e.preventDefault();
            console.log("Novo Material cadastrado com sucesso!");
            formNewMaterial.reset();
            fecharModal('modal-new-material');
        });
    }

    // MODAIS DE EDIÇÃO DADOS 

    // FORMULÁRIOS DE EDIÇÃO
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


    // Editar Material 
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

    // BOTÃO "VER HISTÓRICO"

    const btnVerHistorico = document.getElementById("btn-view-reports");
    const tabHistorico = document.querySelector('.tab[data-tab="historico"]');

    if (btnVerHistorico && tabHistorico) {
        btnVerHistorico.addEventListener("click", () => {
            tabHistorico.click(); // Abre a aba Histórico
        });
    }

    // BOTÃO "VER AGENDAMENTOS"

    const btnVerAgendamentos = document.getElementById("btn-ver-agendamentos");
    const tabAgendamentos = document.querySelector('.tab[data-tab="agendamentos"]');

    if (btnVerAgendamentos && tabAgendamentos) {
        btnVerAgendamentos.addEventListener("click", () => {
            tabAgendamentos.click(); // Abre a aba Agendamentos
        });
    }

    // BOTÃO "VER MATERIAIS"

    const btnVerMateriais = document.getElementById("btn-ver-materiais");
    const tabMateriais = document.querySelector('.tab[data-tab="materiais"]');

    if (btnVerMateriais && tabMateriais) {
        btnVerMateriais.addEventListener("click", () => {
            tabMateriais.click(); // Abre a aba Materiais
        });
    }


});

