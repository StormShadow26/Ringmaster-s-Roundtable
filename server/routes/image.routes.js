import { uploadImage, getImages, deleteImage } from "../controllers/imageController.js";
import upload from "../middlewares/upload.js";
import express from "express";

const router = express.Router();

// Upload single image
router.post("/upload/:userId", upload.single("image"), uploadImage);

// Get all images
router.get("/images/:userId", getImages);

// Delete image
router.delete("/delete/:userId/:publicId", deleteImage);

export default router;
