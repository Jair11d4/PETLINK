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


// Conexión a MongoDB


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB (Petlink)"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err.message));


// Definición de Esquemas

//  ROLES 
const rolSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  descripcion: String,
  nivel: Number
});

// TIPOS_USUARIOS 
const tipoUsuarioSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  descripcion: String
});

//  USUARIOS 
const usuarioSchema = new mongoose.Schema({
  rol_id: { type: mongoose.Schema.Types.ObjectId, ref: "roles" },
  nombre: String,
  numero_contacto: String,
  contrasena_: String,
  correo: String,
  fecha_registro: { type: Date, default: Date.now }
});

// Encriptar contraseñas
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

// MASCOTAS
const mascotaSchema = new mongoose.Schema({
  serial: { type: String, unique: true, required: true },
  nombre_mascota: String,
  raza_perro: String,
  edad_perro: Number
});

//DISPOSITIVOS
const dispositivoSchema = new mongoose.Schema({
  serial: { type: String, unique: true, required: true },
  estado: String,
  fecha_registro: { type: Date, default: Date.now }
});

// MEDICIONES
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

// UBICACIONES HISTÓRICOS
const ubicacionHistoricoSchema = new mongoose.Schema({
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: "dispositivos" },
  fecha: { type: Date, default: Date.now },
  latitud: Number,
  longitud: Number
});

//EVENTOS
const eventoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios" },
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: "dispositivos" },
  fecha: { type: Date, default: Date.now },
  hora: Number,
  tipo_evento: String,
  descripcion: String,
  estado: String
});

// Modelos

const Rol = mongoose.model("roles", rolSchema);
const TipoUsuario = mongoose.model("tipos_usuarios", tipoUsuarioSchema);
const Usuario = mongoose.model("usuarios", usuarioSchema);
const Mascota = mongoose.model("mascotas", mascotaSchema);
const Dispositivo = mongoose.model("dispositivos", dispositivoSchema);
const Medicion = mongoose.model("mediciones", medicionSchema);
const UbicacionHistorico = mongoose.model("ubicaciones_historicos", ubicacionHistoricoSchema);
const Evento = mongoose.model("eventos", eventoSchema);


// ROLES 


app.post('/api/roles', async (req, res) => {
  try {
    const { nombre, descripcion, nivel } = req.body;

    if (!nombre) {
      return res.status(400).json({ ok: false, message: 'El nombre del rol es obligatorio' });
    }

    const nuevo = new Rol({ nombre, descripcion, nivel });
    const guardado = await nuevo.save();

    res.status(201).json({ ok: true, data: guardado });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, message: 'El nombre del rol ya existe' });
    }
    res.status(500).json({ ok: false, message: 'Error al crear el rol', error: err.message });
  }
});



// GET

app.get('/api/roles', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const roles = await Rol.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Rol.countDocuments();

    res.json({
      ok: true,
      data: roles,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar roles', error: err.message });
  }
});



//GET

app.get('/api/roles/:id', async (req, res) => {
  try {
    const rol = await Rol.findById(req.params.id);
    if (!rol) return res.status(404).json({ ok: false, message: 'Rol no encontrado' });
    res.json({ ok: true, data: rol });
  } catch (err) {
    res.status(400).json({ ok: false, message: 'ID inválido', error: err.message });
  }
});



//PUT

app.put('/api/roles/:id', async (req, res) => {
  try {
    const { nombre, descripcion, nivel } = req.body;
    const actualizado = await Rol.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, nivel },
      { new: true, runValidators: true }
    );

    if (!actualizado) return res.status(404).json({ ok: false, message: 'Rol no encontrado' });
    res.json({ ok: true, data: actualizado });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Ya existe un rol con ese nombre' });
    }
    res.status(400).json({ ok: false, message: 'Error al actualizar el rol', error: err.message });
  }
});



//PATCH

app.patch('/api/roles/:id', async (req, res) => {
  try {
    const actualizado = await Rol.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!actualizado) return res.status(404).json({ ok: false, message: 'Rol no encontrado' });
    res.json({ ok: true, data: actualizado });
  } catch (err) {
    res.status(400).json({ ok: false, message: 'Error al actualizar parcialmente el rol', error: err.message });
  }
});



//DELETE

