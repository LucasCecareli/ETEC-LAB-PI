const protocolo = "http://"
const baseURL = "127.0.0.1:3000"
const usuariosEndpoint = "/usuarios"

// funcao alert 
function exibirAlerta(seletor, innerHTML, classesToAdd, classesToRemove, timeout) {
    let alert = document.querySelector(seletor)
    alert.innerHTML = innerHTML
    alert.classList.add(...classesToAdd)
    alert.classList.remove(...classesToRemove)

    setTimeout(() => {
        alert.classList.add(...classesToRemove)
        alert.classList.remove(...classesToAdd)
        setTimeout(() => {
            alert.innerHTML = ''
        }, 150)
    }, timeout)
}

// funcao de fechar o modal
function esconderModal(seletor, timeout) {
    setTimeout(() => {
        let modal = bootstrap.Modal.getInstance(document.querySelector(seletor))
        modal.hide()
    }, timeout)
}
// função de cadastro de usuarios
async function cadastrarUsuario() {
    let nomeInput = document.querySelector('#new-user-name')
    let emailInput = document.querySelector('#new-user-email')
    let perfilSelect = document.querySelector('#new-user-role')
    let passwordInput = document.querySelector('#new-user-password')

    let nome = nomeInput.value
    let email = emailInput.value
    let perfil = perfilSelect.options[perfilSelect.selectedIndex].value
    let password = passwordInput.value

    if (nome && email && perfil && password) {
        if (!email.includes('@')) {
            exibirAlerta('.alert-modal-cadastro', "Por favor, insira um email válido!!!", ['show', 'alert-danger'], ['d-none'], 2000)
            return
        }

        try {
            const cadastroEndpoint = '/usuarios'
            const URLcompleta = `${protocolo}${baseURL}${cadastroEndpoint}`
            await axios.post(URLcompleta, {
                nome: nome,
                email: email,
                perfil: perfil,
                password: password
            })

            nomeInput.value = ""
            emailInput.value = ""
            perfilSelect.selectedIndex = 0
            passwordInput.value = ""

            exibirAlerta('.alert-modal-cadastro', "Usuário cadastrado com sucesso!!!", ['show', 'alert-success'], ['d-none'], 2000)
            setTimeout(() => {
                fecharModal('modal-new-user')
            }, 2000)

            setTimeout(async () => {
                await carregarUsuarios()
                await carregarDashboard()
            }, 2000)
        }
        catch (erro) {
            let mensagemErro = "Não foi possível cadastrar usuário!!!"

            if (erro.response) {
                switch (erro.response.status) {
                    case 400:
                        mensagemErro = "Dados inválidos. Verifique as informações!!!"
                        break
                    case 409:
                        mensagemErro = "Email já cadastrado!!!"
                        break
                    case 500:
                        mensagemErro = "Erro interno do servidor. Tente novamente!!!"
                        break
                    default:
                        mensagemErro = `Erro ${erro.response.status}: ${erro.response.data?.message || 'Erro no servidor'}!!!`
                }
            }

            exibirAlerta('.alert-modal-cadastro', mensagemErro, ['show', 'alert-danger'], ['d-none'], 2000)
        }
    }
    else {
        exibirAlerta('.alert-modal-cadastro', "Preencha todos os campos!!!", ['show', 'alert-danger'], ['d-none'], 2000)
    }
}

//carregar usuários
let usuarios = {}
async function obterUsuarios() {
    try {
        const resposta = await axios.get("http://localhost:3000/usuarios")
        console.log("Usuários carregados:", resposta.data)

        usuarios = {}
        resposta.data.forEach(usuario => {
            usuarios[usuario._id] = usuario
        })

        atualizarTabelaUsuarios()
        atualizarEstatisticas()

        return usuarios
    } catch (erro) {
        console.error("Erro ao carregar usuários:", erro)
        alert("Erro ao carregar usuários do servidor.")
        return {}
    }
}

//atualiza a tabela de usuários
function atualizarTabelaUsuarios() {
    const tbody = document.getElementById('users-table-body')
    if (!tbody) return

    tbody.innerHTML = ''

    Object.keys(usuarios).forEach(usuarioId => {
        const usuario = usuarios[usuarioId]
        const linha = criarLinhaUsuario(usuarioId, usuario)
        tbody.appendChild(linha)
    })
}

//cria uma linha de usuário
function criarLinhaUsuario(usuarioId, usuario) {
    const tr = document.createElement('tr')
    tr.setAttribute('data-user-id', usuarioId)

    const statusClass = usuario.status === 'Ativo' ? 'status-active' : 'status-disabled'

    tr.innerHTML = `
        <td data-label="Nome" class="user-name">${usuario.nome}</td>
        <td data-label="Perfil" class="user-profile">${usuario.perfil}</td>
        <td data-label="Email" class="user-email">${usuario.email}</td>
        <td data-label="Status">
            <span class="badge user-status ${statusClass}">${usuario.status}</span>
        </td>
        <td data-label="Ações" class="kit-actions-compact actions-cell">
            <button class="btn btn-light btn-edit-user" data-user-id="${usuarioId}">✏️ Editar</button>
            <button class="btn btn-danger btn-remove-user" data-user-id="${usuarioId}">
                🗑️ Remover
            </button>
        </td>
    `

    return tr
}

