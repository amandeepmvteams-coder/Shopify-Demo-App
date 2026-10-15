import express from 'express'
import {
    createAppSubscription,
    getCurrentSubscription,
    syncSubscriptionStatus
} from '../controller/plansController.js'
const router = express.Router()

router.post('/create', createAppSubscription)
router.post("/sync-status", syncSubscriptionStatus);
router.get("/current", getCurrentSubscription);
export default router;