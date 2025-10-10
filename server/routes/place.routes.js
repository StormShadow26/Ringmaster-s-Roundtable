import express from "express";
import { addPlace, getAllPlaces } from "../controllers/placeController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/add", upload.single("photo"), addPlace); // upload photo
router.get("/all", getAllPlaces);

export default router;