//atualiza estatísticas
function atualizarEstatisticas() {
    const totalUsuarios = Object.keys(usuarios).length
    const professores = Object.values(usuarios).filter(u => u.perfil === 'Professor').length
    const tecnicos = Object.values(usuarios).filter(u => u.perfil === 'Técnico').length
    const administradores = Object.values(usuarios).filter(u => u.perfil === 'Administrador').length

    const statTotalUsuarios = document.getElementById('stat-total-usuarios')
    if (statTotalUsuarios) {
        statTotalUsuarios.textContent = totalUsuarios
    }

    const statsElement = document.querySelector('.kits-stats')
    if (statsElement) {
        statsElement.innerHTML = `
            <span>Total: <strong>${totalUsuarios}</strong></span>
            <span>Professores: <strong>${professores}</strong></span>
            <span>Técnicos: <strong>${tecnicos}</strong></span>
            <span>Administradores: <strong>${administradores}</strong></span>
        `
    }

    const totalUsuariosElement = document.getElementById('total-usuarios')
    const totalProfessoresElement = document.getElementById('total-professores')
    const totalTecnicosElement = document.getElementById('total-tecnicos')
    const totalAdministradoresElement = document.getElementById('total-administradores')

    if (totalUsuariosElement) totalUsuariosElement.textContent = totalUsuarios
    if (totalProfessoresElement) totalProfessoresElement.textContent = professores
    if (totalTecnicosElement) totalTecnicosElement.textContent = tecnicos
    if (totalAdministradoresElement) totalAdministradoresElement.textContent = administradores
}

// edição de usuarios
const setupFormEditUsuario = () => {
    const form = document.getElementById('form-edit-user')
    if (!form) return

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const usuarioId = document.getElementById('edit-user-id').value
        const novaSenha = document.getElementById('edit-user-password').value
        const confirmarSenha = document.getElementById('edit-user-confirm-password').value
        const nome = document.getElementById('edit-user-name').value
        const email = document.getElementById('edit-user-email').value
        const perfil = document.getElementById('edit-user-profile').value

        if (novaSenha !== confirmarSenha) {
            exibirAlerta('.alert-modal-edit-cadastro', "As senhas não coincidem", ['show', 'alert-danger'], ['d-none'], 2000)
            return
        }

        const dadosAtualizados = { nome, email, perfil }
        if (novaSenha) dadosAtualizados.password = novaSenha

        try {
            await axios.put(`http://localhost:3000/usuarios/${usuarioId}`, dadosAtualizados)

            if (usuarios && usuarios[usuarioId]) {
                usuarios[usuarioId] = { ...usuarios[usuarioId], ...dadosAtualizados }
            }
            if (typeof atualizarTabelaUsuarios === 'function') atualizarTabelaUsuarios()
            if (typeof atualizarEstatisticas === 'function') atualizarEstatisticas()

            exibirAlerta('.alert-modal-edit-cadastro', "Usuário atualizado com sucesso", ['show', 'alert-success'], ['d-none'], 2000)

            document.getElementById('edit-user-password').value = ''
            document.getElementById('edit-user-confirm-password').value = ''

            setTimeout(() => fecharModal('modal-edit-user'), 2000)

        } catch (erro) {
            const mensagem = erro.response?.status === 409
                ? "Email já está em uso"
                : "Erro ao atualizar usuário"

            exibirAlerta('.alert-modal-edit-cadastro', mensagem, ['show', 'alert-danger'], ['d-none'], 2000)
        }
    })
}
// Materiais --------------------------------------------------------------------------------------------------------------------------------

// verifica se o material já existe
async function verificarMaterialExistente(nome, descricao) {
    try {
        const resposta = await axios.get("http://localhost:3000/materiais")
        const todosMateriais = resposta.data

        const duplicataExata = todosMateriais.find(material => {
            const mesmoNome = material.item.toLowerCase() === nome.toLowerCase()
            const mesmaDescricao = material.descricao.toLowerCase() === (descricao || "").toLowerCase()
            return mesmoNome && mesmaDescricao
        })

        if (duplicataExata) {
            return duplicataExata
        }

        const mesmoNomeDescricaoDiferente = todosMateriais.find(material =>
            material.item.toLowerCase() === nome.toLowerCase() &&
            material.descricao.toLowerCase() !== (descricao || "").toLowerCase()
        )

        if (mesmoNomeDescricaoDiferente) {
            const descricaoExistente = mesmoNomeDescricaoDiferente.descricao || "(sem descrição)"
            const novaDescricao = descricao || "(sem descrição)"

            const confirmar = confirm(
                `Atenção!\n\nJá existe um material com o nome "${mesmoNomeDescricaoDiferente.item}" mas com descrição diferente.\n\n` +
                `Existente: ${descricaoExistente}\n` +
                `Novo: ${novaDescricao}\n\n` +
                `Deseja cadastrar mesmo assim?`
            )
            return confirmar ? null : mesmoNomeDescricaoDiferente
        }

        return null

    } catch (erro) {
        console.error("Erro ao verificar duplicatas:", erro)
        return null
    }
}

