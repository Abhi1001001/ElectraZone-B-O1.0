import { Product } from "../models/productModel.js";
import cloudinary from "../utills/cloudinary.js";
import getDataUri from "../utills/dataURI.js";

export const addProduct = async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      productPrice,
      productCategory,
      productBrand,
    } = req.body;
    const userId = req.id;

    if (
      !productName ||
      !productDescription ||
      !productPrice ||
      !productCategory ||
      !productBrand
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // handle multiple image uploads
    let productImage = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const fileUri = getDataUri(file);
        const result = await cloudinary.uploader.upload(fileUri, {
          folder: "e-comm_products", //cloudinary folder name
        });
        productImage.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    // create product in DB
    const newProduct = await Product.create({
      userId,
      productName,
      productDescription,
      productPrice,
      productCategory,
      productBrand,
      productImage, //array of objects
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Product added successfully",
        product: newProduct,
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    
    if (!products) {
      return res
        .status(400)
        .json({ success: false, message: "No products found" });
    }
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });
    }

    // delete images from cloudinary
    if(product.productImage && product.productImage.length > 0){
      for(let image of product.productImage){
        const result = await cloudinary.uploader.destroy(image.public_id);
      }
    }
    // delete product from DB
    await Product.findByIdAndDelete(productId);
    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
} 

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {productName, productDescription, productPrice, productCategory, productBrand, existingImages} = req.body;

    const product = await Product.findById(productId);
    if(!product){
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });
    }

    let updatedImages = [];

    // keep selected old images
    if(existingImages) {
      const keepIds = json.parse(existingImages);
      updatedImages = product.productImage.filter((image) => keepIds.includes(image.public_id));

      // delete only removed image
      const removedImage = product.productImage.filter((image) => !keepIds.includes(image.public_id));
      for(let image of removedImage){
        await cloudinary.uploader.destroy(image.public_id);
      }
    } else {
      updatedImages = product.productImage; // keep all images if no images selected
    }

    // upload image if any 
    if(req.files && req.files.length > 0){
      for(let file of req.files){
        const fileUri = getDataUri(file);
        const result = await cloudinary.uploader.upload(fileUri, {
          folder: "e-comm_products", //cloudinary folder name
        });
        updatedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    // update product
    product.productName = productName || product.productName;
    product.productDescription = productDescription || product.productDescription;
    product.productPrice = productPrice || product.productPrice;
    product.productCategory = productCategory || product.productCategory;
    product.productBrand = productBrand || product.productBrand;
    product.productImage = updatedImages;

    await product.save();
    return res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


