# Bespoke Learn pre-launch SEO review

Reviewed: 2 August 2026

## Verified in source and automated tests

- Learn-host requests use clean canonical paths and redirect internal `/learn/*`
  implementation URLs from the main website host.
- Metadata uses `https://learn.bespoketech.com.ng` as the Learn canonical
  origin. Public course pages add a conservative `Course` structured-data
  record using only published course title, summary and publisher facts.
- `robots.txt` excludes sign-in, dashboard, protected lesson routes and APIs.
- `sitemap.xml` includes Learn home, catalogue, support, and only dynamically
  published course detail pages.
- The empty catalogue has clear indexable copy but makes no course, learner,
  accreditation, price, rating, outcome or social-proof claim.
- Search input state is URL-based (`?q=`); empty search results are explicit.

## Release checks still required

- Attach and verify the Learn hostname, TLS and canonical response before
  requesting indexing. This repository change does not perform those actions.
- Fetch the deployed `/robots.txt`, `/sitemap.xml`, home, catalogue and one
  published course detail URL with the final host header.
- Run a live crawl and Search Console property verification only after an
  approved course is published. Do not submit an empty catalogue as proof of
  course availability.
- Re-run mobile/browser and accessibility checks after the first reviewed
  course introduces real titles, descriptions, assets and media transcripts.
