import { useState } from "react"

export default function AddProduct({ onProductCreated }) {
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [status, setStatus] = useState("ACTIVE")
    const [vendor, setVendor] = useState("")
    const [productType, setProductType] = useState("")
    const [options, setOptions] = useState([
        {
            name: "",
            position: 1,
            values: [
                {
                    name: "",
                },
            ],
        },
    ]);
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState({
        name: "",
    });
    const [isCreating, setIsCreating] = useState(false)
    const [totalInventory, setTotalInventory] = useState(0)
    const [images, setImages] = useState([]);
    const resetForm = () => {
        setTitle("");
        setTags("");
        setDescription("");
        setTotalInventory(0);
        setProductType("");
        setVendor("");
        setStatus("ACTIVE");

        setCategory({
            name: "",
        });

        setOptions([
            {
                name: "",
                position: 1,
                values: [
                    {
                        name: "",
                    },
                ],
            },
        ]);
    };

    const handleCreateProduct = async () => {
        try {
            if (!title.trim()) {
                return;
            }

            setIsCreating(true);

            const validOptions = options
                .map((option, index) => ({
                    ...option,
                    position: index + 1,
                    values: option.values.filter(
                        (value) => value.name.trim() !== ""
                    ),
                }))
                .filter(
                    (option) =>
                        option.name.trim() !== "" &&
                        option.values.length > 0
                );
            const formData = new FormData();

            formData.append("title", title);
            formData.append("description", description);
            formData.append("productType", productType);
            formData.append("status", status);
            formData.append("vendor", vendor);

            formData.append(
                "tags",
                JSON.stringify(
                    tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                )
            );

            formData.append("category", JSON.stringify(category));

            formData.append("options", JSON.stringify(validOptions));

            formData.append(
                "totalInventory",
                String(Number(totalInventory))
            );

            images.forEach((image) => {
                formData.append("images", image);
            });

            const response = await fetch("/api/products", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create product"
                );
            }

            onProductCreated()
            resetForm();

        } catch (error) {
            console.log(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddOption = () => {
        setOptions((prev) => [
            ...prev,
            {
                name: "",
                position: prev.length + 1,
                values: [
                    {
                        name: "",
                    },
                ],
            },
        ]);
    };
    const handleOptionNameChange = (optionIndex, value) => {
        setOptions((prev) =>
            prev.map((option, index) =>
                index === optionIndex
                    ? {
                        ...option,
                        name: value,
                    }
                    : option
            )
        );
    };

    const handleAddOptionValue = (optionIndex) => {
        setOptions((prev) =>
            prev.map((option, index) =>
                index === optionIndex
                    ? {
                        ...option,
                        values: [
                            ...option.values,
                            {
                                name: "",
                            },
                        ],
                    }
                    : option
            )
        );
    };

    const handleOptionValueChange = (
        optionIndex,
        valueIndex,
        value
    ) => {
        setOptions((prev) =>
            prev.map((option, index) =>
                index === optionIndex
                    ? {
                        ...option,
                        values: option.values.map((item, vIndex) =>
                            vIndex === valueIndex
                                ? { ...item, name: value }
                                : item
                        ),
                    }
                    : option
            )
        );
    };
    return (
        <s-section>

            <s-modal id="addProductModal" heading="Add New Product">
                <s-stack gap="base">
                    <s-grid
                        gridTemplateColumns="repeat(2, 1fr)"
                        gap="small"
                        justifyContent="center"
                    >
                        <s-grid-item gridColumn="span 2" border="base" borderStyle="none">

                            <s-text-field
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter Product Title"
                            ></s-text-field>
                        </s-grid-item>
                        <s-grid-item
                            gridColumn="span 2"
                            border="base"
                            borderStyle="none"
                        >
                            <s-stack gap="base">

                                <s-drop-zone
                                    label="Upload"
                                    accessibilityLabel="Upload image of type jpg, png, or gif"
                                    accept=".jpg,.png,.gif,.jpeg"
                                    multiple
                                    onChange={(event) => {
                                        const files = Array.from(
                                            event.currentTarget.files || []
                                        );

                                        setImages(files);
                                    }}
                                    onDropRejected={(event) => {
                                        console.log(
                                            "Rejected files:",
                                            event.currentTarget.files
                                        );
                                    }}
                                ></s-drop-zone>

                                {images.length > 0 && (
                                    <s-stack gap="small">
                                        {images.map((image, index) => (
                                            <s-box
                                                key={`${image.name}-${index}`}
                                                border="base"
                                                padding="small"
                                            >
                                                <s-stack direction="inline" gap="small">
                                                    <s-text>{image.name}</s-text>

                                                    <s-button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setImages((prev) =>
                                                                prev.filter((_, imageIndex) => imageIndex !== index)
                                                            );
                                                        }}
                                                    >
                                                        Remove
                                                    </s-button>
                                                </s-stack>
                                            </s-box>
                                        ))}
                                    </s-stack>
                                )}

                            </s-stack>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
                            <s-select label="Status" value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <s-option value="ACTIVE">Active</s-option>
                                <s-option value="ARCHIVED">Archived</s-option>
                                <s-option value="DRAFT">Draft</s-option>
                                <s-option value="UNLISTED">Unlisted</s-option>
                            </s-select>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
                            <s-text-field
                                label="Vendor"
                                value={vendor}
                                placeholder="Enter Product Vendor"
                                onChange={(e) => setVendor(e.target.value)}
                            ></s-text-field>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
                            <s-text-field
                                label="Product Type"
                                value={productType}
                                placeholder="Enter Product Type"
                                onChange={(e) => setProductType(e.target.value)}
                            ></s-text-field>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
                            <s-number-field
                                label="Total Inventory"
                                details="Number of items in stock"
                                value={totalInventory}
                                onChange={(e) => setTotalInventory(e.target.value)}
                                placeholder="0"
                                step="5"
                                min="0"
                                max="100"
                            ></s-number-field>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 2" border="base" borderStyle="none">
                            <s-text-area
                                label="Description"
                                placeholder="Enter Product Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                            ></s-text-area>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
                            <s-text-field
                                label="Tags"
                                placeholder="Enter Product Tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                            ></s-text-field>
                        </s-grid-item>
                        <s-grid-item gridColumn="span 1" border="base" borderStyle="none">
                            <s-text-field
                                label="Category"
                                placeholder="Enter Product Category"
                                value={category.name}
                                onChange={(e) =>
                                    setCategory({
                                        ...category,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </s-grid-item>
                        <s-grid-item gridColumn="span 2" border="base" borderStyle="none">
                            <s-stack gap="base">

                                {options.map((option, optionIndex) => (
                                    <s-box key={optionIndex} >
                                        <s-stack gap="base">                                    <s-text-field
                                            label={`Option ${optionIndex + 1} Name`}
                                            value={option.name}
                                            placeholder="e.g. Color"
                                            onChange={(e) =>
                                                handleOptionNameChange(
                                                    optionIndex,
                                                    e.target.value
                                                )
                                            }
                                        />

                                            {option.values.map((value, valueIndex) => (
                                                <s-text-field
                                                    key={valueIndex}
                                                    label={`Value ${valueIndex + 1}`}
                                                    value={value.name}
                                                    placeholder="e.g. Red"
                                                    onChange={(e) =>
                                                        handleOptionValueChange(
                                                            optionIndex,
                                                            valueIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            ))}

                                            <s-button
                                                variant="secondary"
                                                onClick={() =>
                                                    handleAddOptionValue(optionIndex)
                                                }
                                            >
                                                Add Value
                                            </s-button>
                                        </s-stack>


                                    </s-box>
                                ))}

                                <s-button
                                    variant="secondary"
                                    onClick={handleAddOption}
                                >
                                    Add Option
                                </s-button>
                            </s-stack>

                        </s-grid-item>
                    </s-grid>

                </s-stack>

                <s-button slot="secondary-actions" commandFor="addProductModal" command="--hide">
                    Close
                </s-button>
                <s-button
                    slot="primary-action"
                    variant="primary"
                    commandFor="addProductModal"
                    command="--hide"
                    disabled={isCreating}
                    onClick={handleCreateProduct}
                >
                    {isCreating ? "Creating..." : "Add Product"}
                </s-button>
            </s-modal>
        </s-section>
    )
}


