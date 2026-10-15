import {
    consumeBannerViewCredit
} from "../repositories/subscription.repository.js";


export const recordBannerView = async (req, res) => {
    try {

        const shop = decodeURIComponent(req.query.shop);
        const {
            placement,
            sessionId
        } = req.body ?? {};

        if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
            return res.status(400).json({
                success: false,
                allowed: false,
                message: "Valid session ID is required",
            });
        }

        if (!shop || typeof shop !== "string") {
            return res.status(400).json({
                success: false,
                allowed: false,
                message: "Shop is required",
            });
        }

        if (!placement || typeof placement !== "string") {
            return res.status(400).json({
                success: false,
                allowed: false,
                message: "Banner placement is required",
            });
        }

        const result = await consumeBannerViewCredit(shop,sessionId);

        if (!result.allowed) {
            return res.status(403).json({
                success: true,
                allowed: false,
                reason: result.reason,
                message: "No banner-view credits available",
            });
        }

        return res.status(200).json({
            success: true,
            allowed: true,
            data: {
                creditCount: result.creditCount,
                creditLimit: result.creditLimit,
                planCode: result.planCode,
                remaining: result.creditLimit - result.creditCount,
                placement,
            },
        });
    } catch (error) {
        console.error("Record banner view error:", error);

        return res.status(500).json({
            success: false,
            allowed: false,
            message: "Failed to consume banner-view credit",
        });
    }
};