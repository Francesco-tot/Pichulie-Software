
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

const { connectDB } = require("./src/config/db.js")
const routes = require("./src/routes/routes")

const PORT = 3000;

// Middlewares
app.use(cors()); // Allow requests from the frontend
app.use(express.json());

// Parse cookies
app.use(cookieParser()); 

// Main routes
app.use(routes);

app.get("/", (req, res) => {
  res.send("Express is working!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

connectDB();
