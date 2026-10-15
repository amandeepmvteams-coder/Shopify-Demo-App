import {
    createBoosterRepository,
    deleteBoosterRepository,
    getAllBoosterRepository,
    getBoosterByIdRepository,
    unpublishBoosterRepository,
    updateBoosterRepository
} from "../repositories/booster.repository.js";

export const createBoosterService = async ({
    shop,
    name,
    type,
    status,
    content,
    design,
    placement
}) => {

    const booster = await createBoosterRepository({
        shop,
        name,
        type,
        status,
        content,
        design,
        placement

    })
    return booster;

}

export const getAllBoosterService = async ({
    shop
}) => {
    const boosters = await getAllBoosterRepository({
        shop
    })

    return boosters;
}

export const updateBoosterService = async ({
    id,
    shop,
    name,
    type,
    status,
    content,
    design,
    placement,
}) => {


    const booster = await updateBoosterRepository({
        id,
        shop,
        name,
        type,
        status,
        content,
        design,
        placement,
    });

    if (!booster) {
        throw new Error("Booster not found");
    }

    return booster;
};

export const getBoosterByIdService = async ({
    id,
    shop,
}) => {
    return await getBoosterByIdRepository({
        id,
        shop,
    });
};

export const unpublishBoosterService = async ({
    id,
    shop
}) => {
    const booster = await unpublishBoosterRepository({
        id,
        shop,
    });

    if (!booster) {
        throw new Error("Booster not found");
    }

    return booster;
};
export const deleteBoosterService = async ({
    id,
    shop
}) => {
    const booster = await deleteBoosterRepository({
        id,
        shop,
    });

    if (!booster) {
        throw new Error("Booster not found");
    }

    return booster;
};