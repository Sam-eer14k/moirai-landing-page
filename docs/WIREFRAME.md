# MoirAI Cloud landing page: wireframe (v2)

The page sells Synaptix™, MoirAI Cloud's AI infrastructure operating platform, to infrastructure
leaders at data centers, enterprises, regulated environments and edge operations, many of them
planning a move off VMware. Facts come from moiraicloud.ai (read 2026-10-28). Anything not on the
client's site is marked `[CONFIRM: …]`.

## Strategy

| | |
|---|---|
| Primary conversion | **Talk to Our Team**, ending at the contact form. |
| Secondary | Calculator and readiness check (both pre-fill the contact form), VMware playbook links. |
| Tone | Plain and specific. Shows real roadmap status; never implies autonomy that hasn't shipped. |
| Proof policy | No customer names, logos, statistics, prices or certifications invented. |

### Objections and where they are answered

| Objection | Section |
|---|---|
| "Is it real or a roadmap deck?" | Roadmap (only stage 1 is Available), FAQ |
| "Another console on top of mine?" | About before/after, VMware comparison |
| "Will AI change things on its own?" | Bento console (Approve step), FAQ, explorer copy |
| "Migration risk" | Starting points, readiness check, rollout steps, playbook links |
| "Is it worth it?" | Calculator (with visible assumptions) |
| "Who is behind it?" | Founders |

## Section map

```
HEADER   slim top bar (collapses) · logo tile · Platform▾ Synaptik™ Cell Solutions▾ Roadmap Team Insights
         · [Talk to Our Team] · [Menu] → full-screen numbered menu (01–15) · frosted navy + cyan progress on scroll
HERO     video bg + strong navy overlay | label · H1 "AI-Assisted Infrastructure" · subline · 2 CTAs
         · proof strip (01/02/03, equal columns) | interactive SVG operating map + explanation panel · scroll cue
BENTO    5 modules tile (expanding icon pills) | AI console mock (alert → cause → fix → Approve) | VMware tile
ABOUT    copy + 2 ticks | before/after toggle: four tools → one Synaptix™ console
PLATFORM vertical module list (arrow keys) → detail panel with 3 bullets + built visual
WHY      sticky architecture SVG | four reasons; the matching layer lights up while scrolling
MARQUEE  two rows, opposite directions, pause on hover
ROADMAP  faint full-width watermark · horizontal timeline (track from node 01 to 05, cyan → amber to 02)
         · equal title heights so badges align · sliding indicator · crossfading detail panel
SOLUTIONS four environment panels, active one widens (description, common pain, how Synaptix™ helps)
START    three selectable situations → situation / how it helps / outcomes + matching CTA
VMWARE   VMware vs Synaptix™ table (7 rows) with takeaway panel on hover/tap
CALC     five sliders → 3-year total, servers retired, hardware/power, licensing · rack graphic · disclaimer
READY    six yes/no questions → live score ring and advice (nothing sent anywhere)
CELL     three staggered stat blocks with hover animations · validation disclaimer
ROLLOUT  four numbered steps on one line, connector through circle centres, draws on scroll · "What you get"
CONTACT  form (validation, honeypot, success state) | copy-email card, what happens next, reply time
TEAM     two founder cards: duotone → colour, bio slides up, LinkedIn
FAQ      live search + accessible accordion (8 questions)
INSIGHTS horizontal drag row: three posts + All resources card
CLOSE    one closing CTA on an animated node network, with the VMware plan link
FOOTER   columns, more reading, Back to top, faint MoirAI wordmark
```

## Visual system

| Token | Value | Source |
|---|---|---|
| `--blue` | `#004AAE` | Logo wordmark |
| `--electric` | `#2080C0` | Logo eye ring (mid) |
| `--cyan` | `#52D0E2` | Logo eye ring (light end) |
| `--navy` | `#06142F` | Wordmark hue darkened (the logo has no navy) |

Type: Bricolage Grotesque (headings), Instrument Sans (body), JetBrains Mono (labels, console).
Radius 4–10px. Cyan and electric blue are the interaction colours.
Imagery: the hero video appears only in the hero; everything else is SVG, canvas or code-drawn.
