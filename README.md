# ⚡ Proof-of-Support (PoS)

> **Your contributions. Verified. On-chain. Forever.**
>
> The Web3 platform where community contributions are tracked, verified, and rewarded — built on Solana.

---

## 🚀 Quick Start

```bash
# 1. Clone / unzip the project
cd proof-of-support

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase + admin wallet values

# 4. Run the Supabase SQL schema
# Paste schema.sql into Supabase → SQL Editor → Run

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Next.js 14 App Router (Vercel)             │
│                                                         │
│  / Landing    /feed    /submit    /dashboard            │
│  /leaderboard /admin                                    │
│                                                         │
│  API Routes: /api/contributions  /api/user/[wallet]     │
│              /api/leaderboard    /api/stats             │
│              /api/admin/*                               │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────▼──────┐          ┌───────▼──────┐
   │  Supabase   │          │    Solana    │
   │  Postgres   │          │   Devnet     │
   │             │          │              │
   │  users      │          │  Wallet Auth │
   │  contribs   │          │  (identity)  │
   │  badges     │          │  Signatures  │
   │  user_badges│          └──────────────┘
   └─────────────┘
```

---

## 📁 Project Structure

```
proof-of-support/
├── app/
│   ├── page.tsx              # Landing page (animated hero)
│   ├── feed/page.tsx         # Public contribution feed
│   ├── submit/page.tsx       # Submit contribution form
│   ├── dashboard/page.tsx    # User profile + badges
│   ├── leaderboard/page.tsx  # Rankings + podium
│   ├── admin/page.tsx        # Admin control panel
│   ├── layout.tsx            # Root layout + providers
│   ├── globals.css           # Design system + animations
│   └── api/
│       ├── contributions/    # GET + POST
│       ├── user/[wallet]/    # GET + POST + PATCH
│       ├── leaderboard/      # Rankings
│       ├── stats/            # Public counters
│       └── admin/            # Admin-only endpoints
├── components/
│   ├── Navbar.tsx            # Cyber HUD navigation
│   ├── ContributionCard.tsx  # Feed card component
│   └── BadgeDisplay.tsx      # Hexagonal badge grid
├── hooks/
│   └── useUser.ts            # Wallet → user state
├── lib/
│   ├── supabase.ts           # DB clients
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Points, badges, formatting
├── providers/
│   └── WalletProvider.tsx    # Solana wallet adapter
├── schema.sql                # Complete DB schema
└── .env.example              # Environment template
```

---

## 🗄 Database Schema

| Table         | Purpose                              |
|---------------|--------------------------------------|
| `users`       | Wallet identity, points, streaks     |
| `contributions` | Submitted links with status/points |
| `badges`      | Badge definitions (seeded)           |
| `user_badges` | Earned badges per user               |
| `seasons`     | Season tracking (Genesis active)     |

---

## 🎮 Reward System

### Points Per Contribution Type
| Type     | Points |
|----------|--------|
| Tweet    | +10    |
| Feedback | +15    |
| Thread   | +25    |
| Referral | +40    |

### Level Thresholds
| Level | Name         | Points Required |
|-------|--------------|-----------------|
| 1     | Newcomer     | 0               |
| 2     | Contributor  | 50              |
| 3     | Advocate     | 150             |
| 4     | Champion     | 350             |
| 5     | Hero         | 750             |
| 6     | Legend       | 1,500           |
| 7     | Mythic       | 3,000           |
| 8     | Apex         | 6,000           |
| 9     | Genesis      | 12,000          |
| 10    | Transcendent | 25,000          |

### Badge Tiers
- 🌱 **Common** — First milestones
- 📡 **Rare** — Consistent contributors
- 🏆 **Epic** — Power users
- 💎 **Legendary** — Elite tier

---

## 🔗 Solana Integration

### MVP (Current)
- Wallet = identity (no email/password)
- Auto-register on first connection
- Optional message signing on submission (cryptographic proof)

### Roadmap
```
Phase 2 → Message signatures stored in DB (verifiable)
Phase 3 → Compressed NFT badges via Metaplex Bubblegum
Phase 4 → $PROOF SPL token distribution
Phase 5 → Anchor program for on-chain contribution PDAs
Phase 6 → DAO governance for verification
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# NEXT_PUBLIC_ADMIN_WALLET
```

### Environment Variables Required
See `.env.example` for all required variables.

---

## 🔐 Admin Access

1. Set `NEXT_PUBLIC_ADMIN_WALLET` to your Solana wallet's public key
2. Connect that wallet on the app
3. Visit `/admin` — the panel will be accessible

Admin capabilities:
- View pending/approved/rejected contributions
- Approve or reject submissions
- Monitor platform stats (users, contributions, points)

---

## 📊 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript     |
| Styling    | Tailwind CSS + Custom CSS (no UI libs)  |
| Backend    | Next.js API Routes                      |
| Database   | Supabase (Postgres + RLS)               |
| Auth       | Solana Wallet Adapter (Phantom, Solflare, Backpack) |
| Blockchain | Solana Devnet                           |
| Hosting    | Vercel                                  |
| Fonts      | Orbitron, Share Tech Mono, Exo 2        |

---

## 🎨 Design System

**Theme:** Dark Cyber / Neon Pulse

| Token          | Value     |
|----------------|-----------|
| Primary accent | `#00f5d4` (Neon Cyan) |
| Secondary      | `#a855f7` (Neon Purple) |
| Alert          | `#ff2d78` (Neon Pink) |
| Reward         | `#fbbf24` (Neon Gold) |
| Background     | `#050508` (Void) |
| Font Display   | Orbitron |
| Font Mono      | Share Tech Mono |
| Font Body      | Exo 2 |

---

## 💬 Support

Built for **HelpBnk × Superteam Business Challenge**

---

*Proof-of-Support — because invisible work deserves on-chain proof.*
