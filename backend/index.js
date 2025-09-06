
const express = require("express");
const app = express();

const { connectDB } = require("./src/config/db.js")
const routes = require("./src/routes/routes")

const PORT = 3000;


app.use(express.json());


app.get("/", (req, res) => {
  res.send("Express está funcionando!");
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use(routes);

connectDB();
