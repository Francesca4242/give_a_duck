# 🦆 I Don't Give a Duck

Silly, slightly filthy party games for a whole flock. One phone, pass it round, lots of cartoon ducks.

Installable on iPhone and Android (it's a PWA), works offline once loaded, no accounts, no server state.

## The games

| Game | Ducks | What happens |
|---|---|---|
| **Duck in a Hat** | 4+ | The hat game. Everyone writes words (or use the Duck Deck), then teams play three rounds with the same words: *Describe It*, *One Word Wonder*, *Quack Charades*. |
| **Scrawl-ack** | 3+ | Drawing telephone. Write → draw → guess → draw… then a step-by-step Big Reveal. |
| **Duck Duck Goose** | 4+ | Everyone sees the secret word except the Goose, who only gets the category. One-word clues, then vote out the Goose. If they're caught, the Goose can still steal the win by guessing the word. |
| **Pecking Order** | 3+ | One Top Duck secretly ranks five things from love to loathe. The flock guesses the order. |
| **Quackers** | 2+ | Card deck of *Most likely to…*, *Never have I ever…*, *Would you rather…* and *Fowl Play* dares. |

A **🧼 Clean / 🍑 Cheeky** switch on the home screen controls how rude the content gets. All the words live in [`public/js/content.js`](public/js/content.js). Add your own there.

## Install on a phone

- **iPhone (Safari):** open the site, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** tap the **Install** banner on the home screen, or ⋮ menu → **Install app**.

## Deploying (Cloudflare Workers)

The app is plain static files in `public/`, served by a Cloudflare Worker with static assets (`wrangler.jsonc`).

GitHub Actions deploys automatically on every push to `main` (and you can run it by hand from the Actions tab). The workflow needs two **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → *Create Token* → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → Account ID (right-hand sidebar) |

The site goes live at `https://give-a-duck.<your-subdomain>.workers.dev`. Add a custom domain in the Cloudflare dashboard if you like.

When you change files, bump `VERSION` in `public/sw.js` so installed phones pick up the update.

## Running locally

```bash
npm run dev
```

Or any static server, e.g. `cd public && python3 -m http.server`.

## Tech

No framework, no build step. Vanilla JS, ducks drawn as SVG in code (`public/js/duck.js`), and quacks synthesised with the Web Audio API (`public/js/ui.js`).
