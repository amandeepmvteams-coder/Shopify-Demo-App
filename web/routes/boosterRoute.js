import express from 'express'
import {
    createBooster,
    deleteBooster,
    getAllBoosters,
    getBoosterById,
    renameBooster,
    unpublishBooster,
    updateBooster
} from '../controller/boosterController.js';
const router = express.Router()

router.post('/', createBooster)

router.get("/", getAllBoosters);

router.put("/:id", updateBooster);

router.get("/:id", getBoosterById);

router.post("/:id/unpublish", unpublishBooster);

router.post("/:id/rename", renameBooster);

router.delete("/:id", deleteBooster);



export default router;