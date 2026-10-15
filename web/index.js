import "dotenv/config";
import cors from 'cors'
import {
  join
} from "path";
import {
  readFileSync
} from "fs";
import express, {
  response
} from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import {
  error
} from "console";
import productRoutes from './routes/productRoute.js'
import orderRoutes from './routes/orderRoute.js'
import boosterRoutes from './routes/boosterRoute.js'
import planRoutes from './routes/plansRoute.js'
// import {
//   startProductSyncWorker
// } from "./workers/product-sync.worker.js";
import {
  getPublishBoosters
} from "./controller/boosterController.js";
import {
  refreshShopSession
} from "./utils/refresh-session.js";
import {
  ensureFreePlan
} from "./repositories/subscription.repository.js";
import {
  recordBannerView
} from "./controller/creditController.js";
import {
  addProductSyncJob
} from "./add-product-sync-job.js";
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production" ?
  `${process.cwd()}/frontend/dist` :
  `${process.cwd()}/frontend/`;

const app = express();
app.use(cors({
  origin: [
    "https://testing-stores-development.myshopify.com"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ]
}));
// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
      try {
        const session = res.locals.shopify?.session;

        if (!session?.shop) {
          throw new Error(
            "Shopify session not found after authentication"
          );
        }

        await ensureFreePlan(session.shop);
        addProductSyncJob();


        next();
      } catch (error) {
        next(error);
      }
    },
    shopify.redirectToShopifyOrAppRoot(),

);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({
    webhookHandlers: PrivacyWebhookHandlers
  })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api", shopify.validateAuthenticatedSession());

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/boosters", boosterRoutes)
app.use('/api/subscription', planRoutes)


app.post("/creditsBannerView", recordBannerView);
app.get('/getAllPublishBooster', getPublishBoosters)

// startProductSyncWorker(shopify);
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, {
  index: false
}));


app.use("/api", async (req, _res, next) => {

  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?. [1];

  if (bearer) {

    try {

      const payload = await shopify.api.session.decodeSessionToken(bearer);

      const shop = shopify.api.utils.sanitizeShop(new URL(payload.dest).hostname);

      if (shop) await refreshShopSession(shop);

    } catch (e) {

      console.warn("[tokens] api refresh skipped:", e?.message || e);

    }

  }

  next();

});



app.use("/", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
      .toString()
      .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);