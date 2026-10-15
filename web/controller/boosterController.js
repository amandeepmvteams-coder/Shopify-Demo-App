import {
    getPublishBoosterRepository,
    renameBoosterRepository
} from '../repositories/booster.repository.js';
import {
    createBoosterService,
    deleteBoosterService,
    getAllBoosterService,
    getBoosterByIdService,
    unpublishBoosterService,
    updateBoosterService
} from '../services/booster.service.js'


export const createBooster = async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;

        const {
            type,
            name,
            content,
            status,
            design,
            placement
        } = req.body;

        const booster = await createBoosterService({
            shop,
            type,
            name,
            content,
            status,
            design,
            placement
        })
        return res.status(201).json({
            success: true,
            message: "Booster created successfully",
            data: booster,
        });


    } catch (error) {
        console.error("Create booster error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create booster",
            error: error.message,
        });
    }

}

export const getAllBoosters = async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;



        const boosters = await getAllBoosterService({
            shop,
        });

        return res.status(200).json({
            success: true,
            message: "Boosters fetched successfully",
            data: boosters,
        });

    } catch (error) {
        console.error("Get all boosters error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch boosters",
            error: error.message,
        });
    }
};

export const updateBooster = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const {
            name,
            type,
            status,
            content,
            design,
            placement,
        } = req.body;

        const shop = res.locals.shopify.session.shop;

        const booster = await updateBoosterService({
            id,
            shop,
            name,
            type,
            status,
            content,
            design,
            placement,
        });

        return res.status(200).json({
            success: true,
            message: "Booster updated successfully",
            data: booster,
        });

    } catch (error) {
        console.error("Update booster error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update booster",
            error: error.message,
        });
    }
};

export const getBoosterById = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const shop = res.locals.shopify.session.shop;

        const booster = await getBoosterByIdService({
            id,
            shop,
        });

        if (!booster) {
            return res.status(404).json({
                success: false,
                message: "Booster not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: booster,
        });

    } catch (error) {
        console.error("Get booster error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get booster",
            error: error.message,
        });
    }
};

export const unpublishBooster = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const shop = res.locals.shopify.session.shop;

        const booster = await unpublishBoosterService({
            id,
            shop,
        });

        return res.status(200).json({
            success: true,
            message: "Booster unpublished successfully",
            data: booster,
        });
    } catch (error) {
        console.error("Unpublish booster error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to unpublish booster",
            error: error.message,
        });
    }
};

export const deleteBooster = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const shop = res.locals.shopify.session.shop;

        const booster = await deleteBoosterService({
            id,
            shop,
        });

        return res.status(200).json({
            success: true,
            message: "Booster deleted successfully",
            data: booster,
        });
    } catch (error) {
        console.error("Delete booster error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete booster",
            error: error.message,
        });
    }
};

export const renameBooster = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            name
        } = req.body;
        const shop = res.locals.shopify.session.shop;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Booster name is required",
            });
        }


        const booster = await renameBoosterRepository({
            id,
            name,
            shop
        })
        return res.status(200).json({
            success: true,
            message: "Booster renamed successfully",
            data: booster,
        });

    } catch (error) {
        console.error("Renamed booster error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to renamed booster",
            error: error.message,
        });
    }
}

export const getPublishBoosters = async (req, res) => {
    try {

        const {
            shop,
            type
        } = req.query;

        const boosters = await getPublishBoosterRepository({
            shop,
            type
        })

        return res.status(200).json({
            success: true,
            message: "Published boosters fetched successfully",
            data: boosters,
        })
    } catch (error) {
        console.error("Get all published boosters error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch published boosters",
            error: error.message,
        });
    }
}