// cadastro de materiais
async function cadastrarMaterial() {
    const nome = document.getElementById("material-name").value.trim()
    const descricao = document.getElementById("material-description").value.trim()
    const categoria = document.getElementById("material-category").value
    const quantidade = parseInt(document.getElementById("material-quantity").value)
    const unidadeSelect = document.getElementById("material-unit")
    const unidade = unidadeSelect.value === 'outro'
        ? document.getElementById("custom-unit-text").value.trim()
        : unidadeSelect.value
    const quantidadeMinima = parseInt(document.getElementById("material-min-quantity").value)

    if (!nome || !categoria || isNaN(quantidade) || !unidade || isNaN(quantidadeMinima)) {
        exibirAlerta('.alert-modal-novo-material', "Por favor, preencha todos os campos obrigatórios.", ['show', 'alert-danger'], ['d-none'], 2000)
        return
    }

    if (quantidade < 0 || quantidadeMinima < 0) {
        exibirAlerta('.alert-modal-novo-material', "Quantidade e quantidade mínima não podem ser negativas.", ['show', 'alert-danger'], ['d-none'], 2000)
        return
    }

    if (unidadeSelect.value === 'outro' && !unidade) {
        exibirAlerta('.alert-modal-novo-material', "Por favor, especifique a unidade personalizada.", ['show', 'alert-danger'], ['d-none'], 2000)
        return
    }

    try {
        console.log("Enviando dados do material:", {
            nome, descricao, categoria, quantidade, unidade, quantidadeMinima
        })

        const materialExistente = await verificarMaterialExistente(nome, descricao)
        if (materialExistente) {
            alert(`Material já cadastrado!\n\nItem: ${materialExistente.item}\nDescrição: ${materialExistente.descricao || '(sem descrição)'}\nQuantidade atual: ${materialExistente.quantidade} ${materialExistente.unidade}`)
            return
        }

        const resposta = await axios.post("http://localhost:3000/materiais", {
            item: nome,
            descricao: descricao || "",
            categoria: categoria,
            quantidade: quantidade,
            unidade: unidade,
            quantidadeMinima: quantidadeMinima
        })

        console.log("Material cadastrado:", resposta.data)
        exibirAlerta('.alert-modal-novo-material', "Material cadastrado com sucesso!", ['show', 'alert-success'], ['d-none'], 2000)

        await obterMateriais()

        document.getElementById("form-new-material").reset()
        fecharModal("modal-new-material")

    } catch (erro) {
        console.error("Erro ao cadastrar material:", erro)

        let mensagemErro = "Erro ao cadastrar material."

        if (erro.response) {
            console.error("Status:", erro.response.status)
            console.error("Dados:", erro.response.data)

            switch (erro.response.status) {
                case 400:
                    mensagemErro = "Dados inválidos. Verifique as informações."
                    break
                case 500:
                    mensagemErro = "Erro interno do servidor. Tente novamente."
                    break
                default:
                    mensagemErro = `Erro ${erro.response.status}: ${erro.response.data?.error || 'Erro no servidor'}`
            }
        } else if (erro.request) {
            mensagemErro = "Erro de conexão. Verifique se o servidor está rodando."
        } else {
            mensagemErro = "Erro de configuração: " + erro.message
        }

        alert(mensagemErro)
    }
}

// carrega os materiais para a tabela
async function obterMateriais() {
    try {
        const resposta = await axios.get("http://localhost:3000/materiais")
        console.log("Materiais carregados:", resposta.data)

        materiais = {}
        resposta.data.forEach(material => {
            materiais[material._id] = material
        })

        atualizarTabelaMateriais()
        atualizarEstatisticasMateriais()

        return materiais
    } catch (erro) {
        console.error("Erro ao carregar materiais:", erro)

        exibirAlerta('.alert-modal-novo-material', "Erro ao carregar materiais do servidor", ['show', 'alert-danger'], ['d-none'], 2000)
        return {}
    }
}

// atualiza a tabela de materiais
function atualizarTabelaMateriais() {
    const tbody = document.getElementById('material-table-body')
    if (!tbody) return

    tbody.innerHTML = ''
    Object.keys(materiais).forEach(materialId => {
        const material = materiais[materialId]
        const linha = criarLinhaMaterial(materialId, material)
        tbody.appendChild(linha)
    })
}

