//////////////////////////////////////////////////////////
// PETLINK DATABASE MODEL v4 - Mongo Version
// Autor: Jair
// Adaptado para MongoDB usando Mongoose
//////////////////////////////////////////////////////////

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// URI de conexión
const MONGO_URI = "mongodb+srv://Jairsito1104:Pdhijhnm45*@cluster0.yivafrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Conexión a MongoDB
mongoose.connect(MONGO_URI, { dbName: 'Petlink' })
  .then(() => console.log("✅ Conectado a MongoDB (Petlink)"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err.message));



// Tabla roles
const roleSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  descripcion: String,
  nivel: Number
});
const Role = mongoose.model('roles', roleSchema);

// Tabla tipos_usuarios
const tipoUsuarioSchema = new mongoose.Schema({
  nombre: { type: String, unique: true, required: true },
  descripcion: String
});
const TipoUsuario = mongoose.model('tipos_usuarios', tipoUsuarioSchema);

// Tabla usuarios
const usuarioSchema = new mongoose.Schema({
  rol_id: { type: mongoose.Schema.Types.ObjectId, ref: 'roles' },
  nombre: String,
  numero_contacto: String,
  contrasena_: String,
  correo: String,
  fecha_registro: { type: Date, default: Date.now }
});
const Usuario = mongoose.model('usuarios', usuarioSchema);

// Tabla mascotas
const mascotaSchema = new mongoose.Schema({
  serial: { type: String, unique: true, required: true },
  nombre_mascota: String,
  raza_perro: String,
  edad_perro: Number
});
const Mascota = mongoose.model('mascotas', mascotaSchema);

// Tabla dispositivos
const dispositivoSchema = new mongoose.Schema({
  serial: { type: String, unique: true, required: true },
  estado: String,
  fecha_registro: { type: Date, default: Date.now }
});
const Dispositivo = mongoose.model('dispositivos', dispositivoSchema);

// Tabla mediciones
const medicionSchema = new mongoose.Schema({
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'dispositivos' },
  fecha: { type: Date, default: Date.now },
  movimiento: Boolean,
  ubicacion_lat: Number,
  ubicacion_lng: Number,
  estado_collar: Boolean,
  estado_broche: Boolean,
  bateria: Number
});
const Medicion = mongoose.model('mediciones', medicionSchema);

// Tabla ubicaciones_historicos
const ubicacionSchema = new mongoose.Schema({
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'dispositivos' },
  fecha: { type: Date, default: Date.now },
  latitud: Number,
  longitud: Number
});
const Ubicacion = mongoose.model('ubicaciones_historicos', ubicacionSchema);

// Tabla eventos
const eventoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'dispositivos' },
  fecha: { type: Date, default: Date.now },
  hora: String,
  tipo_evento: String,
  descripcion: String,
  estado: String
});
const Evento = mongoose.model('eventos', eventoSchema);


async function crearColecciones() {
  const modelos = [Role, TipoUsuario, Usuario, Mascota, Dispositivo, Medicion, Ubicacion, Evento];
  for (const modelo of modelos) {
    await modelo.createCollection(); // crea la colección vacía si no existe
  }
  console.log("📁 Colecciones creadas en MongoDB (Petlink)");
}

mongoose.connection.once('open', async () => {
  await crearColecciones();
});

app.get('/', (req, res) => {
  res.send({ mensaje: "Servidor PetLink activo y colecciones listas 🚀" });
});


app.listen(port, () => {
  console.log(`🌐 Servidor PetLink ejecutándose en http://localhost:${port}`);
});