app.delete('/api/roles/:id', async (req, res) => {
  try {
    const eliminado = await Rol.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ ok: false, message: 'Rol no encontrado' });
    res.json({ ok: true, message: 'Rol eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ ok: false, message: 'Error al eliminar el rol', error: err.message });
  }
});


//TIPOS DE USUARIOS


app.post('/api/tipos_usuarios', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ ok: false, message: 'El nombre del tipo de usuario es obligatorio' });
    }

    const nuevo = new TipoUsuario({ nombre, descripcion });
    const guardado = await nuevo.save();

    res.status(201).json({ ok: true, data: guardado });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, message: 'El tipo de usuario ya existe' });
    }
    res.status(500).json({ ok: false, message: 'Error al crear el tipo de usuario', error: err.message });
  }
});



//GET

app.get('/api/tipos_usuarios', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const tipos = await TipoUsuario.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await TipoUsuario.countDocuments();

    res.json({
      ok: true,
      data: tipos,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar los tipos de usuario', error: err.message });
  }
});



//GET

app.get('/api/tipos_usuarios/:id', async (req, res) => {
  try {
    const tipo = await TipoUsuario.findById(req.params.id);
    if (!tipo) return res.status(404).json({ ok: false, message: 'Tipo de usuario no encontrado' });
    res.json({ ok: true, data: tipo });
  } catch (err) {
    res.status(400).json({ ok: false, message: 'ID inválido', error: err.message });
  }
});



//PUT

app.put('/api/tipos_usuarios/:id', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const actualizado = await TipoUsuario.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion },
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(404).json({ ok: false, message: 'Tipo de usuario no encontrado' });
    }

    res.json({ ok: true, data: actualizado });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Ya existe un tipo de usuario con ese nombre' });
    }
    res.status(400).json({ ok: false, message: 'Error al actualizar el tipo de usuario', error: err.message });
  }
});



//PATCH

app.patch('/api/tipos_usuarios/:id', async (req, res) => {
  try {
    const actualizado = await TipoUsuario.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(404).json({ ok: false, message: 'Tipo de usuario no encontrado' });
    }

    res.json({ ok: true, data: actualizado });
  } catch (err) {
    res.status(400).json({ ok: false, message: 'Error al actualizar parcialmente el tipo de usuario', error: err.message });
  }
});



//DELETE

app.delete('/api/tipos_usuarios/:id', async (req, res) => {
  try {
    const eliminado = await TipoUsuario.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, message: 'Tipo de usuario no encontrado' });
    }
    res.json({ ok: true, message: 'Tipo de usuario eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ ok: false, message: 'Error al eliminar el tipo de usuario', error: err.message });
  }
});


//USUARIO


app.post("/api/usuarios", async (req, res) => {
  const { rol_id, nombre, numero_contacto, contrasena_, correo, fecha_registro } = req.body;

  if (!nombre || !correo || !contrasena_) {
    return res.status(400).json({ ok: false, message: "Nombre, correo y contraseña son obligatorios" });
  }

  const nuevo = new Usuario({ rol_id, nombre, numero_contacto, contrasena_, correo, fecha_registro });
  const guardado = await nuevo.save();

  const { contrasena_: _, ...usuarioSinClave } = guardado.toObject();
  res.status(201).json({ ok: true, data: usuarioSinClave });
});

app.get("/api/usuarios", async (req, res) => {
  const usuarios = await Usuario.find({}, "-contrasena_").populate("rol_id").sort({ createdAt: -1 });
  res.json({ ok: true, data: usuarios });
});

app.get("/api/usuarios/:id", async (req, res) => {
  const usuario = await Usuario.findById(req.params.id, "-contrasena_").populate("rol_id");
  if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  res.json({ ok: true, data: usuario });
});

app.put("/api/usuarios/:id", async (req, res) => {
  const actualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    select: "-contrasena_"
  });
  if (!actualizado) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  res.json({ ok: true, data: actualizado });
});

app.delete("/api/usuarios/:id", async (req, res) => {
  const eliminado = await Usuario.findByIdAndDelete(req.params.id);
  if (!eliminado) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  res.json({ ok: true, message: "Usuario eliminado correctamente" });
});



//MASCOTAS


