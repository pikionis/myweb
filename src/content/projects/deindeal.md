---
# Engineering work, not a design showcase: its card shows the figure and the scope instead of a picture.
title: "DeinDeal"
summary: "Marketplace engineering for a large Swiss online marketplace: small suppliers connected to major European marketplaces."
# draft, written only from the facts on the E-commerce sheet: rewrite freely
blurb: "The bridge between small suppliers and the big European marketplaces: product feeds, category matching, pricing, orders and stock sync, running at 800K+ products a day."
services: [commerce]
tags: ["Feeds", "Integrations", "Category matching"]
# from the work that used to be listed on its own (the AI product, Channable ops): confirm
stack: ["LLMs", "React", "Channable"]
url: "https://deindeal.ch"
metric: { value: "800K+", label: "products a day" }
scope: ["Product feeds", "Marketplace integrations", "Category matching", "Pricing", "Orders & stock sync"]
order: 2
---

<!-- draft, from the DeinDeal chapter of My story and the work that used to be listed on its own
     (category matching, the Galaxus integration, Channable ops, the medallion pipeline, the AI product): rewrite freely -->

## The other side of the counter

For years I helped small e-shops get their products onto big marketplaces. At DeinDeal, a large Swiss online marketplace, I switched sides: I became the one onboarding them.

## Every partner, every format

I built the integrations: every partner, every format (XML, CSV, JSON, FTP, SFTP, API), every feed, connected end to end. Among them the Galaxus integration, with AI category matching, and the feed orchestration in Channable: deduplication and pricing rules, automated.

## 800,000+ products, every day

I was responsible for more than 800,000 unique product codes. To make them manageable I built an internal AI product from scratch, on a medallion pipeline (ingest, map, validate): it filters the data, fixes it and translates it into four languages, with structured JSON outputs, multi-model routing and content-hash caching.

The result: 800,000+ products refreshed daily, ready for the marketplace, no spreadsheets. And somewhere in there, Feedgenix was born.

The whole story is a chapter of [My story](/about).
