---
description: What one Amazon listing looks like to a buyer, and what reviewers complain about
---

Audit a single Amazon product and tell me what a buyer sees.

Ask me for the ASIN and the marketplace if I have not given them. Default to `www.amazon.com` only after saying so.

Then:

1. Call `hasdata_amazon_product_getProductDetails` for the ASIN. Report title, brand, current price, rating, review count, availability and who holds the buy box.
2. Call `hasdata_amazon_reviews_getProductReviews` twice, once with `stars: "critical"` and once with `stars: "positive"`, both with `sortBy: "recent"`.
3. From the critical reviews, pull the complaints that repeat. Group them and say how many reviews each group rests on.
4. From the positive ones, pull what buyers actually praise, in their words.
5. Close with the gap: what the listing promises and what the critical reviews say about it.

If the price is missing from the payload, say the listing carries no price rather than inventing one. If either call comes back empty, report that instead of filling the space.