app.post("/api/mascotas", async (req, res) => {
  const { serial, nombre_mascota, raza_perro, edad_perro } = req.body;

  if (!serial || !nombre_mascota) {
    return res.status(400).json({ ok: false, message: "El serial y el nombre de la mascota son obligatorios" });
  }

  const nueva = new Mascota({ serial, nombre_mascota, raza_perro, edad_perro });
  const guardada = await nueva.save();
  res.status(201).json({ ok: true, data: guardada });
});

app.get("/api/mascotas", async (req, res) => {
  const mascotas = await Mascota.find().sort({ createdAt: -1 });
  res.json({ ok: true, data: mascotas });
});

app.get("/api/mascotas/:id", async (req, res) => {
  const mascota = await Mascota.findById(req.params.id);
  if (!mascota) return res.status(404).json({ ok: false, message: "Mascota no encontrada" });
  res.json({ ok: true, data: mascota });
});

app.put("/api/mascotas/:id", async (req, res) => {
  const actualizada = await Mascota.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!actualizada) return res.status(404).json({ ok: false, message: "Mascota no encontrada" });
  res.json({ ok: true, data: actualizada });
});

app.delete("/api/mascotas/:id", async (req, res) => {
  const eliminada = await Mascota.findByIdAndDelete(req.params.id);
  if (!eliminada) return res.status(404).json({ ok: false, message: "Mascota no encontrada" });
  res.json({ ok: true, message: "Mascota eliminada correctamente" });
});


//DISPOSITIVOS


app.post("/api/dispositivos", async (req, res) => {
  const { serial, estado, fecha_registro } = req.body;

  if (!serial) {
    return res.status(400).json({ ok: false, message: "El serial del dispositivo es obligatorio" });
  }

  const nuevo = new Dispositivo({ serial, estado, fecha_registro });
  const guardado = await nuevo.save();
  res.status(201).json({ ok: true, data: guardado });
});

app.get("/api/dispositivos", async (req, res) => {
  const dispositivos = await Dispositivo.find().sort({ createdAt: -1 });
  res.json({ ok: true, data: dispositivos });
});

app.get("/api/dispositivos/:id", async (req, res) => {
  const dispositivo = await Dispositivo.findById(req.params.id);
  if (!dispositivo) return res.status(404).json({ ok: false, message: "Dispositivo no encontrado" });
  res.json({ ok: true, data: dispositivo });
});

app.put("/api/dispositivos/:id", async (req, res) => {
  const actualizado = await Dispositivo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!actualizado) return res.status(404).json({ ok: false, message: "Dispositivo no encontrado" });
  res.json({ ok: true, data: actualizado });
});

app.delete("/api/dispositivos/:id", async (req, res) => {
  const eliminado = await Dispositivo.findByIdAndDelete(req.params.id);
  if (!eliminado) return res.status(404).json({ ok: false, message: "Dispositivo no encontrado" });
  res.json({ ok: true, message: "Dispositivo eliminado correctamente" });
});


//MEDICIONES


app.post("/api/mediciones", async (req, res) => {
  const { dispositivo_id, fecha, movimiento, ubicacion_lat, ubicacion_lng, estado_collar, estado_broche, bateria } = req.body;

  if (!dispositivo_id || !fecha) {
    return res.status(400).json({ ok: false, message: "El dispositivo y la fecha son obligatorios" });
  }

  const nueva = new Medicion({ dispositivo_id, fecha, movimiento, ubicacion_lat, ubicacion_lng, estado_collar, estado_broche, bateria });
  const guardada = await nueva.save();
  res.status(201).json({ ok: true, data: guardada });
});

app.get("/api/mediciones", async (req, res) => {
  const mediciones = await Medicion.find().populate("dispositivo_id").sort({ fecha: -1 });
  res.json({ ok: true, data: mediciones });
});

app.get("/api/mediciones/:id", async (req, res) => {
  const medicion = await Medicion.findById(req.params.id).populate("dispositivo_id");
  if (!medicion) return res.status(404).json({ ok: false, message: "Medición no encontrada" });
  res.json({ ok: true, data: medicion });
});

app.put("/api/mediciones/:id", async (req, res) => {
  const actualizada = await Medicion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!actualizada) return res.status(404).json({ ok: false, message: "Medición no encontrada" });
  res.json({ ok: true, data: actualizada });
});

app.delete("/api/mediciones/:id", async (req, res) => {
  const eliminada = await Medicion.findByIdAndDelete(req.params.id);
  if (!eliminada) return res.status(404).json({ ok: false, message: "Medición no encontrada" });
  res.json({ ok: true, message: "Medición eliminada correctamente" });
});



