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
  {
    id: "social",
    label: "Social series",
    blurb: "Superhero comparisons, film quotes and character collages.",
  },
];

const ig = (code) => `https://www.instagram.com/fandomwire/p/${code}/`;
const fb = (id) => `https://www.facebook.com/photo/?fbid=${id}`;

const existingPosts = [
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

// Dates and publishers come from the public posts; unknown dates stay null.
const legacyMetadata = {
  "gosling-danny-ketch": {
    "date": "2026-08-07",
    "suppliedOrder": 1000,
    "width": 1080,
    "height": 1350
  },
  "doomsday-character-designs": {
    "date": "2026-07-27",
    "suppliedOrder": 1001,
    "width": 1080,
    "height": 1350
  },
  "sylvie-real-cause": {
    "date": "2026-07-27",
    "suppliedOrder": 1002,
    "width": 1080,
    "height": 1350
  },
  "deadpool-wolverine-theory": {
    "date": "2026-07-28",
    "suppliedOrder": 1003,
    "width": 1080,
    "height": 1350
  },
  "spider-man-posters": {
    "date": "2026-08-06",
    "suppliedOrder": 1004,
    "width": 1080,
    "height": 1350
  },
  "upcoming-marvel-projects": {
    "date": "2026-07-27",
    "suppliedOrder": 1005,
    "width": 1080,
    "height": 1350
  },
  "brand-new-day-review": {
    "date": "2026-07-28",
    "suppliedOrder": 1006,
    "width": 1080,
    "height": 1350
  },
  "no-spoilers-campaign": {
    "date": "2026-07-29",
    "suppliedOrder": 1007,
    "width": 1080,
    "height": 1350
  },
  "doctor-doom-evolution": {
    "date": null,
    "suppliedOrder": 1008,
    "width": 1080,
    "height": 1350
  },
  "lanterns-hal-jordan-timeline": {
    "date": null,
    "suppliedOrder": 1009,
    "width": 1080,
    "height": 1350
  },
  "green-lantern-evolution": {
    "date": null,
    "suppliedOrder": 1010,
    "width": 1080,
    "height": 1350
  },
  "hiroyuki-sanada-roles": {
    "date": null,
    "suppliedOrder": 1011,
    "width": 1080,
    "height": 1350
  },
  "charlie-hunnam-roles": {
    "date": null,
    "suppliedOrder": 1012,
    "width": 1080,
    "height": 1350
  },
  "real-vs-reel": {
    "date": null,
    "suppliedOrder": 1013,
    "width": 1080,
    "height": 1350
  },
  "highest-grossing-actors": {
    "date": null,
    "suppliedOrder": 1014,
    "width": 1080,
    "height": 1350
  }
};

const suppliedPosts = [
  {
    "slug": "at-with-great-power",
    "category": "social",
    "title": "With great power",
    "note": "The same line split across three Spider-Man stills.",
    "url": "https://www.instagram.com/animatedtimes/p/DNFSe_tPGs6/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-07",
    "highlight": true,
    "suppliedOrder": 25,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DNFSe_tPGs6/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-07"
      }
    ],
    "frames": [
      {
        "asset": "at-with-great-power",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNFSe_tPGs6/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-spidey-time",
    "category": "retrospectives",
    "title": "It's Spidey time",
    "note": "Homecoming, Far From Home and No Way Home stacked under their wordmarks.",
    "url": "https://www.instagram.com/animatedtimes/p/DM9kjXYPF6G/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-04",
    "highlight": true,
    "suppliedOrder": 26,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DM9kjXYPF6G/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-04"
      }
    ],
    "frames": [
      {
        "asset": "at-spidey-time",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DM9kjXYPF6G/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-spider-man-three-eras",
    "category": "retrospectives",
    "title": "Three Spider-Man eras",
    "note": "Three actors and three sets of suits in one vertical composition.",
    "url": "https://www.instagram.com/animatedtimes/p/DM5ijUVIyu4/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-03",
    "highlight": true,
    "suppliedOrder": 27,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DM5ijUVIyu4/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-03"
      }
    ],
    "frames": [
      {
        "asset": "at-spider-man-three-eras",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DM5ijUVIyu4/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-never-give-up",
    "category": "social",
    "title": "Never give up",
    "note": "Four film stills, one sentence running through them.",
    "url": "https://www.instagram.com/animatedtimes/p/DM4yzrLuhEA/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-03",
    "highlight": true,
    "suppliedOrder": 28,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DM4yzrLuhEA/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-03"
      }
    ],
    "frames": [
      {
        "asset": "at-never-give-up",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DM4yzrLuhEA/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-opening-weekend-comparison",
    "category": "data",
    "title": "Opening-weekend comparison",
    "note": "Superman, Fantastic Four and Jurassic World, each with a still and a box-office figure.",
    "url": "https://www.instagram.com/animatedtimes/p/DMzHMkaPzjK/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-31",
    "highlight": true,
    "suppliedOrder": 29,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMzHMkaPzjK/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-31"
      }
    ],
    "frames": [
      {
        "asset": "at-opening-weekend-comparison",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMzHMkaPzjK/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-sue-storm-across-media",
    "category": "retrospectives",
    "title": "Sue Storm across media",
    "note": "Comics, film, games and animation arranged as four strips.",
    "url": "https://www.instagram.com/animatedtimes/p/DMs6QsLITVh/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-29",
    "highlight": true,
    "suppliedOrder": 30,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMs6QsLITVh/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-29"
      }
    ],
    "frames": [
      {
        "asset": "at-sue-storm-across-media",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMs6QsLITVh/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-it-all-leads-to-doom",
    "category": "campaigns",
    "title": "It all leads to Doom",
    "note": "Marvel team marks overlap above the Doomsday wordmark.",
    "url": "https://www.instagram.com/animatedtimes/p/DMuqbpbvqay/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-30",
    "highlight": true,
    "suppliedOrder": 31,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMuqbpbvqay/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-30"
      }
    ],
    "frames": [
      {
        "asset": "at-it-all-leads-to-doom",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMuqbpbvqay/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-hope-and-fear",
    "category": "social",
    "title": "Hope and fear",
    "note": "Two contrasting stills, with the words cut through each image.",
    "url": "https://www.instagram.com/animatedtimes/p/DMQvwnDTFR6/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-18",
    "highlight": false,
    "suppliedOrder": 0,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMQvwnDTFR6/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-18"
      }
    ],
    "frames": [
      {
        "asset": "at-hope-and-fear",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMQvwnDTFR6/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-x-men-casting",
    "category": "news",
    "title": "X-Men casting cover",
    "note": "Comic art sits behind the actor portraits on the opening cover.",
    "url": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-09-11",
    "highlight": false,
    "suppliedOrder": 1,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 10,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-09-11"
      }
    ],
    "frames": [
      {
        "asset": "at-x-men-casting",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-02",
        "width": 1080,
        "height": 1350,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-03",
        "width": 1080,
        "height": 1350,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-04",
        "width": 1080,
        "height": 1350,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-05",
        "width": 1080,
        "height": 1350,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-06",
        "width": 1080,
        "height": 1350,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-07",
        "width": 1080,
        "height": 1350,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-08",
        "width": 1080,
        "height": 1350,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-09",
        "width": 1080,
        "height": 1350,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-x-men-casting-10",
        "width": 1080,
        "height": 1350,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DdKUMQxjv-R/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-spider-men-mcu",
    "category": "retrospectives",
    "title": "Spider-Men in the MCU",
    "note": "Actor portraits laid over the suits, under a shared headline.",
    "url": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-08-04",
    "highlight": false,
    "suppliedOrder": 2,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 5,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-08-04"
      }
    ],
    "frames": [
      {
        "asset": "at-spider-men-mcu",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-men-mcu-02",
        "width": 1080,
        "height": 1350,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-men-mcu-03",
        "width": 1080,
        "height": 1350,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-men-mcu-04",
        "width": 1080,
        "height": 1350,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-men-mcu-05",
        "width": 1080,
        "height": 1350,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/Dbn_sJhimj9/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-spider-man-film-years",
    "category": "retrospectives",
    "title": "Spider-Man film years",
    "note": "Films and release years stacked into a still-by-still timeline.",
    "url": "https://www.instagram.com/animatedtimes/p/DbhwuyICqRa/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-08-01",
    "highlight": false,
    "suppliedOrder": 3,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 2,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DbhwuyICqRa/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-08-01"
      }
    ],
    "frames": [
      {
        "asset": "at-spider-man-film-years",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DbhwuyICqRa/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-man-film-years-02",
        "width": 1080,
        "height": 1350,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DbhwuyICqRa/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-invincible-tomatoes",
    "category": "campaigns",
    "title": "Invincible season scores",
    "note": "Season scores matched to character art and Rotten Tomatoes badges.",
    "url": "https://www.instagram.com/animatedtimes/p/DWcDmxiAecl/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-03-28",
    "highlight": false,
    "suppliedOrder": 4,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DWcDmxiAecl/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-03-28"
      }
    ],
    "frames": [
      {
        "asset": "at-invincible-tomatoes",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DWcDmxiAecl/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-brand-new-day-trailer",
    "category": "campaigns",
    "title": "Spider-Man: Brand New Day trailer post",
    "note": "Three Spider-Man action stills stacked without a separate headline.",
    "url": "https://www.instagram.com/animatedtimes/p/DWB2-FoD5Dy/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-03-18",
    "highlight": false,
    "suppliedOrder": 5,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DWB2-FoD5Dy/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-03-18"
      }
    ],
    "frames": [
      {
        "asset": "at-brand-new-day-trailer",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DWB2-FoD5Dy/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-oscar-winners",
    "category": "news",
    "title": "The Oscar winners",
    "note": "Film portraits around a single award-season headline.",
    "url": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-03-16",
    "highlight": false,
    "suppliedOrder": 6,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 19,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-03-16"
      }
    ],
    "frames": [
      {
        "asset": "at-oscar-winners",
        "width": 1440,
        "height": 1801,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-02",
        "width": 1440,
        "height": 1802,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-03",
        "width": 1440,
        "height": 1802,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-04",
        "width": 1440,
        "height": 1802,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-05",
        "width": 1440,
        "height": 1802,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-06",
        "width": 1440,
        "height": 1802,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-07",
        "width": 1440,
        "height": 1802,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-08",
        "width": 1440,
        "height": 1802,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-09",
        "width": 1440,
        "height": 1802,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-10",
        "width": 1440,
        "height": 1802,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-11",
        "width": 1440,
        "height": 1802,
        "position": 11,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-12",
        "width": 1440,
        "height": 1802,
        "position": 12,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-13",
        "width": 1440,
        "height": 1802,
        "position": 13,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-14",
        "width": 1440,
        "height": 1802,
        "position": 14,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-15",
        "width": 1440,
        "height": 1802,
        "position": 15,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-16",
        "width": 1440,
        "height": 1802,
        "position": 16,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-17",
        "width": 1440,
        "height": 1802,
        "position": 17,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-18",
        "width": 1440,
        "height": 1802,
        "position": 18,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-oscar-winners-19",
        "width": 1440,
        "height": 1802,
        "position": 19,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DV8o7A3jw_c/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-glowing-eyes",
    "category": "social",
    "title": "Glowing eyes",
    "note": "Eye-beam shots cut into horizontal strips.",
    "url": "https://www.instagram.com/animatedtimes/p/DTu4D45D5zf/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2026-01-20",
    "highlight": false,
    "suppliedOrder": 7,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DTu4D45D5zf/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2026-01-20"
      }
    ],
    "frames": [
      {
        "asset": "at-glowing-eyes",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DTu4D45D5zf/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-seven-sentences",
    "category": "social",
    "title": "Seven sentences",
    "note": "A rainy Spider-Man still behind the opening line.",
    "url": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-11-20",
    "highlight": false,
    "suppliedOrder": 8,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 8,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-11-20"
      }
    ],
    "frames": [
      {
        "asset": "at-seven-sentences",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-05",
        "width": 1440,
        "height": 1800,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-06",
        "width": 1440,
        "height": 1800,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-07",
        "width": 1440,
        "height": 1800,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-seven-sentences-08",
        "width": 1440,
        "height": 1800,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DRRuNEXD5iN/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-heroes-then-now",
    "category": "retrospectives",
    "title": "Heroes, then and now",
    "note": "First appearances and later suits paired in a two-row year grid.",
    "url": "https://www.instagram.com/animatedtimes/p/DQ_Jx2aDIJO/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-11-12",
    "highlight": false,
    "suppliedOrder": 9,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DQ_Jx2aDIJO/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-11-12"
      }
    ],
    "frames": [
      {
        "asset": "at-heroes-then-now",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQ_Jx2aDIJO/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-monday-motivation",
    "category": "social",
    "title": "Monday motivation",
    "note": "Superman against an orange sky, with a line across the top.",
    "url": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-11-10",
    "highlight": false,
    "suppliedOrder": 10,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 5,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-11-10"
      }
    ],
    "frames": [
      {
        "asset": "at-monday-motivation",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-monday-motivation-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-monday-motivation-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-monday-motivation-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-monday-motivation-05",
        "width": 1440,
        "height": 1800,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQ4A_osj-nH/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-just-do-it",
    "category": "social",
    "title": "Just do it",
    "note": "Small setup line, oversized blue 'just do it'.",
    "url": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-11-01",
    "highlight": false,
    "suppliedOrder": 11,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 5,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-11-01"
      }
    ],
    "frames": [
      {
        "asset": "at-just-do-it",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-just-do-it-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-just-do-it-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-just-do-it-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-just-do-it-05",
        "width": 1440,
        "height": 1800,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DQg5I4FD-Tk/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-what-they-should-be-known-for",
    "category": "social",
    "title": "What they should be known for",
    "note": "A tight Tony Stark crop with the last word set larger.",
    "url": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-10-17",
    "highlight": false,
    "suppliedOrder": 12,
    "nsfw": true,
    "contentWarning": "Film-injury imagery.",
    "carouselCount": 12,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-10-17"
      }
    ],
    "frames": [
      {
        "asset": "at-what-they-should-be-known-for",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": true,
        "contentWarning": "Visible realistic facial burn injuries in an Iron Man film still."
      },
      {
        "asset": "at-what-they-should-be-known-for-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-05",
        "width": 1440,
        "height": 1800,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-06",
        "width": 1440,
        "height": 1800,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-07",
        "width": 1440,
        "height": 1800,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-08",
        "width": 1440,
        "height": 1800,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-09",
        "width": 1440,
        "height": 1800,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-10",
        "width": 1440,
        "height": 1800,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-11",
        "width": 1440,
        "height": 1800,
        "position": 11,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-what-they-should-be-known-for-12",
        "width": 1440,
        "height": 1800,
        "position": 12,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DP65311kvJm/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-hope-fear-omen-chaos",
    "category": "social",
    "title": "Hope, fear, omen, chaos",
    "note": "Four comic-book film stills with type used as a cutout.",
    "url": "https://www.instagram.com/animatedtimes/p/DPgUSYfD8Xx/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-10-07",
    "highlight": false,
    "suppliedOrder": 13,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DPgUSYfD8Xx/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-10-07"
      }
    ],
    "frames": [
      {
        "asset": "at-hope-fear-omen-chaos",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPgUSYfD8Xx/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-yet-they-smile",
    "category": "social",
    "title": "Yet they smile",
    "note": "Two character close-ups paired under a short caption.",
    "url": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-27",
    "highlight": false,
    "suppliedOrder": 14,
    "nsfw": true,
    "contentWarning": "Film-injury imagery.",
    "carouselCount": 12,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-27"
      }
    ],
    "frames": [
      {
        "asset": "at-yet-they-smile",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": true,
        "contentWarning": "Visible realistic facial burn injuries in an Iron Man collage."
      },
      {
        "asset": "at-yet-they-smile-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-05",
        "width": 1440,
        "height": 1800,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-06",
        "width": 1440,
        "height": 1800,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": true,
        "contentWarning": "Visible bloody arm injury/amputation in a Winter Soldier collage."
      },
      {
        "asset": "at-yet-they-smile-07",
        "width": 1440,
        "height": 1800,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-08",
        "width": 1440,
        "height": 1800,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-09",
        "width": 1440,
        "height": 1800,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-10",
        "width": 1440,
        "height": 1800,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-11",
        "width": 1440,
        "height": 1800,
        "position": 11,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-yet-they-smile-12",
        "width": 1440,
        "height": 1800,
        "position": 12,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DPGm2t4j82G/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-marvel-trios",
    "category": "social",
    "title": "Marvel trios",
    "note": "Two rows of characters, cut out against a dark background.",
    "url": "https://www.instagram.com/animatedtimes/p/DO3ktjIjwwC/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-21",
    "highlight": false,
    "suppliedOrder": 15,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DO3ktjIjwwC/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-21"
      }
    ],
    "frames": [
      {
        "asset": "at-marvel-trios",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DO3ktjIjwwC/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-successful-films-2025",
    "category": "data",
    "title": "Movie rankings, 2025",
    "note": "A ranking cover with three characters above the title.",
    "url": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-15",
    "highlight": false,
    "suppliedOrder": 16,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 16,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-15"
      }
    ],
    "frames": [
      {
        "asset": "at-successful-films-2025",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-02",
        "width": 1080,
        "height": 1350,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-03",
        "width": 1080,
        "height": 1350,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-04",
        "width": 1080,
        "height": 1350,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-05",
        "width": 1080,
        "height": 1350,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-06",
        "width": 1080,
        "height": 1350,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-07",
        "width": 1080,
        "height": 1350,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-08",
        "width": 1080,
        "height": 1350,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-09",
        "width": 1080,
        "height": 1350,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-10",
        "width": 1080,
        "height": 1350,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-11",
        "width": 1080,
        "height": 1350,
        "position": 11,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-12",
        "width": 1080,
        "height": 1350,
        "position": 12,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-13",
        "width": 1080,
        "height": 1350,
        "position": 13,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-14",
        "width": 1080,
        "height": 1350,
        "position": 14,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-15",
        "width": 1080,
        "height": 1350,
        "position": 15,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-successful-films-2025-16",
        "width": 1080,
        "height": 1350,
        "position": 16,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOoI6i7D0cp/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-superhero-box-office",
    "category": "data",
    "title": "Superhero box office",
    "note": "A fifteen-row ranking with film strips and box-office totals.",
    "url": "https://www.instagram.com/animatedtimes/p/DOfO2CPDDzj/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-11",
    "highlight": false,
    "suppliedOrder": 17,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DOfO2CPDDzj/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-11"
      }
    ],
    "frames": [
      {
        "asset": "at-superhero-box-office",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOfO2CPDDzj/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-dc-2027-slate",
    "category": "news",
    "title": "DC release-slate graphic",
    "note": "Two releases, each given a large title and a date.",
    "url": "https://www.instagram.com/animatedtimes/p/DOL9JSlDEUn/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-04",
    "highlight": false,
    "suppliedOrder": 18,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DOL9JSlDEUn/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-04"
      }
    ],
    "frames": [
      {
        "asset": "at-dc-2027-slate",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOL9JSlDEUn/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-movie-slate-2026",
    "category": "news",
    "title": "Movie slate, 2026",
    "note": "A release-year cover built from character cutouts.",
    "url": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-05",
    "highlight": false,
    "suppliedOrder": 19,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 20,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-05"
      }
    ],
    "frames": [
      {
        "asset": "at-movie-slate-2026",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-02",
        "width": 1080,
        "height": 1350,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-03",
        "width": 1080,
        "height": 1350,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-04",
        "width": 1080,
        "height": 1350,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-05",
        "width": 1080,
        "height": 1350,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-06",
        "width": 1080,
        "height": 1350,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-07",
        "width": 1080,
        "height": 1350,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-08",
        "width": 1080,
        "height": 1350,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-09",
        "width": 1080,
        "height": 1350,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-10",
        "width": 1080,
        "height": 1350,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-11",
        "width": 1080,
        "height": 1350,
        "position": 11,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-12",
        "width": 1080,
        "height": 1350,
        "position": 12,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-13",
        "width": 1080,
        "height": 1350,
        "position": 13,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-14",
        "width": 1080,
        "height": 1350,
        "position": 14,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-15",
        "width": 1080,
        "height": 1350,
        "position": 15,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-16",
        "width": 1080,
        "height": 1350,
        "position": 16,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-17",
        "width": 1080,
        "height": 1350,
        "position": 17,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-18",
        "width": 1080,
        "height": 1350,
        "position": 18,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-19",
        "width": 1080,
        "height": 1350,
        "position": 19,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-slate-2026-20",
        "width": 1080,
        "height": 1350,
        "position": 20,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOP6PI9j9xw/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-movie-scene-budgets",
    "category": "data",
    "title": "Movie-scene budgets",
    "note": "Film stills and a fighter jet arranged around the headline.",
    "url": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-09-02",
    "highlight": false,
    "suppliedOrder": 20,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 12,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-09-02"
      }
    ],
    "frames": [
      {
        "asset": "at-movie-scene-budgets",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-02",
        "width": 1080,
        "height": 1350,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-03",
        "width": 1080,
        "height": 1350,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-04",
        "width": 1080,
        "height": 1350,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-05",
        "width": 1080,
        "height": 1350,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-06",
        "width": 1080,
        "height": 1350,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-07",
        "width": 1080,
        "height": 1350,
        "position": 7,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-08",
        "width": 1080,
        "height": 1350,
        "position": 8,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-09",
        "width": 1080,
        "height": 1350,
        "position": 9,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-10",
        "width": 1080,
        "height": 1350,
        "position": 10,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-11",
        "width": 1080,
        "height": 1350,
        "position": 11,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-movie-scene-budgets-12",
        "width": 1080,
        "height": 1350,
        "position": 12,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DOGv6Khj-rB/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-spider-man-mcu-films",
    "category": "retrospectives",
    "title": "Spider-Man's MCU films",
    "note": "Four movie titles and release labels set over action stills.",
    "url": "https://www.instagram.com/animatedtimes/p/DN53x4sD214/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-28",
    "highlight": false,
    "suppliedOrder": 21,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DN53x4sD214/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-28"
      }
    ],
    "frames": [
      {
        "asset": "at-spider-man-mcu-films",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DN53x4sD214/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-doomsday-team-lineup",
    "category": "news",
    "title": "Avengers: Doomsday team lineup",
    "note": "Six proposed teams laid out as character groups.",
    "url": "https://www.instagram.com/animatedtimes/p/DNVfLvFIkQ5/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-14",
    "highlight": false,
    "suppliedOrder": 22,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DNVfLvFIkQ5/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-14"
      }
    ],
    "frames": [
      {
        "asset": "at-doomsday-team-lineup",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNVfLvFIkQ5/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-great-responsibility-comic",
    "category": "social",
    "title": "Great responsibility",
    "note": "Two comic panels with dialogue bubbles, halftone and a red suit.",
    "url": "https://www.instagram.com/animatedtimes/p/DNQpoUeMnDu/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-12",
    "highlight": false,
    "suppliedOrder": 23,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DNQpoUeMnDu/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-12"
      }
    ],
    "frames": [
      {
        "asset": "at-great-responsibility-comic",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNQpoUeMnDu/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-spider-man-spirit-animal",
    "category": "social",
    "title": "Spider-Man as a spirit animal",
    "note": "Two Spider-Men framed around the line 'Being kind is cool af.'",
    "url": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-08-09",
    "highlight": false,
    "suppliedOrder": 24,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 6,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-08-09"
      }
    ],
    "frames": [
      {
        "asset": "at-spider-man-spirit-animal",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-man-spirit-animal-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-man-spirit-animal-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-man-spirit-animal-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-man-spirit-animal-05",
        "width": 1440,
        "height": 1800,
        "position": 5,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-spider-man-spirit-animal-06",
        "width": 1440,
        "height": 1800,
        "position": 6,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DNIUwpBIhWy/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-first-steps-portraits",
    "category": "campaigns",
    "title": "Fantastic Four: First Steps portraits",
    "note": "Character portraits split into blue panels, with condensed name labels.",
    "url": "https://www.instagram.com/animatedtimes/p/DMks3MvoZty/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-26",
    "highlight": false,
    "suppliedOrder": 32,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": 4,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMks3MvoZty/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-26"
      }
    ],
    "frames": [
      {
        "asset": "at-first-steps-portraits",
        "width": 1440,
        "height": 1800,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMks3MvoZty/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-first-steps-portraits-02",
        "width": 1440,
        "height": 1800,
        "position": 2,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMks3MvoZty/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-first-steps-portraits-03",
        "width": 1440,
        "height": 1800,
        "position": 3,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMks3MvoZty/",
        "nsfw": false,
        "contentWarning": null
      },
      {
        "asset": "at-first-steps-portraits-04",
        "width": 1440,
        "height": 1800,
        "position": 4,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMks3MvoZty/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-fantastic-four-tomatoes",
    "category": "campaigns",
    "title": "Fantastic Four film scores",
    "note": "Four film scores, matched to stills and freshness badges.",
    "url": "https://www.instagram.com/animatedtimes/p/DMhCLIFPrZt/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-24",
    "highlight": false,
    "suppliedOrder": 33,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMhCLIFPrZt/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-24"
      }
    ],
    "frames": [
      {
        "asset": "at-fantastic-four-tomatoes",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMhCLIFPrZt/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-smartest-marvel-characters",
    "category": "data",
    "title": "Smartest Marvel characters",
    "note": "A ten-portrait grid with a red divider between rows.",
    "url": "https://www.instagram.com/animatedtimes/p/DMezs7noySs/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-24",
    "highlight": false,
    "suppliedOrder": 34,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMezs7noySs/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-24"
      }
    ],
    "frames": [
      {
        "asset": "at-smartest-marvel-characters",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMezs7noySs/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-superman-super-man",
    "category": "social",
    "title": "Superman / super man",
    "note": "One word split two ways over two Superman stills.",
    "url": "https://www.instagram.com/animatedtimes/p/DMcur2KvXVu/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-23",
    "highlight": false,
    "suppliedOrder": 35,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMcur2KvXVu/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-23"
      }
    ],
    "frames": [
      {
        "asset": "at-superman-super-man",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMcur2KvXVu/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-fantastic-four-casts",
    "category": "retrospectives",
    "title": "Fantastic Four casts",
    "note": "Four characters compared across three film adaptations.",
    "url": "https://www.instagram.com/animatedtimes/p/DMaJ0W8vPIo/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-22",
    "highlight": false,
    "suppliedOrder": 36,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMaJ0W8vPIo/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-22"
      }
    ],
    "frames": [
      {
        "asset": "at-fantastic-four-casts",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMaJ0W8vPIo/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-marvel-phase-box-office",
    "category": "data",
    "title": "MCU phase box office",
    "note": "Five MCU phases, each with a character collage and a box-office total.",
    "url": "https://www.instagram.com/animatedtimes/p/DMSOyZhIsCC/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-19",
    "highlight": false,
    "suppliedOrder": 37,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMSOyZhIsCC/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-19"
      }
    ],
    "frames": [
      {
        "asset": "at-marvel-phase-box-office",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMSOyZhIsCC/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-dc-six-frames",
    "category": "social",
    "title": "DC in six frames",
    "note": "Six Superman and Batman stills in a two-column grid.",
    "url": "https://www.instagram.com/animatedtimes/p/DMLLhL3oQSO/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-16",
    "highlight": false,
    "suppliedOrder": 38,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMLLhL3oQSO/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-16"
      }
    ],
    "frames": [
      {
        "asset": "at-dc-six-frames",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMLLhL3oQSO/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-superman-tomatoes",
    "category": "campaigns",
    "title": "Superman film scores",
    "note": "Eight film scores stacked with Rotten Tomatoes marks.",
    "url": "https://www.instagram.com/animatedtimes/p/DMCZuoUo5mo/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-12",
    "highlight": false,
    "suppliedOrder": 39,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DMCZuoUo5mo/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-12"
      }
    ],
    "frames": [
      {
        "asset": "at-superman-tomatoes",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DMCZuoUo5mo/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-heroes-flying",
    "category": "social",
    "title": "Heroes in flight",
    "note": "Five flight shots, each carrying its film wordmark.",
    "url": "https://www.instagram.com/animatedtimes/p/DL_6AFmObYp/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-11",
    "highlight": false,
    "suppliedOrder": 40,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DL_6AFmObYp/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-11"
      }
    ],
    "frames": [
      {
        "asset": "at-heroes-flying",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DL_6AFmObYp/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-avengers-era-timeline",
    "category": "retrospectives",
    "title": "Avengers screen timeline",
    "note": "The Avengers A changes through a five-row screen timeline.",
    "url": "https://www.instagram.com/animatedtimes/p/DL8QaTuTH3h/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-07-10",
    "highlight": false,
    "suppliedOrder": 41,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DL8QaTuTH3h/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-07-10"
      }
    ],
    "frames": [
      {
        "asset": "at-avengers-era-timeline",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DL8QaTuTH3h/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "at-marvel-character-arcs",
    "category": "social",
    "title": "Marvel character arcs",
    "note": "Five paired stills with a short line about each character arc.",
    "url": "https://www.instagram.com/animatedtimes/p/DKz_Jtvu_iQ/",
    "platform": "Instagram",
    "client": "Animated Times",
    "date": "2025-06-12",
    "highlight": false,
    "suppliedOrder": 42,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.instagram.com/animatedtimes/p/DKz_Jtvu_iQ/",
        "platform": "Instagram",
        "client": "Animated Times",
        "date": "2025-06-12"
      }
    ],
    "frames": [
      {
        "asset": "at-marvel-character-arcs",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.instagram.com/animatedtimes/p/DKz_Jtvu_iQ/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-will-smith-film-collage",
    "category": "retrospectives",
    "title": "Will Smith film collage",
    "note": "Film roles arranged around a full-length Will Smith cutout.",
    "url": "https://www.facebook.com/FandomWire/photos/will-smith-has-built-one-of-hollywoods-most-recognizable-careers-successfully-mo/1517286873764811/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "16 September at 19:41",
    "highlight": false,
    "suppliedOrder": 43,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/will-smith-has-built-one-of-hollywoods-most-recognizable-careers-successfully-mo/1517286873764811/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1517286873764811",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-will-smith-film-collage",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/will-smith-has-built-one-of-hollywoods-most-recognizable-careers-successfully-mo/1517286873764811/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-house-of-the-dragon-cast",
    "category": "retrospectives",
    "title": "House of the Dragon cast comparison",
    "note": "Character stills above the actors' portraits.",
    "url": "https://www.facebook.com/FandomWire/photos/iconic/1516770163816482/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "16 September at 06:30",
    "highlight": false,
    "suppliedOrder": 44,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/iconic/1516770163816482/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1516770163816482",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-house-of-the-dragon-cast",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/iconic/1516770163816482/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-angel-casting-comparison",
    "category": "retrospectives",
    "title": "Angel casting comparison",
    "note": "Three character cards, each with a film mark and an actor name.",
    "url": "https://www.facebook.com/FandomWire/photos/angel-in-x-men-movies-/1514172744076224/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "13 September at 09:00",
    "highlight": false,
    "suppliedOrder": 45,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/angel-in-x-men-movies-/1514172744076224/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1514172744076224",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-angel-casting-comparison",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/angel-in-x-men-movies-/1514172744076224/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-doomsday-rumor-card",
    "category": "news",
    "title": "Avengers: Doomsday rumor card",
    "note": "A character composite above a small rumour headline.",
    "url": "https://www.facebook.com/FandomWire/photos/avengers-doomsday-will-reportedly-feature-the-deths-of-three-x-men-and-two-aveng/1512079540952211/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "11 September at 00:00",
    "highlight": false,
    "suppliedOrder": 46,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/avengers-doomsday-will-reportedly-feature-the-deths-of-three-x-men-and-two-aveng/1512079540952211/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1512079540952211",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-doomsday-rumor-card",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/avengers-doomsday-will-reportedly-feature-the-deths-of-three-x-men-and-two-aveng/1512079540952211/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-peter-cullen-tribute",
    "category": "retrospectives",
    "title": "Peter Cullen tribute collage",
    "note": "A portrait-led tribute with character circles around the face.",
    "url": "https://www.facebook.com/FandomWire/photos/remembering-peter-cullen-the-legendary-voice-actor-whose-unmistakable-voice-brou/1511885164304982/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "10 September at 19:44",
    "highlight": false,
    "suppliedOrder": 47,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/remembering-peter-cullen-the-legendary-voice-actor-whose-unmistakable-voice-brou/1511885164304982/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1511885164304982",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-peter-cullen-tribute",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/remembering-peter-cullen-the-legendary-voice-actor-whose-unmistakable-voice-brou/1511885164304982/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-street-fighter-cast",
    "category": "retrospectives",
    "title": "Street Fighter cast comparison",
    "note": "Three eras of Ryu and Ken, each given its own band.",
    "url": "https://www.facebook.com/FandomWire/photos/iconic/1511397674353731/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "10 September at 07:30",
    "highlight": false,
    "suppliedOrder": 48,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/iconic/1511397674353731/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1511397674353731",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-street-fighter-cast",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/iconic/1511397674353731/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-doomsday-team-lineup",
    "category": "news",
    "title": "Avengers: Doomsday team lineup",
    "note": "Six rows of team logos and character cutouts.",
    "url": "https://www.facebook.com/FandomWire/photos/six-teams-one-massive-collision-and-doctor-doom-standing-at-the-center-avengers-/1508130104680488/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "6 September at 17:48",
    "highlight": false,
    "suppliedOrder": 49,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/six-teams-one-massive-collision-and-doctor-doom-standing-at-the-center-avengers-/1508130104680488/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1508130104680488",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-doomsday-team-lineup",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/six-teams-one-massive-collision-and-doctor-doom-standing-at-the-center-avengers-/1508130104680488/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-doomsday-matchup-list",
    "category": "news",
    "title": "Avengers: Doomsday matchup list",
    "note": "A twelve-pair lineup on a black-and-green title card.",
    "url": "https://www.facebook.com/FandomWire/photos/you-have-no-idea-how-excited-i-am/1506868198140012/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "5 September at 07:31",
    "highlight": false,
    "suppliedOrder": 50,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/you-have-no-idea-how-excited-i-am/1506868198140012/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1506868198140012",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-doomsday-matchup-list",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/you-have-no-idea-how-excited-i-am/1506868198140012/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-doctor-doom-character-card",
    "category": "data",
    "title": "Doctor Doom character card",
    "note": "Powers, abilities and a star-rated grid alongside Doctor Doom.",
    "url": "https://www.facebook.com/FandomWire/photos/its-doctor-doom-/1506676768159155/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "5 September at 01:31",
    "highlight": false,
    "suppliedOrder": 51,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/its-doctor-doom-/1506676768159155/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1506676768159155",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-doctor-doom-character-card",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/its-doctor-doom-/1506676768159155/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-avengers-poster-timeline",
    "category": "retrospectives",
    "title": "Avengers poster timeline",
    "note": "The Avengers wordmark sits over five rows of cast collages.",
    "url": "https://www.facebook.com/FandomWire/photos/avengers-/1506710164822482/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "5 September at 02:31",
    "highlight": false,
    "suppliedOrder": 52,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/avengers-/1506710164822482/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1506710164822482",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-avengers-poster-timeline",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/avengers-/1506710164822482/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-chris-tucker-film-collage",
    "category": "retrospectives",
    "title": "Chris Tucker film collage",
    "note": "A suited Chris Tucker cutout runs through a grid of his roles.",
    "url": "https://www.facebook.com/FandomWire/photos/chris-tuckers-career-is-basically-a-masterclass-in-range-and-pure-comic-energy-f/1506386874854811/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "4 September at 18:47",
    "highlight": false,
    "suppliedOrder": 53,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/chris-tuckers-career-is-basically-a-masterclass-in-range-and-pure-comic-energy-f/1506386874854811/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1506386874854811",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-chris-tucker-film-collage",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/chris-tuckers-career-is-basically-a-masterclass-in-range-and-pure-comic-energy-f/1506386874854811/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-gta-vi-activity-card",
    "category": "news",
    "title": "GTA VI activity news card",
    "note": "Four game scenes framed by the GTA VI mark and a news line.",
    "url": "https://www.facebook.com/FandomWire/photos/d41d8cd9/1501551055338393/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "30 August",
    "highlight": false,
    "suppliedOrder": 54,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/d41d8cd9/1501551055338393/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1501551055338393",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-gta-vi-activity-card",
        "width": 1080,
        "height": 1080,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/d41d8cd9/1501551055338393/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-wolverine-endgame-release",
    "category": "campaigns",
    "title": "Wolverine and Endgame release graphic",
    "note": "Two release labels paired with Wolverine and Avengers character art.",
    "url": "https://www.facebook.com/FandomWire/photos/september-2026-is-shaping-up-to-be-an-exciting-month-for-marvel-fans-with-two-ma/1499670058859826/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "28 August",
    "highlight": false,
    "suppliedOrder": 55,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/september-2026-is-shaping-up-to-be-an-exciting-month-for-marvel-fans-with-two-ma/1499670058859826/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1499670058859826",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-wolverine-endgame-release",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/september-2026-is-shaping-up-to-be-an-exciting-month-for-marvel-fans-with-two-ma/1499670058859826/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-doomsday-matchup-list-variant",
    "category": "news",
    "title": "Avengers: Doomsday matchup list variant",
    "note": "The same twelve-pair story in a second title-card treatment.",
    "url": "https://www.facebook.com/FandomWire/photos/fights-in-avengers-doomsday/1498787698948062/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "27 August",
    "highlight": false,
    "suppliedOrder": 56,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/fights-in-avengers-doomsday/1498787698948062/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1498787698948062",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-doomsday-matchup-list-variant",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/fights-in-avengers-doomsday/1498787698948062/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-tim-curry-tribute",
    "category": "retrospectives",
    "title": "Tim Curry tribute collage",
    "note": "An actor portrait above a collage of his roles.",
    "url": "https://www.facebook.com/FandomWire/photos/tim-curry-has-sadly-passed-away-at-the-age-of-80/1498484375645061/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "26 August",
    "highlight": false,
    "suppliedOrder": 57,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/tim-curry-has-sadly-passed-away-at-the-age-of-80/1498484375645061/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1498484375645061",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-tim-curry-tribute",
        "width": 1350,
        "height": 1687,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/tim-curry-has-sadly-passed-away-at-the-age-of-80/1498484375645061/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-x-men-casting-rumor",
    "category": "news",
    "title": "X-Men casting rumor card",
    "note": "Actor portraits, comic art and a casting-rumour headline.",
    "url": "https://www.facebook.com/FandomWire/photos/the-cast-of-marvel-studios-upcoming-x-men-movie-has-reportedly-signed-deals-that/1497797412380424/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "26 August",
    "highlight": false,
    "suppliedOrder": 58,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/the-cast-of-marvel-studios-upcoming-x-men-movie-has-reportedly-signed-deals-that/1497797412380424/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1497797412380424",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-x-men-casting-rumor",
        "width": 1080,
        "height": 1440,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/the-cast-of-marvel-studios-upcoming-x-men-movie-has-reportedly-signed-deals-that/1497797412380424/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-endgame-doomsday-release",
    "category": "campaigns",
    "title": "Endgame and Doomsday release graphic",
    "note": "Purple and green title cards, each anchored by a large date.",
    "url": "https://www.facebook.com/FandomWire/photos/the-avengers-are-coming-back-to-the-big-screen-avengers-endgame-is-reportedly-se/1493285759498256/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "21 August",
    "highlight": false,
    "suppliedOrder": 59,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/the-avengers-are-coming-back-to-the-big-screen-avengers-endgame-is-reportedly-se/1493285759498256/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1493285759498256",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-endgame-doomsday-release",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/the-avengers-are-coming-back-to-the-big-screen-avengers-endgame-is-reportedly-se/1493285759498256/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-marvel-villains-ranking",
    "category": "data",
    "title": "Marvel villains ranking",
    "note": "Ten characters in a two-column ranking, each with a short ability list.",
    "url": "https://www.facebook.com/FandomWire/photos/marvel-has-no-shortage-of-terrifying-villains-but-who-deserves-the-top-spot-from/1493284159498416/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "21 August",
    "highlight": false,
    "suppliedOrder": 60,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/marvel-has-no-shortage-of-terrifying-villains-but-who-deserves-the-top-spot-from/1493284159498416/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1493284159498416",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-marvel-villains-ranking",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/marvel-has-no-shortage-of-terrifying-villains-but-who-deserves-the-top-spot-from/1493284159498416/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-scarlet-witch-timeline",
    "category": "retrospectives",
    "title": "Scarlet Witch screen timeline",
    "note": "Live action and animation arranged around a screen timeline.",
    "url": "https://www.facebook.com/FandomWire/photos/scarlet-witch-has-become-one-of-marvels-most-powerful-and-complex-characters-acr/1492467559580076/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "20 August",
    "highlight": false,
    "suppliedOrder": 61,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/scarlet-witch-has-become-one-of-marvels-most-powerful-and-complex-characters-acr/1492467559580076/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1492467559580076",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-scarlet-witch-timeline",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/scarlet-witch-has-become-one-of-marvels-most-powerful-and-complex-characters-acr/1492467559580076/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-mutant-saga-logo-lineup",
    "category": "news",
    "title": "Mutant Saga logo lineup",
    "note": "Film marks laid out beneath a single saga title.",
    "url": "https://www.facebook.com/FandomWire/photos/the-mcus-next-major-chapter-could-be-packed-with-some-of-marvels-most-iconic-cha/1489080233252142/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "16 August",
    "highlight": false,
    "suppliedOrder": 62,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/the-mcus-next-major-chapter-could-be-packed-with-some-of-marvels-most-iconic-cha/1489080233252142/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1489080233252142",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-mutant-saga-logo-lineup",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/the-mcus-next-major-chapter-could-be-packed-with-some-of-marvels-most-iconic-cha/1489080233252142/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-hulk-screen-timeline",
    "category": "retrospectives",
    "title": "Hulk screen timeline",
    "note": "Movie marks and character poses orbit a central Hulk cutout.",
    "url": "https://www.facebook.com/FandomWire/photos/from-2008-to-2026-the-hulk-has-gone-through-one-of-the-mcus-most-noticeable-tran/1487649566728542/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "14 August",
    "highlight": false,
    "suppliedOrder": 63,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/from-2008-to-2026-the-hulk-has-gone-through-one-of-the-mcus-most-noticeable-tran/1487649566728542/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1487649566728542",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-hulk-screen-timeline",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/from-2008-to-2026-the-hulk-has-gone-through-one-of-the-mcus-most-noticeable-tran/1487649566728542/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-daredevil-punisher-comparison",
    "category": "retrospectives",
    "title": "Daredevil and Punisher comparison",
    "note": "Four character portraits on paper-white, with names tucked under each image.",
    "url": "https://www.facebook.com/FandomWire/photos/from-netflixs-daredevil-to-the-mcus-daredevil-born-again-and-from-the-punishers-/1486209663539199/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "13 August",
    "highlight": false,
    "suppliedOrder": 64,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/from-netflixs-daredevil-to-the-mcus-daredevil-born-again-and-from-the-punishers-/1486209663539199/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1486209663539199",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-daredevil-punisher-comparison",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/from-netflixs-daredevil-to-the-mcus-daredevil-born-again-and-from-the-punishers-/1486209663539199/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-jean-grey-casting-timeline",
    "category": "retrospectives",
    "title": "Jean Grey casting timeline",
    "note": "Three portraits, three year labels and a comic-book backdrop.",
    "url": "https://www.facebook.com/FandomWire/photos/the-evolution-of-jean-grey-on-screen-is-fascinating-famke-janssen-first-brought-/1482649253895240/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "9 August",
    "highlight": false,
    "suppliedOrder": 65,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/the-evolution-of-jean-grey-on-screen-is-fascinating-famke-janssen-first-brought-/1482649253895240/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1482649253895240",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-jean-grey-casting-timeline",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/the-evolution-of-jean-grey-on-screen-is-fascinating-famke-janssen-first-brought-/1482649253895240/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-lateef-crowder-action-collage",
    "category": "retrospectives",
    "title": "Lateef Crowder action collage",
    "note": "A central portrait surrounded by action-film roles and wordmarks.",
    "url": "https://www.facebook.com/FandomWire/photos/lateef-crowder-is-a-highly-respected-stunt-performer-martial-artist-and-actor-kn/1481791193981046/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "8 August",
    "highlight": false,
    "suppliedOrder": 66,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/lateef-crowder-is-a-highly-respected-stunt-performer-martial-artist-and-actor-kn/1481791193981046/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1481791193981046",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-lateef-crowder-action-collage",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/lateef-crowder-is-a-highly-respected-stunt-performer-martial-artist-and-actor-kn/1481791193981046/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-spider-man-friendships",
    "category": "retrospectives",
    "title": "Spider-Man friendships comparison",
    "note": "Three Peter Parkers paired with friends from their films.",
    "url": "https://www.facebook.com/FandomWire/photos/one-thing-every-live-action-spider-man-franchise-gets-right-is-giving-peter-park/1480810397412459/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "7 August",
    "highlight": false,
    "suppliedOrder": 67,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/one-thing-every-live-action-spider-man-franchise-gets-right-is-giving-peter-park/1480810397412459/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1480810397412459",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-spider-man-friendships",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/one-thing-every-live-action-spider-man-franchise-gets-right-is-giving-peter-park/1480810397412459/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-cyclops-visor-timeline",
    "category": "retrospectives",
    "title": "Cyclops visor timeline",
    "note": "Three visor close-ups, with X-Men and Avengers marks between them.",
    "url": "https://www.facebook.com/FandomWire/photos/cyclops-visor-has-come-a-long-way-on-the-big-screen-from-the-iconic-red-lensed-d/1480348937458605/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "6 August",
    "highlight": false,
    "suppliedOrder": 68,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/cyclops-visor-has-come-a-long-way-on-the-big-screen-from-the-iconic-red-lensed-d/1480348937458605/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1480348937458605",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-cyclops-visor-timeline",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/cyclops-visor-has-come-a-long-way-on-the-big-screen-from-the-iconic-red-lensed-d/1480348937458605/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-marvel-box-office-comparison",
    "category": "data",
    "title": "Marvel box-office comparison",
    "note": "Two films, two box-office totals and matching character collages.",
    "url": "https://www.facebook.com/FandomWire/photos/history-repeated-itself-at-the-box-office-avengers-endgame-became-the-fastest-fi/1478666407626858/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "4 August",
    "highlight": false,
    "suppliedOrder": 69,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/history-repeated-itself-at-the-box-office-avengers-endgame-became-the-fastest-fi/1478666407626858/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1478666407626858",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-marvel-box-office-comparison",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/history-repeated-itself-at-the-box-office-avengers-endgame-became-the-fastest-fi/1478666407626858/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-tom-holland-before-after",
    "category": "retrospectives",
    "title": "Tom Holland before-and-after graphic",
    "note": "Two shirtless portraits with oversized age labels.",
    "url": "https://www.facebook.com/FandomWire/photos/tom-holland-has-officially-turned-30-and-fans-still-cant-believe-how-much-hes-ch/1477969674363198/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "4 August",
    "highlight": false,
    "suppliedOrder": 70,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/tom-holland-has-officially-turned-30-and-fans-still-cant-believe-how-much-hes-ch/1477969674363198/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1477969674363198",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-tom-holland-before-after",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/tom-holland-has-officially-turned-30-and-fans-still-cant-believe-how-much-hes-ch/1477969674363198/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-spider-man-superman-quote",
    "category": "news",
    "title": "Spider-Man vs Superman quote card",
    "note": "Three character cutouts above a quote-led news line.",
    "url": "https://www.facebook.com/FandomWire/photos/tom-holland-doesnt-think-spider-man-would-beat-superman-in-a-one-on-one-fight-wh/1473204808173018/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "29 July",
    "highlight": false,
    "suppliedOrder": 71,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/tom-holland-doesnt-think-spider-man-would-beat-superman-in-a-one-on-one-fight-wh/1473204808173018/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1473204808173018",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-spider-man-superman-quote",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/tom-holland-doesnt-think-spider-man-would-beat-superman-in-a-one-on-one-fight-wh/1473204808173018/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-ghost-rider-casting-lineup",
    "category": "retrospectives",
    "title": "Ghost Rider casting lineup",
    "note": "Four actor cards, each with a universe label and Ghost Rider art.",
    "url": "https://www.facebook.com/FandomWire/photos/ghost-rider-has-taken-many-forms-across-marvels-live-action-universe-with-each-v/1472702214889944/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "29 July",
    "highlight": false,
    "suppliedOrder": 72,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/ghost-rider-has-taken-many-forms-across-marvels-live-action-universe-with-each-v/1472702214889944/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1472702214889944",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-ghost-rider-casting-lineup",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/ghost-rider-has-taken-many-forms-across-marvels-live-action-universe-with-each-v/1472702214889944/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  },
  {
    "slug": "fw-ghost-rider-spider-noir-cover",
    "category": "news",
    "title": "Ghost Rider and Spider-Noir news card",
    "note": "Three character portraits merge into a single news cover.",
    "url": "https://www.facebook.com/FandomWire/photos/robert-downey-jr-has-shared-that-hed-love-to-see-ryan-goslings-ghost-rider-team-/1471697268323772/",
    "platform": "Facebook",
    "client": "FandomWire",
    "date": null,
    "sourceDateLabel": "28 July",
    "highlight": false,
    "suppliedOrder": 73,
    "nsfw": false,
    "contentWarning": null,
    "carouselCount": null,
    "sources": [
      {
        "url": "https://www.facebook.com/FandomWire/photos/robert-downey-jr-has-shared-that-hed-love-to-see-ryan-goslings-ghost-rider-team-/1471697268323772/",
        "suppliedUrl": "https://www.facebook.com/photo/?fbid=1471697268323772",
        "platform": "Facebook",
        "client": "FandomWire",
        "date": null
      }
    ],
    "frames": [
      {
        "asset": "fw-ghost-rider-spider-noir-cover",
        "width": 1080,
        "height": 1350,
        "position": 1,
        "sourceUrl": "https://www.facebook.com/FandomWire/photos/robert-downey-jr-has-shared-that-hed-love-to-see-ryan-goslings-ghost-rider-team-/1471697268323772/",
        "nsfw": false,
        "contentWarning": null
      }
    ]
  }
];

export const posts = [
  ...existingPosts.map((post) => ({
    ...post,
    client: "FandomWire",
    date: legacyMetadata[post.slug].date,
    suppliedOrder: legacyMetadata[post.slug].suppliedOrder,
    highlight: false,
    nsfw: false,
    contentWarning: null,
    carouselCount: null,
    sources: [{ url: post.url, platform: post.platform, client: "FandomWire", date: legacyMetadata[post.slug].date }],
    frames: [{ asset: post.slug, width: legacyMetadata[post.slug].width, height: legacyMetadata[post.slug].height, position: 1, sourceUrl: post.url, nsfw: false, contentWarning: null }],
  })),
  ...suppliedPosts,
].sort((a, b) => {
  if (a.highlight !== b.highlight) return a.highlight ? -1 : 1;
  if (!a.highlight) {
    const dateOrder = (b.date || "").localeCompare(a.date || "");
    if (dateOrder) return dateOrder;
  }
  return a.suppliedOrder - b.suppliedOrder;
});
