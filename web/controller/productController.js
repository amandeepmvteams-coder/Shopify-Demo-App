import shopify from "../shopify.js"

import {
    getProducts,
    getProductsCount
} from "../repositories/product.repository.js";
import { getShopifyClient } from "../utils/token.js";

// Product Fetch Through Shopify GraphQl Api 
// export const fetchProducts = async (req, res) => {
//     const client = new shopify.api.clients.Graphql({
//         session: res.locals.shopify.session,
//     });
//     const cursor = req.query.cursor || null;
//     const direction = req.query.direction || null;

//     let productQuery;
//     if (direction === "next") {
//         productQuery = `products(first: 10,after: ${cursor ? `"${cursor}"` : null},reverse:true)`
//     } else {
//         productQuery = `products(last: 10,before: ${cursor ? `"${cursor}"` : null},reverse:true)`

//     }

//     const products = await client.request(`
//     query GetProducts {
//    ${productQuery}{
//    edges {
//     node {
//       id
//       title
//       createdAt
//       updatedAt
//       description
//       productType
//       tags
//       createdAt
//       status
//       totalInventory
//       vendor
//       featuredMedia{
// 					preview{
//             image{
//               url
//               altText
//             }
//           }
//       }
//     }
//   }
//     pageInfo{
//       hasNextPage
//       hasPreviousPage
//       endCursor
//       startCursor
//     }
//     }
//     productsCount{
//     count
//   }

// }
//   `);

//     const updatedData = products.data.products.edges.map((product) => ({
//         id: product.node.id,
//         title: product.node.title,
//         status: product.node.status,
//         createdAt: product.node.createdAt,
//         productType: product.node.productType,
//         totalInventory: product.node.totalInventory,
//         updatedAt: product.node.updatedAt,
//         vendor: product.node.vendor,
//         image: product.node.featuredMedia?.preview?.image?.url,
//         tags: product.node.tags,
//     }));
//     const pageInfo = products.data.products.pageInfo
//     const totalProducts = products.data.productsCount.count;
//     res.status(200).send({
//         products: updatedData,
//         pageInfo,
//         totalProducts
//     });

// }

// Products Fetch By Rest Api From Postgresql 
export const fetchProducts = async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const products = await getProducts(shop, page, limit)
        const totalProducts = await getProductsCount(shop)

        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).send({
            products,
            pagination: {
                page,
                limit,
                totalProducts,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);

        res.status(500).send({
            message: "Failed to fetch products",
            error: error.message,
        });
    }

}

export const countProducts = async (_req, res) => {
    const shop = res.locals.shopify.session.shop;
    const client = await getShopifyClient(shopify, shop)

    const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

    res.status(200).send({
        count: countData.data.productsCount.count
    });
}

