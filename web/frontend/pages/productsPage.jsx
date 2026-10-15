import { useState, useEffect } from 'react'
import AddProduct from './components/addProduct'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  // const [pageInfo, setPageInfo] = useState({})
  // const [cursor, setCursor] = useState(null)
  // const [direction, setDirection] = useState("next")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({})
  // const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productTitle, setProductTitle] = useState("");
  const [productTags, setProductTags] = useState("");
  const [productType, setProductType] = useState("");
  const [status, setStatus] = useState("");
  const [vendor, setVendor] = useState("");
  const [media, setMedia] = useState([
    {
      originalSource: "",
      mediaContentType: "IMAGE",
      alt: "",
    },
  ]);
  const [refresh, setRefresh] = useState(false);
  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products?page=${page}&limit=10`);
      const data = await response.json()
      setProducts(data?.products)
      setPagination(data?.pagination)
      setTotalProducts(data?.pagination?.totalProducts)
    } catch (error) {
      console.log(error)

    } finally {

      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

  }, [page,setPage, refresh])

  const handleNextPage = () => {
    // setDirection("next"),
    // setCursor(pageInfo.endCursor)
    setPage((page) => page + 1)
    // setCurrentPage((page) => page + 1)

  }

  const handlePreviousPage = () => {
    // setDirection("previous"),
    // setCursor(pageInfo.startCursor)
    setPage((page) => page - 1)
    // setCurrentPage((page) => page - 1)


  }
  const totalPages = Math.ceil(totalProducts / 10);

  const handleDeleteClick = (product) => {
    setSelectedProduct(product)


  }
  const handleUpdateClick = (product) => {
    setSelectedProduct(product);

    setProductTitle(product.title || "");
    setProductTags(product.tags || "");
    setProductType(product.productType || "");
    setStatus(product.status || "");
    setVendor(product.vendor || "");

    setMedia([
      {
        originalSource: "",
        mediaContentType: "IMAGE",
        alt: "",
      },
    ]);
  };

  //Delete Api Call
  const handleConfirmDelete = async () => {
    try {
      if (!selectedProduct) return;
      const response = await fetch(`/api/products/${encodeURIComponent(selectedProduct.id)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      setSelectedProduct(null)
      handleRefresh()
    } catch (error) {
      console.log(error)
    }
  }

  const handleAddMedia = () => {
    setMedia((prev) => [
      ...prev,
      {
        originalSource: "",
        mediaContentType: "IMAGE",
        alt: "",
      },
    ]);
  };

  const handleMediaChange = (index, field, value) => {
    setMedia((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
            ...item,
            [field]: value,
          }
          : item
      )
    );
  };
  const handleUpdateProduct = async () => {
    try {
      const validMedia = media.filter(
        (item) => item.originalSource.trim() !== ""
      );
      const response = await fetch(
        `/api/products/${encodeURIComponent(selectedProduct.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: productTitle,
            tags: productTags,
            productType,
            status,
            vendor,
            media: validMedia,
          }),
        }
      );

      const data = await response.json();
      handleRefresh()
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };
  return (
    <s-section padding={isLoading ? "base" : "none"} accessibilityLabel="Products table section">
      <AddProduct onProductCreated={handleRefresh} />
      <s-table
        paginate
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        hasPreviousPage={pagination?.hasPreviousPage}
        hasNextPage={pagination?.hasNextPage}
        paginationLabel={`Page ${page} of ${totalPages}`}
      >
        <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr auto auto">
          <s-text-field
            label="Search puzzles"
            labelAccessibilityVisibility="exclusive"
            icon="search"
            placeholder="Searching all Products"
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
                  <s-choice value="inventory" selected> Total Inventory</s-choice>
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

          <s-button commandFor="addProductModal" variant="primary" >Add New Product </s-button>

        </s-grid>
        <s-table-header-row>
          <s-table-header listSlot="primary">Title</s-table-header>
          <s-table-header format="numeric">Total Inventory</s-table-header>
          <s-table-header format="numeric">Product Type</s-table-header>
          <s-table-header>Created At</s-table-header>
          <s-table-header>Updated At</s-table-header>
          <s-table-header>Tags</s-table-header>
          <s-table-header listSlot="secondary">Status</s-table-header>
          <s-table-header>Actions</s-table-header>
        </s-table-header-row>

        {isLoading ? (
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
                    accessibilityLabel="Loading products"
                  />
                </s-box>
              </s-table-cell>
            </s-table-row>
          </s-table-body>
        ) : (
          <s-table-body>
            {products.map((product) => (

              <s-table-row key={product.id} clickDelegate="mountain-view-checkbox">
                <s-table-cell>
                  <s-stack direction="inline" gap="small" alignItems="center">
                    {/* <s-checkbox id="mountain-view-checkbox" /> */}
                    <s-clickable
                      href=""
                      accessibilityLabel="Mountain View puzzle thumbnail"
                      border="base"
                      borderRadius="base"
                      overflow="hidden"
                      inlineSize="40px"
                      blockSize="40px"
                    >
                      <s-image
                        objectFit="cover"
                        src={product?.image}
                      />
                    </s-clickable>
                    <s-table-cell>{product.title}</s-table-cell>
                  </s-stack>
                </s-table-cell>
                <s-table-cell>{product.totalInventory ? product.totalInventory : "Out of Stock"}</s-table-cell>
                <s-table-cell>{product.productType}</s-table-cell>
                <s-table-cell> {new Date(product?.createdAt).toLocaleString()}</s-table-cell>
                <s-table-cell> {product?.updatedAt
                  ? new Date(product.updatedAt).toLocaleString()
                  : "N/A"}</s-table-cell>
                <s-table-cell>{product.tags.join(", ")}</s-table-cell>
                <s-table-cell>
                  <s-badge color="base" tone={product.status === 'ACTIVE' ? 'success' : product.status === 'DRAFT' ? 'info' : 'warning'}>
                    {product.status}
                  </s-badge>
                </s-table-cell>
                <s-table-cell >
                  <s-button-group>

                    <s-button commandFor="openeditProductModal" slot="secondary-actions" onClick={() => handleUpdateClick(product)}>Edit</s-button>
                    <s-button commandFor="openDeleteProductModal" slot="primary-action" onClick={() => handleDeleteClick(product)} >Delete</s-button>
                  </s-button-group>
                </s-table-cell>
              </s-table-row>

            ))}


          </s-table-body>
        )}

      </s-table>

      {/* <s-box padding="base" background="subdued" border="base" borderRadius="base">

        <s-button-group>
          <s-button disabled={!pageInfo.hasPreviousPage} onClick={() => { setCursor(pageInfo.startCursor),setDirection("previous") }} slot="secondary-actions">Previous</s-button>
          <s-button disabled={!pageInfo.hasNextPage} onClick={() => { setCursor(pageInfo.endCursor),setDirection("next") }} slot="primary-action">Next</s-button>
        </s-button-group>
      </s-box> */}

      {/* Update Product Modal  */}
      <s-modal id="openeditProductModal" heading="Edit Product Details">
        <s-stack gap="base">

          {/* Product Input Field  */}
          <s-paragraph fontSize="large-100" fontWeight="bold"> Product Query</s-paragraph>

          <s-grid
            gridTemplateColumns="repeat(2, 1fr)"
            gap="small"
            justifyContent="center"
          >
            <s-grid-item gridColumn="span 2" border="base" borderStyle="none">
              <s-text-field
                label="Title"
                value={selectedProduct?.title}
                placeholder="Enter product title"
                onChange={(e) => setProductTitle(e.target.value)}
              ></s-text-field>
            </s-grid-item>
            <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
              <s-text-field
                label="Tags"
                value={selectedProduct?.tags}
                placeholder="Enter tags"
                onChange={(e) => setProductTags(e.target.value)}

              ></s-text-field>
            </s-grid-item>
            <s-grid-item gridColumn="auto" border="base" borderStyle="none">
              <s-text-field
                label="Product Type"
                value={selectedProduct?.productType}
                placeholder="Enter Product Type"
                onChange={(e) => setProductType(e.target.value)}
              ></s-text-field>
            </s-grid-item>
            <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
              <s-select label="Status" value={selectedProduct?.status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <s-option value="ACTIVE">Active</s-option>
                <s-option value="ARCHIVED">Archived</s-option>
                <s-option value="DRAFT">Draft</s-option>
                <s-option value="UNLISTED">Unlisted</s-option>
              </s-select>
            </s-grid-item>

            <s-grid-item gridColumn="auto" border="base" borderStyle="none">
              <s-text-field
                label="Vendor"
                value={selectedProduct?.vendor}
                placeholder="Enter Product Vendor"
                onChange={(e) => setVendor(e.target.value)}
              ></s-text-field>
            </s-grid-item>

          </s-grid>
          <s-paragraph fontSize="large-100" fontWeight="bold">
            Media
          </s-paragraph>

          {media.map((item, index) => (
            <s-grid
              key={index}
              gridTemplateColumns="repeat(2, 1fr)"
              gap="small"
              justifyContent="center"
            >
              <s-grid-item
                gridColumn="span 2"
                border="base"
                borderStyle="none"
              >
                <s-text-field
                  label={`Media ${index + 1} URL`}
                  value={item.originalSource}
                  placeholder="Enter media URL"
                  onChange={(event) =>
                    handleMediaChange(
                      index,
                      "originalSource",
                      event.target.value
                    )
                  }
                />
              </s-grid-item>

              <s-grid-item
                gridColumn="auto"
                border="base"
                borderStyle="none"
              >
                <s-text-field
                  label="Media Alt"
                  value={item.alt}
                  placeholder="Enter Media Alt"
                  onChange={(event) =>
                    handleMediaChange(
                      index,
                      "alt",
                      event.target.value
                    )
                  }
                />
              </s-grid-item>

              <s-grid-item
                gridColumn="auto"
                border="base"
                borderStyle="none"
              >
                <s-select
                  label="Media Content Type"
                  value={item.mediaContentType}
                  onChange={(event) =>
                    handleMediaChange(
                      index,
                      "mediaContentType",
                      event.target.value
                    )
                  }
                >
                  <s-option value="IMAGE">Image</s-option>
                  <s-option value="VIDEO">Video</s-option>
                  <s-option value="EXTERNAL_VIDEO">
                    External Video
                  </s-option>
                  <s-option value="MODEL_3D">
                    Model 3D
                  </s-option>
                </s-select>
              </s-grid-item>
            </s-grid>
          ))}

          <s-button
            variant="secondary"
            onClick={handleAddMedia}
          >
            Add Media
          </s-button>
        </s-stack>

        <s-button slot="secondary-actions" commandFor="openeditProductModal" command="--hide">
          Close
        </s-button>
        <s-button
          slot="primary-action"
          variant="primary"
          commandFor="openeditProductModal"
          command="--hide"
          onClick={handleUpdateProduct}
        >
          Update
        </s-button>
      </s-modal>

      {/* Delete Product Modal  */}
      <s-modal id="openDeleteProductModal" heading="Delete">
        {
          selectedProduct && (

            <s-stack gap="base">
              <s-stack direction="inline"
                gap="large"
                alignItems="center"
              // justifyContent="space-around" 
              >
                <s-box blockSize="100px">

                  <s-image
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    objectFit="cover"
                    aspectRatio="1/1"
                  />
                </s-box>

                <s-stack gap="small-100">
                  <s-text type="strong">
                    {selectedProduct.title}
                  </s-text>

                  <s-text>
                    Product Type: {selectedProduct.productType || "N/A"}
                  </s-text>

                  <s-text>
                    Inventory: {selectedProduct.totalInventory ?? "Out of Stock"}
                  </s-text>

                  <s-text>
                    Status: {selectedProduct.status}
                  </s-text>
                </s-stack>
              </s-stack>

              <s-paragraph >
                Are you sure you want to delete this product? This action cannot be undone.
              </s-paragraph>
            </s-stack>
          )
        }

        <s-button slot="secondary-actions" commandFor="openDeleteProductModal" command="--hide">
          Close
        </s-button>

        <s-button
          slot="primary-action"
          variant="primary"
          commandFor="openDeleteProductModal"
          onClick={handleConfirmDelete}
          command="--hide"
        >
          Delete
        </s-button>
      </s-modal>
    </s-section>
  );
}
