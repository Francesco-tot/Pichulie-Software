
// Cargar variables de entorno
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const app = express();

// Importar rutas
const userRoutes = require("./src/apps/user/user");
const PORT = 3000;

// Middlewares
app.use(cors()); //Permitir peticiones desde el frontend
app.use(express.json());

// Rutas
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Express está funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
