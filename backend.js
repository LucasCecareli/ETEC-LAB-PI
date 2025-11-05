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

// ======= MODELOS =======
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  perfil: { type: String, enum: ["Professor", "Tecnico", "Administrador"], required: true },
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
  nome: { type: String, required: true },
  descricao: { type: String },
  capacidade: { type: Number, required: true }
});
const Laboratorio = mongoose.model("Laboratorio", laboratorioSchema);

// ======= CONEXÃO COM O MONGODB =======
mongoose.set("strictQuery", true);

async function conectarAoMongoDB() {
  try {
    await mongoose.connect(process.env.CONEXAO_BD);
    console.log("✅ Conexão com MongoDB estabelecida!");
  } catch (error) {
    console.error("❌ Erro ao conectar MongoDB:", error);
    process.exit(1);
  }
}

// ======= Usuarios =======

// Listar usuários
app.get("/usuarios", async (req, res) => {
  const usuarios = await Usuario.find();
  res.json(usuarios);
});

// Cadastrar usuário
app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, perfil, password } = req.body;

    console.log("📥 Dados recebidos:", req.body);

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
    console.error("💥 Erro ao cadastrar:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

conectarAoMongoDB().then(() => {
  app.listen(PORTA, () => console.log(`Servidor rodando na porta ${PORTA}`));
});


// ======= ROTAS PARA MATERIAIS =======

// lista todos os materiais
app.get("/materiais", async (req, res) => {
  try {
    console.log(" Recebida requisição para /materiais");
    const materiais = await Material.find();
    console.log(` Enviando ${materiais.length} materiais`);
    res.json(materiais);
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    res.status(500).json({ error: "Erro interno ao buscar materiais" });
  }
});

// cadastra novo material
app.post("/materiais", async (req, res) => {
  try {
    const { item, descricao, categoria, quantidade, unidade, quantidadeMinima } = req.body;

    console.log(" Dados recebidos para material:", req.body);

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