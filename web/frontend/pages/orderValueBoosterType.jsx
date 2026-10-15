import React from 'react'
import { useNavigate } from 'react-router-dom';

const OrderValueBoosterType = () => {
    const navigate = useNavigate();

    const cardsContent = [
        {
            id: 1,
            title: "Product page",
            subtitle: "Block in product page below add to cart button.",
            imageUrl: "https://freeshipping-essential-apps.uk/product_page.svg",
            href: "/item?type=product-page"

        },
        {
            id: 2,
            title: "Cart page",
            subtitle: "Add order value booster block to cart page.",
            imageUrl: "https://freeshipping-essential-apps.uk/cart_page.svg",
            href: "/item?type=cart-page"


        },
        {
            id: 3,
            title: "Announcement",
            subtitle: "Fixed or sticky bar on the top or the bottom of any page.",
            imageUrl: "https://freeshipping-essential-apps.uk/bar.svg",
            href: "/item?type=announcement"


        },
    ]
    return (
        <s-page heading="Essential Free Shipping">
            <s-stack display="flex" direction="block" gap="base" padding="base" >

                <s-stack display="flex" direction="block" padding="none" >
                    <s-stack display="flex" direction="inline" gap="base" alignItems="center">
                        <s-button variant="tertiary" >

                            <s-icon type="arrow-left" onClick={() => navigate('/orderValueBooster')} />
                        </s-button>
                        <s-heading fontSize="large-200">Choose order value booster type</s-heading>
                    </s-stack>


                </s-stack>
                <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
                    {
                        cardsContent.map((content) => (
                            <s-section key={content.id}>
                                <s-stack display="flex" direction="block" justifyContent="space-between" alignItems="center" gap="base" >
                                    <s-image
                                        src={content.imageUrl}
                                        alt={content.title}
                                        aspectRatio="3/2"
                                        objectFit="cover"
                                        borderRadius="base"
                                        inlineSize="fill"
                                    />
                                    <s-stack display="flex" direction="block" justifyContent="space-between" alignItems="start" gap="base">
                                        <s-paragraph fontWeight="bold" fontSize="large" >{content.title}</s-paragraph>
                                        <s-text fontSize="small-100">{content.subtitle}</s-text>
                                    </s-stack>

                                    <s-button inlineSize="fill" href={content.href}>Select this booster type</s-button>
                                </s-stack>

                            </s-section>
                        ))
                    }
                </s-grid>
            </s-stack>
        </s-page>
    )
}

export default OrderValueBoosterType
