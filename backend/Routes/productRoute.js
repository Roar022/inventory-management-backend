const express = require("express");
const {
  createProduct,
  getProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");
const router = express.Router();

//                               array => to upload multiple files
router.post("/", protect, upload.single("image"), createProduct);
router.patch("/:id", protect, upload.single("image"), updateProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
