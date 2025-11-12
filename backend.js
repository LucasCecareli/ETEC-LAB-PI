const PORTA = process.env.PORTA || 3000;
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));

// Schemas 
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  perfil: { type: String, enum: ["Professor", "Técnico", "Administrador"], required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["Ativo", "Desativado"], default: "Ativo" }
});
usuarioSchema.plugin(uniqueValidator);
const Usuario = mongoose.model("Usuario", usuarioSchema);

const materialSchema = new mongoose.Schema({
  item: { type: String, required: true },
  descricao: { type: String, default: "" },
  categoria: { type: String, required: true },
  quantidade: { type: Number, required: true },
  unidade: { type: String, required: true },
  quantidadeMinima: { type: Number, default: 0 }
});
const Material = mongoose.model("Material", materialSchema);

const laboratorioSchema = new mongoose.Schema({
  nome: { type: String, required: true},
  disponibilidade: { type: String, required: true,default: "disponivel"},
  horarios: [{ type: String, required: true }]
}, {
  timestamps: true
});

const Laboratorio = mongoose.model("Laboratorio", laboratorioSchema);

// Conexão com o banco de dados 
mongoose.set("strictQuery", true);

async function conectarAoMongoDB() {
  try {
    await mongoose.connect(process.env.CONEXAO_BD);
    console.log("conexao ok");
  } catch (error) {
    console.error("erro na conexao:", error);
    process.exit(1);
  }
}

// Usuarios 

// Listar usuários
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno ao buscar usuários" });
  }
});

// Cadastrar usuário
app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, perfil, password } = req.body;

    console.log("Dados recebidos:", req.body);

    if (!nome || !email || !perfil || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(password, 10);
    const novoUsuario = new Usuario({ nome, email, perfil, password: senhaHash });

    await novoUsuario.save();
    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });

  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// edição de usuarios
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, perfil, password } = req.body;

    const usuarioExistente = await Usuario.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (email && email !== usuarioExistente.email) {
      const emailEmUso = await Usuario.findOne({ email, _id: { $ne: id } });
      if (emailEmUso) {
        return res.status(409).json({ error: "E-mail já está em uso." });
      }
    }

    const dadosAtualizados = {
      nome: nome || usuarioExistente.nome,
      email: email || usuarioExistente.email,
      perfil: perfil || usuarioExistente.perfil
    };

    if (password) {
      dadosAtualizados.password = await bcrypt.hash(password, 10);
    }

    const usuarioAtualizado = await Usuario.findByIdAndUpdate(
      id,
      dadosAtualizados,
      { new: true, runValidators: true }
    );

    res.json({ 
      message: "Usuário atualizado com sucesso!", 
      usuario: usuarioAtualizado 
    });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno ao atualizar usuário." });
  }
});

// deletar usuario
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params
    console.log("Deletando usuário ID:", id)

    const usuario = await Usuario.findByIdAndDelete(id)

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." })
    }

    console.log("Usuário deletado:", usuario.nome)
    res.json({ message: "Usuário deletado com sucesso!" })

  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "ID do usuário inválido." })
    }
    
    res.status(500).json({ error: "Erro interno ao deletar usuário." })
  }
});


//Materiais 

// Lista todos os materiais
app.get("/materiais", async (req, res) => {
  try {
    console.log("Recebida requisição para /materiais");
    const materiais = await Material.find();
    console.log(`Enviando ${materiais.length} materiais`);
    res.json(materiais);
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    res.status(500).json({ error: "Erro interno ao buscar materiais" });
  }
});

// Cadastra novo material
app.post("/materiais", async (req, res) => {
  try {
    const { item, descricao, categoria, quantidade, unidade, quantidadeMinima } = req.body;

    console.log("Dados recebidos para material:", req.body);

    if (!item || !categoria || quantidade === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const novoMaterial = new Material({
      item,
      descricao: descricao || "",
      categoria,
      quantidade: quantidade || 0,
      unidade: unidade || "unidade",
      quantidadeMinima: quantidadeMinima || 0
    });

    await novoMaterial.save();
    res.status(201).json({ message: "Material cadastrado com sucesso!", material: novoMaterial });

  } catch (error) {
    console.error("Erro ao cadastrar material:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar material" });
  }
});

