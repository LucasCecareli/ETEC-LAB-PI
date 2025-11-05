const protocolo = "http://";
const baseURL = "127.0.0.1:3000";
const usuariosEndpoint = "/usuarios";

async function cadastrarUsuario() {
    const nome = document.getElementById("new-user-name").value;
    const email = document.getElementById("new-user-email").value;
    const perfilSelect = document.getElementById("new-user-role");
    const perfil = perfilSelect.options[perfilSelect.selectedIndex].value;
    const password = document.getElementById("new-user-password").value;

    if (!nome || !email || !perfil || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    if (!email.includes('@')) {
        alert("Por favor, insira um email válido.");
        return;
    }

    try {
        console.log("📤 Enviando dados:", { nome, email, perfil, password: "***" })

        const resposta = await axios.post("http://localhost:3000/usuarios", {
            nome,
            email,
            perfil,
            password
        });

        console.log("Usuário cadastrado:", resposta.data)
        alert("Usuário cadastrado com sucesso!")

        // Recarregar a lista de usuários
        await carregarUsuarios()
        await carregarDashboard()

        document.getElementById("form-new-user").reset()
        fecharModal("modal-new-user")

    } catch (erro) {
        console.error(" Erro ao cadastrar usuário:", erro)

        let mensagemErro = "Erro ao cadastrar usuário."

        if (erro.response) {
            console.error(" Status:", erro.response.status)
            console.error(" Dados:", erro.response.data)

            switch (erro.response.status) {
                case 400:
                    mensagemErro = "Dados inválidos. Verifique as informações.";
                    break;
                case 409:
                    mensagemErro = "Email já cadastrado.";
                    break;
                case 500:
                    mensagemErro = "Erro interno do servidor. Tente novamente.";
                    break;
                default:
                    mensagemErro = `Erro ${erro.response.status}: ${erro.response.data?.message || 'Erro no servidor'}`;
            }
        } else if (erro.request) {
            mensagemErro = "Erro de conexão. Verifique se o servidor está rodando.";
        } else {
            mensagemErro = "Erro de configuração: " + erro.message;
        }

        alert(mensagemErro);
    }
}
//carregar usuários
let usuarios = {}
async function carregarUsuarios() {
    try {
        const resposta = await axios.get("http://localhost:3000/usuarios");
        console.log("Usuários carregados:", resposta.data);

        // Converter array para objeto com IDs
        usuarios = {};
        resposta.data.forEach(usuario => {
            usuarios[usuario._id] = usuario;
        });

        // Atualizar a tabela
        atualizarTabelaUsuarios();
        atualizarEstatisticas();

        return usuarios;
    } catch (erro) {
        console.error(" Erro ao carregar usuários:", erro);
        alert("Erro ao carregar usuários do servidor.");
        return {};
    }
}

//atualiza a tabela de usuários
function atualizarTabelaUsuarios() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = ''; // Limpar tabela

    Object.keys(usuarios).forEach(usuarioId => {
        const usuario = usuarios[usuarioId];
        const linha = criarLinhaUsuario(usuarioId, usuario);
        tbody.appendChild(linha);
    });
}

//cria uma linha de usuário
function criarLinhaUsuario(usuarioId, usuario) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-user-id', usuarioId);

    // determina classe do status
    const statusClass = usuario.status === 'Ativo' ? 'status-active' : 'status-disabled';
    const textoBotao = usuario.status === 'Ativo' ? ' Desativar' : 'Reativar';

    tr.innerHTML = `
        <td data-label="Nome" class="user-name">${usuario.nome}</td>
        <td data-label="Perfil" class="user-profile">${usuario.perfil}</td>
        <td data-label="Email" class="user-email">${usuario.email}</td>
        <td data-label="Status">
            <span class="badge user-status ${statusClass}">${usuario.status}</span>
        </td>
        <td data-label="Ações" class="kit-actions-compact actions-cell">
            <button class="btn btn-light btn-edit-user" data-user-id="${usuarioId}">✏️ Editar</button>
            <button class="btn ${usuario.status === 'Ativo' ? 'btn-danger' : 'btn-success'} btn-remove-user" data-user-id="${usuarioId}">
                ${textoBotao}
            </button>
        </td>
    `;

    return tr;
}

