const localUrl = "https://shopify-demo-backend-0siu.onrender.com";
const shop = Shopify.shop;

const storefrontSessionId = (() => {
    const storageKey = "storefront_credit_session_id";

    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
})();
const bannerCreditChecks = new Map();

const headers = {
    "Content-Type": "application/json",
};

async function canDisplayBanner(booster, placement) {
    const bannerId = booster?.id ?? booster?.name ?? booster?.type;
    const key = `${bannerId}:${placement}`;

    if (bannerCreditChecks.has(key)) {
        return bannerCreditChecks.get(key);
    }

    const checkPromise = (async () => {
        try {

            const response = await fetch(
                `${localUrl}/creditsBannerView?shop=${encodeURIComponent(shop)}`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        placement,
                        sessionId: storefrontSessionId,
                    }),
                }
            );

            if (!response.ok) {
                console.error(
                    "Banner credit check failed:",
                    response.status
                );
                return false;
            }

            const result = await response.json();

            if (!result.success || !result.allowed) {
                console.log("Banner blocked by credit limit:", placement);
                return false;
            }

            console.log("Banner credit approved:", result.data);
            return true;
        } catch (error) {
            console.error("Banner credit request failed:", error);
            return false;
        }
    })();

    bannerCreditChecks.set(key, checkPromise);
    return checkPromise;
}


let cartDrawerBanner = null;
let cartPageBanner = null;

// Find the form with action="/cart/add"
(function () {
    if (!window || !window.Shopify) return;

    const CartEvents = {
        add: "SCE:add",
        update: "SCE:update",
        change: "SCE:change",
        clear: "SCE:clear",
        mutate: "SCE:mutate",
    };

    const ShopifyCartURLs = [
        "/cart/add",
        "/cart/update",
        "/cart/change",
        "/cart/clear",
        "/cart/add.js",
        "/cart/update.js",
        "/cart/change.js",
        "/cart/clear.js",
    ];

    function isShopifyCartURL(url) {
        if (!url) return false;
        const path = url.split("/").pop();
        return ShopifyCartURLs.includes(`/cart/${path}`);
    }

    function updateType(url) {
        if (!url) return false;
        if (url.includes("cart/add")) {
            return "add";
        } else if (url.includes("cart/update")) {
            return "update";
        } else if (url.includes("cart/change")) {
            return "change";
        } else if (url.includes("cart/clear")) {
            return "clear";
        } else return false;
    }

    function dispatchEvent(url, detail) {
        if (typeof detail === "string") {
            try {
                detail = JSON.parse(detail);
            } catch {}
        }

        window.dispatchEvent(new CustomEvent(CartEvents.mutate, {
            detail
        }));
        const type = updateType(url);
        switch (type) {
            case "add":
                window.dispatchEvent(new CustomEvent(CartEvents.add, {
                    detail
                }));
                break;
            case "update":
                window.dispatchEvent(new CustomEvent(CartEvents.update, {
                    detail
                }));
                break;
            case "change":
                window.dispatchEvent(new CustomEvent(CartEvents.change, {
                    detail
                }));
                break;
            case "clear":
                window.dispatchEvent(new CustomEvent(CartEvents.clear, {
                    detail
                }));
                break;
            default:
                break;
        }
    }

    function XHROverride() {
        if (!window.XMLHttpRequest) return;

        const originalOpen = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function () {
            const url = arguments[1];
            this.addEventListener("load", function () {
                if (isShopifyCartURL(url)) {
                    dispatchEvent(url, this.response);
                }
            });
            return originalOpen.apply(this, arguments);
        };
    }

    function fetchOverride() {
        if (!window.fetch || typeof window.fetch !== "function") return;
        const originalFetch = window.fetch;
        window.fetch = function () {
            const response = originalFetch.apply(this, arguments);

            if (isShopifyCartURL(arguments[0])) {
                response.then((res) => {
                    res
                        .clone()
                        .json()
                        .then((data) => dispatchEvent(res.url, data));
                });
            }

            return response;
        };
    }
    fetchOverride();
    XHROverride();
})();

// Fetch Cart Data Function 
async function getCartData() {
    let res = await fetch(window.Shopify.routes.root + "cart.js");
    if (!res.ok) {
        throw new Error("Failed to fetch cart data");
    }
    res = await res.json();
    console.log("Cart Data Result:", res);

    return res;
}

