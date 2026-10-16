# Seed images

Demo catalog images referenced by `supabase/seed.sql` (`shops.banner_url` →
`/seed/banners/<slug>.jpg`, `products.image_url` → `/seed/products/<slug>-<n>.jpg`).

- **Source:** freely-licensed photos from **Wikimedia Commons** (CC BY / CC BY-SA / CC0 /
  public domain), with a Lorem Picsum fallback for any lookup that failed. `ATTRIBUTION.json`
  records the first-pass source page + license for each file (best-effort; a handful of files
  were re-fetched during curation, so titles there may be approximate).
- **Processing:** re-encoded to JPEG, max 1024px on the long edge, quality 65 (~97 KB average,
  ~3.6 MB total).
- **Replacing:** sellers normally upload banners/photos in-app (buckets `shop-banners`,
  `product-images`). Replacing a file here just swaps what the demo shows; the DB path stays.

These are demo placeholders — swap them for real shop photos before any real launch.