//atualiza estatísticas
// Função para atualizar todas as estatísticas
function atualizarEstatisticas() {
    const totalUsuarios = Object.keys(usuarios).length;
    const professores = Object.values(usuarios).filter(u => u.perfil === 'Professor').length;
    const tecnicos = Object.values(usuarios).filter(u => u.perfil === 'Técnico').length;
    const administradores = Object.values(usuarios).filter(u => u.perfil === 'Administrador').length;

    // Atualizar o stats-grid (Dashboard)
    const statTotalUsuarios = document.getElementById('stat-total-usuarios');
    if (statTotalUsuarios) {
        statTotalUsuarios.textContent = totalUsuarios;
    }

    // Atualizar as estatísticas na seção de usuários
    const statsElement = document.querySelector('.kits-stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <span>Total: <strong>${totalUsuarios}</strong></span>
            <span>Professores: <strong>${professores}</strong></span>
            <span>Técnicos: <strong>${tecnicos}</strong></span>
            <span>Administradores: <strong>${administradores}</strong></span>
        `;
    }

    // Atualizar elementos individuais (se existirem)
    const totalUsuariosElement = document.getElementById('total-usuarios');
    const totalProfessoresElement = document.getElementById('total-professores');
    const totalTecnicosElement = document.getElementById('total-tecnicos');
    const totalAdministradoresElement = document.getElementById('total-administradores');

    if (totalUsuariosElement) totalUsuariosElement.textContent = totalUsuarios;
    if (totalProfessoresElement) totalProfessoresElement.textContent = professores;
    if (totalTecnicosElement) totalTecnicosElement.textContent = tecnicos;
    if (totalAdministradoresElement) totalAdministradoresElement.textContent = administradores;
}

// Materiais 

// verifica se o material já existe
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
                ` Atenção!\n\nJá existe um material com o nome "${mesmoNomeDescricaoDiferente.item}" mas com descrição diferente.\n\n` +
                `Existente: ${descricaoExistente}\n` +
                `Novo: ${novaDescricao}\n\n` +
                `Deseja cadastrar mesmo assim?`
            );
            return confirmar ? null : mesmoNomeDescricaoDiferente;
        }
        
        return null;
        
    } catch (erro) {
        console.error(" Erro ao verificar duplicatas:", erro);
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
        console.log(" Enviando dados do material:", {
            nome, descricao, categoria, quantidade, unidade, quantidadeMinima
        });

        // Verificação de duplicatas (atualizada para descrição opcional)
        const materialExistente = await verificarMaterialExistente(nome, descricao);
        if (materialExistente) {
            alert(` Material já cadastrado!\n\nItem: ${materialExistente.item}\nDescrição: ${materialExistente.descricao || '(sem descrição)'}\nQuantidade atual: ${materialExistente.quantidade} ${materialExistente.unidade}`);
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

        console.log(" Material cadastrado:", resposta.data);
        alert("Material cadastrado com sucesso!");

        // Recarregar a lista de materiais
        await carregarMateriais();
        
        // Limpar formulário e fechar modal
        document.getElementById("form-new-material").reset();
        fecharModal("modal-new-material");
        
    } catch (erro) {
        console.error(" Erro ao cadastrar material:", erro);
        
        let mensagemErro = "Erro ao cadastrar material.";
        
        if (erro.response) {
            console.error("Status:", erro.response.status);
            console.error( "Dados:", erro.response.data);
            
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
        console.error("Erro ao carregar materiais:", erro);
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
            <button class="btn-action btn-edit-material" data-material-id="${materialId}">
                <span class="edit-icon">✏️ Editar</span>
            </button>
            <button class="btn-action btn-remove-material" data-material-id="${materialId}">
                <span class="remove-icon">🗑️ Remover</span>
            </button>
        </td>
    `;

    return tr;
}

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
            // Aqui você pode adicionar uma rota PUT no backend quando precisar
            // const resposta = await axios.put(`http://localhost:3000/materiais/${materialId}`, dadosAtualizados);
            
            // Por enquanto, atualizamos localmente
            materiais[materialId] = { ...materiais[materialId], ...dadosAtualizados };
            atualizarTabelaMateriais();
            
            console.log("✅ Material atualizado:", dadosAtualizados);
            alert("Material atualizado com sucesso!");
            fecharModal('modal-edit-material');
        } catch (erro) {
            console.error("❌ Erro ao atualizar material:", erro);
            alert("Erro ao atualizar material.");
        }
    });
};

