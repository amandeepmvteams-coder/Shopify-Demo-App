import express from "express";
import multer from "multer";

import {
    fetchProducts,
    countProducts,
    createProduct,
    deleteProduct,
    updateProduct,
} from "../controller/productController.js";
const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
})

router.get('/', fetchProducts)
router.get('/count', countProducts)
router.post('/', upload.array("images", 10), createProduct)
router.delete('/:id', deleteProduct)
router.put('/:id', updateProduct)

export default router;