export const createProduct = async (req, res) => {
    try {
        const shop = res.locals.shopify.session.shop;
        const client = await getShopifyClient(shopify, shop)
        const {
            title,
            description,
            productType,
            status,
            vendor,

        } = req.body
        const tags = JSON.parse(req.body.tags || "[]");
        const options = JSON.parse(req.body.options || "[]");

        const images = req.files || [];
        if (images.length === 0) {
            return res.status(400).json({
                message: "At least one image is required",
            });
        }
        const validOptions = (options || [])
            .map((option, index) => ({
                name: option.name?.trim(),
                position: index + 1,
                values: (option.values || [])
                    .filter((value) => value.name?.trim())
                    .map((value) => ({
                        name: value.name.trim(),
                    })),
            }))
            .filter(
                (option) =>
                option.name &&
                option.values.length > 0
            );


        const stagedUpload = await client.request(`
        mutation stagedUploadsCreate($input:[StagedUploadInput!]!){
            stagedUploadsCreate(input:$input){
                  stagedTargets{
                  url
                  resourceUrl
                   parameters {
                          name
                          value
                        }
                  }
                        userErrors{
                        field
                        message
                        }
            }
        }
        `, {
            variables: {
                input: images.map((image) => ({
                    filename: image.originalname,
                    mimeType: image.mimetype,
                    httpMethod: "POST",
                    fileSize: String(image.size),
                    resource: "IMAGE",
                })),
            },
        })
        const stagedResult = stagedUpload?.data?.stagedUploadsCreate;

        if (stagedResult.userErrors.length > 0) {
            return res.status(400).json({
                message: "Failed to create staged upload",
                error: stagedResult.userErrors
            });
        }
        const stagedTarget = stagedResult.stagedTargets;

        if (stagedTarget.length !== images.length) {
            return res.status(400).json({
                message: "Failed to create staged upload targets",
            });
        }


        const resourceUrls = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const target = stagedTarget[i];

            const uploadForm = new FormData();

            // Shopify requires these parameters
            for (const parameter of target.parameters) {
                uploadForm.append(
                    parameter.name,
                    parameter.value
                );
            }

            // Add actual image
            uploadForm.append(
                "file",
                new Blob([image.buffer], {
                    type: image.mimetype,
                }),
                image.originalname
            );

            const uploadResponse = await fetch(
                target.url, {
                    method: "POST",
                    body: uploadForm,
                }
            );

            if (!uploadResponse.ok) {
                return res.status(400).json({
                    message: `Failed to upload image: ${image.originalname}`,
                });
            }

            resourceUrls.push(target.resourceUrl);
        }

        const product = await client.request(`
    mutation CreateProduct($product:ProductCreateInput!,$media:[CreateMediaInput!]){
           productCreate(product:$product,media:$media){
                  product{
                        id
                        title
                        category{
                            id 
                            name
                        }
                        createdAt
                        descriptionHtml
                        productType
                        status
                        tags
                        vendor
                        totalInventory
                        options{
                          id
                          name
                          position
                          optionValues{
                            id
                            name
                            hasVariants
                          }
                          }
                  }
            userErrors {
              field
              message
            }
}
}
    `, {
            variables: {
                product: {
                    title,
                    descriptionHtml: description,
                    productType,
                    status,
                    tags,
                    vendor,
                    productOptions: validOptions
                },
                media: resourceUrls.map(
                    (resourceUrl, index) => ({
                        originalSource: resourceUrl,
                        mediaContentType: "IMAGE",
                        alt: `${title} image ${index + 1}`,
                    })
                ),
            }
        })

        const result = product.data.productCreate;
        if (result.userErrors.length > 0) {
            return res.status(400).json({
                message: "Product creation failed",
                error: result.userErrors
            })
        }
        return res.status(200).json({
            message: "Product Created Succesfully",
            product: result.product
        })
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

export const deleteProduct = async (req, res) => {

    try {
        const productId = decodeURIComponent(req.params.id);


        const shop = res.locals.shopify.session.shop;
        const client = await getShopifyClient(shopify, shop)

        const response = await client.request(`
      mutation {
        productDelete(input: { id: "${productId}" }) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `);


        if (response?.productDelete?.userErrors?.length > 0) {
            return res.status(400).json({
                message: response.productDelete.userErrors[0].message,
            });
        }

        return res.status(200).json({
            message: 'Product Deleted Successfully',
            deletedProductId: response?.productDelete?.deletedProductId,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: error.message,
        });
    }
}

export const updateProduct = async (req, res) => {
    const shop = res.locals.shopify.session.shop;
    const client = await getShopifyClient(shopify, shop)
    try {
        const productId = decodeURIComponent(req.params.id);

        const {
            title,
            tags,
            status,
            productType,
            vendor,
            media
        } = req.body

        const updateProduct = await client.request(`
      mutation updateProduct($product:ProductUpdateInput!,$media:[CreateMediaInput!]){
      productUpdate(product:$product,media:$media){
      product{
      id
      title
      tags
      status
      productType
      updatedAt
      vendor
      media(first:10){
      nodes{
      alt
      mediaContentType
      preview{
      status
      }
      }

      }
      }
      userErrors{
      field
      message
      }
      }
      }
      `, {
            variables: {
                product: {
                    id: productId,
                    title,
                    status,
                    productType,
                    vendor,
                    tags,

                },
                media
            }
        })
        const result = updateProduct.data.productUpdate;
        if (result.userErrors.length > 0) {
            return res.status(400).json({
                message: 'Product update failed',
                errors: result.userErrors,
            });
        }
        return res.status(200).json({
            message: 'Product updated successfully',
            product: result.product,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: error.message,
        });
    }
}