// Agendamentos 
// carrega e atualiza estatísticas de agendamentos
async function carregarEstatisticasAgendamentos() {
    try {
        // Supondo que você tenha uma rota para agendamentos
        // const resposta = await axios.get("http://localhost:3000/agendamentos");
        // const agendamentosMes = resposta.data.length;

        // Por enquanto, vamos manter o valor mockado ou calcular baseado em alguma lógica
        const agendamentosMes = 47; // Valor temporário

        const statTotalAgendamentos = document.getElementById('stat-total-agendamentos');
        if (statTotalAgendamentos) {
            statTotalAgendamentos.textContent = agendamentosMes;
        }

        return agendamentosMes;
    } catch (erro) {
        console.error(" Erro ao carregar agendamentos:", erro);
        return 0;
    }
}
// Função para carregar todos os dados do dashboard
async function carregarDashboard() {
    try {
        await Promise.all([
            carregarUsuarios(),
            carregarEstatisticasMateriais(),
            carregarEstatisticasAgendamentos()
        ]);
        console.log("Dashboard carregado com sucesso!");
    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
    }
}

// ======================= DADOS SIMULADOS =======================
const laboratorios = {
    '1': { nome: 'Laboratório 1', descricao: 'Química Geral', capacidade: 20 },
    '2': { nome: 'Laboratório 2', descricao: 'Química Orgânica', capacidade: 18 },
    '3': { nome: 'Laboratório 3', descricao: 'Análise Quantitativa', capacidade: 16 }
};

let materiais = {};

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

// ======================= TABS =======================
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        const target = document.getElementById(tab.dataset.tab);
        if (target) target.classList.add("active");
    });
});

const setupFormEditUsuario = () => {
    const form = document.getElementById('form-edit-user');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuarioId = document.getElementById('edit-user-id').value;

        const dadosAtualizados = {
            nome: document.getElementById('edit-user-name').value,
            email: document.getElementById('edit-user-email').value,
            perfil: document.getElementById('edit-user-profile').value
        };

        try {
            usuarios[usuarioId] = { ...usuarios[usuarioId], ...dadosAtualizados };
            atualizarTabelaUsuarios();

            console.log(" Usuário atualizado:", dadosAtualizados);
            alert("Usuário atualizado com sucesso!");
            fecharModal('modal-edit-user');
        } catch (erro) {
            console.error(" Erro ao atualizar usuário:", erro);
            alert("Erro ao atualizar usuário.");
        }
    });
};
// ======================= MODAIS =======================