// Loading DOM Content On Reload 
document.addEventListener("DOMContentLoaded", async function () {

    console.log("-----Inside Dom Version 99.O----- ");

    const announcementBoosters =
        await fetchPublishAnnouncementBoosters();

    const announcementBooster = announcementBoosters?.find(
        (booster) =>
        booster.status === "published" &&
        booster.type === "announcement" &&
        booster.placement?.type === "all-pages"
    );

    const announcementBanner = document.getElementById(
        "freeShippingBannerAnnouncementBar"
    );

    if (announcementBanner) {
        announcementBanner.style.display = "none";
    }


    if (announcementBooster) {
        // Hide the banner until its initial message is ready
        const announcementBanner = document.getElementById(
            "freeShippingBannerAnnouncementBar"
        );

        if (announcementBanner) {
            announcementBanner.style.display = "none";
        }
    }

    const cartData = await getCartData();
    window.currentCartData = cartData;

    if (
        announcementBooster &&
        cartData &&
        await canDisplayBanner(announcementBooster, "announcement")
    ) {
        updateAnnouncementMessage(cartData, announcementBooster);
        mountAnnouncementBar(announcementBooster);
    }


    const boosters = await fetchPublishBoosters();
    const cartBoosters = await fetchPublishCartDrawerBoosters();

    const booster = boosters?. [0];
    const cartBooster = cartBoosters?. [0];

    cartDrawerBanner = document.getElementById(
        "freeShippingBannerCartDrawer"
    );

    cartPageBanner = document.getElementById(
        "freeShippingBannerCartPage"
    );

    // Hide both cart banners before checking placement.
    if (cartDrawerBanner) cartDrawerBanner.style.display = "none";
    if (cartPageBanner) cartPageBanner.style.display = "none";


    if (await shouldShowCartBooster(cartBooster, cartData)) {
        if (
            await canDisplayBanner(cartBooster, "cart-drawer")
        ) {
            mountCartDrawerBooster(cartBooster);
        }

        if (
            await canDisplayBanner(cartBooster, "cart-page")
        ) {
            mountCartPageBooster(cartBooster);
        }
    }


    // Continue your existing product-page logic separately.




    const mainDiv = document.getElementById("freeShippingBanner");

    // Hide it immediately, before checking any condition.
    if (mainDiv) {
        mainDiv.style.display = "none";
    }


    if (
        booster &&
        await shouldShowBooster(booster) &&
        await canDisplayBanner(booster, "product")
    ) {
        const productForm = document.querySelector("product-form");

        if (mainDiv && productForm) {
            productForm.append(mainDiv);

            applyBoosterDesign(booster, "product");
            updateProgressBar(cartData, booster, "product");

            mainDiv.style.display = "flex";
        }
    } else {
        console.log("Product booster hidden or credit limit reached");
    }
    // else {
    //     console.log("Product booster condition not satisfied");
    // }



})

// Get Page Type Function
function getPageType() {
    return window.boosterContext?.pageType;
}

// ShowBooster For Specific Product and Collection ID 
async function shouldShowBooster(booster) {
    const context = window.boosterContext;
    const pageType = context?.pageType;
    const productId = context?.productId;

    if (!booster || !booster.placement) {
        return false;
    }

    if (
        booster.type === "product-page" &&
        pageType !== "product"
    ) {
        return false;
    }

    const placement = booster.placement;

    // Show on all products.
    if (placement.type === "all-products") {
        return true;
    }

    // Show only on selected products.
    if (placement.type === "specific-products") {
        return placement.productIds?.some(
            id => String(id).split("/").pop() === String(productId)
        ) ?? false;
    }

    // Show only on products belonging to selected collections.
    if (placement.type === "collection-products") {
        const productCollectionIds = context?.collectionIds ?? [];
        const selectedCollectionIds = placement.collectionIds ?? [];

        return productCollectionIds.some(productCollectionId =>
            selectedCollectionIds.some(selectedCollectionId =>
                String(selectedCollectionId).split("/").pop() ===
                String(productCollectionId).split("/").pop()
            )
        );
    }

    return false;
}


// ShowBooster For Cart Drawer And Page 
async function shouldShowCartBooster(booster, cartData) {
    if (!booster) {
        return false;
    }
    if (cartData.item_count < 1) {
        return false
    }

    return (
        booster.type === "cart-page" &&
        booster.placement?.type === "cart-page" &&
        booster.placement?.position === "cart-page"
    );
}

