<p align="center">
  <img src="public/titlianime-logo.png" alt="TitliAnime" width="120" />
</p>

<h1 align="center">TitliAnime</h1>

<p align="center">A modern anime streaming and tracking platform.</p>

---

## About

TitliAnime is a full-featured anime streaming site powered by a **remodeled version of the Miruro scraper** that I built myself. It aggregates episode sources, streams them via HLS, and syncs your progress with MyAnimeList and AniList.

## Features

- **Stream anime** — Sub and Dub support with automatic provider fallback
- **MAL & AniList login** — Sign in with your existing account to sync watch progress
- **Auto-skip filler episodes** — Filler episodes are marked in the episode list and can be auto-skipped
- **Continue watching** — Pick up right where you left off across devices
- **Explore & discover** — Trending, popular, top-rated, and seasonal anime browsing
- **Top movies** — Curated top-rated anime movies section
- **Airing schedule** — Weekly schedule with countdown timers
- **Episode comments** — Per-episode comment sections powered by Waline
- **Anime news** — Latest news feed from Anime News Network
- **Watch history** — Full local history of everything you've watched
- **Fully responsive** — Desktop sidebar + mobile hamburger menu, works on all screen sizes

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **Tailwind CSS v4**
- **Zustand** for state management
- **HLS.js** for video playback
- **Framer Motion** for animations
- **Waline** for comments
- **AniList GraphQL API** for anime metadata
- **Custom Miruro API** for episode sources and streaming