// DOMContentLoaded ======================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarUsuarios()
    await carregarMateriais()
    // ===== Modais simples =====
    const modais = document.querySelectorAll('.modal-overlay');
    modais.forEach(modal => {
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(modal.id); });
        // Fechar botões
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

    // --- Editar Laboratório ---
    const formEditLab = document.getElementById('form-edit-lab');
    if (formEditLab) {
        formEditLab.addEventListener('submit', e => {
            e.preventDefault();
            console.log("Laboratório atualizado.");
            fecharModal('modal-edit-lab');
        });
    }

    // ================== MODAIS DE EDIÇÃO DADOS ==================

    const abrirModalEdicaoLab = (labId) => {
        const lab = laboratorios[labId];
        if (!lab) return;
        document.getElementById('edit-lab-title').textContent = `Editar ${lab.nome}`;
        document.getElementById('edit-lab-id').value = labId;
        document.getElementById('edit-lab-name').value = lab.nome;
        document.getElementById('edit-lab-desc').value = lab.descricao;
        document.getElementById('edit-lab-capacity').value = lab.capacidade;
        abrirModal('modal-edit-lab');
    };

    const abrirModalEdicaoMaterial = (id) => {
        const m = materiais[id];
        if (!m) return;
        document.getElementById('edit-material-id').value = id;
        document.getElementById('edit-material-name').value = m.item;
        document.getElementById('edit-material-quantity').value = m.quantidade;

        const select = document.getElementById('edit-material-unit');
        const customGroup = document.getElementById('custom-edit-unit-group');
        const customInput = document.getElementById('custom-edit-unit-text');

        if (select.querySelector(`option[value="${m.unidade}"]`)) {
            select.value = m.unidade;
            customGroup.style.display = 'none';
            customInput.removeAttribute('required');
        } else {
            select.value = 'outro';
            customInput.value = m.unidade;
            customGroup.style.display = 'block';
            customInput.setAttribute('required', 'required');
        }
        abrirModal('modal-edit-material');
    };

    const abrirModalEdicaoUsuario = (id) => {
        const u = usuarios[id];
        if (!u) return;
        document.getElementById('edit-user-id').value = id;
        document.getElementById('edit-user-title').textContent = `Editar ${u.nome}`;
        document.getElementById('edit-user-name').value = u.nome;
        document.getElementById('edit-user-email').value = u.email;

        // Garantir que o perfil seja mapeado corretamente
        const perfilSelect = document.getElementById('edit-user-profile');
        if (perfilSelect) {
            // Se o valor salvo for "admin", mapear para "Administrador"
            const perfilCorrigido = u.perfil === 'admin' ? 'Administrador' : u.perfil;
            perfilSelect.value = perfilCorrigido;
        }

        abrirModal('modal-edit-user');
    };
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
    setupFormEdit('form-edit-material', materiais, (id, m) => {
        const row = document.querySelector(`tr[data-material-id="${id}"]`);
        if (row) {
            row.querySelector('.material-item-name').textContent = m.item;
            row.querySelector('.material-quantity').textContent = m.quantidade;
            row.querySelector('.material-unit').textContent = m.unidade;
        }
    });

    // --- Editar Usuário ---
    // ================== CONFIRMAÇÃO ==================
    const modalConfirm = document.getElementById('modal-confirm');
    const confirmMessage = document.getElementById('confirm-message');
    let currentAction = null;

    const showConfirm = (msg, action) => {
        confirmMessage.textContent = msg;
        currentAction = action;
        abrirModal('modal-confirm');
    };

    document.getElementById('btn-confirm-yes')?.addEventListener('click', () => {
        currentAction && currentAction();
        fecharModal('modal-confirm');
    });

    document.getElementById('btn-confirm-no')?.addEventListener('click', () => fecharModal('modal-confirm'));

    modalConfirm?.addEventListener('click', e => { if (e.target === modalConfirm) fecharModal('modal-confirm'); });

    // ================== EVENTOS DE TABELA ==================
    // Materiais
    document.getElementById('material-table-body')?.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.materialId;

        if (btn.classList.contains('btn-edit-material')) abrirModalEdicaoMaterial(id);
        if (btn.classList.contains('btn-remove-material')) {
            showConfirm(`Deseja remover o material "${materiais[id].item}"?`, () => {
                delete materiais[id];
                document.querySelector(`tr[data-material-id="${id}"]`)?.remove();
                console.log(`Material "${id}" removido.`);
            });
        }
    });

    // Usuários
    document.getElementById('users-table-body')?.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.userId;

        if (btn.classList.contains('btn-edit-user')) abrirModalEdicaoUsuario(id);
        if (btn.classList.contains('btn-remove-user')) {
            const u = usuarios[id];
            const newStatus = u.status === 'Ativo' ? 'Desativado' : 'Ativo';
            const actionText = u.status === 'Ativo' ? 'Desativar' : 'Reativar';

            showConfirm(`Deseja ${actionText.toLowerCase()} o usuário "${u.nome}"?`, () => {
                u.status = newStatus;
                const row = document.querySelector(`tr[data-user-id="${id}"]`);
                if (row) {
                    const span = row.querySelector('.user-status');
                    span.textContent = newStatus;
                    span.classList.remove('status-active', 'status-disabled', 'status-denied', 'status-draft');
                    span.classList.add(newStatus === 'Ativo' ? 'status-active' : 'status-disabled');

                    const actionBtn = row.querySelector('.btn-remove-user');
                    actionBtn.textContent = newStatus === 'Ativo' ? 'Desativar' : 'Reativar';
                }
                console.log(`Usuário "${u.nome}" agora está ${newStatus}.`);
            });
        }
    });

});