//UBICACIONES HISTÓRICOS


// Crear un registro de ubicación histórica
app.post("/api/ubicaciones_historicos", async (req, res) => {
  const { dispositivo, latitud, longitud, fecha } = req.body;

  if (!dispositivo || latitud === undefined || longitud === undefined) {
    return res.status(400).json({ ok: false, message: "Dispositivo, latitud y longitud son obligatorios" });
  }

  const nuevo = new UbicacionHistorico({ dispositivo, latitud, longitud, fecha, velocidad });
  const guardado = await nuevo.save();
  res.status(201).json({ ok: true, data: guardado });
});


// Obtener todos los registros históricos de ubicación
app.get("/api/ubicaciones_historicos", async (req, res) => {
  const ubicaciones = await UbicacionHistorico.find().populate("dispositivo").sort({ createdAt: -1 });
  res.json({ ok: true, data: ubicaciones });
});


// Obtener un registro por ID
app.get("/api/ubicaciones_historicos/:id", async (req, res) => {
  const ubicacion = await UbicacionHistorico.findById(req.params.id).populate("dispositivo");
  if (!ubicacion) {
    return res.status(404).json({ ok: false, message: "Registro de ubicación no encontrado" });
  }
  res.json({ ok: true, data: ubicacion });
});


// Actualizar un registro histórico
app.put("/api/ubicaciones_historicos/:id", async (req, res) => {
  const actualizado = await UbicacionHistorico.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!actualizado) {
    return res.status(404).json({ ok: false, message: "Registro de ubicación no encontrado" });
  }
  res.json({ ok: true, data: actualizado });
});


// Eliminar un registro histórico
app.delete("/api/ubicaciones_historicos/:id", async (req, res) => {
  const eliminado = await UbicacionHistorico.findByIdAndDelete(req.params.id);
  if (!eliminado) {
    return res.status(404).json({ ok: false, message: "Registro de ubicación no encontrado" });
  }
  res.json({ ok: true, message: "Registro de ubicación eliminado correctamente" });
});


// EVENTOS


app.post("/api/eventos", async (req, res) => {
  try {
    const { usuario_id, dispositivo_id, tipo_evento, descripcion, fecha, hora, estado } = req.body;

    if (!dispositivo_id || !tipo_evento) {
      return res.status(400).json({ ok: false, message: "dispositivo_id y tipo_evento son obligatorios" });
    }

    const nuevo = new Evento({
      usuario_id,
      dispositivo_id,
      tipo_evento,
      descripcion,
      fecha: fecha || Date.now(),
      hora,
      estado
    });

    const guardado = await nuevo.save();
    res.status(201).json({ ok: true, data: guardado });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Error al crear el evento", error: err.message });
  }
});


// Obtener todos los eventos
app.get("/api/eventos", async (req, res) => {
  try {
    const eventos = await Evento.find()
      .populate("usuario_id dispositivo_id")
      .sort({ fecha: -1 });

    res.json({ ok: true, data: eventos });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Error al obtener los eventos", error: err.message });
  }
});


// Obtener un evento por ID
app.get("/api/eventos/:id", async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id).populate("usuario_id dispositivo_id");
    if (!evento) {
      return res.status(404).json({ ok: false, message: "Evento no encontrado" });
    }
    res.json({ ok: true, data: evento });
  } catch (err) {
    res.status(400).json({ ok: false, message: "ID inválido", error: err.message });
  }
});


// Actualizar un evento
app.put("/api/eventos/:id", async (req, res) => {
  try {
    const actualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!actualizado) {
      return res.status(404).json({ ok: false, message: "Evento no encontrado" });
    }

    res.json({ ok: true, data: actualizado });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Error al actualizar el evento", error: err.message });
  }
});


// Eliminar un evento
app.delete("/api/eventos/:id", async (req, res) => {
  try {
    const eliminado = await Evento.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, message: "Evento no encontrado" });
    }
    res.json({ ok: true, message: "Evento eliminado correctamente" });
  } catch (err) {
    res.status(400).json({ ok: false, message: "Error al eliminar el evento", error: err.message });
  }
});



//  Servicios del dispositivo (para ESP32)


//  Autenticación del dispositivo
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


// Puerto

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚙️ Servidor escuchando en http://localhost:${PORT}`));