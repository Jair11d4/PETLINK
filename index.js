//////////////////////////////////////////////////////////
// PETLINK API v5
// Autor: Jair
// Backend con Express + MongoDB
// Modelo adaptado desde el diseño relacional (v4)
// CRUD: roles, tipos_usuarios, usuarios, mascotas, dispositivos
// GET-only: mediciones, ubicaciones_historicos, eventos
// 🔐 Mejora: contraseñas cifradas con bcryptjs
// 🚦 Inicialización automática de roles
//////////////////////////////////////////////////////////

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

// ------------------------------------------------------
// 🔌 Conexión a MongoDB
// ------------------------------------------------------
// URI de conexión
const MONGO_URI = "mongodb+srv://Jairsito1104:Pdhijhnm45*@cluster0.yivafrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Conexión a MongoDB
mongoose.connect(MONGO_URI, { dbName: 'Petlink' })
  .then(() => console.log("✅ Conectado a MongoDB (Petlink)"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err.message));

// ------------------------------------------------------
// 📦 Definición de Esquemas
// ------------------------------------------------------

// --- ROLES ---
const rolSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  descripcion: String,
  nivel: Number
});

// --- TIPOS_USUARIOS ---
const tipoUsuarioSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  descripcion: String
});

// --- USUARIOS ---
const usuarioSchema = new mongoose.Schema({
  rol_id: { type: mongoose.Schema.Types.ObjectId, ref: "roles" },
  nombre: String,
  numero_contacto: String,
  contrasena_: String,
  correo: String,
  fecha_registro: { type: Date, default: Date.now }
});

// 🔒 Hook para encriptar contraseñas antes de guardar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("contrasena_")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.contrasena_ = await bcrypt.hash(this.contrasena_, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔑 Método para comparar contraseñas
usuarioSchema.methods.compararContrasena = function (contrasenaPlano) {
  return bcrypt.compare(contrasenaPlano, this.contrasena_);
};

// --- MASCOTAS ---
const mascotaSchema = new mongoose.Schema({
  serial: { type: String, unique: true, required: true },
  nombre_mascota: String,
  raza_perro: String,
  edad_perro: Number
});

// --- DISPOSITIVOS ---
const dispositivoSchema = new mongoose.Schema({
  serial: { type: String, unique: true, required: true },
  estado: String,
  fecha_registro: { type: Date, default: Date.now }
});

// --- MEDICIONES ---
const medicionSchema = new mongoose.Schema({
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: "dispositivos" },
  fecha: { type: Date, default: Date.now },
  movimiento: Boolean,
  ubicacion_lat: Number,
  ubicacion_lng: Number,
  estado_collar: Boolean,
  estado_broche: Boolean,
  bateria: Number
});

// --- UBICACIONES HISTÓRICOS ---
const ubicacionHistoricoSchema = new mongoose.Schema({
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: "dispositivos" },
  fecha: { type: Date, default: Date.now },
  latitud: Number,
  longitud: Number
});

// --- EVENTOS ---
const eventoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios" },
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: "dispositivos" },
  fecha: { type: Date, default: Date.now },
  hora: Number,
  tipo_evento: String,
  descripcion: String,
  estado: String
});

// ------------------------------------------------------
// 🧱 Modelos
// ------------------------------------------------------
const Rol = mongoose.model("roles", rolSchema);
const TipoUsuario = mongoose.model("tipos_usuarios", tipoUsuarioSchema);
const Usuario = mongoose.model("usuarios", usuarioSchema);
const Mascota = mongoose.model("mascotas", mascotaSchema);
const Dispositivo = mongoose.model("dispositivos", dispositivoSchema);
const Medicion = mongoose.model("mediciones", medicionSchema);
const UbicacionHistorico = mongoose.model("ubicaciones_historicos", ubicacionHistoricoSchema);
const Evento = mongoose.model("eventos", eventoSchema);

// ------------------------------------------------------
// 🚦 Inicializar roles
// ------------------------------------------------------
async function inicializarRoles() {
  const rolesIniciales = [
    { nombre: "admin", descripcion: "Administradores del sistema", nivel: 4 },
    { nombre: "dueño", descripcion: "Dueño de las mascotas", nivel: 3 },
    { nombre: "guarderia", descripcion: "Guardería o veterinaria, acceso a muchas mascotas", nivel: 2 },
    { nombre: "cuidador", descripcion: "Cuidador, solo ve la ubicación de la mascota", nivel: 1 }
  ];

  for (const rolData of rolesIniciales) {
    const existe = await Rol.findOne({ nombre: rolData.nombre });
    if (!existe) {
      await new Rol(rolData).save();
      console.log(`✅ Rol '${rolData.nombre}' creado`);
    }
  }
}

// Ejecutar la inicialización después de conectar a MongoDB
mongoose.connection.once("open", () => {
  inicializarRoles();
});

// ------------------------------------------------------
// 🛠️ Funciones de rutas genéricas
// ------------------------------------------------------
function crearRutasCRUD(modelo, nombre) {
  const ruta = `/api/${nombre}`;

  app.get(ruta, async (req, res) => {
    const data = await modelo.find();
    res.json(data);
  });

  app.post(ruta, async (req, res) => {
    try {
      const nuevo = new modelo(req.body);
      const guardado = await nuevo.save();
      res.status(201).json(guardado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put(`${ruta}/:id`, async (req, res) => {
    try {
      const actualizado = await modelo.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(actualizado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete(`${ruta}/:id`, async (req, res) => {
    try {
      await modelo.findByIdAndDelete(req.params.id);
      res.json({ mensaje: `${nombre} eliminado correctamente` });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}

function crearRutaGet(modelo, nombre) {
  const ruta = `/api/${nombre}`;
  app.get(ruta, async (req, res) => res.json(await modelo.find()));
}

// ------------------------------------------------------
// 🚀 Crear rutas
// ------------------------------------------------------
crearRutasCRUD(Rol, "roles");
crearRutasCRUD(TipoUsuario, "tipos_usuarios");
crearRutasCRUD(Usuario, "usuarios");
crearRutasCRUD(Mascota, "mascotas");
crearRutasCRUD(Dispositivo, "dispositivos");

// Solo GET
crearRutaGet(Medicion, "mediciones");
crearRutaGet(UbicacionHistorico, "ubicaciones_historicos");
crearRutaGet(Evento, "eventos");

// ------------------------------------------------------
// 🧠 Puerto
// ------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`⚙️ Servidor escuchando en http://localhost:${PORT}`));