// cria uma linha nova
function criarLinhaMaterial(materialId, material) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-material-id', materialId);

    tr.innerHTML = `
        <td data-label="Item" class="material-item-name">${material.item}</td>
        <td data-label="Quantidade" class="material-quantity">${material.quantidade}</td>
        <td data-label="Unidade" class="material-unit">${material.unidade}</td>
        <td data-label="Descrição">${material.descricao}</td>
        <td data-label="Ações" class="kit-actions-compact actions-cell">
            <button class="btn btn-light btn-edit-material" data-material-id="${materialId}">
                ✏️ Editar
            </button>
            <button class="btn btn-danger btn-remove-material" data-material-id="${materialId}">
                🗑️ Remover
            </button>
        </td>
    `;

    return tr;
}
// atualiza as stats no dashboard e na aba de materiais
function atualizarEstatisticasMateriais() {
    const totalMateriais = Object.keys(materiais).length;

    const statTotalMateriais = document.getElementById('stat-total-materiais');
    if (statTotalMateriais) {
        statTotalMateriais.textContent = totalMateriais;
    }

    const statsMateriais = document.querySelector('#materiais .kits-stats');
    if (statsMateriais) {
        statsMateriais.innerHTML = `
            <span>Total de Itens: <strong>${totalMateriais}</strong></span>
        `;
    }
}
// função para abrir modal de edição de material
const abrirModalEdicaoMaterial = (materialId) => {
    const material = materiais[materialId]
    if (!material) {
        console.error("Material não encontrado:", materialId)
        return
    }

    console.log("Editando material:", material)

    document.getElementById('edit-material-id').value = materialId
    document.getElementById('edit-material-name').value = material.item
    document.getElementById('edit-material-quantity').value = material.quantidade

    const select = document.getElementById('edit-material-unit')
    const customGroup = document.getElementById('custom-edit-unit-group')
    const customInput = document.getElementById('custom-edit-unit-text')

    if (select.querySelector(`option[value="${material.unidade}"]`)) {
        select.value = material.unidade
        customGroup.style.display = 'none'
        customInput.removeAttribute('required')
    } else {
        select.value = 'outro'
        customInput.value = material.unidade
        customGroup.style.display = 'block'
        customInput.setAttribute('required', 'required')
    }

    abrirModal('modal-edit-material')
}

// função de edição
const setupFormEditMaterial = () => {
    const form = document.getElementById('form-edit-material')
    if (!form) return

    form.addEventListener('submit', async (e) => {
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
            atualizarTabelaMateriais()

            console.log("Material atualizado:", resposta.data)

            exibirAlerta('.alert-modal-edit-material', "Material atualizado com sucesso!!!", ['show', 'alert-success'], ['d-none'], 2000)
            esconderModal('#modal-edit-material', 2500)

        } catch (erro) {
            console.error("Erro ao atualizar material:", erro)
            exibirAlerta('.alert-modal-edit-material', "Erro ao atualizar material.", ['show', 'alert-danger'], ['d-none'], 2000)
        }
    })

    const cancelBtn = form.querySelector('[data-close="modal-edit-material"]')
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault()
            fecharModal('#modal-edit-material')
        })
    }
}

// Função para filtrar materiais
function filtrarMateriais(termo) {
    const tbody = document.getElementById('material-table-body');
    const linhas = tbody.querySelectorAll('tr[data-material-id]');
    const resultadosPesquisa = document.getElementById('resultados-pesquisa');
    const totalMateriais = document.getElementById('total-materiais');
    const searchBox = document.querySelector('.search-box');
    
    let resultadosEncontrados = 0;
    const termoLower = termo.toLowerCase().trim();

    linhas.forEach(linha => {
        const nomeItem = linha.querySelector('.material-item-name').textContent.toLowerCase();
        const descricao = linha.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        const corresponde = nomeItem.includes(termoLower) || descricao.includes(termoLower);
        
        if (corresponde || termoLower === '') {
            linha.style.display = '';
            linha.classList.remove('material-row-hidden');
            resultadosEncontrados++;
        } else {
            linha.style.display = 'none';
            linha.classList.add('material-row-hidden');
        }
    });

    if (termoLower !== '') {
        const total = Object.keys(materiais).length;
        resultadosPesquisa.textContent = `${resultadosEncontrados} de ${total} itens encontrados`;
        
        searchBox.classList.add('searching');
    } else {
        resultadosPesquisa.textContent = '';
        searchBox.classList.remove('searching');
    }

    if (totalMateriais) {
        totalMateriais.textContent = Object.keys(materiais).length;
    }
}

