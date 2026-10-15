import {
    updateProductFromWebhook,
    createProductFromWebhook,
    deleteProductFromWebhook
} from "../repositories/product.repository.js";


export const handleProductUpdateWebhook = async (
    shop,
    payload
) => {
    const updatedProduct = await updateProductFromWebhook(
        shop,
        payload
    );

    if (!updatedProduct) {
        console.log(
            `Product not found in database: ${payload.id}`
        );

        return null;
    }

    console.log(
        `Product updated in database: ${payload.id}`
    );

    return updatedProduct;
};




export const handleProductCreateWebhook = async (
    shop,
    payload
) => {
    const createdProduct = await createProductFromWebhook(
        shop,
        payload
    );

    console.log(
        `Product created in database: ${payload.id}`
    );

    return createdProduct;
};

export const handleProductDeleteWebhook = async (shop, payload) => {
    const deleteProduct = await deleteProductFromWebhook(
        shop,
        payload
    )
    console.log(`Product deleted in database:${payload.id}`);
    return deleteProduct;

}