# Turtle Biz

A playful static storefront and arcade for Turtle Biz. The 2026 refresh uses the existing 14-product catalog, original product artwork, music, founder details, and contact address.

## Run the website

Serve this directory with any static HTTP server. For example:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. No application install or bundler is required. The chat loads the Firebase browser SDK from Google’s CDN when its section approaches the viewport. Relative URLs support hosting beneath the /TurtleBiz/ path.

## What changed

- A shared cream, forest-green, citrus and terracotta visual system across ten pages.
- Responsive navigation, original product imagery, product previews, saved favourites, search, category filters and price/name sorting.
- One catalog in `scripts/catalog.js`, integer-cent totals, bounded quantities, cross-tab updates, and migration of the old `cart` key.
- The previous homepage cap price mismatch is corrected using the shop's $24.99 AUD price.
- Working email order enquiries and copyable summaries replace the previous checkout alert. The website does not take payment or claim an order is confirmed.
- An interactive turtle physics pond, three-track radio, and Shell Sprint: a 30-second, keyboard/touch arcade game with pause, restart and a locally saved best score.
- The original `Turtle Blitz.html` is preserved and linked from the arcade. The unrelated `RatDiscovery.html` is untouched.
- Reduced-motion support, a persistent motion switch, visible keyboard focus, native dialogs, status messages, automatic game pausing and capped canvas pixel density.
- Footer year follows the current year.

## Content and integrations

Products, existing prices and original image paths are in `scripts/catalog.js`. Prices are presented as AUD for this South Australian storefront. Product copy does not promise stock, delivery times or unverified product specifications.

The contact email remains `guihlemturtlebiz@gmail.com`. Contact forms open the visitor's email app; no message is sent by the website itself. There is no order database, payment processor or newsletter endpoint.

Turtle Chat is restored on the homepage below the radio. The original public web configuration was recovered from commit `b16eb0a`; it connects to the same `turtle-biz` Firebase project, default Firestore database and `chats` collection. A read-only check found 32 original messages before this update. No existing documents, IDs, text, timestamps or database rules are rewritten or deleted. New messages append the original `{ text, timestamp }` schema with a server timestamp and the original 150-character limit. Analytics is not initialized.

The SDK is pinned to 12.19.0 and loads only near the chat. The listener pauses offscreen or while the tab is hidden, except while a send is pending. The collection is sorted locally so legacy messages missing a timestamp remain accessible. Forty messages render initially, with earlier messages available on demand. New arrivals preserve the reader’s position. Drafts survive reloads in session storage; failed sends retain the draft and duplicate submission is blocked while awaiting acknowledgement. Incoming text is rendered as text, never HTML. The public interface provides no deletion controls.

Existing policy text and its original dates have been retained, with a factual note explaining how the current storefront behaves. This is a visual and functional website update, not a review of the business's policies. Donation claims and payment-method claims without a working supporting integration are not used in new marketing or help content.

Google Fonts supplies Space Grotesk and DM Sans, with system fallbacks. Music requests begin only on user interaction. Product images load lazily except the hero. Canvas animations stop when inactive or offscreen; the pond is capped at 12 turtles. Cart/favourites continue in memory when browser storage is blocked.

## Verification

```sh
npm install --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

The workflow checks local links, catalog references, JavaScript syntax, cart/state behavior, browser flows, and serious/critical axe accessibility findings. It exercises desktop, 390px and 320px layouts under a /TurtleBiz/ base path and produces desktop/mobile screenshot artifacts.

Browser tests cover filtering, sorting, favourites, dialogs, cart edits/persistence, legacy and corrupt storage, email enquiry URLs, mobile navigation, motion preferences, pond controls, and a complete deterministic arcade round. Chat checks use an intercepted adapter for sending, failures, legacy history, safe rendering, reconnects and draft persistence; no test messages are posted to the public conversation. An opt-in live check reads the real conversation without writing.

## Design reference

Tuch et al. (2012), “The role of visual complexity and prototypicality regarding first impression of websites,” *International Journal of Human–Computer Studies*, 70(11), 794–811. DOI: [10.1016/j.ijhcs.2012.06.003](https://doi.org/10.1016/j.ijhcs.2012.06.003).

Credibility: **8/10** — peer-reviewed controlled studies, useful for first-impression principles; static screenshot experiments are not a performance or conversion guarantee for this site. The refresh applies the principle through clear navigation and product hierarchy, with optional play areas.

## Image delivery

All 14 catalog images and both team images use committed WebP copies in `images/optimized/`. The hero retains 1024-pixel detail; other copies are 640 pixels wide or smaller. Originals remain at their original paths. The 16 delivery images total 823196 bytes, compared with 15080635 bytes of source art — a 94.5% reduction.
