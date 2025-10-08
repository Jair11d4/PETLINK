const express = require('express');
const app = express();
const port = 3000;  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
var payload = {
    mensaje: "Hola Mundo!",  
  }

  res.send(payload);
});


app.get('/hora', (req, res) => {
console.log(req);

var payload = {

    mensaje: "Hola Mundo!",  
    hora: new Date().toLocaleTimeString()     
  }

  res.send(payload);
});

app.get('/doble', (req, res) => {
console.log(req.query);

var payload = {

    mensaje: "Hola Mundo!",  
    hora: new Date().toLocaleTimeString()     
  }

  res.send(payload);
});

app.post('/suma', (req, res) => {
var variables = req.body;

console.log(variables);
var resultado_suma  = variables.num1 + variables.num2

var payload = {
    mensaje: "Hola Mundo!",  
    rsultado : resultado_suma 
  }

  res.send(payload);
});

app.post('/petlink', (req, res)=>{
  var datos =req.body;

  console.log(datos);
  var info ={
    mensaje: "Nueva mascota",
    Serial:datos.Ser,
    Raza:datos.Raza,
    Age:datos.Age,
    Ubi:datos.Ubi,
    Hum:datos.Hum,
    ContNum:datos.ContNum

  }
  res.send(info);
});
app.get('/perdido', (req, res)=>{

  console.log(req.query);
  var info ={
    mensaje: "Mascota Perdida",
    Serial:132132,
    Ubi:"Usequen",
    Time:new Date().toLocaleTimeString(),
    Battery:60,
    ContNum:23132132

  }
  res.send(info);
});
app.get('/encontrada', (req, res)=>{

  console.log(req.query);
  var info ={
    mensaje: "Mascota Encontrada",
    Serial:132132,
    Ubi:"Nize",
    Time:new Date().toLocaleTimeString(),
    Battery:60

  }
  res.send(info);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});