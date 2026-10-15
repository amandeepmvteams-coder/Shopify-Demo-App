import shopify from "../shopify.js";
import {
  getShopifyClient
} from "../utils/token.js";

export const fetchOrders = async (req, res) => {
  // const client = new shopify.api.clients.Graphql({
  //   session: res.locals.shopify.session,
  // });
  const shop = res.locals.shopify.session.shop;
  const client = await getShopifyClient(shopify, shop)

  try {
    const cursor = req.query.cursor || null;
    const direction = req.query.direction || "next";
    const search = req.query.search?.trim() || ""
    const searchQuery = search ?
      search :
      null;
    let orderQuery;
    if (direction === "next") {
      orderQuery = `orders(first: 10,after: ${cursor ? `"${cursor}"` : null},query:${searchQuery ? `"${searchQuery}"`:null})`
    } else {
      orderQuery = `orders(last: 10,before: ${cursor ? `"${cursor}"` : null},query:${searchQuery ? `"${searchQuery}"`:null})`

    }
    const orders = await client.request(`
      query	getOrders {
   ${orderQuery} {
    edges {
      cursor
      node {
        id
        name
        createdAt
        lineItems(first:10){
          nodes{
            id
            image{
							url
            }
            title
            
          }

        }
        customer{
          displayName
          email
        }
        fulfillments{
          displayStatus
          totalQuantity
        }
        currentSubtotalLineItemsQuantity
        shippingAddress{
          address1
          city
          zip
          country
        }
        totalPrice
        unpaid
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
    ordersCount{
    count
  }
}
      `)
    const updatedOrders = orders.data.orders.edges.map((edge) => ({
      id: edge.node.id,
      orderName: edge.node.name,
      createdAt: edge.node.createdAt,
      customer: edge.node.customer,
      orderStatus: edge.node.fulfillments.displayStatus,
      totalQuantity: edge.node.currentSubtotalLineItemsQuantity,
      shippingAddress: edge.node.shippingAddress,
      totalPrice: edge.node.totalPrice,
      isUnpaid: edge.node.unpaid,
      items: edge.node.lineItems.nodes,
    }))
    const pageInfo = orders.data.orders.pageInfo
    const totalOrders = orders.data.ordersCount.count;

    res.status(200).send({
      orders: updatedOrders,
      pageInfo,
      totalOrders,
    })

  } catch (error) {
    res.status(500).send({
      error
    })
  }
}

export const deleteOrders = async (req, res) => {
  const shop = res.locals.shopify.session.shop;
  const client = await getShopifyClient(shopify, shop)

  try {

    const orderId = decodeURIComponent(req.params.id)

    const response = await client.request(`
        mutation OrderDelete($orderId: ID!) {
                  orderDelete(orderId: $orderId) {
                    deletedId
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
                  `, {
      variables: {
        orderId
      }
    })

    if (response?.orderDelete?.userErrors.length > 0) {
      return res.status(400).json({
        message: response.orderDelete.userErrors[0].message,
      });
    }

    return res.status(200).json({
      message: 'Order Deleted Successfully',
      deletedOrderId: response?.orderDelete?.deletedId,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
}