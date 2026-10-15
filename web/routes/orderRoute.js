import express from "express"
import {
    deleteOrders,
    fetchOrders
} from "../controller/orderController.js"

const router = express.Router()

router.get('/', fetchOrders)
router.delete('/:id',deleteOrders)

export default router