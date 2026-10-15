import { useAppBridge } from "@shopify/app-bridge-react";
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ColorInput from './components/ColorInput';

const defaultDesign = {
    template: "custom",

    card: {
        backgroundType: "singleColor",

        singleColor: "#FF0000",

        gradientAngle: 0,
        gradientStart: "#DDDDDD",
        gradientEnd: "#FFFFFF",

        cornerRadius: 10,

        borderSize: 1,
        borderColor: "#000000",

        spacing: {
            insideTop: 16,
            insideBottom: 16,
            outsideTop: 20,
            outsideBottom: 20,
        },
    },

    progressBar: {
        backgroundColor: "#FFFFFF",
        barColor: "#000000",
        cornerRadius: 4,
    },

    typography: {
        font: "theme",

        message: {
            size: 16,
            color: "#202223",
        },


    },


};
const defaultAnnouncementDesign = {
    template: "custom",

    position: {
        placement: "top",
        sticky: true,
    },

    card: {
        backgroundType: "gradientColor",
        singleColor: "#ffffff",
        gradientAngle: 90,
        gradientStart: "#00fff0",
        gradientEnd: "#d285ff",
        cornerRadius: 0,
        borderSize: 0,
        borderColor: "#c5c8d1",
        spacing: {
            insideTop: 10,
            insideBottom: 10,
            outsideTop: 0,
            outsideBottom: 0,
        },
    },

    typography: {
        font: "theme",
        message: {
            size: 16,
            color: "#202223",
        },
    },
};
const templates = {
    blackAndYellow: {
        card: {
            backgroundType: "singleColor",
            singleColor: "#000000",

            gradientAngle: 90,
            gradientStart: "#000000",
            gradientEnd: "#222222",

            cornerRadius: 8,

            borderSize: 0,
            borderColor: "#c5c8d1",

            spacing: {
                insideTop: 16,
                insideBottom: 16,
                outsideTop: 20,
                outsideBottom: 20,
            },
        },

        progressBar: {
            backgroundColor: "#5c5c5c",
            barColor: "#faf16d",
            cornerRadius: 4,
        },

        typography: {
            font: "helvetica",

            message: {
                size: 16,
                color: "#ffffff",
            },


        },


    },

    vibrant: {
        card: {
            backgroundType: "singleColor",
            singleColor: "#ffffff",

            gradientAngle: 90,
            gradientStart: "#ffffff",
            gradientEnd: "#ffffff",

            cornerRadius: 8,

            borderSize: 2,
            borderColor: "#f15bb5",

            spacing: {
                insideTop: 16,
                insideBottom: 16,
                outsideTop: 20,
                outsideBottom: 20,
            },
        },

        progressBar: {
            backgroundColor: "#e9d6ff",
            barColor: "#f15bb5",
            cornerRadius: 4,
        },

        typography: {
            font: "theme",

            message: {
                size: 16,
                color: "#9b5de5",
            },


        },


    },

    electric: {
        card: {
            backgroundType: "gradientColor",
            singleColor: "#b0ead7",

            gradientAngle: 90,
            gradientStart: "#00fff0",
            gradientEnd: "#d285ff",

            cornerRadius: 8,

            borderSize: 0,
            borderColor: "#c5c8d1",

            spacing: {
                insideTop: 16,
                insideBottom: 16,
                outsideTop: 20,
                outsideBottom: 20,
            },
        },

        progressBar: {
            backgroundColor: "#f8ffff",
            barColor: "#192c6b",
            cornerRadius: 4,
        },

        typography: {
            font: "theme",

            message: {
                size: 16,
                color: "#192c6b",
            },


        },
    },

    darkOcean: {
        card: {
            backgroundType: "singleColor",
            singleColor: "#222831",

            gradientAngle: 90,
            gradientStart: "#DDDDDD",
            gradientEnd: "#FFFFFF",

            cornerRadius: 8,

            borderSize: 0,
            borderColor: "#000000",

            spacing: {
                insideTop: 16,
                insideBottom: 16,
                outsideTop: 20,
                outsideBottom: 20,
            },
        },

        progressBar: {
            backgroundColor: "#f8f8f8",
            barColor: "#13cad2",
            cornerRadius: 4,
        },

        typography: {
            font: "theme",

            message: {
                size: 16,
                color: "#c0deed",
            },


        },
    },

    Minimal: {
        card: {
            backgroundType: "singleColor",
            singleColor: "#FFFFFF",

            gradientAngle: 90,
            gradientStart: "#DDDDDD",
            gradientEnd: "#FFFFFF",

            cornerRadius: 8,

            borderSize: 1,
            borderColor: "#000000",

            spacing: {
                insideTop: 16,
                insideBottom: 16,
                outsideTop: 20,
                outsideBottom: 20,
            },
        },

        progressBar: {
            backgroundColor: "#c5d2de",
            barColor: "#202223",
            cornerRadius: 4,
        },

        typography: {
            font: "theme",

            message: {
                size: 16,
                color: "#202223",
            },


        },

    },

    mint: {
        card: {
            backgroundType: "singleColor",
            singleColor: "#b0ead7",

            gradientAngle: 90,
            gradientStart: "#DDDDDD",
            gradientEnd: "#FFFFFF",

            cornerRadius: 8,

            borderSize: 0,
            borderColor: "#c5c8d1",

            spacing: {
                insideTop: 16,
                insideBottom: 16,
                outsideTop: 20,
                outsideBottom: 20,
            },
        },

        progressBar: {
            backgroundColor: "#f8ffff",
            barColor: "#009094",
            cornerRadius: 4,
        },

        typography: {
            font: "theme",

            message: {
                size: 16,
                color: "#006d71",
            },


        },

    },
};
const mergeDesign = (base, override) => {
    const result = structuredClone(base);

    Object.keys(override).forEach((key) => {
        if (
            override[key] &&
            typeof override[key] === "object" &&
            !Array.isArray(override[key])
        ) {
            result[key] = mergeDesign(
                result[key] || {},
                override[key]
            );
        } else {
            result[key] = override[key];
        }
    });

    return result;
};