// Função para configurar a barra de pesquisa
function configurarBarraPesquisa() {
    const inputPesquisa = document.getElementById('pesquisa-materiais');
    const btnLimpar = document.getElementById('limpar-pesquisa');

    if (!inputPesquisa) return;

    inputPesquisa.addEventListener('input', function(e) {
        const termo = e.target.value;
        filtrarMateriais(termo);
        
        btnLimpar.style.display = termo ? 'block' : 'none';
    });

    btnLimpar.addEventListener('click', function() {
        inputPesquisa.value = '';
        filtrarMateriais('');
        btnLimpar.style.display = 'none';
        inputPesquisa.focus();
    });

    inputPesquisa.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            inputPesquisa.value = '';
            filtrarMateriais('');
            btnLimpar.style.display = 'none';
        }
    });
}

function atualizarTabelaMateriais() {
    const tbody = document.getElementById('material-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    Object.keys(materiais).forEach(materialId => {
        const material = materiais[materialId];
        const linha = criarLinhaMaterial(materialId, material);
        tbody.appendChild(linha);
    });

    const totalMateriais = document.getElementById('total-materiais');
    if (totalMateriais) {
        totalMateriais.textContent = Object.keys(materiais).length;
    }

    const inputPesquisa = document.getElementById('pesquisa-materiais');
    if (inputPesquisa && inputPesquisa.value) {
        filtrarMateriais(inputPesquisa.value);
    }
}

function criarLinhaMaterial(materialId, material) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-material-id', materialId);
    tr.classList.add('material-row'); 

    tr.innerHTML = `
        <td data-label="Item" class="material-item-name">${material.item}</td>
        <td data-label="Quantidade" class="material-quantity">${material.quantidade}</td>
        <td data-label="Unidade" class="material-unit">${material.unidade}</td>
        <td data-label="Descrição">${material.descricao}</td>
        <td data-label="Ações" class="kit-actions-compact actions-cell">
            <button class="btn btn-light btn-edit-material" data-material-id="${materialId}">
                ✏️ Editar
            </button>
            <button class="btn btn-danger btn-remove-material" data-material-id="${materialId}">
                🗑️ Remover
            </button>
        </td>
    `;

    return tr;
}
// laboratórios

let laboratorios = {};

// carrega os laboratórios 
async function obterLaboratorios() {
    try {
        const resposta = await axios.get("http://localhost:3000/laboratorios")
        console.log("Laboratórios carregados:", resposta.data)

        laboratorios = {}
        resposta.data.forEach(lab => {
            laboratorios[lab._id] = lab
        });

        atualizarListaLaboratorios()
        atualizarStatLab() 
        return laboratorios

    } catch (erro) {
        console.error("Erro ao carregar laboratórios:", erro)
        exibirAlerta('.alert-modal-novo-material', "Erro ao carregar laboratórios do servidor", ['show', 'alert-danger'], ['d-none'], 2000)
        
        const statTotalLab = document.getElementById('stat-total-lab');
        if (statTotalLab) {
            statTotalLab.textContent = '0';
        }
        
        return {}
    }
}

// atualiza a lista de laboratórios na interface
function atualizarListaLaboratorios() {
    console.log("Buscando container de laboratórios...")

    let container = document.querySelector('#configuracoes .card')

    if (!container) {
        console.log("Primeiro seletor falhou, tentando alternativos...")
        container = document.querySelector('.card')
    }

    if (!container) {
        console.error("Container não encontrado!")
        return
    }

    console.log("Container encontrado:", container)

    const loading = container.querySelector('#loading-labs')
    if (loading) {
        console.log("Removendo loading...")
        loading.remove()
    }

    const oldItems = container.querySelectorAll('.lab-item')
    console.log(`Removendo ${oldItems.length} itens antigos`)
    oldItems.forEach(item => item.remove())

    const labIds = Object.keys(laboratorios);
    console.log(`Adicionando ${labIds.length} laboratórios`)

    if (labIds.length === 0) {
        const noLabsMessage = document.createElement('div')
        noLabsMessage.className = 'lab-item'
        noLabsMessage.innerHTML = `
            <div class="lab-info">
                <p>Nenhum laboratório cadastrado no sistema</p>
            </div>
        `;
        container.appendChild(noLabsMessage)
        return
    }

    labIds.forEach(labId => {
        const lab = laboratorios[labId]
        console.log(`➕ Criando item para: ${lab.nome}`)
        const labItem = criarItemLaboratorio(labId, lab)
        container.appendChild(labItem)
    });

    console.log("Lista de laboratórios atualizada!");
}
function atualizarStatLab() {
    try {
        const laboratoriosDisponiveis = Object.values(laboratorios).filter(lab => 
            lab.disponibilidade === 'disponivel' || lab.disponibilidade === 'Disponível'
        );

        console.log(`Laboratórios disponíveis: ${laboratoriosDisponiveis.length} de ${Object.keys(laboratorios).length}`);

        const statTotalLab = document.getElementById('stat-total-lab');
        if (statTotalLab) {
            statTotalLab.textContent = laboratoriosDisponiveis.length;
        }

        return laboratoriosDisponiveis.length;

    } catch (erro) {
        console.error("Erro ao contar laboratórios disponíveis:", erro);
        
        const statTotalLab = document.getElementById('stat-total-lab');
        if (statTotalLab) {
            statTotalLab.textContent = '0';
        }
        
        return 0;
    }
}
// abre o modal de edição
const abrirModalEdicaoLab = (labId) => {
    const lab = laboratorios[labId]
    if (!lab) {
        console.error("Laboratório não encontrado:", labId)
        return
    }

    console.log("Editando laboratório:", lab)

    document.getElementById('edit-lab-title').textContent = `Editar ${lab.nome}`
    document.getElementById('edit-lab-id').value = labId
    document.getElementById('edit-lab-name').value = lab.nome
    document.getElementById('edit-lab-disponibilidade').value = lab.disponibilidade

    const horariosContainer = document.getElementById('horarios-container')
    if (horariosContainer) {
        horariosContainer.innerHTML = ''

        if (lab.horarios && lab.horarios.length > 0) {
            lab.horarios.forEach((horario, index) => {
                const horarioItem = document.createElement('div')
                horarioItem.className = 'horario-item'
                horarioItem.style.padding = '8px 5px'
                horarioItem.style.borderBottom = '1px solid #eee'
                horarioItem.style.fontSize = '14px'
                horarioItem.textContent = `${index + 1}. ${horario}`
                horariosContainer.appendChild(horarioItem)
            })
        } else {
            horariosContainer.innerHTML = '<p style="color: #666; text-align: center;">Nenhum horário cadastrado</p>'
        }
    }

    abrirModal('modal-edit-lab')
}

