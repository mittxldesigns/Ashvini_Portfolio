// Ashvini's artist side: digital paintings, poster concepts and pencil work from his Instagram
// (instagram.com/ashvini_kmr). Plain data, safe to import from Node (prerender / SEO).
// Medium and notes come from his own captions.

export const SKETCH_CHAPTERS = [
  { id: "posters", label: "Poster concepts", hand: "posters", blurb: "Film posters I wish existed, painted from scratch in Photoshop." },
  { id: "characters", label: "Characters & scene studies", hand: "characters", blurb: "Movie and game stills redrawn to learn light, skin and mood." },
  { id: "paper", label: "On paper", hand: "graphite & ink", blurb: "Where it started: graphite fan art, then paid ink covers." },
  { id: "portraits", label: "Portraits", hand: "faces", blurb: "Faces, including my own." },
];

const ig = (code) => `https://www.instagram.com/p/${code}/`;

export const sketches = [
  // posters
  { slug: "batman-part-ii-akira", chapter: "posters", title: "The Batman Part II × Akira", medium: "Photoshop 2022", year: 2026, note: "A concept poster mixing The Batman with Akira. The Court of Owls went in at the very end.", url: ig("DdlPRkPRZJF") },
  { slug: "spider-man-brand-new-day", chapter: "posters", title: "Spider-Man: Brand New Day", medium: "Photoshop", year: 2026, note: "Fan poster around the idea of Spider-Man's rebirth between lifecycles.", url: ig("DaIW6dCkc8M") },
  { slug: "superman-punk-rock", chapter: "posters", title: "Superman: Kindness Is Punk Rock", medium: "Photoshop 2021", year: 2025, note: "A James Gunn-era Superman poster. Had to trust the process on this one.", url: ig("DMbzeH9yHIS") },
  { slug: "monkey-man", chapter: "posters", title: "Monkey Man", medium: "Photoshop", year: 2024, note: "Started as an experiment because the original poster looked so good.", url: ig("C6qUBLKyPt7") },
  { slug: "pulp-fiction", chapter: "posters", title: "Pulp Fiction", medium: "Photoshop", year: 2024, note: "The Mia Wallace poster, repainted.", url: ig("C5LbQ6Gye0i") },
  { slug: "the-batman-rain", chapter: "posters", title: "The Batman: Halloween", medium: "Photoshop", year: 2024, note: "Gotham on Halloween night, after Batman's journal entry from the film.", url: ig("C3paNEdy5Sd") },
  { slug: "songbird", chapter: "posters", title: "Songbird, Phantom Liberty", medium: "Photoshop 2022", year: 2025, note: "Meant as practice, ended up fully rendered, with a dossier-style layout.", url: ig("DL1IDWHhnq_") },
  // characters
  { slug: "spider-noir", chapter: "characters", title: "Spider-Noir", medium: "Photoshop", year: 2026, note: "Concept art for the Nicolas Cage Spider-Noir series.", url: ig("DZSSV3JlAI-") },
  { slug: "arthur-morgan", chapter: "characters", title: "Arthur Morgan", medium: "Photoshop", year: 2025, note: "You're a good man, Arthur Morgan. Red Dead Redemption 2.", url: ig("DFunbudSrVv") },
  { slug: "leon-scene-study", chapter: "characters", title: "Léon: The Professional", medium: "Photoshop", year: 2025, note: "Scene study of Mathilda by the window.", url: ig("DH1traqzRnc") },
  { slug: "silver-surfer", chapter: "characters", title: "Silver Surfer", medium: "Photoshop 2022", year: 2025, note: "From The Fantastic Four: First Steps.", url: ig("DOKeMbzkrkI") },
  { slug: "loki-scene-study", chapter: "characters", title: "Loki, Season 2", medium: "Photoshop", year: 2023, note: "A more minimal rendering approach, with less blending.", url: ig("C0OVBCWSaJD") },
  { slug: "joi-blade-runner", chapter: "characters", title: "Joi, Blade Runner 2049", medium: "Photoshop 2020", year: 2023, note: "Scene study that taught me a lot about rendering.", url: ig("Cr725f7P5WJ") },
  { slug: "bruce-wayne", chapter: "characters", title: "Bruce Wayne, The Batman", medium: "Photoshop", year: 2023, note: "Robert Pattinson after hours of rendering.", url: ig("CpmxCQyPslm") },
  { slug: "ellie", chapter: "characters", title: "Ellie, The Last of Us", medium: "Photoshop", year: 2023, note: "From the series adaptation.", url: ig("CoTzDx0PD9G") },
  { slug: "kim-and-jimmy", chapter: "characters", title: "Kim & Jimmy, Better Call Saul", medium: "Photoshop", year: 2024, note: "A value study in black and white.", url: ig("C3QXBbPynlj") },
  { slug: "jane-breaking-bad", chapter: "characters", title: "Jane, Breaking Bad", medium: "Photoshop 2020", year: 2024, note: "Around six to seven hours.", url: ig("C29_vz3SmcH") },
  { slug: "lucy-edgerunners", chapter: "characters", title: "Lucy, Cyberpunk: Edgerunners", medium: "Photoshop", year: 2022, note: "Learned a lot of rendering techniques on this one.", url: ig("Ckk9yWDvpXm") },
  // paper
  { slug: "akira-commission", chapter: "paper", title: "Akira", medium: "Ink on paper · commission", year: 2020, note: "A commissioned Akira piece. That film was a masterpiece.", url: ig("CC-8SZ7hkCD") },
  { slug: "manga-cover-commission", chapter: "paper", title: "Manga cover", medium: "Ink on paper · commission", year: 2020, note: "Cover art for a commissioned manga.", url: ig("CERJb2aB256") },
  { slug: "dc-cover-commission", chapter: "paper", title: "DC comics cover", medium: "Ink on paper · commission", year: 2020, note: "A DC cover, and my 100th post.", url: ig("CDDYcYiBIk6") },
  { slug: "batman-cover-commission", chapter: "paper", title: "Batman cover", medium: "Ink on paper · commission", year: 2020, note: "Another commissioned Batman cover.", url: ig("CD58gkfBoAa") },
  { slug: "captain-marvel-graphite", chapter: "paper", title: "Captain Marvel", medium: "Graphite pencils", year: 2019, note: "20+ hours with HB to 2B pencils.", url: ig("BxWYJmUlPd6") },
  { slug: "master-chief-sketch", chapter: "paper", title: "Master Chief", medium: "Pencil", year: 2019, note: "Almost 20 hours.", url: ig("Bs4k0QSFHCd") },
  { slug: "venom-sketch", chapter: "paper", title: "Venom", medium: "Pencil", year: 2018, note: "16 hours, challenging and fun.", url: ig("BlXBxDGhA8n") },
  { slug: "deadpool-first-sketch", chapter: "paper", title: "Deadpool", medium: "Pencil", year: 2017, note: "One of my very first fan-art sketches.", url: ig("BUJqHtDg2lo") },
  // portraits
  { slug: "self-portrait", chapter: "portraits", title: "Self portrait", medium: "Photoshop", year: 2024, note: "Professional drawer, apparently.", url: ig("DCb0oTlydmP") },
  { slug: "bangles-study", chapter: "portraits", title: "Bangles", medium: "Photoshop", year: 2026, note: "Painting study, reference by @siimipie.", url: ig("DYl7YIfRXDk") },
];

export const SKETCH_TIMELINE = [
  { year: "2017", note: "first fan-art sketches: Deadpool, Goku, Scorpion", slug: "deadpool-first-sketch" },
  { year: "2018", note: "16 hours on one Venom drawing", slug: "venom-sketch" },
  { year: "2020", note: "first paid commissions: manga, DC and Akira covers", slug: "akira-commission" },
  { year: "2023", note: "Photoshop scene studies: Loki, Joi, Ellie", slug: "loki-scene-study" },
  { year: "2026", note: "film poster concepts", slug: "batman-part-ii-akira" },
];
