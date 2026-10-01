// Social & editorial posts (plain data, safe to import from Node scripts such as prerender).
// Images are attached in editorial.js.

export const EDITORIAL_CATEGORIES = [
  {
    id: "news",
    label: "News & theory covers",
    blurb: "Breaking news and fan theories, each turned into one image you stop for.",
  },
  {
    id: "campaigns",
    label: "Reviews & campaigns",
    blurb: "Review score cards and release-week posts, each with its own look.",
  },
  {
    id: "retrospectives",
    label: "Timelines & retrospectives",
    blurb: "Decades of film stills, stitched into a single frame.",
  },
  {
    id: "data",
    label: "Data graphics",
    blurb: "Rankings you can read in a second.",
  },
];

const ig = (code) => `https://www.instagram.com/fandomwire/p/${code}/`;
const fb = (id) => `https://www.facebook.com/photo/?fbid=${id}`;

export const posts = [
  { slug: "gosling-danny-ketch", category: "news", title: "Ryan Gosling as Danny Ketch", note: "News cover pairing comic-panel Ghost Riders with a film still.", url: ig("Dbu4lBYjHmm"), platform: "Instagram" },
  { slug: "doomsday-character-designs", category: "news", title: "Avengers: Doomsday character designs", note: "Reveal cover for Doctor Doom, Magneto and Professor X.", url: ig("DbTsJNFDJgO"), platform: "Instagram" },
  { slug: "sylvie-real-cause", category: "news", title: "Why Sylvie is the real cause of Doomsday", note: "Theory cover built around the Avengers wordmark.", url: ig("DbU1VCjjOIu"), platform: "Instagram" },
  { slug: "deadpool-wolverine-theory", category: "news", title: "Deadpool, Wolverine and Doomsday", note: "Three-character composite for a fan-theory story.", url: ig("DbWRfP_DJcs"), platform: "Instagram" },
  { slug: "spider-man-posters", category: "news", title: "New posters for the Spider-Man films", note: "Poster roundup laid out as one layered composition.", url: ig("DbuXmcnjD0S"), platform: "Instagram" },
  { slug: "upcoming-marvel-projects", category: "news", title: "Upcoming Marvel Studios projects", note: "Slate announcement combining characters from several films.", url: ig("DbS0LV2DI8u"), platform: "Instagram" },
  { slug: "brand-new-day-review", category: "campaigns", title: "Spider-Man: Brand New Day review", note: "Review template with score dial and pull quote.", url: ig("DbV0fe2sw7M"), platform: "Instagram" },
  { slug: "no-spoilers-campaign", category: "campaigns", title: "No spoilers", note: "Release-week awareness post with a single bold message.", url: ig("DbYz7QBMeCc"), platform: "Instagram" },
  { slug: "doctor-doom-evolution", category: "retrospectives", title: "Doctor Doom through the years", note: "1994 to 2026 on screen, one row per era.", url: fb("1522096906617141"), platform: "Facebook" },
  { slug: "lanterns-hal-jordan-timeline", category: "retrospectives", title: "Lanterns: Hal Jordan timeline", note: "Five decades of one actor, cut into a single title sequence.", url: fb("1521934443300054"), platform: "Facebook" },
  { slug: "green-lantern-evolution", category: "retrospectives", title: "Green Lantern evolution", note: "Animation and live action from 2009 to 2026 in a year grid.", url: fb("1517771883716310"), platform: "Facebook" },
  { slug: "hiroyuki-sanada-roles", category: "retrospectives", title: "Hiroyuki Sanada's roles", note: "Filmography collage across Hollywood and Japanese cinema.", url: fb("1522002256626606"), platform: "Facebook" },
  { slug: "charlie-hunnam-roles", category: "retrospectives", title: "Charlie Hunnam's roles", note: "Character collage spanning his best-known work.", url: fb("1520958860064279"), platform: "Facebook" },
  { slug: "real-vs-reel", category: "retrospectives", title: "Real vs. reel", note: "Real people and the actors who played them, side by side.", url: fb("1521138240046341"), platform: "Facebook" },
  { slug: "highest-grossing-actors", category: "data", title: "Highest-grossing actors of all time", note: "Top-ten ranking with portraits and box-office totals.", url: fb("1520623210097844"), platform: "Facebook" },
];
