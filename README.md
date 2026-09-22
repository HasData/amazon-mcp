# Amazon MCP Server

<!-- mcp-name: com.hasdata/amazon -->

A hosted Model Context Protocol (MCP) server that gives Claude, Cursor, Windsurf and any other MCP client four read-only Amazon tools. Run a keyword search, read one product by its ASIN, look up a seller, and page through what that seller stocks, all as structured JSON, with no Amazon developer account and nothing to host.

It reads public Amazon pages that a signed-out visitor can see, on any of the 23 regional domains.

**1,000 free credits every month, no card required**, which is 200 Amazon calls at the 5-credit rate.

```
https://mcp.hasdata.com/api/mcp?apis=amazon
```

[![Glama score](https://glama.ai/mcp/servers/HasData/amazon-mcp/badges/score.svg)](https://glama.ai/mcp/servers/HasData/amazon-mcp)
[![tool contract](https://github.com/HasData/amazon-mcp/actions/workflows/contract.yml/badge.svg)](https://github.com/HasData/amazon-mcp/actions/workflows/contract.yml)
[![MCP](https://img.shields.io/badge/MCP-remote%20%7C%20streamable%20HTTP-6366f1?style=flat-square)](https://mcp.hasdata.com/api/mcp?apis=amazon)
[![Tools](https://img.shields.io/badge/tools-4-10b981?style=flat-square)](#tools)
[![npm](https://img.shields.io/npm/v/@hasdata/amazon-mcp?style=flat-square&logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@hasdata/amazon-mcp)
[![PyPI](https://img.shields.io/pypi/v/hasdata-amazon-mcp?style=flat-square&logo=pypi&logoColor=white&label=PyPI&color=3775a9)](https://pypi.org/project/hasdata-amazon-mcp/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Contents

- [What you need](#what-you-need)
- [Quick start](#quick-start)
- [Example prompts](#example-prompts)
- [Tools](#tools)
- [Errors and failure paths](#errors-and-failure-paths)
- [Pricing, free tier and limits](#pricing-free-tier-and-limits)
- [Tool selection](#tool-selection)
- [How it compares](#how-it-compares)
- [FAQ](#faq)
- [HasData links](#hasdata-links)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## What you need

An MCP client and a HasData API key from the [dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp), free to create with no card, and the free tier covers about 200 calls a month at the 5-credit rate. This is a remote server, so the simplest path is a URL and an `x-api-key` header, with no container to run. A client that only speaks stdio reaches it through a thin launcher, published as `@hasdata/amazon-mcp` on npm and `hasdata-amazon-mcp` on PyPI, shown below.

## Quick start

The server URL is the same for every client. We run it hands-on in Claude Code and Claude Desktop. The other blocks follow each client's own documented format for a remote server.

| Field | Value |
| :--- | :--- |
| URL | `https://mcp.hasdata.com/api/mcp?apis=amazon` |
| Transport | HTTP, streamable |
| Auth header | `x-api-key: HASDATA_API_KEY` |

Clients with OAuth support can add the same URL as a connector and sign in without putting a key in a config file.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http amazon "https://mcp.hasdata.com/api/mcp?apis=amazon" \
  --header "x-api-key: HASDATA_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Settings, then Connectors, then Add custom connector, then paste `https://mcp.hasdata.com/api/mcp?apis=amazon` and sign in.

For the config-file route, Claude Desktop loads only local (stdio) servers, so it reaches a remote server through a stdio launcher. The `@hasdata/amazon-mcp` package is that launcher, and it reads the key from the environment. Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amazon": {
      "command": "npx",
      "args": ["-y", "@hasdata/amazon-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

For Python instead of Node, swap the launcher for the PyPI package, which `uvx` runs without a manual install:

```json
{
  "mcpServers": {
    "amazon": {
      "command": "uvx",
      "args": ["hasdata-amazon-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` for one:

```json
{
  "mcpServers": {
    "amazon": {
      "url": "https://mcp.hasdata.com/api/mcp?apis=amazon",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`~/.codeium/windsurf/mcp_config.json`. Windsurf calls the field `serverUrl`, not `url`:

```json
{
  "mcpServers": {
    "amazon": {
      "serverUrl": "https://mcp.hasdata.com/api/mcp?apis=amazon",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "amazon": {
      "type": "http",
      "url": "https://mcp.hasdata.com/api/mcp?apis=amazon",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

## Example prompts

Each of these lands on one tool, or on two in sequence when the second needs an identifier the first returns.

- Find laptop stands under $40 on Amazon and sort them by average customer review.
- What does ASIN B0DHJ7SBDR cost right now, and how many other sellers offer it?
- Compare the price of this ASIN on amazon.com and amazon.de.
- Who is the seller behind ASIN B0DHJ7SBDR, and what is their lifetime rating?
- Page through everything seller ATQQBVXK188KS stocks and pull out the discounted items.
- Search for wireless earbuds with delivery to 10001 and tell me which arrive fastest.

A prompt that names a product rather than an ASIN takes two calls, one search to resolve the ASIN and one product lookup to read it. A prompt that names a seller by brand rather than by seller ID takes the same shape, one product lookup to find the seller ID and one seller lookup to read the profile.

## Tools

| Tool | What it returns |
| --- | --- |
| `hasdata_amazon_product_getProductDetails` | Title, brand, current/list/deal price, currency, availability, Buy Box seller, Prime eligibility, bullet points, A+ description, rating and review count, images,…. 5 credits a call |
| `hasdata_amazon_reviews_getProductReviews` | Per-review title, body, star rating, author name and profile, review date, country, verified-purchase flag, helpful-vote count, variant/format attributes, and attached…. 5 credits a call |
| `hasdata_amazon_search_getSearchResults` | The organic results list with ASIN, title, thumbnail, product URL, price and list price, currency, star rating, review count, Prime/sponsored flags, and position, plus…. 5 credits a call |
| `hasdata_amazon_seller_getSellerDetails` | Business name, seller logo, About-this-seller text, overall feedback rating and lifetime/12-month/90-day/30-day rating breakdown, feedback count, business address and…. 5 credits a call |
| `hasdata_amazon_seller_products_getSellerProducts` | Each product row with ASIN, title, image, product URL, price and list price, currency, star rating, review count, and Prime flag. 5 credits a call |

Five tools, 5 credits per successful call. Every tool accepts `domain` to switch marketplace, one of 23 values, `www.amazon.com` through the European, Asian and other regional marketplaces, and `language` where the marketplace offers more than one.

### Get Amazon search results

[`hasdata_amazon_search_getSearchResults`](https://docs.hasdata.com/apis/amazon/search?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)

A page of search results for a keyword.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `q` | string | yes | The search term |
| `domain` | string | | Marketplace, defaults to `www.amazon.com` |
| `page` | number | | Result page, starting at 1 |
| `sortBy` | string | | `featured`, `priceLowToHigh`, `priceHighToLow`, `avgCustomerReview`, `newestArrivals` or `bestSellers` |
| `deliveryZip` | string | | Postal code, which changes availability and delivery dates |
| `shippingLocation` | string | | Two-letter country code for the delivery address |
| `language` | string | | Marketplace language code |

Returns `productResults`, an `ads` array of sponsored placements, and `pagination` with `totalResults`, `currentPage`, `nextPageUrl` and `otherPageUrls`. Each result carries `position`, `asin`, `title`, `url`, `isSponsored`, a `price` object, `image`, `reviews` with `rating` and `totalReviews`, a `badges` object, `boughtInPastMonth` and `deliveryInfo`.

> A search result is deliberately thin. Brand, features, variants, images and the seller are not here, they come from the product tool below. Resolve the ASIN first, then read the product.

```json
{
  "position": 1,
  "asin": "B077B9W343",
  "title": "Nulaxy Ergonomic Adjustable Laptop Stand for Desk, Dual Foldable Computer Riser...",
  "isSponsored": false,
  "price": { "symbol": "$", "currentPrice": 15.99, "beforePrice": 17.99 },
  "image": "https://m.media-amazon.com/images/I/61jtA8kHq9L.jpg",
  "reviews": { "totalReviews": 16800, "rating": 4.7 },
  "badges": { "amazonChoice": true, "amazonPrime": false, "bestSeller": false },
  "boughtInPastMonth": "10K+",
  "deliveryInfo": { "freeDelivery": "Join Prime", "fastestDelivery": "Mon, Sep 14" },
  "url": "https://www.amazon.com/dp/B077B9W343"
}
```

### Get Amazon product details

[`hasdata_amazon_product_getProductDetails`](https://docs.hasdata.com/apis/amazon/product?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)

One product in full, by its ASIN.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `asin` | string | yes | The Amazon Standard Identification Number |
| `domain` | string | | Marketplace, defaults to `www.amazon.com` |
| `otherSellers` | boolean | | Also collect competing offers. Costs 5 credits on top of the base, 10 instead of 5 |
| `deliveryZip` | string | | Postal code, which changes availability and delivery dates |
| `shippingLocation` | string | | Two-letter country code for the delivery address |
| `language` | string | | Marketplace language code |

Returns a `product` object with `asin`, `url`, `title`, `brand`, `isAvailable`, `condition`, a `price` object, `primaryFeatures` and a wider `features` map, `featureBullets`, `description`, `variants`, `breadcrumbs`, `whatIsInTheBox`, image and video collections, `specification`, `reviewsInfo`, the delivery estimates, and the current `seller` with `sellerUrl`.

The `price` object holds `currentPrice`, `beforePrice` when the item is discounted, `discount`, `priceFrom` and `otherOfferQuantity`. That last field is a count of competing offers, which the base call reports without fetching them. Ask for `otherSellers` only when the offers themselves are needed, because it doubles the price of the call.

```json
{
  "asin": "B0DHJ7SBDR",
  "title": "Apple iPhone 16 Pro Max, 1TB, Desert Titanium",
  "brand": "Apple",
  "condition": "Refurbished - Excellent",
  "price": {
    "symbol": "$",
    "currentPrice": 974,
    "beforePrice": 949.99,
    "discount": "-11%",
    "otherOfferQuantity": 11
  },
  "seller": "WirelessSource",
  "deliveryIsoDate": "2026-09-11T00:00:00.000Z"
}
```

### Get Amazon seller details

[`hasdata_amazon_seller_getSellerDetails`](https://docs.hasdata.com/apis/amazon/seller?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)

The public storefront profile of one seller.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `sellerId` | string | yes | The seller ID, which a product response returns in `sellerUrl` |
| `domain` | string | | Marketplace, defaults to `www.amazon.com` |
| `language` | string | | Marketplace language code |

Returns a `seller` object with `sellerId`, `url`, `storefrontUrl`, `name`, `businessName`, `businessAddress`, an `about` block, and four rating windows named `oneMonthRatings`, `threeMonthRatings`, `twelveMonthRating` and `lifetimeRating`. Each window carries `totalVotes`, `averageRating` and a per-star breakdown with both `votes` and `percent`.

The four windows are what make this tool worth a call. A lifetime average of 4.5 over 2,701 votes and a one-month average of 2 over 4 votes describe very different sellers, and only the pair shows a decline in progress.

```json
{
  "sellerId": "ATQQBVXK188KS",
  "name": "Expercom - Apple Premier Partner",
  "businessName": "Expercom of Utah, Inc",
  "lifetimeRating": { "totalVotes": 2701, "averageRating": 4.5 },
  "oneMonthRatings": { "totalVotes": 4, "averageRating": 2 }
}
```

### Get Amazon seller products

[`hasdata_amazon_seller_products_getSellerProducts`](https://docs.hasdata.com/apis/amazon/seller-products?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)

A page of what one seller stocks.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `sellerId` | string | yes | The seller ID |
| `domain` | string | | Marketplace, defaults to `www.amazon.com` |
| `page` | number | | Result page, starting at 1 |
| `language` | string | | Marketplace language code |

Returns `productResults` and `pagination`, shaped like the search tool's output. Each item carries `position`, `asin`, `title`, `url`, `price`, `image`, `reviews`, `badges`, `boughtInPastMonth`, `deliveryInfo` and `colorUrls`. Walk `pagination` to reach the rest of the catalogue rather than guessing page numbers.

## Errors and failure paths

Plan for these rather than assuming a happy path.

**A search with no matches returns a successful result with an empty `productResults` array**, not an error. `requestMetadata.status` is still `ok`. Test the array length before iterating.

**An ASIN that does not exist on the chosen marketplace answers with an error, not an empty product.** The same ASIN often exists on one domain and not another, so a failure on `www.amazon.de` does not mean the ASIN is wrong.

**A seller ID is marketplace-scoped too.** The ID that a product on `www.amazon.com` returns will not resolve on another domain.

**A price can be absent from a live listing.** Items that are out of stock, sold only through other sellers, or gated behind a promotion come back without a usable `currentPrice`. Read `isAvailable` before you compare prices.

**`deliveryZip` and `shippingLocation` change the answer, not just the delivery line.** Availability, price and the seller mix all shift with the destination, so a comparison across postcodes has to hold every other parameter still.

Results that carry data also carry a `requestMetadata.id` worth quoting in support.

## Pricing, free tier and limits

Each Amazon tool costs **5 credits per successful call**. Turning on `otherSellers` adds 5 credits to the product call, 10 instead of 5, so leave it off unless the competing offers are the point. Response size does not change the price.

The free tier is **1,000 credits every month with no card**, which is 200 Amazon calls at the base rate. It renews with the billing cycle, so a low-volume agent runs on the free tier indefinitely.

Paid plans start at **$59 a month** for 200,000 credits, which is 40,000 calls. The unit price falls with volume, from **$1.48 per 1,000 calls** on the entry plan to **$0.60** on Basic and **$0.41** across the Growth tiers. Current figures live on the [pricing page](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp).

Your plan also sets concurrency. The free tier allows 1 request at a time, Startup 5, Basic 15, and the Growth tiers run from 50 to 500. Retry on the 429 with a backoff in anything unattended, because an agent that fans out across ASINs will reach the ceiling before you do.

A request that comes back non-200 is not billed. A successful call that finds nothing is still a call.

## Tool selection

Two rules cover most of it.

Start from what the prompt gives you. A keyword goes to the search tool, an ASIN goes straight to the product tool, and a seller ID goes to one of the two seller tools. Spending a search call to reach an ASIN you already have is the most common waste.

Then pick by depth. The search and seller-products tools return the same thin item shape, good for ranking, filtering and price sweeps across many products. The product tool is the only one that returns brand, features, variants, images and the seller, and it is the only one worth calling when the question is about a single item.

## How it compares

Amazon's own Product Advertising API is the official route to this data, and it is a different instrument.

| | Product Advertising API | This server |
| :--- | :--- | :--- |
| Eligibility | An approved Associates account with qualifying sales | An API key |
| Setup | Associates signup, tag, request signing | One header |
| Scope | Items you are approved to advertise | Any public listing page |
| Seller storefronts | Not returned | Two dedicated tools |
| Search sorting | Limited set | The six orders Amazon shows a shopper |
| Cost | Free, when you qualify | Paid past the free tier, 5 credits a call |

The row that decides it is eligibility. The Product Advertising API is built for affiliates and its access depends on sales you have already made, which rules it out for research, monitoring and anything an agent does on your behalf. When you do qualify and only need advertisable items, the official API is the better fit.

## FAQ

### Is there an official Amazon MCP server?

Amazon does not publish one. This one is maintained by HasData and reads public Amazon pages.

### What is an Amazon MCP server?

An MCP server exposes tools an AI client can call. This one turns Amazon search results, product pages and seller storefronts into JSON an agent can reason over, without a browser or a scraping library in your stack.

### Do I need an Amazon account or API key?

No. The only credential is your HasData key.

### Which marketplaces are covered?

All 23 domains the API accepts, from `www.amazon.com` through the European and Asian marketplaces. Pass `domain` to switch. Prices, availability and the seller mix differ per marketplace, so a cross-domain comparison is a real comparison rather than a currency conversion.

### Why does a search result have no brand or features?

Amazon does not put them on the results page. The search tool returns what the page shows, and the product tool returns the item page. That split is the reason the two tools cost the same and return different depths.

### What does `otherOfferQuantity` mean?

The number of other sellers offering the same item, as the product page reports it. It arrives with the base call. The offers themselves need `otherSellers`, which costs 5 credits more.

### Can I use this together with other HasData APIs?

Yes. One key covers everything, and one endpoint serves them all through the `apis` parameter. Point a client at `?apis=amazon,google_serp` to get both tool sets in one connection, or at [`mcp.hasdata.com/api/mcp`](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp) for the full catalogue.

### Is HasData affiliated with Amazon?

No. HasData is an independent service and is not affiliated with, endorsed by, or sponsored by Amazon. Amazon is a trademark of its respective owner. The tools work with publicly available data only, and you are responsible for using the results in line with Amazon's terms and the law that applies to you.

### Compliance and personal data

Seller profiles carry a business name and a business address, which are published by Amazon on the storefront page. Treat them as business records rather than free-form data, and check your own obligations before storing them.

## HasData links

- [Amazon Scraper API](https://hasdata.com/apis/amazon-api?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp), the REST endpoints behind these tools
- [API documentation](https://docs.hasdata.com/apis/amazon/search?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)
- [MCP server documentation](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)
- [Pricing](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)
- [Dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=amazon-mcp)

Other HasData MCP servers: [Google Search](https://github.com/HasData/google-search-mcp), [Google Maps](https://github.com/HasData/google-maps-mcp), [Google Trends](https://github.com/HasData/google-trends-mcp), [Google Flights](https://github.com/HasData/google-flights-mcp), [DuckDuckGo](https://github.com/HasData/duckduckgo-mcp), [YouTube](https://github.com/HasData/youtube-mcp), [TikTok](https://github.com/HasData/tiktok-mcp), [Instagram](https://github.com/HasData/instagram-mcp), [Zillow](https://github.com/HasData/zillow-mcp), [Airbnb](https://github.com/HasData/airbnb-mcp), [Booking.com](https://github.com/HasData/booking-mcp), [Indeed](https://github.com/HasData/indeed-mcp).

## Development

The launcher is a thin stdio bridge to the remote server, so there is nothing to build.

```bash
npm install
HASDATA_API_KEY=your_key_here npm test
```

The tests in `test/` assert the tool contract, the part that can break without a commit here. They check that `?apis=amazon` returns the expected tool count, that no name changed, that every tool still declares its required parameter and carries a description, and that the key in use is actually accepted. That last check calls a tool for real and costs 5 credits, which is the price of a canary that can fail for the right reason.

One more test covers a tool this README does not document. The server also lists a reviews tool whose upstream endpoint is retired and answers with an error, so documenting it would send readers at a dead end. The test pins that state instead of ignoring it, and it fails the day the endpoint returns or the day the server drops the tool, which is when this README needs a decision.

The contract suite also runs weekly on a schedule, because the upstream tool list can change without anyone touching this repository.

## Contributing

A tool table, a response sample or a documented behaviour that does not match reality is worth an issue. There is a template for exactly that. Pull requests are welcome for the same, and for anything in the launcher.

## License

MIT, see [LICENSE](LICENSE).
