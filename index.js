const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = "mongodb+srv://Jairsito1104:Pdhijhnm45*@cluster0.yivafrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(MONGO_URI,{
  dbname:'Petlink'
}).then(()=>{
  console.log("Conectado a mongo");


}).catch((err)=>{
  console.log("Error conectadndo a Mongo",err.message);
})

const usuariosschema =new mongoose.Schema({
  id : {type:String,required:true},

},
{
  timestamps : true
})

const user = mongoose.model('Usuario',usuariosschema)



var mascotas = [
  { serial: 1001, nombre: "Luna", raza: "Labrador", edad: 3, dueño: "Ana", contacto: 3254855896 },
  { serial: 1002, nombre: "Rocky", raza: "Bulldog", edad: 4, dueño: "Carlos", contacto: 3115458976 },
  { serial: 1003, nombre: "Milo", raza: "Beagle", edad: 2, dueño: "Laura", contacto: 3106245547 },
  { serial: 1004, nombre: "Nala", raza: "Golden Retriever", edad: 5, dueño: "Diego", contacto: 3124782143 },
  { serial: 1005, nombre: "Coco", raza: "Poodle", edad: 1, dueño: "Sofía", contacto: 3209541506 }
];

var ubicaciones = [
  { serial: 1001, lat: 4.710989, lon: -74.072092, horaTransmision: "10:15 AM", enMovimiento: true },
  { serial: 1002, lat: 4.748116, lon: -74.056753, horaTransmision: "10:10 AM", enMovimiento: false },
  { serial: 1003, lat: 4.667897, lon: -74.057123, horaTransmision: "10:18 AM", enMovimiento: true },
  { serial: 1004, lat: 4.732564, lon: -74.080231, horaTransmision: "10:12 AM", enMovimiento: false },
  { serial: 1005, lat: 4.721223, lon: -74.069951, horaTransmision: "10:20 AM", enMovimiento: true }
];

var ubicacionesPerdidas = [
  { serial: 2001, lat: 4.658222, lon: -74.093333, horaTransmision: "09:58 AM", enMovimiento: true },
  { serial: 2002, lat: 4.723444, lon: -74.049882, horaTransmision: "09:45 AM", enMovimiento: false },
  { serial: 2003, lat: 4.699112, lon: -74.078120, horaTransmision: "09:51 AM", enMovimiento: true },
  { serial: 2004, lat: 4.740500, lon: -74.060321, horaTransmision: "10:00 AM", enMovimiento: false },
  { serial: 2005, lat: 4.706332, lon: -74.067772, horaTransmision: "09:53 AM", enMovimiento: true }
];

var estadoCollares = [
  { serial: 1001, hiloConductor: true, sensorMagnetico: true, antenasOk: true },
  { serial: 1002, hiloConductor: true, sensorMagnetico: false, antenasOk: true },
  { serial: 1003, hiloConductor: false, sensorMagnetico: true, antenasOk: true },
  { serial: 1004, hiloConductor: true, sensorMagnetico: true, antenasOk: false },
  { serial: 1005, hiloConductor: true, sensorMagnetico: true, antenasOk: true }
];


app.get('/', (req, res) => {
  res.send({ mensaje: "Servidor PetLink activo " });
});

app.get('/hora', (req, res) => {
  res.send({ mensaje: "Servidor PetLink activo " });
});


app.get('/pet', (req, res) => {
  const serial = parseInt(req.query.serial);
  if (serial) {
    const mascota = mascotas.find(m => m.serial === serial);
    if (!mascota) return res.status(404).json({ mensaje: "Mascota no encontrada " });
    return res.json({ mensaje: "Información de mascota encontrada ", mascota });
  }
  res.json({ mensaje: "Listado de mascotas registradas", mascotas });
});


app.post('/pet', (req, res) => {
  const { serial, nombre, raza, edad, dueño, contacto } = req.body;

 
  if (!serial || !nombre || !raza || !edad || !dueño || !contacto) {
    return res.status(400).json({ mensaje: "Faltan datos para registrar la mascota " });
  }

  
  const existe = mascotas.find(m => m.serial === serial);
  if (existe) {
    return res.status(409).json({ mensaje: "Ya existe una mascota con ese serial " });
  }


  const nuevaMascota = { serial, nombre, raza, edad, dueño, contacto };
  mascotas.push(nuevaMascota);

  res.status(201).json({ mensaje: "Mascota registrada exitosamente ", mascota: nuevaMascota });
});



app.get('/ubi', (req, res) => {
  const serial = parseInt(req.query.serial);
  if (serial) {
    const ubicacion = ubicaciones.find(u => u.serial === serial);
    if (!ubicacion) return res.status(404).json({ mensaje: "Ubicación no encontrada " });
    return res.json({ mensaje: "Ubicación encontrada ", ubicacion });
  }
  res.json({ mensaje: "Ubicaciones actuales de las mascotas activas", ubicaciones });
});


app.get('/ubilost', (req, res) => {
  const serial = parseInt(req.query.serial);
  if (serial) {
    const perdida = ubicacionesPerdidas.find(u => u.serial === serial);
    if (!perdida) return res.status(404).json({ mensaje: "Mascota perdida no encontrada " });
    return res.json({ mensaje: "Ubicación de mascota perdida encontrada ", perdida });
  }
  res.json({ mensaje: "Ubicaciones de mascotas perdidas ", ubicacionesPerdidas });
});


app.get('/eCollares', (req, res) => {
  const serial = parseInt(req.query.serial);
  if (serial) {
    const collar = estadoCollares.find(c => c.serial === serial);
    if (!collar) return res.status(404).json({ mensaje: "Estado de collar no encontrado " });
    return res.json({ mensaje: "Estado del collar encontrado ", collar });
  }
  res.json({ mensaje: "Estado funcional de cada collar ", estadoCollares });
});

app.listen(port, () => {
  console.log(`Servidor PetLink ejecutándose en http://localhost:${port}`);
});
