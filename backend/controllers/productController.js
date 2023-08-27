const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, price, quantity, description } = req.body;
  //   console.log(req.body)
  //   console.log(name)

  //   Validateion
  if (!name || !sku || !category || !price || !quantity || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  //   Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save file to Cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }
  // Create product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });
  res.status(201).json(product);
});

// Get All products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

// Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // If product does not exists
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product with user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  res.status(200).json(product);
});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // If product does not exists
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product with user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  // GPT
  await Product.deleteOne({ _id: product._id }); // Use deleteOne here
  res.status(200).json({ message: "Product deleted." });
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, price, quantity, description } = req.body;
  //   console.log(req.body)
  //   console.log(name)
  const { id } = req.params;
  const product = await Product.findById(id);

  // If product does not exists
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product with user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  //   Validateion
  // if (!name || !category || !price || !quantity || !description) {
  //   res.status(400);
  //   throw new Error("Please fill in all fields");
  // }

  //   Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save file to Cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }
  // Update product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      // image: fileData || product.image,
      image:Object.keys(fileData).length === 0 ? product?.image:fileData
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(201).json(updatedProduct);
});


module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
