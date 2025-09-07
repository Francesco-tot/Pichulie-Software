
const express = require("express");
const cors = require("cors");
const app = express();

const { connectDB } = require("./src/config/db.js")
const routes = require("./src/routes/routes")

const PORT = 3000;

// Middlewares
app.use(cors()); //Permitir peticiones desde el frontend
app.use(express.json());

// Rutas principales
app.use(routes);

app.get("/", (req, res) => {
  res.send("Express está funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

connectDB();
