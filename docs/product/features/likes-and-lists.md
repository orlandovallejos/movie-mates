# Likes and your own lists

Stories for the heart, the Likes screen and your own lists. Conventions (IDs, fields, the **Privacy:** line)
are in the [requirements](../requirements.md#3-conventions).

The rules behind these stories, from the
[roadmap](../../ROADMAP.md#how-likes-lists-and-matches-work) and the
[decisions](../requirements.md#6-decisions):

- **Likes** is one list per person, private, and the only list used for matching.
- **Your own lists** are as many as you want, private, and never used for matching. They're saved to your
  account, so they're the same on every device (decision 8).
- A title can be in your Likes, in any number of your own lists, in both or in neither. Adding a title to a
  list doesn't like it, and liking it doesn't add it to a list.
- Everyone starts with two lists, **Watch later** and **Binge-watch** (LIST-10,
  [decision 21](../requirements.md#6-decisions)).
- Saving needs a connection. While you're offline, the app says so in a banner and the heart and **Add to
  list** wait until you're back ([decision 20](../requirements.md#6-decisions)).

**Milestones.** M6 builds all of this on desktop with the data stored on the device. M7 moves it to the
account; the device's M6 data isn't moved (decision 2). Web and phone follow in M8 and M9.

**Contents:** [The heart](#the-heart) · [Likes screen](#likes-screen) · [Your own lists](#your-own-lists) ·
[Limits](#limits) · [Syncing](#syncing) · [States](#states) · [Later](#later)

---

## The heart

### LIKE-1 · Like a title

As someone browsing, I want to tap a heart to save a title I'd watch, so that it can match without any other
effort.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] On every poster, on the Home hero and on the title page, the same heart in the same place relative to
      the poster
- [ ] The heart fills at once, before the save finishes, with a short animation (none when the system asks
      for reduced motion)
- [ ] Screen readers hear "Like Dune" and the pressed state (`aria-pressed` on desktop and web)
- [ ] A tap while a save is still running is queued, not lost: the last tap wins
- [ ] **Privacy:** nothing changes for anyone else, unless the Like makes a match (MATCH). A Like that
      doesn't match is never shown, counted or notified to anyone.

### LIKE-2 · Unlike a title

As someone who changed their mind, I want to tap the heart again to remove the title, so that my Likes stay
honest.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] No confirmation. A short message offers **Undo** for 5 seconds: "Removed from your Likes. Undo"
- [ ] When the title is a match, the message says so: "Removed from your Likes and your matches with Sam.
      Undo". The match leaves the shared list (decision 6).
- [ ] Undo puts the Like back with its original date, and the match comes back with it
- [ ] **Privacy:** the other person sees the match disappear from the shared list, with no notification and
      no message saying who removed it

### LIKE-3 · When saving fails

As someone whose connection dropped, I want to know right away that nothing can be saved, so that I don't
count on a Like or a match that never happened.

**Clients:** D W M · **Release:** first version · **Milestone:** M7 (D), M8 (W), M9 (M)

- [ ] Offline: a banner at the top of the app, on every screen, says "You're offline. Likes and lists can't
      be saved until you're back online." ([decision 20](../requirements.md#6-decisions))
- [ ] While offline the app makes no calls to the server. The heart and **Add to list** stay visible but
      disabled, and tapping them repeats the banner's message. Nothing is kept to send later.
- [ ] Screens already loaded stay readable. When the connection is back, the banner goes away and everything
      works again without a reload.
- [ ] The connection drops in the middle of a save: the heart empties again and a message says "Couldn't save
      your Like" with **Try again**, the same as when the server refuses it
- [ ] Unlikes follow the same rules
- [ ] In M6 there's no server: a failed write to the device shows the same message

### LIKE-4 · A daily limit on Likes

**Removed.** There's no limit on how many titles you can like
([decision 14](../requirements.md#6-decisions)): nobody liking by hand gets near "everything". Scripts are
slowed by the server's limit of 20 requests a second per client
([decision 16](../requirements.md#6-decisions)), which no person reaches. If a save is slowed, the heart
behaves as in LIKE-3: it stays filled and the app retries by itself.

## Likes screen

### LIKE-5 · See your Likes

As someone choosing what to watch alone, or checking what I've liked, I want all my Likes in one place, so
that I can browse them.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] A grid of posters with title and year, and the number of Likes in the header ("48 Likes"). It scrolls
      down: 20 titles, then **Show more** adds 30 ([decisions 17 and 18](../requirements.md#6-decisions)).
- [ ] A lock and "Only you can see your Likes" in the header, the same cue as on your own lists
      ([principle 2](../../design/principles.md#2-private-looks-private-shared-looks-shared))
- [ ] Each poster opens the title page and has the filled heart (tap to unlike, LIKE-2)
- [ ] Titles that are matches show a small badge with the connection's photo (from M7)
- [ ] **Privacy:** the badge appears for matches only. Nothing on this screen tells you anything about a
      connection's Likes beyond the matches.

### LIKE-6 · Sort and filter your Likes

As someone with many Likes, I want to sort and filter them, so that I can find the one I'm thinking of.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] Sort: **Date liked** (newest first, the default), **Title** (A to Z), **TMDB rating**, **Release date**
- [ ] Filter: **All**, **Movies**, **TV shows**
- [ ] The choice is remembered on the device
- [ ] With a filter that matches nothing: "No TV shows in your Likes yet" and **Show all**

### LIKE-7 · No Likes yet

As a new member, I want the empty Likes screen to tell me what to do, so that I start liking.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] A short animation shows what to do instead of a paragraph: a finger taps the heart on a poster and the
      heart fills. One line under it: "Tap the heart on anything you'd like to watch." and **Browse titles**
      (Home).
- [ ] Uses the same animation style as the welcome screen (AUTH-1); with reduced motion on, it's a still
      picture of the filled heart. Screen readers hear the line of text.
- [ ] The privacy cue is shown here too

## Your own lists

### LIST-1 · Create a list

As someone who sorts titles by mood, I want to make a named list, so that I can keep "Horror to watch alone"
apart from the rest.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] **New list** on the Your lists screen and in the "Add to list" menu (LIST-2)
- [ ] A name of 1 to 50 characters, trimmed; two of your lists can't have the same name (ignoring case)
- [ ] Creating from the menu adds the title to the new list at the same time
- [ ] A new list shows its empty state (LIST-8)

### LIST-2 · Add a title to your lists

As someone looking at a title, I want to put it in one or more of my lists, so that I find it there later.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] On the title page, a two-part button:
  - **The main part** names your last used list and adds to it in one tap: "Add to Watch later". Your first
    time, it's **Watch later** (LIST-10). When the title is already there, it says "In Watch later ✓", and
    tapping it removes the title, with **Undo**.
  - **The arrow part** opens a menu with every list and a checkbox each. Ticking adds and unticking removes,
    at once, without a Save button. **New list** at the top creates one right there (LIST-1) and adds the
    title to it.
- [ ] The list you add to last becomes the main part's list, on every device (stored on the account from M7)
- [ ] On posters, the poster's menu has, in this order:
  - **Add to Watch later**, or **Remove from Watch later** when the title is there
  - **Add to** your last used list, by name ("Add to Horror to watch alone"), when it isn't Watch later
  - **Add to list…**, which opens the list menu above, with every list and **New list**
- [ ] The poster's menu opens from the ⋯ button, which shows with the heart on hover and keyboard focus
      (HOME-4), and with a long press on the phone. On desktop, right-click opens it too. On the web,
      right-click keeps the browser's own menu (open in a new tab, copy the link).
- [ ] A message confirms: "Added to Horror to watch alone"
- [ ] Adding to a list doesn't like the title
- [ ] **Privacy:** your own lists are never used for matching and never shown to anyone

### LIST-3 · See your lists

As someone with several lists, I want them all on one screen, so that I can open the one I need.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] Each list shows its name, the number of titles and the first four posters as a small collage
- [ ] Ordered by the last change, newest first
- [ ] The same "Only you can see your lists" cue as on Likes
- [ ] No lists (only if you deleted the starter lists too): "Make lists for any mood, like "Sunday films" or "Horror to watch alone". Only you see
      them." with **New list**

### LIST-4 · Open a list

As someone picking from one of my lists, I want to see its titles, so that I can choose one.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] The list's name, its number of titles and the privacy cue at the top
- [ ] A grid like Likes, with the same sort, filter and **Show more** (LIKE-5, LIKE-6). The default sort is
      **Date added**.
- [ ] Each poster opens the title page and shows the heart (its own Like state, not the list)

### LIST-5 · Remove a title from a list

As someone tidying a list, I want to take a title out of it, so that the list stays useful.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] From the poster's menu on the list page, or by unticking it in the list menu (LIST-2)
- [ ] No confirmation. A message offers **Undo** for 5 seconds.
- [ ] The title stays in your Likes and your other lists

### LIST-6 · Rename a list

As someone whose list grew beyond its name, I want to rename it, so that the name still fits.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] From the list page's menu; the same rules as LIST-1 for the name
- [ ] Esc or **Cancel** keeps the old name

### LIST-7 · Delete a list

As someone who doesn't need a list anymore, I want to delete it, so that my lists stay short.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] From the list page's menu, as a destructive action
- [ ] A list with titles asks first: "Delete "Horror to watch alone"? The list and its 12 titles will be
      deleted. Your Likes and your other lists stay as they are." with **Delete** and **Cancel**. It doesn't
      say the titles stay in your Likes, because a title can be in a list without being liked.
- [ ] An empty list is deleted without asking, with **Undo** for 5 seconds
- [ ] After deleting, Your lists is shown

### LIST-8 · An empty list

As someone who just made a list, I want to know how to fill it, so that I don't stare at an empty screen.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] A short, playful animation instead of a block of text: a poster dropping into the list. One line under
      it: "Nothing here yet." with **Browse titles**. Still picture with reduced motion on.
- [ ] **Suggestions** below it, based on the list's name: a list called "Marvel" suggests Marvel movies and TV
      shows, using the same search as SEARCH-5 (studios, franchises and keywords) and then title search. Each
      suggestion has the heart and an **Add** button for this list. 20, then **Show more**.
- [ ] When the name finds nothing useful (and for **Watch later** and **Binge-watch**), the suggestions are
      trending titles instead: trending movies for Watch later, trending TV shows for Binge-watch
- [ ] Suggestions come from TMDB only. Offline or with TMDB down, only the animation and the line show.
- [ ] **Privacy:** the list's name is sent to TMDB as a search, like any search you type, and to nobody else

### LIST-10 · Start with two lists

As a new member, I want a couple of lists ready, so that I can sort titles from the first day without
setting anything up.

**Clients:** D W M · **Release:** first version · **Milestone:** M6 (D), M8 (W), M9 (M)

- [ ] Every account starts with two empty lists, **Watch later** and **Binge-watch**, in that order
      ([decision 21](../requirements.md#6-decisions)). In M6, before accounts, they're created on the device
      the first time the app opens.
- [ ] They're ordinary lists: you can rename or delete them, and they count toward the limit of 100
- [ ] A deleted starter list doesn't come back
- [ ] **Watch later** is the list the add button (LIST-2) starts with

## Limits

Your own lists have limits high enough that nobody reaches them by normal use, low enough to protect the server
and the screens. Likes have none.

| What               | Limit         | At the limit                                                                    |
| ------------------ | ------------- | ------------------------------------------------------------------------------- |
| Likes              | None          | No limit ([decision 14](../requirements.md#6-decisions))                        |
| Your own lists     | 100           | **New list** is disabled with "You've reached 100 lists."                       |
| Titles in one list | 1,000         | That list is disabled in the list menu with "This list is full (1,000 titles)." |
| List name          | 50 characters | The field stops accepting characters and shows the count                        |

Grids show 20 titles and add 30 with each **Show more** (decision 18), so a list of 1,000 titles opens as fast
as one of 20.

## Syncing

From M7, Likes and your own lists live on your account and every device shows the same thing (decision 8).

- [ ] A change on one device shows on your other open devices within a few seconds, without a reload
- [ ] Nothing is saved while offline (LIKE-3), so there are no offline changes to send later
- [ ] When two devices change the same thing at almost the same time, the latest change wins, for each title
      and each list name separately. Adding different titles to the same list on two devices keeps both.
- [ ] Deleting a list on one device while another adds to it: the delete wins, and the other device says
      "This list was deleted on another device"
- [ ] **Privacy:** syncing is between your own devices only; nothing in it reaches a connection

## States

| Situation                    | What the person sees                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Loading Likes or a list      | Poster skeletons in the grid; the header with the count appears as soon as it's known                                      |
| Offline                      | The banner from LIKE-3. Likes and lists open as last loaded; the heart and **Add to list** are disabled until you're back. |
| Saving fails                 | LIKE-3 for the heart; the list menu (LIST-2) unticks the list again with "Couldn't add to the list" and **Try again**      |
| TMDB down                    | Grids show the saved title and year with plain tiles instead of posters; opening a title says TMDB is down                 |
| A title is no longer on TMDB | It stays in your Likes or list as a plain tile, "Not available anymore", and can be removed                                |

## Later

After the first version. IDs are reserved so the wireframes can leave room for them.

### LIKE-8 · Swipe through titles on the phone

As someone with five minutes on the bus, I want to go through titles one card at a time, so that I like more
of them with less effort.

**Clients:** M · **Release:** later

- [ ] One large card at a time; swipe right to like, left to skip, and buttons for both
- [ ] Cards come from the same sources as Home (trending and your genres), never titles already liked or
      marked "Not interested"

### LIKE-9 · Mark a title "Not interested"

As someone who keeps seeing a title I'll never watch, I want to hide it, so that it stops coming back.

**Clients:** D W M · **Release:** later

- [ ] From a poster's menu; hides the title from Home, onboarding picks, the swipe deck and "pick one for
      us"
- [ ] A list of hidden titles in Settings to undo it
- [ ] **Privacy:** private, like Likes, and never used for matching

### LIST-9 · Reorder titles in a list

As someone who ranks a list, I want to put titles in my own order, so that the first one is the next to
watch.

**Clients:** D W M · **Release:** later

- [ ] A **Custom** sort, by drag and drop, and with the keyboard on desktop and web
