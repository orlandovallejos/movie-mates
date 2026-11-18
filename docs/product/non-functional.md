# Non-functional requirements

The stories in [`features/`](requirements.md#where-the-stories-are) say what the app does. This file says how
well: accessible to whom, private from whom, how fast, on which systems, and what happens when the network or
TMDB fails. Each requirement is a number, a standard or a named behavior, so a test or a person can check it.
Stories point here instead of saying "fast" or "secure".

Each requirement has an ID, like the stories (`PERF-3`), so tests and issues can refer to it. The same rules
apply: IDs are never reused, and a dropped requirement stays, marked **Removed**.

**Contents:** [Accessibility](#accessibility) · [Themes](#themes) · [Privacy](#privacy) ·
[Offline and outages](#offline-and-outages) · [Performance](#performance) ·
[Supported platforms](#supported-platforms) · [Security](#security) · [Legal](#legal) ·
[Language](#language)

---

## Accessibility

The bar is [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA on every client. The
[audit](../design/audit.md#accessibility-gaps) lists today's gaps, and #135 fixes them.

| ID     | Requirement                                                                                                                                                                                                                                                                                                    | Checked by                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A11Y-1 | Every screen meets WCAG 2.2 AA, in both themes                                                                                                                                                                                                                                                                 | Automated checks (axe) on each screen in CI, and a manual pass per milestone |
| A11Y-2 | Contrast: text at least 4.5:1 against its background; large text (24 px, or 19 px bold) at least 3:1; icons, control borders and the focus ring at least 3:1 against what's next to them                                                                                                                       | A test over every text and background token pair, for each theme             |
| A11Y-3 | Text over images (the hero, backdrops, the poster-tinted title page) sits on a dark layer that keeps it at 4.5:1. The tint is computed at runtime, so the app checks the ratio and falls back to the theme's colors                                                                                            | A unit test with a light, a dark and a mid-gray poster                       |
| A11Y-4 | Keyboard on desktop and web: everything works with Tab, Enter, Space, the arrow keys and Esc; focus is always visible (the `color.focus` ring, 2 px) and never hidden under the sidebar, a banner or a message; dialogs keep focus inside and return it when they close; **Skip to content** is the first stop | Manual keyboard-only pass per milestone                                      |
| A11Y-5 | Screen readers: VoiceOver (macOS, iOS), TalkBack (Android) and NVDA (Windows) name every control, read its state (the heart is "pressed"), and announce messages and the offline banner. Each web screen has its own page title.                                                                               | Manual pass with each reader per client milestone                            |
| A11Y-6 | Text follows the system size up to 200% without anything cut off or overlapping (SET-8); on the web, the page reflows at 320 px wide with no sideways scroll                                                                                                                                                   | Screenshot tests at 100% and 200%                                            |
| A11Y-7 | Touch and click targets are at least 24 × 24 px on desktop and web, 44 × 44 pt on iOS and 48 × 48 dp on Android                                                                                                                                                                                                | Component tests on the shared components                                     |
| A11Y-8 | With reduced motion on, animations become fades of 200 ms or less, and celebrations become still pictures (SET-8). Nothing flashes more than 3 times a second.                                                                                                                                                 | Tests with reduced motion forced on                                          |
| A11Y-9 | Color is never the only cue: **New**, the pressed heart, unread notifications and errors also have text, a shape or an icon                                                                                                                                                                                    | Review of each component in grayscale                                        |

Trailers play in YouTube's player, so their captions are YouTube's.

## Themes

| ID      | Requirement                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| THEME-1 | Every screen and every state (loading, empty, offline, failed) is designed and tested in Dark and Light ([decision 9](requirements.md#6-decisions)) |
| THEME-2 | Both themes pass A11Y-2 and A11Y-3. A token pair that fails in either theme fails the build.                                                        |
| THEME-3 | Screenshot tests of the shared components run in both themes (the M4 guardrail)                                                                     |
| THEME-4 | Changing the theme, or the system's mode with **System** on, takes effect at once, window frame included (SET-7)                                    |

## Privacy

The privacy rules **P1 to P6** in [matching](features/matching.md#privacy-rules) apply everywhere. This
section says who can see each kind of data, who else receives it, and how long it's kept.

### Who can see what

| Data                                    | You                                    | A connection                                                     | Anyone else                                          | The server                       |
| --------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| Your Likes, and when you liked each one | ✓                                      | Only titles that are matches, never when you liked them (P1, P2) | —                                                    | Stores them to find matches      |
| Your own lists, their names and titles  | ✓                                      | —                                                                | —                                                    | Stores them to sync your devices |
| A shared match list, Watched included   | ✓                                      | ✓, the two of you only                                           | —                                                    | Stores it                        |
| Your name and photo                     | ✓                                      | ✓ (P4)                                                           | Whoever opens an invite you sent                     | Stores them                      |
| Your email address and sign-in methods  | ✓                                      | —                                                                | —                                                    | Stores them to sign you in       |
| Who you're connected with               | ✓                                      | Only that they're connected with you                             | —                                                    | Stores it                        |
| Invites you sent                        | ✓, never whether one was declined (P3) | —                                                                | The person holding the link sees your name and photo | Stores them until they expire    |
| Your counts (Likes, lists, connections) | ✓, on Profile                          | Only the number of matches you share                             | —                                                    | Computes them                    |
| A connection ending, and why            | ✓                                      | The list disappears, with no notice or reason (P5)               | —                                                    | Deletes the shared list          |
| Mutes and settings                      | ✓                                      | —                                                                | —                                                    | Stores the account ones (SET)    |
| What you search for                     | ✓                                      | —                                                                | —                                                    | Never stored or logged           |
| Your IP address, app version            | —                                      | —                                                                | —                                                    | In server logs for 14 days       |

PRIV-1: the server never answers a request with data from this table that the person asking shouldn't see,
whatever the client asks for. Tests call the API as a connection and as a stranger and check every response
against the table.

### Other services

| Service                            | What it receives                                                                                                                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TMDB                               | What you search for, the names of your lists when they suggest titles (LIST-8), the titles, people and images you open, your language and region, and your IP address when your device calls it. Never your email or your account. |
| YouTube                            | That a trailer is played, from the privacy-enhanced player (TITLE-8)                                                                                                                                                               |
| Google, Apple                      | That you signed in to Movie Mates, when you use them                                                                                                                                                                               |
| The email provider                 | Your email address, to send sign-in emails                                                                                                                                                                                         |
| Apple's and Google's push services | Your phone's push token, and each notification's text: a connection's name and a title                                                                                                                                             |
| The hosting and database provider  | What the server stores, on our behalf; named in the M7 backend ADR                                                                                                                                                                 |

PRIV-2: no ads, no tracking, no analytics or advertising SDKs, and no data sold or shared beyond this table
([not now](requirements.md#5-not-now)). Error reporting, if it's added, needs an ADR, and its reports carry no
Likes, list names, emails or search terms.

### How long data is kept

| Data                              | Kept for                                                         |
| --------------------------------- | ---------------------------------------------------------------- |
| Your account and everything in it | Until you delete it (AUTH-14), then removed at once              |
| A shared match list               | Until the connection ends, then deleted for both (decision 6)    |
| Notifications                     | 30 days (NOTIF-5)                                                |
| Invites                           | Until accepted, revoked or expired (7 days), then deleted        |
| Sign-in links and codes           | 15 minutes, and deleted within a day                             |
| Server logs                       | 14 days                                                          |
| Backups                           | 30 days, so a deleted account is gone from them within 30 days   |
| The "Download my data" file       | 24 hours (AUTH-15)                                               |
| Data on a device                  | Until sign-out, which removes it (AUTH-13); device settings stay |

## Offline and outages

Offline, the app says so and pauses ([decision 20](requirements.md#6-decisions)): it makes no calls to the
server, nothing is queued to send later, and screens already loaded stay readable.

| ID        | Requirement                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| OFFLINE-1 | The banner appears within 2 seconds of losing the connection and leaves within 2 seconds of it coming back, without a reload (LIKE-3)    |
| OFFLINE-2 | While offline, the app sends nothing to the server and keeps nothing to send later                                                       |
| OFFLINE-3 | No screen is ever blank: a screen that can't load says why, in words, with **Try again**                                                 |
| OFFLINE-4 | Back online, the real-time connection returns and the app asks the server what changed, so every open screen is current within 5 seconds |
| OFFLINE-5 | The server keeps each saved title's name, year, type, genres and runtime, so Likes, lists and match filters work when TMDB is down       |

### What each area shows

| Area                         | Offline                                                              | TMDB down                                                    | Movie Mates server down                                |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Welcome and sign-in          | Buttons disabled, with the reason; the code field keeps what's typed | Works (no TMDB on these screens)                             | "Sign-in isn't working right now", **Try again**       |
| Onboarding                   | Steps already loaded stay; saving waits                              | Steps 1, 2 and 4 work; step 3 can be skipped (ONBOARD-9)     | As offline                                             |
| Home, search, titles, people | As last loaded; new screens say "You're offline"                     | "We can't reach the movie database right now", **Try again** | Works; the heart is disabled                           |
| Likes and your lists         | As last loaded; the heart and **Add to list** disabled               | Plain tiles with the saved title and year                    | "Your Likes aren't available right now", **Try again** |
| Matches and connections      | As last loaded, "Matches may be out of date"                         | Plain tiles; filters work from saved data                    | "Matches aren't available right now", **Try again**    |
| Notifications                | As last loaded                                                       | Works                                                        | As offline                                             |
| Profile and settings         | Readable; device settings (theme) still change                       | Works                                                        | Account settings disabled, with the reason             |

Disabled while offline, each with the banner's reason: liking and unliking, adding to and removing from lists,
creating, renaming and deleting lists, creating, accepting and revoking invites, marking watched, ending a
connection, muting, and changing account settings. Still working: reading what's loaded, sort and filters,
the theme, and signing out (which clears the device; the server session then ends after 90 days unused).

## Performance

Budgets are measured on reference devices and a reference network, so a number means the same thing every
time:

- **Mid-range phone:** an Android phone from the mid-range of two years before (a 2024 Samsung Galaxy A
  series), and an iPhone 13
- **Computer:** a laptop from five years before, with 8 GB of memory
- **Network:** 4G, throttled to 10 Mbps down and 100 ms round trip

Times are the 95th percentile (19 times out of 20) unless the row says otherwise.

| ID      | Budget                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERF-1  | First screen: the layout with skeletons within 1 s of opening the app, and Home's posters within 2 s on the phone, 1.5 s on desktop                  |
| PERF-2  | Web, as Google's Core Web Vitals measure it (75th percentile): largest content within 2.5 s, response to input within 200 ms, layout shift under 0.1 |
| PERF-3  | The heart fills within 100 ms of a tap (before the server answers, LIKE-1); the server confirms the save within 1 s                                  |
| PERF-4  | The match celebration (MATCH-1) appears within 1 s of the Like that made it                                                                          |
| PERF-5  | A real-time event (a match, an unlike, an ended connection) shows on the other person's open app within 5 s                                          |
| PERF-6  | Push notifications are best effort, through Apple and Google: usually within 30 s, never guaranteed                                                  |
| PERF-7  | Search results within 1 s of the pause in typing (SEARCH-2)                                                                                          |
| PERF-8  | A title page's header within 1 s of tapping a poster; the rest of its sections within 2 s                                                            |
| PERF-9  | **Show more** adds its 30 titles within 1 s                                                                                                          |
| PERF-10 | Scrolling a grid of 200 posters on the mid-range phone drops no frames that a profiler marks as long (over 50 ms)                                    |
| PERF-11 | Size: the web app's first load at most 250 KB of compressed JavaScript; the phone app's download at most 50 MB; the desktop installer at most 150 MB |

### Image sizes

Images come from TMDB in fixed widths. Each screen asks for the smallest that stays sharp on a high-density
screen, never `original`:

| Where                                       | Phone  | Desktop and web |
| ------------------------------------------- | ------ | --------------- |
| Poster in a grid                            | `w342` | `w342`          |
| Poster on the title page, pick one for us   | `w500` | `w500`          |
| Hero and title page backdrop                | `w780` | `w1280`         |
| Search results, notifications, list collage | `w154` | `w154`          |
| Cast and person photos                      | `w185` | `w185`          |
| Watch provider logos                        | `w92`  | `w92`           |

## Supported platforms

Checked in November 2026 against the [Electron 45 README](https://github.com/electron/electron/blob/v45.3.3/README.md#platform-support),
the [Expo SDK reference](https://docs.expo.dev/versions/latest/) (SDK 58) and Google Play's target API rule.
Each is checked again when its client's milestone starts.

| ID         | Client  | Supported                                                                                                                                                                                              |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PLATFORM-1 | Desktop | macOS 13 Ventura and later (Apple silicon and Intel); Windows 10 and 11 (x64 and Arm); Ubuntu 22.04 and 24.04 LTS (x64), and other distributions while both Chromium and the distribution support them |
| PLATFORM-2 | Web     | The last two versions of Chrome, Edge, Firefox and Safari, on computers; Safari on iOS and Chrome on Android                                                                                           |
| PLATFORM-3 | Phone   | iOS 16.4 and later; Android 7 and later, targeting Android 16 (API 36) as Google Play requires                                                                                                         |
| PLATFORM-4 | All     | The desktop app stays on an Electron version that Electron still supports (the latest three); the phone app on an Expo SDK that Expo still supports                                                    |
| PLATFORM-5 | Phone   | Screens from 320 pt wide (iPhone SE) up; tablets run the phone layout in the first version                                                                                                             |

Testing covers the oldest and the newest supported version of each system.

## Security

| ID    | Requirement                                                                                                                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-1 | **Sign-in link and code:** the link works once and lives 15 minutes; the 6-digit code expires with it; after 5 wrong codes it stops working; at most 5 emails per address per hour, the next one 30 seconds after the last; only the newest email works (AUTH-3 to AUTH-5)            |
| SEC-2 | **Sessions:** you stay signed in until you sign out or don't use the app for 90 days; each use restarts the 90 days (AUTH-12). Tokens live in the system's secure storage (Keychain, Windows Credential Manager, the Android Keystore), and on the web in a secure, HTTP-only cookie. |
| SEC-3 | **Rate limit:** the server answers one client at most 20 requests a second ([decision 16](requirements.md#6-decisions), P6). Over it, the answer is HTTP 429 with how long to wait; the apps wait and retry by themselves, up to 3 times, then show the failure as LIKE-3.            |
| SEC-4 | Invite codes and IDs in addresses carry at least 96 bits of randomness, so they can't be guessed or counted                                                                                                                                                                           |
| SEC-5 | Every connection uses HTTPS (TLS 1.2 or later); the web app sends HSTS; the desktop app follows Electron's security checklist (context isolation, sandboxed renderers, no Node.js in pages)                                                                                           |
| SEC-6 | Deleting the account (AUTH-14) needs a fresh code or sign-in, is immediate, and signs out every device                                                                                                                                                                                |

The numbers in SEC-1 make guessing useless: with 5 tries per email and 5 emails an hour, the odds of guessing a
6-digit code are about 25 in a million per hour. How the M7 backend counts and stores these limits goes in its
auth ADR.

**TMDB's own limit.** TMDB answers about 40 requests a second, counted per IP address, and says the number
may change ([rate limiting](https://developer.themoviedb.org/docs/rate-limiting)). Desktop calls TMDB from
each person's computer ([ADR 2](../adr/0002-tmdb-calls-in-main-process.md)). If the web or phone apps called
TMDB through our server, every person would share the server's limit; that choice is an
[open question](requirements.md#7-open-questions).

## Legal

| ID      | Requirement                                                                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LEGAL-1 | TMDB is credited as its terms require: the notice and the TMDB logo, less prominent than ours, in About and on the welcome screen (SET-10, AUTH-1)                                                                          |
| LEGAL-2 | Where to watch credits JustWatch (TITLE-4, SET-10)                                                                                                                                                                          |
| LEGAL-3 | The [privacy policy](../legal/privacy-policy.md) and [terms](../legal/terms.md) are linked from the welcome screen and About (SET-9), readable signed out at `/privacy` and `/terms`, and reviewed before the stores in M11 |
| LEGAL-4 | The account can be deleted inside the app, as Apple and Google require (AUTH-14)                                                                                                                                            |
| LEGAL-5 | You must be 13 or older to use Movie Mates ([decision 22](requirements.md#6-decisions)). The terms say so; sign-up doesn't ask for a birth date.                                                                            |
| LEGAL-6 | The store privacy labels (App Store, Google Play) are filled in from the tables in [Privacy](#privacy) in M11                                                                                                               |

## Language

| ID     | Requirement                                                                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LANG-1 | The interface is in English in the first version ([decision 10](requirements.md#6-decisions)). Spanish and Portuguese come next (SET-14, later).                                       |
| LANG-2 | TMDB content follows the language setting, with TMDB's English text when it has nothing in that language, never an empty field                                                         |
| LANG-3 | Dates and numbers follow the device's format ("Nov 17" or "17 Nov")                                                                                                                    |
| LANG-4 | Names and list names accept any script and emoji, and show without being cut mid-character                                                                                             |
| LANG-5 | From M5, every piece of interface text comes from a translation catalog, through an i18n library, never written in a component. A lint rule flags text written directly in the markup. |
| LANG-6 | Plurals and names inside sentences use the library's message format ("1 match", "3 matches", "It's a match with {names}"), never sentences glued together from pieces                  |
| LANG-7 | Layouts fit text 40% longer than the English, the usual growth for Spanish and Portuguese. A screenshot test runs the app in a stretched fake language (pseudo-localization).          |

Which library is a technical choice for an ADR before M5. It must work in React on the web and desktop and in
React Native. Two maintained candidates: [i18next](https://www.i18next.com/) with `react-i18next` (the most
used, with `expo-localization` on the phone) and [Lingui](https://lingui.dev/) (smaller, extracts the text from
the code by itself). [`eslint-plugin-i18next`](https://github.com/edvardchen/eslint-plugin-i18next) provides
the lint rule.