// salva as alterações do laboratório
async function salvarEdicaoLaboratorio(event) {
    event.preventDefault()

    const labId = document.getElementById('edit-lab-id').value
    const nome = document.getElementById('edit-lab-name').value
    const disponibilidade = document.getElementById('edit-lab-disponibilidade').value

    try {
        const dadosAtualizados = {
            nome: nome,
            disponibilidade: disponibilidade
        }

        const resposta = await axios.put(`http://localhost:3000/laboratorios/${labId}`, dadosAtualizados)
        console.log("Laboratório atualizado:", resposta.data)

        laboratorios[labId] = { ...laboratorios[labId], ...dadosAtualizados }

        atualizarListaLaboratorios()

        fecharModal('modal-edit-lab')

        exibirAlerta('.alert-modal-novo-material', "Laboratório atualizado com sucesso!", ['show', 'alert-success'], ['d-none'], 2000)

    } catch (erro) {
        console.error("Erro ao atualizar laboratório:", erro)
        exibirAlerta('.alert-modal-novo-material', "Erro ao atualizar laboratório", ['show', 'alert-danger'], ['d-none'], 2000)
    }
}
function criarItemLaboratorio(labId, lab) {
    const labItem = document.createElement('div')
    labItem.className = 'lab-item'

    // Formata a disponibilidade para exibição
    const disponibilidadeText = {
        'disponivel': '🟢 Disponível',
        'indisponivel': '🔴 Indisponível',
        'manutencao': '🟡 Em Manutenção'
    }[lab.disponibilidade] || lab.disponibilidade

    labItem.innerHTML = `
        <div class="lab-info">
            <h4>${lab.nome}</h4>
            <p>${disponibilidadeText} • ${lab.horarios.length} horários cadastrados</p>
        </div>
        <button class="btn-link" data-open="modal-edit-lab" data-lab-id="${labId}">Editar</button>
    `;

    return labItem
}


// estatisticas painel adm

const STATS_UPDATE_INTERVAL = 60000;
let statsUpdateInterval;

async function buscarEstatisticas() {
    try {
        console.log("Buscando estatísticas...");

        const resposta = await axios.get(`${protocolo}${baseURL}/api/stats`);

        if (resposta.data.success) {
            atualizarUIEstatisticas(resposta.data.stats);
            console.log("Estatísticas atualizadas:", resposta.data.stats);
        } else {
            throw new Error(resposta.data.error || "Erro ao buscar estatísticas");
        }

    } catch (erro) {
        console.error("Erro ao buscar estatísticas:", erro);

      
        if (erro.response && erro.response.status === 404) {
            console.log("Rota de estatísticas não encontrada, usando cálculo local...");
            calcularEstatisticasLocais();
        }
    }
}

// Atualizar interface com as estatísticas
function atualizarUIEstatisticas(stats) {
    const newUsersElement = document.getElementById('stats-new-users');
    if (newUsersElement && stats.newUsers !== undefined) {
        newUsersElement.textContent = stats.newUsers;
    }

    const updatedMaterialsElement = document.getElementById('stats-updated-materials');
    if (updatedMaterialsElement && stats.updatedMaterials !== undefined) {
        updatedMaterialsElement.textContent = stats.updatedMaterials;
    }

    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `Última atualização: ${formatarDataHora(new Date())}`;
    }
}

