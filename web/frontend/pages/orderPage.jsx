import { useEffect, useState } from "react"

export default function OrderPage() {
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [pageInfo, setPageInfo] = useState({
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
    });
    const [cursor, setCursor] = useState(null)
    const [direction, setDirection] = useState("next")
    const [search, setSearch] = useState("")
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [refresh, setRefresh] = useState(false);
    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/orders?direction=${direction}&cursor=${cursor ?? ""}&search=${encodeURIComponent(search)}`)
            const data = await response.json()
            setOrders(data.orders)
            setPageInfo(data.pageInfo)
        } catch (error) {
            console.log(error)

        }
        finally {
            setIsLoading(false)
        }
    }
    const handleRefresh = () => {
        setRefresh((prev) => !prev);
    };
    useEffect(() => {
        fetchOrders()
    }, [cursor, direction, search, refresh])

    // const filterData = orders.filter((order) =>
    //     order.orderName.toLowerCase().includes(search.toLowerCase().trim())
    // );
    const handleNextPage = () => {
        setDirection("next")
        setCursor(pageInfo.endCursor)
    }
    const handlePreviousPage = () => {
        setDirection("previous")
        setCursor(pageInfo.startCursor)
    }
    const handleConfirmDelete = async () => {
        try {
            if (!selectedOrder) return;
            const response = await fetch(`/api/orders/${encodeURIComponent(selectedOrder.id)}`, {
                method: 'DELETE',
            })
            const data = await response.json()
            setSelectedOrder(null)
            handleRefresh()
        } catch (error) {
            console.log(error)
        }
    }
    console.log(selectedOrder);

    return (
        <s-section accessibilityLabel="Order Page Section" padding='none' >
            <s-table
                paginate
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                hasNextPage={pageInfo?.hasNextPage}
                hasPreviousPage={pageInfo?.hasPreviousPage}

            >
                <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr auto">
                    <s-text-field
                        label="Search orders"
                        labelAccessibilityVisibility="exclusive"
                        icon="search"
                        placeholder="Searching all orders"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}

                    />
                    <s-button
                        icon="sort"
                        variant="secondary"
                        accessibilityLabel="Sort"
                        interestFor="sort-tooltip"
                        commandFor="sort-actions"
                    />
                    <s-tooltip id="sort-tooltip">
                        <s-text>Sort</s-text>
                    </s-tooltip>
                    <s-popover id="sort-actions">
                        <s-stack gap="none">
                            <s-box padding="small">
                                <s-choice-list label="Sort by" name="Sort by">
                                    <s-choice value="order-name" selected>
                                        Order name
                                    </s-choice>
                                    <s-choice value="total">Total Price</s-choice>
                                    <s-choice value="created">Created At</s-choice>
                                    <s-choice value="status">Status</s-choice>
                                </s-choice-list>
                            </s-box>
                            <s-divider />
                            <s-box padding="small">
                                <s-choice-list label="Order by" name="Order by">
                                    <s-choice value="product-title" selected>
                                        A-Z
                                    </s-choice>
                                    <s-choice value="created">Z-A</s-choice>
                                </s-choice-list>
                            </s-box>
                        </s-stack>
                    </s-popover>
                </s-grid>
                <s-table-header-row>
                    <s-table-header>Order Id</s-table-header>
                    <s-table-header>Order Items</s-table-header>
                    <s-table-header>Date</s-table-header>
                    <s-table-header>Customer</s-table-header>
                    <s-table-header>Total</s-table-header>
                    <s-table-header>Payment Status</s-table-header>
                    <s-table-header>Qty</s-table-header>
                    <s-table-header>Shipping Address</s-table-header>
                    <s-table-header>Actions</s-table-header>

                </s-table-header-row>
                {
                    isLoading ? (
                        <s-table-body>
                            <s-table-row>
                                <s-table-cell colspan="6" >
                                    <s-box
                                        blockSize="500px"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"

                                    >
                                        <s-spinner
                                            size="large-100"
                                            accessibilityLabel="Loading orders"
                                        />
                                    </s-box>
                                </s-table-cell>
                            </s-table-row>
                        </s-table-body>
                    ) : (
                        <s-table-body>
                            {
                                orders.length === 0 ? (
                                    <s-table-row>
                                        <s-table-cell>
                                            <s-box padding="large">
                                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                                                    <p className="" style={{ fontSize: "20px", color: "red", fontWeight: "600" }}>Orders Not Found</p>

                                                </div>
                                            </s-box>

                                        </s-table-cell>
                                    </s-table-row>
                                ) :

                                    (
                                        orders.map((order) => (

                                            <s-table-row key={order.id}>
                                                <s-table-cell>
                                                    {order.orderName}
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-stack display='flex' direction='inline' alignItems='center' gap='base'>
                                                        {
                                                            order?.items && order.items.map((item) => (
                                                                <s-stack blockSize="40px" inlineSize='40px' >


                                                                    <s-image
                                                                        src={item.image.url}
                                                                        alt="Indoor plant"
                                                                        aspectRatio="1/1"
                                                                        objectFit="contain"
                                                                        borderRadius="base"
                                                                        inlineSize="fill"


                                                                    />
                                                                </s-stack>
                                                            ))
                                                        }

                                                        <s-text fontSize='small-200'>
                                                            {order.items[0].title}
                                                        </s-text>
                                                    </s-stack>

                                                </s-table-cell>
                                                <s-table-cell>
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </s-table-cell>
                                                <s-table-cell>
                                                    {order.customer?.displayName} . {order.customer?.email}
                                                </s-table-cell>
                                                <s-table-cell>
                                                    {order.totalPrice}
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-badge tone={order.isUnpaid ? "warning" : "success"}>{order.isUnpaid ? "Unpaid" : "Paid"}</s-badge>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    {order.totalQuantity ? order.totalQuantity : 0}
                                                </s-table-cell>
                                                <s-table-cell>
                                                    {order.shippingAddress.country}
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-button variant="primary" commandFor='openDeleteModal' tone='critical' onClick={() => setSelectedOrder(order)}> Delete</s-button>
                                                </s-table-cell>

                                            </s-table-row>
                                        ))
                                    )
                            }
                        </s-table-body>
                    )}

            </s-table>

            <s-modal id='openDeleteModal' heading='Delete Order'>
                {
                    selectedOrder && (

                        <s-stack gap="base">
                            <s-stack direction="inline"
                                gap="large"
                                alignItems="center"
                            // justifyContent="space-around" 
                            >
                                <s-box blockSize="100px">

                                    <s-image
                                        src={selectedOrder?.items[0]?.image?.url}
                                        alt={selectedOrder.items[0].title}
                                        objectFit="cover"
                                        aspectRatio="1/1"
                                    />
                                </s-box>

                                <s-stack gap="small-100">
                                    <s-text type="strong">
                                        {selectedOrder.items[0].title}
                                    </s-text>



                                    <s-text>
                                        Inventory: {selectedOrder.totalQuantity ?? "Out of Stock"}
                                    </s-text>

                                    <s-text>
                                        <s-stack display='flex' direction='inline' gap='base' alignItems='center'>

                                            Payment Status:  <s-badge tone={selectedOrder.isUnpaid ? "warning" : "success"}>{selectedOrder.isUnpaid ? "Unpaid" : "Paid"}</s-badge>
                                        </s-stack>
                                    </s-text>
                                </s-stack>
                            </s-stack>

                            <s-paragraph >
                                Are you sure you want to delete this order? This action cannot be undone.
                            </s-paragraph>
                        </s-stack>
                    )
                }
                <s-button slot="secondary-actions" commandFor="openDeleteModal" command="--hide">
                    Close
                </s-button>
                <s-button
                    slot="primary-action"
                    variant="primary"
                    commandFor="openDeleteModal"
                    command="--hide"
                    tone='critical'
                    onClick={handleConfirmDelete}
                >
                    Confirm
                </s-button>
            </s-modal>

        </s-section >
    )
}