// Editar material
app.put("/materiais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { item, descricao, categoria, quantidade, unidade, quantidadeMinima } = req.body;

    console.log("Editando material ID:", id);
    console.log("Dados recebidos:", req.body);

    const materialExistente = await Material.findById(id);
    if (!materialExistente) {
      return res.status(404).json({ error: "Material não encontrado." });
    }

    const materialAtualizado = await Material.findByIdAndUpdate(
      id,
      {
        item: item || materialExistente.item,
        descricao: descricao !== undefined ? descricao : materialExistente.descricao,
        categoria: categoria || materialExistente.categoria,
        quantidade: quantidade !== undefined ? quantidade : materialExistente.quantidade,
        unidade: unidade || materialExistente.unidade,
        quantidadeMinima: quantidadeMinima !== undefined ? quantidadeMinima : materialExistente.quantidadeMinima
      },
      { new: true, runValidators: true }
    );

    console.log("Material atualizado:", materialAtualizado);
    res.json({ 
      message: "Material atualizado com sucesso!", 
      material: materialAtualizado 
    });

  } catch (error) {
    console.error("Erro ao atualizar material:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: "Dados inválidos para atualização." });
    }
    
    res.status(500).json({ error: "Erro interno ao atualizar material." });
  }
});

// deletar material
app.delete("/materiais/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Deletando material ID:", id);

    const material = await Material.findByIdAndDelete(id);

    if (!material) {
      return res.status(404).json({ error: "Material não encontrado." });
    }

    console.log("Material deletado:", material);
    res.json({ message: "Material deletado com sucesso!" });

  } catch (error) {
    console.error("Erro ao deletar material:", error);
    res.status(500).json({ error: "Erro interno ao deletar material." });
  }
});

// laboratórios

// buscar laboratórios
app.get("/laboratorios", async (req, res) => {
  try {
    console.log("Buscando todos os laboratórios");
    
    const laboratorios = await Laboratorio.find();
    console.log("Laboratórios encontrados:", laboratorios.length);
    
    res.json(laboratorios);
    
  } catch (error) {
    console.error("Erro ao buscar laboratórios:", error);
    res.status(500).json({ error: "Erro interno ao buscar laboratórios" });
  }
});
// atualizar laboratórios
app.put("/laboratorios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, disponibilidade } = req.body;

    console.log("Atualizando laboratório ID:", id, "Dados:", req.body);

    const laboratorio = await Laboratorio.findByIdAndUpdate(
      id,
      { nome, disponibilidade },
      { new: true, runValidators: true }
    );

    if (!laboratorio) {
      return res.status(404).json({ error: "Laboratório não encontrado" });
    }

    console.log("Laboratório atualizado:", laboratorio);
    res.json(laboratorio);

  } catch (error) {
    console.error("Erro ao atualizar laboratório:", error);
    res.status(500).json({ error: "Erro interno ao atualizar laboratório" });
  }
});

// ======= Login =======
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Tentativa de login para:", email);

    // valida a entrada
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: "E-mail e senha são obrigatórios." 
      });
    }

    // busca o usuário no MongoDB pelo email
    const usuario = await Usuario.findOne({ email });

    // verifica se existe
    if (!usuario) {
      console.log("Usuário não encontrado:", email);
      return res.status(401).json({ 
        success: false,
        error: "Credenciais inválidas." 
      });
    }

    // verifica se está ativo
    if (usuario.status !== "Ativo") {
      console.log("Usuário inativo:", email);
      return res.status(401).json({ 
        success: false,
        error: "Usuário desativado. Contate o administrador." 
      });
    }

    // verifica a senha usando bcrypt
    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      console.log("Senha inválida para:", email);
      return res.status(401).json({ 
        success: false,
        error: "Credenciais inválidas." 
      });
    }

    console.log("Login bem-sucedido para:", email, "Perfil:", usuario.perfil);

    // retorna sucesso com informações do usuário
    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      perfil: usuario.perfil,
      user: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        status: usuario.status
      }
    });

  } catch (error) {
    console.error("Erro no processo de login:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno do servidor." 
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Servidor rodando normalmente",
    timestamp: new Date().toISOString()
  })
})

// iniciar servidor
conectarAoMongoDB().then(() => {
  app.listen(PORTA, () => console.log(`servidor rodando na porta ${PORTA}`))
})