function formatarDataHora(data) {
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calcularEstatisticasLocais() {
    console.log("Calculando estatísticas localmente...");

    const novosUsuarios = Object.values(usuarios).length > 0 ?
        Math.floor(Object.values(usuarios).length * 0.1) : 0;

    const materiaisAtualizados = Object.values(materiais).length > 0 ?
        Math.floor(Object.values(materiais).length * 0.15) : 0;

    const stats = {
        newUsers: novosUsuarios,
        updatedMaterials: materiaisAtualizados
    };

    atualizarUIEstatisticas(stats);
}

function iniciarAtualizacaoAutomatica() {
    buscarEstatisticas();

    statsUpdateInterval = setInterval(buscarEstatisticas, STATS_UPDATE_INTERVAL);

    console.log("🔄 Atualização automática de estatísticas iniciada");
}

function pararAtualizacaoAutomatica() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
        console.log("⏹️ Atualização automática de estatísticas parada");
    }
}
// função que carrega todos os dados do dashboard
async function carregarDashboard() {
    try {
        await Promise.all([
            obterUsuarios(),
            obterMateriais(),
            obterLaboratorios(),
            buscarEstatisticas()
        ])
        console.log("Dashboard carregado com sucesso!")
    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro)
    }
}

let materiais = {}

const abrirModal = (modalId) => {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.style.display = 'flex'
        modal.setAttribute('aria-hidden', 'false')
        document.body.style.overflow = 'hidden'
    }
}

const fecharModal = (modalId) => {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.style.display = 'none'
        modal.setAttribute('aria-hidden', 'true')
        document.body.style.overflow = ''
    }
}

document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"))
        tab.classList.add("active")

        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"))
        const target = document.getElementById(tab.dataset.tab)
        if (target) target.classList.add("active")
    })
})

