//////////////////////////////////////////////////////////
// PETLINK API v5
// Autor: Jair
// Backend con Express + MongoDB
// Modelo adaptado desde el diseño relacional (v4)
// CRUD simplificado: solo POST y GET
// 🔐 Mejora: contraseñas cifradas con bcryptjs
// 🚦 Inicialización automática de roles
//////////////////////////////////////////////////////////


require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;
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

mongoose.connect(process.env.MONGO_URI)
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

// 🔒 Encriptar contraseñas
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

mongoose.connection.once("open", () => {
  inicializarRoles();
});

// ------------------------------------------------------
// 🛠️ Función CRUD (solo POST y GET)
// ------------------------------------------------------
function crearRutasCRUD(modelo, nombre) {
  const ruta = `/api/${nombre}`;

  // GET: obtener todos
  app.get(ruta, async (req, res) => {
    try {
      const data = await modelo.find();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: crear nuevo
  app.post(ruta, async (req, res) => {
    try {
      const nuevo = new modelo(req.body);
      const guardado = await nuevo.save();
      res.status(201).json(guardado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}

// ------------------------------------------------------
// 🚀 Crear rutas (todas las colecciones usan la misma función)
// ------------------------------------------------------
crearRutasCRUD(Rol, "roles");
crearRutasCRUD(TipoUsuario, "tipos_usuarios");
crearRutasCRUD(Usuario, "usuarios");
crearRutasCRUD(Mascota, "mascotas");
crearRutasCRUD(Dispositivo, "dispositivos");
crearRutasCRUD(Medicion, "mediciones");
crearRutasCRUD(UbicacionHistorico, "ubicaciones_historicos");
crearRutasCRUD(Evento, "eventos");


// ------------------------------------------------------
// 🌐 Servicios del dispositivo (para ESP32)
// ------------------------------------------------------

// 1️⃣ Autenticación del dispositivo
app.post("/api/dispositivo/login", async (req, res) => {
  try {
    const { serial } = req.body;
    const dispositivo = await Dispositivo.findOne({ serial });
    if (!dispositivo) return res.status(404).json({ error: "Dispositivo no registrado" });
    res.json({ message: "Autenticado", id: dispositivo._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Envío de datos de sensores (mediciones)
app.post("/api/dispositivo/data", async (req, res) => {
  try {
    const { serial, data } = req.body;
    const dispositivo = await Dispositivo.findOne({ serial });
    if (!dispositivo) return res.status(404).json({ error: "Dispositivo no encontrado" });

    const nuevaMedicion = new Medicion({
      dispositivo_id: dispositivo._id,
      ...data
    });

    await nuevaMedicion.save();
    res.json({ message: "Datos recibidos", id: nuevaMedicion._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Reporte de eventos del dispositivo
app.post("/api/dispositivo/evento", async (req, res) => {
  try {
    const { serial, tipo_evento, descripcion } = req.body;
    const dispositivo = await Dispositivo.findOne({ serial });
    if (!dispositivo) return res.status(404).json({ error: "Dispositivo no encontrado" });

    const evento = new Evento({
      dispositivo_id: dispositivo._id,
      tipo_evento, // ej: “collar_abierto”, “movimiento_detectado”, “bajo_bateria”
      descripcion,
      estado: "reportado"
    });

    await evento.save();
    res.json({ message: "Evento registrado", id: evento._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4️⃣ Configuración dinámica (qué hacer cuando el perro se pierde)
app.get("/api/dispositivo/config/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const dispositivo = await Dispositivo.findOne({ serial });
    if (!dispositivo) return res.status(404).json({ error: "Dispositivo no encontrado" });

        const configuracion = {
      modo_perdido: {
        leds: true,
        pantalla: true,
        buzzer: true
      },
      modo_normal: {
        verificar_sensores: true,
        frecuencia_check: 5 // segundos
      }
    };

    res.json(configuracion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5️⃣ Comando directo desde el servidor (para apagar, reiniciar, etc.)
app.get("/api/dispositivo/comando/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const dispositivo = await Dispositivo.findOne({ serial });
    if (!dispositivo) return res.status(404).json({ error: "Dispositivo no encontrado" });

    // 🧭 Comando de control (se puede cambiar en tiempo real desde panel web)
    const comando = {
      accion: "ninguno", // opciones: “apagar”, “reiniciar”, “modo_ahorro”
      timestamp: new Date()
    };

    res.json(comando);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------------------------
// 🧠 Puerto
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚙️ Servidor escuchando en http://localhost:${PORT}`));