// Apply Booster Design For Product Cart And Cart Drawer Function 
function applyBoosterDesign(booster, type = "product") {

    const isCart = type === "cart";
    const isCartPage = type === "cart-page";


    const boosterContainer = document.getElementById(
        isCart ? "containerCartDrawer" : isCartPage ? "containerCartPage" : "container"
    );

    const progressBarBackground = document.getElementById(
        isCart ?
        "progressBarBackgroundCartDrawer" : isCartPage ? "progressBarBackgroundCartPage" :
        "progressBarBackground"
    );

    const progressBar = document.getElementById(
        isCart ?
        "progressBarCartDrawer" : isCartPage ? "progressBarCartPage" :
        "progressBar"
    );

    const messages = document.getElementById(
        isCart ?
        "messagesCartDrawer" : isCartPage ? "messagesCartPage" :
        "messages"
    );

    if (
        !boosterContainer ||
        !progressBarBackground ||
        !progressBar ||
        !messages
    ) {
        console.log("Booster elements not found");
        return;
    }

    const {
        gradientAngle,
        gradientStart,
        gradientEnd,
        cornerRadius,
        borderColor,
        borderSize,
        backgroundType,
        singleColor
    } = booster.design.card;

    const {
        insideBottom,
        insideTop,
        outsideBottom,
        outsideTop
    } = booster.design.card.spacing;

    const {
        backgroundColor,
        barColor
    } = booster.design.progressBar;




    boosterContainer.style.borderColor = borderColor;

    boosterContainer.style.borderWidth =
        `${borderSize}px`;

    boosterContainer.style.borderStyle = "solid";

    boosterContainer.style.borderRadius =
        `${cornerRadius}px`;




    if (backgroundType === "singleColor") {

        boosterContainer.style.background =
            singleColor;

    } else {

        boosterContainer.style.background =
            `linear-gradient(
                ${gradientAngle}deg,
                ${gradientStart},
                ${gradientEnd}
            )`;
    }




    boosterContainer.style.margin =
        `${outsideTop}px 0px ${outsideBottom}px 0px`;

    boosterContainer.style.padding =
        `${insideTop}px 16px ${insideBottom}px 16px`;




    progressBarBackground.style.background =
        backgroundColor;

    progressBar.style.background =
        barColor;

    progressBar.style.borderRadius =
        `${booster.design.progressBar.cornerRadius}px`;

    progressBarBackground.style.borderRadius =
        `${booster.design.progressBar.cornerRadius}px`;

    progressBar.style.transition =
        "width 0.8s ease-in-out";




    messages.style.color =
        booster.design.typography.message.color;

    messages.style.fontSize =
        `${booster.design.typography.message.size}px`;
}

// Cart Page Publish Booster  Api Call Function 
async function fetchPublishCartDrawerBoosters() {



    try {
        const response = await fetch(`${localUrl}/getAllPublishBooster?shop=${shop}&type=cart-page`, {
            headers
        })
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        const data = await response.json()


        return data.data

    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }

}

// Product Page Publish Booster  Api Call Function 
async function fetchPublishBoosters() {



    try {
        const response = await fetch(`${localUrl}/getAllPublishBooster?shop=${shop}&type=product-page`, {
            headers
        })
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        const data = await response.json()
        console.log("PublishBooster:", data.data);

        return data.data

    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }

}