// Modais
// DOMContentLoaded 
document.addEventListener('DOMContentLoaded', async () => {
    await obterUsuarios()
    await obterMateriais()
    await obterLaboratorios()
    iniciarAtualizacaoAutomatica();

    configurarBarraPesquisa()

    const modais = document.querySelectorAll('.modal-overlay')
    modais.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(modal.id) })
        modal.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => fecharModal(btn.dataset.close))
        })
        setupFormEditUsuario()
    })

    const setupUnitSelect = (selectId, customGroupId, customInputId) => {
        const select = document.getElementById(selectId)
        const customGroup = document.getElementById(customGroupId)
        const customInput = document.getElementById(customInputId)

        if (select && customGroup && customInput) {
            select.addEventListener('change', () => {
                if (select.value === 'outro') {
                    customGroup.style.display = 'block'
                    customInput.setAttribute('required', 'required')
                } else {
                    customGroup.style.display = 'none'
                    customInput.removeAttribute('required')
                    customInput.value = ''
                }
            })

            if (select.value !== 'outro') {
                customGroup.style.display = 'none'
                customInput.removeAttribute('required')
            }
        }
        setupFormEditUsuario()
        setupFormEditMaterial()
    }
    setupUnitSelect('material-unit', 'custom-unit-group', 'custom-unit-text')
    setupUnitSelect('edit-material-unit', 'custom-edit-unit-group', 'custom-edit-unit-text')

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-link')
        if (!btn) return

        const modalTarget = btn.getAttribute('data-open')
        const labId = btn.getAttribute('data-lab-id')

        if (modalTarget === 'modal-edit-lab' && labId) {
            abrirModalEdicaoLab(labId)
        }
    })
    // novo material 
    const formNewMaterial = document.getElementById('form-new-material')
    if (formNewMaterial) {
        formNewMaterial.addEventListener('submit', e => {
            e.preventDefault()
            console.log("Novo Material cadastrado com sucesso!")
            formNewMaterial.reset()
            fecharModal('modal-new-material')
        })
    }

    // Editar Laboratório 
    const formEditLab = document.getElementById('form-edit-lab')
    if (formEditLab) {
        formEditLab.addEventListener('submit', async e => {
            e.preventDefault()

            const labId = document.getElementById('edit-lab-id').value
            const dadosAtualizados = {
                nome: document.getElementById('edit-lab-name').value,
                disponibilidade: document.getElementById('edit-lab-disponibilidade').value
            }

            try {
                const resposta = await axios.put(`http://localhost:3000/laboratorios/${labId}`, dadosAtualizados)
                console.log("Laboratório atualizado:", resposta.data)

                laboratorios[labId] = { ...laboratorios[labId], ...dadosAtualizados }

                atualizarListaLaboratorios()

                exibirAlerta('.alert-modal-novo-material', "Laboratório atualizado com sucesso!", ['show', 'alert-success'], ['d-none'], 2000)

                setTimeout(() => {
                    fecharModal('modal-edit-lab')
                }, 2000)

            } catch (erro) {
                console.error("Erro ao atualizar laboratório:", erro)
                exibirAlerta('.alert-modal-novo-material', "Erro ao atualizar laboratório", ['show', 'alert-danger'], ['d-none'], 2000)
            }
        })
    }
    // modais de edição
    // edição lab
    const abrirModalEdicaoLab = (labId) => {
        const lab = laboratorios[labId]
        if (!lab) {
            console.error("Laboratório não encontrado:", labId)
            return
        }

        console.log("Editando laboratório:", lab)

        document.getElementById('edit-lab-title').textContent = `Editar ${lab.nome}`
        document.getElementById('edit-lab-id').value = labId
        document.getElementById('edit-lab-name').value = lab.nome
        document.getElementById('edit-lab-disponibilidade').value = lab.disponibilidade

        const horariosContainer = document.getElementById('horarios-container')
        if (horariosContainer) {
            horariosContainer.innerHTML = ''

            if (lab.horarios && lab.horarios.length > 0) {
                lab.horarios.forEach((horario, index) => {
                    const horarioItem = document.createElement('div')
                    horarioItem.className = 'horario-item'
                    horarioItem.style.padding = '8px 5px'
                    horarioItem.style.borderBottom = '1px solid #eee'
                    horarioItem.style.fontSize = '14px'
                    horarioItem.textContent = `${index + 1}. ${horario}`
                    horariosContainer.appendChild(horarioItem)
                })
            } else {
                horariosContainer.innerHTML = '<p style="color: #666; text-align: center;">Nenhum horário cadastrado</p>'
            }
        }

        abrirModal('modal-edit-lab')
    }
    // edição usuario
    const abrirModalEdicaoUsuario = (id) => {
        const u = usuarios[id]
        if (!u) {
            console.error("Usuário não encontrado:", id)
            return
        }

        console.log("Editando usuário:", u)

        document.getElementById('edit-user-id').value = id
        document.getElementById('edit-user-title').textContent = `Editar ${u.nome}`
        document.getElementById('edit-user-name').value = u.nome
        document.getElementById('edit-user-email').value = u.email
        const perfilSelect = document.getElementById('edit-user-profile')
        if (perfilSelect) {
            const perfilCorrigido = u.perfil === 'admin' ? 'Administrador' : u.perfil
            perfilSelect.value = perfilCorrigido
        }

        document.getElementById('edit-user-password').value = ''
        document.getElementById('edit-user-confirm-password').value = ''

        abrirModal('modal-edit-user')
    }


    // edição
    const setupFormEdit = (formId, dataObj, updateRowCallback) => {
        const form = document.getElementById(formId)
        if (!form) return

        form.addEventListener('submit', e => {
            e.preventDefault()
            const id = form.querySelector('[id$="-id"]').value
            const fields = Array.from(form.querySelectorAll('[id^="edit-"]')).filter(f => !f.id.endsWith('-id') && !f.id.endsWith('-title'))

            fields.forEach(f => {
                const key = f.id.replace(/edit-[^-]+-?/, '')
                dataObj[id][key] = f.value
            })

            updateRowCallback && updateRowCallback(id, dataObj[id])
            console.log(`${formId} atualizado com sucesso!`)
            fecharModal(form.closest('.modal-overlay').id)
        })
    }

    // editar material
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
    // Materiais
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

    // Usuários
    document.getElementById('users-table-body')?.addEventListener('click', e => {
    const btn = e.target.closest('button')
    if (!btn) return
    const id = btn.dataset.userId

    if (btn.classList.contains('btn-edit-user')) abrirModalEdicaoUsuario(id)
    if (btn.classList.contains('btn-remove-user')) {
        const u = usuarios[id]

        showConfirm(`Deseja remover permanentemente o usuário "${u.nome}"?`, async () => {
            try {
                const resposta = await axios.delete(`http://localhost:3000/usuarios/${id}`)

                await obterUsuarios()
                
                console.log(`Usuário "${u.nome}" foi removido permanentemente.`)

                exibirAlerta('.alert-container', `Usuário "${u.nome}" removido com sucesso!`, ['show', 'alert-success'], ['d-none'], 3000)

            } catch (error) {
                console.error('Erro ao remover usuário:', error)

                let mensagemErro = "Erro ao remover usuário"
                if (error.response?.status === 405) {
                    mensagemErro = "Servidor não configurado para deletar usuários"
                } else if (error.response?.status === 404) {
                    mensagemErro = "Usuário não encontrado"
                } else if (error.response?.data?.error) {
                    mensagemErro = error.response.data.error
                }

                exibirAlerta('.alert-container', mensagemErro, ['show', 'alert-danger'], ['d-none'], 3000)
            }
        })
    }
})
})