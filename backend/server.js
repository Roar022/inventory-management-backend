const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoutes = require("./Routes/userRoutes");
const productRoute = require("./Routes/productRoute");
const contactRoute = require("./Routes/contactRoute");

const errorMiddleware = require("./middleware/errorMiddleware");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
// const contactUs = require("./controllers/contactController");
// Route MiddleWare

// MiddleWare
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/product", productRoute);
app.use("/api/contactus", contactRoute);

// Routes
app.get("/", (req, res) => {
  res.send("Home Page");
});
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