// Announcement Bar Publish Booster Api Call Function 
async function fetchPublishAnnouncementBoosters() {


    try {
        const response = await fetch(`${localUrl}/getAllPublishBooster?shop=${shop}&type=announcement`, {
            headers
        })
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        const data = await response.json()

        return data.data

    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}


// Apply Announcement Bar Design Function 
function applyAnnouncementDesign(booster) {
    const banner = document.getElementById(
        "freeShippingBannerAnnouncementBar"
    );
    const container = document.getElementById(
        "containerAnnouncementBar"
    );
    const message = document.getElementById(
        "messagesAnnouncementBar"
    );

    if (!banner || !container || !message || !booster?.design) {
        console.error("Announcement elements/design missing", {
            banner,
            container,
            message,
            design: booster?.design,
        });
        return;
    }

    const design = booster.design;
    const card = design.card ?? {};
    const spacing = card.spacing ?? {};
    const typography = design.typography ?? {};
    const messageStyle = typography.message ?? {};
    const position = design.position ?? {};

    // Outer banner
    banner.style.display = "block";
    banner.style.width = "100%";
    banner.style.boxSizing = "border-box";
    banner.style.position = position.sticky ? "sticky" : "relative";
    banner.style.top =
        position.sticky && position.placement !== "bottom" ? "0" : "auto";
    banner.style.bottom =
        position.sticky && position.placement === "bottom" ? "0" : "auto";
    banner.style.zIndex = position.sticky ? "999" : "auto";

    // Inner container layout
    container.style.display = "block";
    container.style.width = "100%";
    container.style.boxSizing = "border-box";
    container.style.margin =
        `${spacing.outsideTop ?? 0}px 0 ${spacing.outsideBottom ?? 0}px`;
    container.style.padding =
        `${spacing.insideTop ?? 10}px 0 ${spacing.insideBottom ?? 10}px`;
    container.style.border =
        `${card.borderSize ?? 0}px solid ${card.borderColor ?? "transparent"}`;
    container.style.borderRadius = `${card.cornerRadius ?? 0}px`;

    // Background
    if (card.backgroundType === "singleColor") {
        container.style.background = card.singleColor ?? "#ffffff";
    } else {
        container.style.background =
            `linear-gradient(${card.gradientAngle ?? 90}deg, ${
                card.gradientStart ?? "#00fff0"
            }, ${card.gradientEnd ?? "#d285ff"})`;
    }

    // Message typography
    message.style.display = "block";
    message.style.margin = "0";
    message.style.padding = "0";
    message.style.fontFamily =
        typography.font && typography.font !== "theme" ?
        typography.font :
        "inherit";
    message.style.fontSize = `${messageStyle.size ?? 16}px`;
    message.style.color = messageStyle.color ?? "#202223";
    message.style.textAlign = "center";
    message.style.lineHeight = "1.4";
}

// Update Announcement Bar Messages Function 
function updateAnnouncementMessage(cartData, booster) {
    const message = document.getElementById(
        "messagesAnnouncementBar"
    );

    if (!message || !cartData || !booster?.content) return;

    const content = booster.content;
    const goal = Number(content.orderValue ?? 0);

    const cartTotal = Number(cartData.total_price ?? 0) / 100;

    if (cartTotal <= 0) {
        message.textContent = (
            content.startingMessage ??
            "Free shipping for orders over {order-value}!"
        ).replace(
            "{order-value}",
            `$${goal.toFixed(2)}`
        );
    } else if (cartTotal < goal) {
        message.textContent = (
            content.goalProgressMessage ??
            "You're only {order-value-progress} away from free shipping!"
        ).replace(
            "{order-value-progress}",
            `$${(goal - cartTotal).toFixed(2)}`
        );
    } else {
        message.textContent =
            content.successMessage ??
            "Congratulations! You've got free shipping!";
    }
}

// Refresh Announcement Bar Messages Function 
async function refreshAnnouncementMessage() {
    try {
        const cartData = await getCartData();
        const announcementBoosters =
            await fetchPublishAnnouncementBoosters();

        const booster = announcementBoosters?.find(
            (item) =>
            item.status === "published" &&
            item.type === "announcement" &&
            item.placement?.type === "all-pages"
        );

        if (booster) {
            updateAnnouncementMessage(cartData, booster);
        }
    } catch (error) {
        console.error("Failed to refresh announcement:", error);
    }
}

// Mounting Cart Drawer Booster Function 
function mountCartDrawerBooster(booster) {
    const cartDrawerBody =
        document.querySelector(".drawer__footer");

    if (!cartDrawerBody) {
        return false;
    }

    if (!cartDrawerBanner) {
        cartDrawerBanner = document.getElementById(
            "freeShippingBannerCartDrawer"
        );
    }

    if (!cartDrawerBanner) {
        console.log("Cart drawer banner not found");
        return false;
    }

    if (!cartDrawerBody.contains(cartDrawerBanner)) {
        cartDrawerBody.prepend(cartDrawerBanner);
    }

    cartDrawerBanner.style.display = "";

    applyBoosterDesign(booster, "cart");
    updateProgressBar(
        window.currentCartData,
        booster,
        "cart"
    );

    return true;
}

// Mounting Cart Page Booster Function 
function mountCartPageBooster(booster) {
    const cartPageBody =
        document.getElementsByTagName("cart-items")[0];

    if (!cartPageBody) {
        console.log("Cart page target not found");
        return false;
    }

    if (!cartPageBanner) {
        cartPageBanner = document.getElementById(
            "freeShippingBannerCartPage"
        );
    }

    if (!cartPageBanner) {
        console.log("Cart page banner not found");
        return false;
    }

    if (!cartPageBody.contains(cartPageBanner)) {
        cartPageBody.prepend(
            cartPageBanner
        );
    }

    cartPageBanner.style.display = "";

    applyBoosterDesign(booster, "cart-page");
    updateProgressBar(
        window.currentCartData,
        booster,
        "cart-page"
    );

    return true;
}

// Remount Cart Booster Function 
async function remountCartBooster(booster, attempts = 5) {
    for (let i = 0; i < attempts; i++) {

        const mounted = mountCartDrawerBooster(booster);

        if (mounted) {
            return true;
        }

        await new Promise((resolve) =>
            setTimeout(resolve, 100)
        );
    }

    console.log("Could not mount cart booster");

    return false;
}



// Mount Annoucement Bar Function 
function mountAnnouncementBar(booster) {
    const banner = document.getElementById(
        "freeShippingBannerAnnouncementBar"
    );

    const message = document.getElementById(
        "messagesAnnouncementBar"
    );

    if (!banner || !message || !booster) {
        console.error("Announcement elements or booster not found", {
            banner,
            message,
            booster,
        });
        return false;
    }



    // Apply styles before displaying the banner.
    applyAnnouncementDesign(booster);

    // For now, show on all pages.
    document.body.prepend(banner);
    banner.style.display = "block";


    return true;
}

// Refresh Booster Function 
async function refreshBooster() {
    const cartData = await getCartData();


    const announcementBoosters =
        await fetchPublishAnnouncementBoosters();

    const announcementBooster = announcementBoosters?.find(
        (item) =>
        item.status === "published" &&
        item.type === "announcement" &&
        item.placement?.type === "all-pages"
    );

    if (announcementBooster) {
        updateAnnouncementMessage(cartData, announcementBooster);
    }


    const boosters = await fetchPublishBoosters();
    const cartBoosters = await fetchPublishCartDrawerBoosters();

    const booster = boosters?. [0];
    const cartBooster = cartBoosters?. [0];

    // Handle cart drawer and cart page booster.

    if (await shouldShowCartBooster(cartBooster, cartData)) {
        if (await canDisplayBanner(cartBooster, "cart-drawer")) {
            const drawerMounted = await remountCartBooster(cartBooster);

            if (drawerMounted) {
                updateProgressBar(cartData, cartBooster, "cart");
            }
        } else if (cartDrawerBanner) {
            cartDrawerBanner.style.display = "none";
        }

        if (await canDisplayBanner(cartBooster, "cart-page")) {
            const pageMounted = mountCartPageBooster(cartBooster);

            if (pageMounted) {
                updateProgressBar(cartData, cartBooster, "cart-page");
            }
        } else if (cartPageBanner) {
            cartPageBanner.style.display = "none";
        }
    } else {
        if (cartDrawerBanner) cartDrawerBanner.style.display = "none";
        if (cartPageBanner) cartPageBanner.style.display = "none";
    }


    // Keep product booster logic independent.
    if (booster) {
        updateProgressBar(
            cartData,
            booster,
            "product"
        );
    }
}

// Update Progress Bar Function 
function updateProgressBar(
    cartData,
    booster,
    type = "product"
) {
    const isCart = type === "cart";
    const isCartPage = type === "cart-page";

    const progressBar = document.getElementById(
        isCart ?
        "progressBarCartDrawer" :
        isCartPage ?
        "progressBarCartPage" :
        "progressBar"
    );

    const messages = document.getElementById(
        isCart ?
        "messagesCartDrawer" :
        isCartPage ?
        "messagesCartPage" :
        "messages"
    );

    if (!cartData || !booster || !progressBar || !messages) {
        return;
    }

    const cartTotal = cartData.total_price / 100;
    const goal = booster.content.orderValue;

    let percentage;

    if (cartTotal <= 0) {
        percentage = 0;

        messages.innerText =
            booster.content.startingMessage.replace(
                "{order-value}",
                `$${goal}`
            );

    } else if (cartTotal < goal) {
        percentage = (cartTotal / goal) * 100;

        const remaining = goal - cartTotal;

        messages.innerText =
            booster.content.goalProgressMessage.replace(
                "{order-value-progress}",
                `$${remaining.toFixed(2)}`
            );

    } else {
        percentage = 100;

        messages.innerText =
            booster.content.successMessage;
    }

    progressBar.style.width = `${percentage}%`;
}

window.addEventListener("SCE:add", async function (event) {
    console.log("Cart add");
    await refreshAnnouncementMessage();
    await refreshBooster();
});

window.addEventListener("SCE:update", async function (event) {
    console.log("Cart update");
    await refreshAnnouncementMessage();
    await refreshBooster();
});

window.addEventListener("SCE:clear", async function (event) {
    console.log("Cart cleared");
    await refreshAnnouncementMessage();
    await refreshBooster();
});

window.addEventListener("SCE:change", async function (event) {
    console.log("Cart changed ");
    await refreshAnnouncementMessage();

    await refreshBooster();

});