const ItemPage = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate();
    const type = searchParams.get("type")
    const boosterId = searchParams.get("id");
    const [tabs, setTabs] = useState("content")
    const shopify = useAppBridge();
    // Content Tab States 
    const [orderValue, setOrderValue] = useState(50)
    const [startingMessage, setStartingMessage] = useState(`Free shipping for orders over {order-value}!`)
    const [goalProgressMessage, setGoalProgressMessage] = useState("You're only {order-value-progress} away from free shipping!")
    const [successMessage, setSuccessMessage] = useState("Congratulations! You've got free shipping!")
    const [placementSelectionMade, setPlacementSelectionMade] = useState(false);

    const [placement, setPlacement] = useState(() =>
        type === "cart-page"
            ? {
                type: "cart-page",
                position: "cart-page",
            }
            : type === "announcement"
                ? {
                    type: "all-pages",
                    productIds: [],
                    collectionIds: [],
                }
                : {
                    type: "all-products",
                    productIds: [],
                    collectionIds: [],
                }
    );


    const [publishLoading, setPublishLoading] = useState(false)
    const [booster, setBooster] = useState(null);
    const [renameName, setRenameName] = useState("");
    const isPublished = booster?.status === "published";
    const hasBooster = Boolean(booster?.id);
    const openProductPicker = async () => {
        const selected = await shopify.resourcePicker({
            type: "product",
            action: "select",
            multiple: true,
        });

        if (!selected) return;

        setPlacement((prev) => ({
            ...prev,
            type: "specific-products",
            productIds: selected.map((product) => product.id),
        }));
    };

    const openCollectionPicker = async () => {
        const selected = await shopify.resourcePicker({
            type: "collection",
            action: "select",
            multiple: true,
        });

        if (!selected) return;

        setPlacement((prev) => ({
            ...prev,
            type: "collection-products",
            collectionIds: selected.map((collection) => collection.id),
        }));
    };

    const [design, setDesign] = useState(() =>
        type === "announcement"
            ? defaultAnnouncementDesign
            : defaultDesign
    );

    const freeShippingOfferStages = [
        {
            id: 1,
            heading: startingMessage,
            progressValue: 1,
        },
        {
            id: 2,
            heading: goalProgressMessage,
            progressValue: 35,
        },
        {
            id: 3,
            heading: successMessage,
            progressValue: 50,
        },
    ]



    const replaceVariables = (message, progressValue) => {
        return message
            .replace(
                "{order-value}",
                `$${orderValue}.00`
            )
            .replace(
                "{order-value-progress}",
                `$${Math.max(orderValue - progressValue, 0)}.00`
            );
    };

    const applyTemplate = (templateName) => {
        if (templateName === "custom") {
            setDesign((prev) => ({
                ...prev,
                template: "custom",
            }));

            return;
        }

        const selectedTemplate = templates[templateName];

        const newDesign = mergeDesign(
            defaultDesign,
            selectedTemplate
        );

        newDesign.template = templateName;

        setDesign(newDesign);
    };
    const updateCard = (key, value) => {
        setDesign((prev) => ({
            ...prev,

            template: "custom",

            card: {
                ...prev.card,
                [key]: value,
            },
        }));
    };
    const updateProgressBar = (key, value) => {
        setDesign((prev) => ({
            ...prev,

            template: "custom",

            progressBar: {
                ...prev.progressBar,
                [key]: value,
            },
        }));
    };
    const updateTypography = (key, value) => {
        setDesign((prev) => ({
            ...prev,

            template: "custom",

            typography: {
                ...prev.typography,
                [key]: value,
            },
        }));
    };
    const updateTypographyItem = (item, key, value) => {
        setDesign((prev) => ({
            ...prev,

            template: "custom",

            typography: {
                ...prev.typography,

                [item]: {
                    ...prev.typography[item],
                    [key]: value,
                },
            },
        }));
    };
    const updateSpacing = (key, value) => {
        setDesign((prev) => ({
            ...prev,

            template: "custom",

            card: {
                ...prev.card,

                spacing: {
                    ...prev.card.spacing,
                    [key]: value,
                },
            },
        }));
    };

    const handlePublish = async () => {
        try {
            setPublishLoading(true);

            const payload = {
                name: "Order value booster",
                type,
                content: {
                    orderValue,
                    startingMessage,
                    goalProgressMessage,
                    successMessage,
                },
                placement,
                design,
                status: "published",
            };

            let result;

            if (boosterId) {
                // Existing booster → update it
                result = await fetch(`/api/boosters/${boosterId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // New booster → create it
                result = await fetch("/api/boosters", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
            }

            const data = await result.json();

            if (!result.ok) {
                throw new Error(
                    data.message || "Failed to save booster"
                );
            }


            setBooster(data.data);

            if (!boosterId) {
                navigate(
                    `/item?type=${type}&id=${data.data.id}`,
                    { replace: true }
                );
            }

        } catch (error) {
            console.error("Publish booster error:", error);
        } finally {
            setPublishLoading(false);
        }
    };
    const handleUnpublish = async () => {
        if (!boosterId) return;

        try {
            setPublishLoading(true);

            const result = await fetch(
                `/api/boosters/${boosterId}/unpublish`,
                {
                    method: "POST",
                }
            );

            const data = await result.json();

            if (!result.ok) {
                throw new Error(
                    data.message || "Failed to unpublish booster"
                );
            }

            setBooster(data.data);

        } catch (error) {
            console.error("Unpublish booster error:", error);
        } finally {
            setPublishLoading(false);
        }
    };
    const handleDelete = async () => {
        if (!boosterId) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this booster?"
        );

        if (!confirmed) return;

        try {
            setPublishLoading(true);

            const result = await fetch(
                `/api/boosters/${boosterId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await result.json();

            if (!result.ok) {
                throw new Error(
                    data.message || "Failed to delete booster"
                );
            }

            navigate("/orderValueBooster");

        } catch (error) {
            console.error("Delete booster error:", error);
        } finally {
            setPublishLoading(false);
        }
    };
    useEffect(() => {
        if (!boosterId) {
            return;
        }

        const loadBooster = async () => {
            try {
                const result = await fetch(
                    `/api/boosters/${boosterId}`
                );

                const data = await result.json();

                if (!result.ok) {
                    throw new Error(
                        data.message || "Failed to load booster"
                    );
                }

                const booster = data.data;

                setBooster(booster);
                setRenameName(booster.name);
                setOrderValue(booster.content.orderValue);
                setStartingMessage(
                    booster.content.startingMessage
                );
                setGoalProgressMessage(
                    booster.content.goalProgressMessage
                );
                setSuccessMessage(
                    booster.content.successMessage
                );

                if (booster.type === "cart-page") {
                    setPlacement({
                        type:
                            booster.placement?.type === "custom-position"
                                ? "custom-position"
                                : "cart-page",
                        position:
                            booster.placement?.type === "custom-position"
                                ? "custom"
                                : "cart-page",
                    });
                } else {
                    setPlacement(booster.placement);
                }

                const designDefaults =
                    booster.type === "announcement"
                        ? defaultAnnouncementDesign
                        : defaultDesign;

                setDesign(mergeDesign(designDefaults, booster.design));

            } catch (error) {
                console.error("Load booster error:", error);
            }
        };

        loadBooster();

    }, [boosterId]);

    const handleRenameUpdate = async () => {
        if (!boosterId) return;

        const trimmedName = renameName.trim();

        if (!trimmedName) {
            return;
        }

        try {
            setPublishLoading(true);

            const result = await fetch(
                `/api/boosters/${boosterId}/rename`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                    }),
                }
            );

            const data = await result.json();

            if (!result.ok) {
                throw new Error(
                    data.message || "Failed to rename booster"
                );
            }

            setBooster(data.data);

        } catch (error) {
            console.error("Rename booster error:", error);
        } finally {
            setPublishLoading(false);
        }
    };
    return (
        <s-page heading="Essential Free Shipping">
            <s-stack display="flex" direction="block" gap="large-500" padding="base">
                <s-stack display="flex" direction="inline" justifyContent="space-between">
                    <s-stack display="flex" direction="inline" gap="base" alignItems="center" justifyContent="start" >
                        <s-stack display="flex" justifyContent="start">
                            <s-icon type="arrow-left" onClick={() => navigate('/orderValueBooster')} />
                        </s-stack>
                        <s-stack>
                            <s-stack display="flex" direction="inline" gap="base" alignItems="center">
                                <s-heading fontSize="large-200">
                                    {booster?.name || "Order value booster"}
                                </s-heading>
                                <s-badge tone={isPublished ? "success" : " "}>
                                    {isPublished ? "Published" : "Not Published"}
                                </s-badge>
                            </s-stack>
                            <s-paragraph fontSize="large-100" color="subdued">Booster ID:{booster ? booster.id : " Save or Publish to show booster ID"}</s-paragraph>

                        </s-stack>
                    </s-stack>
                    <s-stack
                        display="flex"
                        direction="inline"
                        gap="base"
                        justifyContent="center"
                        alignItems="start"
                    >
                        <s-button commandFor="renameModal" variant="secondary">
                            Rename
                        </s-button>
                        <s-modal id="renameModal" heading="Rename booster">
                            <s-text-field
                                label="Booster name"
                                value={renameName}
                                placeholder="Rename booster"
                                onInput={(e) => {
                                    setRenameName(e.currentTarget.value);
                                }}
                            ></s-text-field>

                            <s-button slot="secondary-actions" commandFor="renameModal" command="--hide">
                                Close
                            </s-button>
                            <s-button
                                slot="primary-action"
                                variant="primary"
                                commandFor="renameModal"
                                command="--hide"
                                onClick={handleRenameUpdate}
                                disabled={!renameName.trim() || publishLoading}
                            >
                                {publishLoading ? (
                                    <s-spinner></s-spinner>
                                ) : (
                                    "Rename"
                                )}
                            </s-button>
                        </s-modal>

                        {isPublished ? (
                            <>


                                <s-button
                                    variant="secondary"
                                    tone="critical"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </s-button>
                                <s-button
                                    variant="primary"
                                    onClick={handleUnpublish}
                                    disabled={publishLoading}
                                >
                                    Unpublish
                                </s-button>
                            </>
                        ) : (
                            <s-button
                                variant="primary"
                                onClick={handlePublish}
                                disabled={publishLoading}
                            >
                                {publishLoading ? (
                                    <s-spinner></s-spinner>
                                ) : (
                                    "Publish"
                                )}
                            </s-button>
                        )}
                    </s-stack>

                </s-stack>

                <s-stack display="flex" direction="block" gap="base">
                    <s-stack display="flex" direction="inline" gap="base" paddingInline="large">
                        <s-button variant={tabs === "content" ? "secondary" : "tertiary"} onClick={() => setTabs('content')}>Content</s-button>
                        <s-button variant={tabs === "design" ? "secondary" : "tertiary"} onClick={() => setTabs('design')}>Design</s-button>
                        <s-button variant={tabs === "placement" ? "secondary" : "tertiary"} onClick={() => setTabs('placement')}>Placement</s-button>
                    </s-stack>
                    {/* Content Tab  */}
                    {
                        tabs === "content" && (
                            <s-grid gridTemplateColumns="repeat(14, 1fr)" gap="base" >
                                <s-grid-item gridColumn="span 5" gap="base">
                                    <s-stack display="flex" direction="block" gap="base">

                                        <s-section heading="Content" >
                                            <s-stack display="flex" direction="block" gap="base">
                                                <s-number-field
                                                    label="Order Value"
                                                    details="Order value for free shippment"
                                                    placeholder="0"
                                                    step="5"
                                                    value={orderValue}
                                                    onChange={(e) => setOrderValue(Number(e.target.value))}
                                                    min={50}

                                                ></s-number-field>
                                                <s-text-area
                                                    label="Starting message"
                                                    value={startingMessage}
                                                    onChange={(e) => setStartingMessage(e.target.value)}
                                                    rows="2"
                                                ></s-text-area>
                                                <s-text-area
                                                    label="Goal progress message"
                                                    value={goalProgressMessage}
                                                    onChange={(e) => setGoalProgressMessage(e.target.value)}
                                                    rows="2"
                                                ></s-text-area>
                                                <s-text-area
                                                    label="Success message"
                                                    value={successMessage}
                                                    onChange={(e) => setSuccessMessage(e.target.value)}
                                                    rows="2"
                                                ></s-text-area>
                                                <s-section heading="Use dynamic variables in content:">
                                                    <s-stack display="flex" direction="block" gap="base">
                                                        <s-stack display="flex" direction="inline" gap="base" alignItems="center">
                                                            <s-chip color="base" accessibilityLabel="Product status">{"{\order-value\}"}</s-chip>
                                                            <s-text color="subdued" fontSize="small-100">next goal value</s-text>
                                                        </s-stack>
                                                        <s-stack display="flex" direction="inline" gap="base" alignItems="center">
                                                            <s-chip color="base" accessibilityLabel="Product status" >{"{\order-value-progress\}"}</s-chip>
                                                            <s-text color="subdued" fontSize="small-100">progress to next goal</s-text>
                                                        </s-stack>

                                                    </s-stack>

                                                </s-section>
                                            </s-stack>

                                        </s-section>

                                        <s-button variant="secondary" onClick={() => setTabs('design')} inlineSize="fill">Continue to Design</s-button>
                                    </s-stack>

                                </s-grid-item>
                                <s-grid-item gridColumn="span 9" gap="base">
                                    <s-section padding="none">
                                        <s-stack display="flex" direction="inline" background="strong" padding="small-200 large" justifyContent="space-between" >
                                            <s-icon type="menu-horizontal"></s-icon>
                                            <s-paragraph color="subdued">Product page preview</s-paragraph>
                                            <s-box></s-box>
                                        </s-stack>
                                        <s-stack padding="large-500" display="flex" direction="block" justifyContent="center" alignItems="center" gap="large-400">

                                            {
                                                freeShippingOfferStages.map((stage) => (

                                                    <div key={stage.id} style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        width: '70%',
                                                        gap: '10px',
                                                        alignItems: 'center',
                                                        border: `${design.card.borderSize}px solid ${design.card.borderColor}`,

                                                        padding: `
                                                            ${design.card.spacing.insideTop}px
                                                            16px
                                                            ${design.card.spacing.insideBottom}px
                                                            16px
                                                            `,

                                                        margin: `
                                                            ${design.card.spacing.outsideTop}px
                                                            0px
                                                            ${design.card.spacing.outsideBottom}px
                                                            0px`,

                                                        borderRadius: `${design.card.cornerRadius}px`,
                                                        background:
                                                            design.card.backgroundType === "singleColor"
                                                                ? design.card.singleColor
                                                                : `linear-gradient(
                                                                                ${design.card.gradientAngle}deg,
                                                                                ${design.card.gradientStart},
                                                                                ${design.card.gradientEnd}
                                                                            )`,
                                                    }}>
                                                        <h1
                                                            style={{
                                                                fontFamily: design.typography.font,
                                                                fontSize: `${design.typography.message.size}px`,
                                                                color: design.typography.message.color,
                                                                fontWeight: 'bold'
                                                            }}
                                                        >{replaceVariables(stage.heading, stage.progressValue)}</h1>
                                                        {type !== "announcement" && (
                                                            <div
                                                                style={{
                                                                    width: "100%",
                                                                    height: "8px",
                                                                    backgroundColor:
                                                                        design.progressBar.backgroundColor,

                                                                    borderRadius:
                                                                        `${design.progressBar.cornerRadius}px`,
                                                                    overflow: "hidden",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: `${stage.progressValue}%`,
                                                                        height: "100%",
                                                                        backgroundColor:
                                                                            design.progressBar.barColor,

                                                                        borderRadius:
                                                                            `${design.progressBar.cornerRadius}px`,
                                                                        transition: "width 0.3s ease",
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                    </div>

                                                ))
                                            }

                                        </s-stack>

                                    </s-section>

                                </s-grid-item>
                            </s-grid>
                        )
                    }

                    {/* Design Tab  */}
                    {
                        tabs === "design" && (
                            <s-stack>
                                <s-grid gridTemplateColumns="repeat(14, 1fr)" gap="base" >
                                    <s-grid-item gridColumn="span 5" gap="base">
                                        <s-stack display="flex" direction="block" gap="base">
                                            {/* Positioning Section Announcement Type */}
                                            {type === "announcement" && (
                                                <s-section heading="Positioning">
                                                    <s-stack direction="block" gap="base">

                                                        <s-select
                                                            label="Position"
                                                            labelAccessibilityVisibility="exclusive"
                                                            value={design.position?.placement ?? "top"}
                                                            onChange={(e) => {
                                                                const value =
                                                                    e?.detail?.value ??
                                                                    e?.target?.value ??
                                                                    e?.currentTarget?.value;

                                                                if (value !== "top" && value !== "bottom") return;

                                                                setDesign((prev) => ({
                                                                    ...prev,
                                                                    template: "custom",
                                                                    position: {
                                                                        ...prev.position,
                                                                        placement: value,
                                                                    },
                                                                }));
                                                            }}
                                                        >
                                                            <s-option value="top">Top of the page</s-option>
                                                            <s-option value="bottom">Bottom of the page</s-option>
                                                        </s-select>


                                                        {
                                                            design?.position?.placement === 'top' && (
                                                                <s-checkbox
                                                                    label="Sticky bar"
                                                                    checked={design.position?.sticky ?? true}
                                                                    onChange={(e) => {
                                                                        const checked = e.currentTarget?.checked;

                                                                        if (typeof checked !== "boolean") return;

                                                                        setDesign((prev) => ({
                                                                            ...prev,
                                                                            template: "custom",
                                                                            position: {
                                                                                ...prev.position,
                                                                                sticky: checked,
                                                                            },
                                                                        }));
                                                                    }}
                                                                />
                                                            )
                                                        }



                                                        <s-text color="subdued" fontSize="small-100">
                                                            When enabled, the announcement bar stays visible
                                                            while the customer scrolls.
                                                        </s-text>
                                                    </s-stack>
                                                </s-section>
                                            )}

                                            {/* Template Section  */}
                                            <s-section heading="Template">
                                                <s-select label="Template"
                                                    labelAccessibilityVisibility="exclusive"
                                                    value={design.template}
                                                    onChange={(e) => {
                                                        applyTemplate(e.currentTarget.value);
                                                    }} >
                                                    <s-option value="custom">Custom</s-option>
                                                    <s-option value="blackAndYellow">Black and Yellow</s-option>
                                                    <s-option value="vibrant">Vibrant</s-option>
                                                    <s-option value="electric">Electric</s-option>
                                                    <s-option value="darkOcean">Dark Ocean</s-option>
                                                    <s-option value="Minimal">Minimal</s-option>
                                                    <s-option value="mint">Mint</s-option>
                                                </s-select>

                                            </s-section>

                                            {/* Card Section  */}
                                            <s-section heading="Card">
                                                <s-stack display="flex" direction="block" gap="base" >
                                                    {/* Background Color Type Selection  */}
                                                    <s-stack display="flex" direction="block" gap="base" >

                                                        <s-choice-list label="Background type"
                                                            labelAccessibilityVisibility="exclusive"
                                                            name="visibility"
                                                            onChange={(e) =>
                                                                updateCard(
                                                                    "backgroundType",
                                                                    e.currentTarget.values[0]
                                                                )
                                                            }>
                                                            <s-choice
                                                                value="singleColor"
                                                                selected={
                                                                    design.card.backgroundType === "singleColor"
                                                                }
                                                            >
                                                                Single color background
                                                            </s-choice>

                                                            <s-choice
                                                                value="gradientColor"
                                                                selected={
                                                                    design.card.backgroundType === "gradientColor"
                                                                }
                                                            >
                                                                Gradient background
                                                            </s-choice>
                                                        </s-choice-list>
                                                        {
                                                            design.card.backgroundType === "singleColor" && (
                                                                <ColorInput
                                                                    label="Brand color"
                                                                    value={design.card.singleColor}
                                                                    onChange={(value) =>
                                                                        updateCard("singleColor", value)
                                                                    }
                                                                />
                                                            )
                                                        }
                                                        {
                                                            design.card.backgroundType === "gradientColor" && (
                                                                <s-stack direction="block" gap="base">

                                                                    <s-text>
                                                                        Gradient angle degree
                                                                    </s-text>

                                                                    <input
                                                                        type="range"
                                                                        min="0"
                                                                        max="360"
                                                                        value={design.card.gradientAngle}
                                                                        onChange={(e) =>
                                                                            updateCard(
                                                                                "gradientAngle",
                                                                                Number(e.currentTarget.value)
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: "100%",
                                                                            accentColor: "black",
                                                                        }}
                                                                    />

                                                                    <ColorInput
                                                                        label="Gradient start color"
                                                                        value={design.card.gradientStart}
                                                                        onChange={(value) =>
                                                                            updateCard("gradientStart", value)
                                                                        }
                                                                    />

                                                                    <ColorInput
                                                                        label="Gradient end color"
                                                                        value={design.card.gradientEnd}
                                                                        onChange={(value) =>
                                                                            updateCard("gradientEnd", value)
                                                                        }
                                                                    />

                                                                </s-stack>
                                                            )
                                                        }
                                                    </s-stack>
                                                    {/* Corner Radius  */}
                                                    <s-box inlineSize="86px" >
                                                        <s-number-field
                                                            label="Corner radius"
                                                            placeholder="0"
                                                            step="1"
                                                            min="0"
                                                            // suffix="px"
                                                            max="100"
                                                            value={design.card.cornerRadius}
                                                            onChange={(e) =>
                                                                updateCard(
                                                                    "cornerRadius",
                                                                    Number(e.currentTarget.value)
                                                                )
                                                            }
                                                        ></s-number-field>
                                                    </s-box>

                                                    {/* Border Size & Border Color  */}
                                                    <s-grid gridTemplateColumns="repeat(12, 1fr)" alignItems="center" gap="base">
                                                        <s-grid-item gridColumn="span 4">
                                                            <s-number-field
                                                                label="Border size"
                                                                placeholder="1"
                                                                step="1"
                                                                min="1"
                                                                max="100"
                                                                // suffix="px"
                                                                value={design.card.borderSize}
                                                                onChange={(e) =>
                                                                    updateCard(
                                                                        "borderSize",
                                                                        Number(e.currentTarget.value)
                                                                    )
                                                                }
                                                            />
                                                        </s-grid-item>

                                                        <s-grid-item gridColumn="span 8">
                                                            <ColorInput
                                                                label="Border color"
                                                                value={design.card.borderColor}
                                                                onChange={(value) =>
                                                                    updateCard("borderColor", value)
                                                                }
                                                                showLabel="true"
                                                            />
                                                        </s-grid-item>
                                                    </s-grid>

                                                    {/* Spacing  */}
                                                    <s-stack direction="block" gap="base">

                                                        <s-text>Spacing</s-text>

                                                        <s-grid
                                                            gridTemplateColumns="1fr 1fr"
                                                            gap="base"
                                                        >

                                                            {/* Inside top */}
                                                            <s-grid-item>
                                                                <s-number-field
                                                                    label="Inside top"
                                                                    value={design.card.spacing.insideTop}
                                                                    min={0}
                                                                    step={1}
                                                                    suffix="px"
                                                                    onChange={(e) =>
                                                                        updateSpacing(
                                                                            "insideTop",
                                                                            Number(e.currentTarget.value)
                                                                        )
                                                                    }
                                                                />
                                                            </s-grid-item>

                                                            {/* Inside bottom */}
                                                            <s-grid-item>
                                                                <s-number-field
                                                                    label="Inside bottom"
                                                                    value={design.card.spacing.insideBottom}
                                                                    min={0}
                                                                    step={1}
                                                                    suffix="px"
                                                                    onChange={(e) =>
                                                                        updateSpacing(
                                                                            "insideBottom",
                                                                            Number(e.currentTarget.value)
                                                                        )
                                                                    }
                                                                />
                                                            </s-grid-item>

                                                            {/* Outside top */}
                                                            <s-grid-item>
                                                                <s-number-field
                                                                    label="Outside top"
                                                                    value={design.card.spacing.outsideTop}
                                                                    min={0}
                                                                    step={1}
                                                                    suffix="px"
                                                                    onChange={(e) =>
                                                                        updateSpacing(
                                                                            "outsideTop",
                                                                            Number(e.currentTarget.value)
                                                                        )
                                                                    }
                                                                />
                                                            </s-grid-item>

                                                            {/* Outside bottom */}
                                                            <s-grid-item>
                                                                <s-number-field
                                                                    label="Outside bottom"
                                                                    value={design.card.spacing.outsideBottom}
                                                                    min={0}
                                                                    step={1}
                                                                    suffix="px"
                                                                    onChange={(e) =>
                                                                        updateSpacing(
                                                                            "outsideBottom",
                                                                            Number(e.currentTarget.value)
                                                                        )
                                                                    }
                                                                />
                                                            </s-grid-item>

                                                        </s-grid>

                                                    </s-stack>
                                                </s-stack>

                                            </s-section>
                                            {/* Progress Bar Section  */}
                                            {type !== "announcement" && (

                                                <s-section heading="Progress bar">
                                                    <s-stack
                                                        display="flex"
                                                        direction="block"
                                                        gap="base"
                                                    >

                                                        {/* Background color */}
                                                        <ColorInput
                                                            label="Background color"
                                                            value={design.progressBar.backgroundColor}
                                                            onChange={(value) =>
                                                                updateProgressBar(
                                                                    "backgroundColor",
                                                                    value
                                                                )
                                                            }
                                                            showLabel="true"
                                                        />

                                                        {/* Progress bar color */}
                                                        <ColorInput
                                                            label="Progress bar color"
                                                            value={design.progressBar.barColor}
                                                            onChange={(value) =>
                                                                updateProgressBar(
                                                                    "barColor",
                                                                    value
                                                                )
                                                            }
                                                            showLabel="true"

                                                        />

                                                        {/* Corner radius */}
                                                        <s-box inlineSize="90px">
                                                            <s-number-field
                                                                label="Corner radius"
                                                                value={design.progressBar.cornerRadius}
                                                                min={0}
                                                                step={1}
                                                                suffix="px"
                                                                onChange={(e) =>
                                                                    updateProgressBar(
                                                                        "cornerRadius",
                                                                        Number(e.currentTarget.value)
                                                                    )
                                                                }
                                                            />
                                                        </s-box>

                                                    </s-stack>
                                                </s-section>

                                            )}

                                            {/* Typography Section  */}
                                            <s-section heading="Typography">

                                                <s-stack
                                                    display="flex"
                                                    direction="block"
                                                    gap="base"
                                                >

                                                    {/* Font */}
                                                    <s-stack
                                                        display="flex"
                                                        direction="block"
                                                        gap="small"
                                                    >
                                                        <s-text>Font</s-text>

                                                        <s-select
                                                            label="Font"
                                                            labelAccessibilityVisibility="exclusive"
                                                            value={design.typography.font}
                                                            onChange={(e) =>
                                                                updateTypography(
                                                                    "font",
                                                                    e.currentTarget.value
                                                                )
                                                            }
                                                        >
                                                            <s-option value="theme">
                                                                Use your theme fonts
                                                            </s-option>
                                                            <s-option value="helvetica">
                                                                Helvetica
                                                            </s-option>
                                                            <s-option value="tahoma">
                                                                Tahoma
                                                            </s-option>
                                                            <s-option value="trebuchet-ms">
                                                                Trebuchet MS
                                                            </s-option>
                                                            <s-option value="times-new-roman">
                                                                Times New Roman
                                                            </s-option>
                                                            <s-option value="georgia">
                                                                Georgia
                                                            </s-option>
                                                            <s-option value="garamond">
                                                                Garamond
                                                            </s-option>
                                                            <s-option value="courier-new">
                                                                Courier New
                                                            </s-option>
                                                        </s-select>

                                                        <s-text color="subdued">
                                                            Theme fonts are not available in the preview
                                                            mode. Publish item to preview it in store.
                                                        </s-text>
                                                    </s-stack>


                                                    {/* Message size and color */}
                                                    <s-stack
                                                        display="flex"
                                                        direction="block"
                                                        gap="small"
                                                    >
                                                        <s-text>Message size and color</s-text>

                                                        <s-grid
                                                            gridTemplateColumns="94px 1fr"
                                                            gap="small"
                                                        >
                                                            <s-grid-item>
                                                                <s-number-field
                                                                    label="Message size"
                                                                    labelAccessibilityVisibility="exclusive"
                                                                    value={design.typography.message.size}
                                                                    min={1}
                                                                    step={1}
                                                                    suffix="px"
                                                                    onChange={(e) =>
                                                                        updateTypographyItem(
                                                                            "message",
                                                                            "size",
                                                                            Number(e.currentTarget.value)
                                                                        )
                                                                    }
                                                                />
                                                            </s-grid-item>

                                                            <s-grid-item>
                                                                <ColorInput
                                                                    label="Message color"
                                                                    value={design.typography.message.color}
                                                                    onChange={(value) =>
                                                                        updateTypographyItem(
                                                                            "message",
                                                                            "color",
                                                                            value
                                                                        )
                                                                    }
                                                                    showLabel={false}
                                                                />
                                                            </s-grid-item>
                                                        </s-grid>
                                                    </s-stack>



                                                </s-stack>

                                            </s-section>

                                            <s-button
                                                variant="secondary"
                                                inlineSize="fill"
                                                onClick={(e) => setTabs("placement")} >
                                                Continue to placement
                                            </s-button>
                                        </s-stack>
                                    </s-grid-item>
                                    <s-grid-item gridColumn="span 9" gap="base">
                                        <s-section padding="none">
                                            <s-stack display="flex" direction="inline" background="strong" padding="small-200 large" justifyContent="space-between" >
                                                <s-icon type="menu-horizontal"></s-icon>
                                                <s-paragraph color="subdued">Product page preview</s-paragraph>
                                                <s-box></s-box>
                                            </s-stack>
                                            <s-stack display="flex" direction="block" justifyContent='center' alignItems='center' gap="large-400">

                                                {type === "announcement" ? (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                design.position?.placement === "bottom"
                                                                    ? "column-reverse"
                                                                    : "column",
                                                            width: "100%",
                                                            minHeight: "220px",
                                                        }}
                                                    >


                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                boxSizing: "border-box",
                                                                padding: `${design.card.spacing.insideTop}px 16px ${design.card.spacing.insideBottom}px`,
                                                                margin: `${design.card.spacing.outsideTop}px 0 ${design.card.spacing.outsideBottom}px`,
                                                                border: `${design.card.borderSize}px solid ${design.card.borderColor}`,
                                                                borderRadius: `${design.card.cornerRadius}px`,
                                                                background:
                                                                    design.card.backgroundType === "singleColor"
                                                                        ? design.card.singleColor
                                                                        : `linear-gradient(
                                                                    ${design.card.gradientAngle}deg,
                                                                    ${design.card.gradientStart},
                                                                    ${design.card.gradientEnd}
                                                                )`,
                                                                textAlign: "center",
                                                                fontFamily:
                                                                    design.typography.font === "theme"
                                                                        ? "inherit"
                                                                        : design.typography.font,
                                                                fontSize: `${design.typography.message.size}px`,
                                                                color: design.typography.message.color,
                                                                position: "relative",
                                                                width: "100%",
                                                            }}
                                                        >
                                                            {replaceVariables(startingMessage, 0)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        width: '70%',
                                                        gap: '10px',
                                                        alignItems: 'center',
                                                        border: `${design.card.borderSize}px solid ${design.card.borderColor}`,

                                                        padding: `
                                                            ${design.card.spacing.insideTop}px
                                                            16px
                                                            ${design.card.spacing.insideBottom}px
                                                            16px
                                                            `,

                                                        margin: `
                                                            ${design.card.spacing.outsideTop}px
                                                            0px
                                                            ${design.card.spacing.outsideBottom}px
                                                            0px`,

                                                        borderRadius: `${design.card.cornerRadius}px`,
                                                        background:
                                                            design.card.backgroundType === "singleColor"
                                                                ? design.card.singleColor
                                                                : `linear-gradient(
                                                                                ${design.card.gradientAngle}deg,
                                                                                ${design.card.gradientStart},
                                                                                ${design.card.gradientEnd}
                                                                            )`,
                                                    }}>
                                                        <h1
                                                            style={{
                                                                fontFamily: design.typography.font,
                                                                fontSize: `${design.typography.message.size}px`,
                                                                color: design.typography.message.color,
                                                                fontWeight: 'bold'
                                                            }}
                                                        >You're only $15.00 away from free shipping!</h1>
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                height: "8px",
                                                                backgroundColor:
                                                                    design.progressBar.backgroundColor,

                                                                borderRadius:
                                                                    `${design.progressBar.cornerRadius}px`,
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `35%`,
                                                                    height: "100%",
                                                                    backgroundColor:
                                                                        design.progressBar.barColor,

                                                                    borderRadius:
                                                                        `${design.progressBar.cornerRadius}px`,
                                                                    transition: "width 0.3s ease",
                                                                }}
                                                            />
                                                        </div>

                                                    </div>
                                                )}



                                            </s-stack>

                                        </s-section>

                                    </s-grid-item>
                                </s-grid>
                            </s-stack>
                        )
                    }


                    {/* Placement Tab */}
                    {tabs === "placement" && (
                        <s-grid
                            gridTemplateColumns="repeat(14, 1fr)"
                            gap="base"
                        >
                            {/* Left settings panel */}
                            <s-grid-item gridColumn="span 5" >
                                <s-stack gap="base">

                                    <s-section
                                        heading={
                                            type === "announcement"
                                                ? "Select pages to display the bar"
                                                : type === "cart-page"
                                                    ? "Order value booster will be displayed on the cart page"
                                                    : "Select pages to display the order value booster"
                                        }
                                    >

                                        {type === "announcement" ? (
                                            <s-stack direction="block" gap="base">
                                                <s-choice-list
                                                    label="Select pages to display the bar"
                                                    labelAccessibilityVisibility="exclusive"
                                                    name="announcementPlacement"
                                                    value={placement.type}
                                                    onChange={(e) => {
                                                        const selectedType = e?.currentTarget?.values?.[0];

                                                        if (!selectedType) return;

                                                        setPlacement((prev) => ({
                                                            ...prev,
                                                            type: selectedType,
                                                            productIds:
                                                                selectedType === "specific-products"
                                                                    ? prev.productIds
                                                                    : [],
                                                            collectionIds:
                                                                selectedType === "collection-products" ||
                                                                    selectedType === "specific-collections"
                                                                    ? prev.collectionIds
                                                                    : [],
                                                        }));
                                                    }}
                                                >
                                                    <s-choice value="all-pages">
                                                        Show on every page
                                                    </s-choice>
                                                    <s-choice value="home-page">
                                                        Show on home page only
                                                    </s-choice>
                                                    <s-choice value="all-product-pages">
                                                        Show on all product pages
                                                    </s-choice>
                                                    <s-choice value="specific-products">
                                                        Show on specific product pages
                                                    </s-choice>
                                                    <s-choice value="collection-products">
                                                        Show on all products in specific collections
                                                    </s-choice>
                                                    <s-choice value="all-collection-pages">
                                                        Show on all collection pages
                                                    </s-choice>
                                                    <s-choice value="specific-collections">
                                                        Show on specific collection pages
                                                    </s-choice>
                                                </s-choice-list>

                                                {placement.type === "specific-products" && (
                                                    <s-button variant="secondary" onClick={openProductPicker}>
                                                        Select products
                                                    </s-button>
                                                )}

                                                {(placement.type === "collection-products" ||
                                                    placement.type === "specific-collections") && (
                                                        <s-button
                                                            variant="secondary"
                                                            onClick={openCollectionPicker}
                                                        >
                                                            Select collections
                                                        </s-button>
                                                    )}

                                                <s-divider />

                                                <s-text color="subdued" fontSize="small-100">
                                                    Choose which storefront pages should display this announcement bar.
                                                </s-text>
                                            </s-stack>
                                        ) : type === "cart-page" ? (
                                            <s-stack
                                                direction="block"
                                                gap="base"
                                            >


                                                <s-choice-list
                                                    label="Cart page placement"
                                                    labelAccessibilityVisibility="exclusive"
                                                    name="cartPlacement"
                                                    value={placement.type}
                                                    onChange={(e) => {
                                                        const selectedType =
                                                            e.currentTarget.values[0];

                                                        setPlacement({
                                                            type: selectedType,
                                                            position:
                                                                selectedType === "cart-page"
                                                                    ? "cart-page"
                                                                    : "custom",
                                                        });
                                                    }}
                                                >
                                                    <s-choice value="cart-page">
                                                        Cart Page
                                                    </s-choice>

                                                    <s-choice value="custom-position">
                                                        Custom position
                                                    </s-choice>
                                                </s-choice-list>


                                                <s-stack
                                                    padding="base"
                                                    gap="base"
                                                >
                                                    <s-text>
                                                        Add the order value booster anywhere
                                                        in your cart page using an app block
                                                        or the code snippet provided below.
                                                    </s-text>

                                                    <s-divider />
                                                    <s-stack display="flex" direction="block" gap="base">


                                                        <s-stack display="flex" direction="block" >
                                                            <s-text color="base" fontWeight="bold">
                                                                Booster ID
                                                            </s-text>


                                                            <s-text color="subdued" fontSize="small-100">
                                                                {booster?.id ||
                                                                    "Publish the booster to generate its ID"} <s-icon type="clipboard"></s-icon>
                                                            </s-text>
                                                        </s-stack>


                                                        <s-text color="subdued" fontSize="small-100">
                                                            Order value booster app block can be added, removed, repositioned, and customized through the theme editor using booster ID.
                                                        </s-text>


                                                    </s-stack>
                                                </s-stack>



                                            </s-stack>
                                        ) : (
                                            <s-stack direction="block" gap="base">
                                                <s-choice-list
                                                    label="Select Pages"
                                                    labelAccessibilityVisibility="exclusive"
                                                    name="productPlacement"
                                                    value={placement.type}
                                                    onChange={(e) => {
                                                        const selectedType = e.currentTarget.values[0];

                                                        setPlacementSelectionMade(true);

                                                        setPlacement((prev) => ({
                                                            ...prev,
                                                            type: selectedType,
                                                            productIds:
                                                                selectedType === "specific-products"
                                                                    ? prev.productIds
                                                                    : [],
                                                            collectionIds:
                                                                selectedType === "collection-products"
                                                                    ? prev.collectionIds
                                                                    : [],
                                                        }));
                                                    }}
                                                >
                                                    <s-choice value="all-products">All products</s-choice>
                                                    <s-choice value="specific-products">Specific products</s-choice>
                                                    <s-choice value="collection-products">
                                                        All products in specific collections
                                                    </s-choice>
                                                </s-choice-list>
                                                <>
                                                    {placementSelectionMade &&
                                                        placement.type === "specific-products" && (
                                                            <s-button
                                                                variant="secondary"
                                                                onClick={openProductPicker}
                                                            >
                                                                Select Products
                                                            </s-button>
                                                        )}

                                                    {placementSelectionMade &&
                                                        placement.type === "collection-products" && (
                                                            <s-button
                                                                variant="secondary"
                                                                onClick={openCollectionPicker}
                                                            >
                                                                Specific collections
                                                            </s-button>
                                                        )}
                                                </>
                                                <s-stack
                                                    gap="base"
                                                >
                                                    <s-stack paddingInline="base"  >

                                                        <s-text color="subdued" fontSize="small-100" >
                                                            Add the order value booster anywhere using app blocks or code snippet provided below.
                                                        </s-text>

                                                    </s-stack>

                                                </s-stack>
                                                <s-divider />
                                                <s-stack display="flex" direction="block" gap="base"  >


                                                    <s-stack display="flex" direction="block"  >
                                                        <s-text color="base" fontWeight="bold">
                                                            Booster ID
                                                        </s-text>


                                                        <s-text color="subdued" fontSize="small-100">
                                                            {booster?.id ||
                                                                "Publish the booster to generate its ID"} <s-icon type="clipboard"></s-icon>
                                                        </s-text>
                                                    </s-stack>


                                                    <s-text color="subdued" fontSize="small-100">
                                                        Order value booster app block can be added, removed, repositioned, and customized through the theme editor using booster ID.
                                                    </s-text>


                                                </s-stack>
                                            </s-stack>
                                        )}


                                    </s-section>

                                    {!isPublished && (
                                        <s-button
                                            variant="primary"
                                            inlineSize="fill"
                                            disabled={publishLoading}
                                            onClick={handlePublish}
                                        >
                                            {publishLoading ? (
                                                <s-spinner />
                                            ) : (
                                                "Publish"
                                            )}
                                        </s-button>
                                    )}

                                </s-stack>

                            </s-grid-item>

                            {/* Right preview panel */}
                            <s-grid-item gridColumn="span 9">
                                <s-section padding="none">
                                    <s-stack
                                        direction="inline"
                                        background="strong"
                                        padding="small-200 large"
                                        justifyContent="space-between"
                                    >
                                        <s-icon type="menu-horizontal" />

                                        <s-paragraph color="subdued">
                                            {type === "announcement"
                                                ? "Announcement bar preview"
                                                : type === "cart-page"
                                                    ? "Cart page preview"
                                                    : "Product page preview"}
                                        </s-paragraph>

                                        <s-box />
                                    </s-stack>

                                    <s-stack padding="large-500" display="flex" direction="block" justifyContent='center' alignItems='center' gap="large-400">

                                        {type === "announcement" ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection:
                                                        design.position?.placement === "bottom"
                                                            ? "column-reverse"
                                                            : "column",
                                                    width: "100%",
                                                    minHeight: "220px",
                                                }}
                                            >


                                                <div
                                                    style={{
                                                        width: "100%",
                                                        boxSizing: "border-box",
                                                        padding: `${design.card.spacing.insideTop}px 16px ${design.card.spacing.insideBottom}px`,
                                                        margin: `${design.card.spacing.outsideTop}px 0 ${design.card.spacing.outsideBottom}px`,
                                                        border: `${design.card.borderSize}px solid ${design.card.borderColor}`,
                                                        borderRadius: `${design.card.cornerRadius}px`,
                                                        background:
                                                            design.card.backgroundType === "singleColor"
                                                                ? design.card.singleColor
                                                                : `linear-gradient(
                                                            ${design.card.gradientAngle}deg,
                                                            ${design.card.gradientStart},
                                                            ${design.card.gradientEnd}
                                                        )`,
                                                        textAlign: "center",
                                                        fontFamily:
                                                            design.typography.font === "theme"
                                                                ? "inherit"
                                                                : design.typography.font,
                                                        fontSize: `${design.typography.message.size}px`,
                                                        color: design.typography.message.color,
                                                        position: "relative",
                                                        width: "100%",
                                                    }}
                                                >
                                                    {replaceVariables(startingMessage, 0)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                width: '70%',
                                                gap: '10px',
                                                alignItems: 'center',
                                                border: `${design.card.borderSize}px solid ${design.card.borderColor}`,

                                                padding: `
                                                            ${design.card.spacing.insideTop}px
                                                            16px
                                                            ${design.card.spacing.insideBottom}px
                                                            16px
                                                            `,

                                                margin: `
                                                            ${design.card.spacing.outsideTop}px
                                                            0px
                                                            ${design.card.spacing.outsideBottom}px
                                                            0px`,

                                                borderRadius: `${design.card.cornerRadius}px`,
                                                background:
                                                    design.card.backgroundType === "singleColor"
                                                        ? design.card.singleColor
                                                        : `linear-gradient(
                                                                                ${design.card.gradientAngle}deg,
                                                                                ${design.card.gradientStart},
                                                                                ${design.card.gradientEnd}
                                                                            )`,
                                            }}>
                                                <h1
                                                    style={{
                                                        fontFamily: design.typography.font,
                                                        fontSize: `${design.typography.message.size}px`,
                                                        color: design.typography.message.color,
                                                        fontWeight: 'bold'
                                                    }}
                                                >You're only $15.00 away from free shipping!</h1>
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "8px",
                                                        backgroundColor:
                                                            design.progressBar.backgroundColor,

                                                        borderRadius:
                                                            `${design.progressBar.cornerRadius}px`,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `35%`,
                                                            height: "100%",
                                                            backgroundColor:
                                                                design.progressBar.barColor,

                                                            borderRadius:
                                                                `${design.progressBar.cornerRadius}px`,
                                                            transition: "width 0.3s ease",
                                                        }}
                                                    />
                                                </div>

                                            </div>
                                        )}

                                    </s-stack>

                                </s-section>
                            </s-grid-item>
                        </s-grid>
                    )}


                </s-stack>

            </s-stack>

        </s-page >
    )
}

export default ItemPage
