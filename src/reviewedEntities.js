// Source-supported additions from the 2026-09-07 two-model NER review.
// Evidence lists archive record IDs inspected in context, not verified occurrence counts.
// Keep unreviewed model candidates separate from this public recognition catalogue.
export const REVIEWED_ENTITIES = [
  {
    "id": "facebook",
    "name": "Facebook",
    "type": "Business",
    "aliases": [
      "Facebook"
    ],
    "evidence": [
      4564,
      4569
    ],
    "reviewNote": "Named platform/company, not previously in the dictionary."
  },
  {
    "id": "gifford-hall",
    "name": "Gifford Hall",
    "type": "Building",
    "aliases": [
      "Gifford Hall"
    ],
    "evidence": [
      67,
      751
    ],
    "reviewNote": "Explicit residence-hall name; model PERSON labels should not be accepted."
  },
  {
    "id": "ncaa",
    "name": "NCAA",
    "type": "Organization",
    "aliases": [
      "NCAA"
    ],
    "evidence": [
      250,
      423
    ],
    "reviewNote": "Athletic organization named in tournament context."
  },
  {
    "id": "springfest",
    "name": "Springfest",
    "type": "Misc.",
    "aliases": [
      "Springfest"
    ],
    "evidence": [
      6288,
      6328
    ],
    "reviewNote": "Named event/weekend; model GPE label is inappropriate in these examples."
  },
  {
    "id": "vax",
    "name": "VAX",
    "type": "Misc.",
    "aliases": [
      "VAX"
    ],
    "evidence": [
      222,
      463
    ],
    "reviewNote": "Named computing system; add a technology category if included in the explorer."
  },
  {
    "id": "dukettes",
    "name": "Dukettes",
    "type": "Organization",
    "aliases": [
      "Dukettes"
    ],
    "evidence": [
      1230,
      1671
    ],
    "reviewNote": "Named dance team, not a building."
  },
  {
    "id": "virginia-tech",
    "name": "Virginia Tech",
    "type": "University",
    "aliases": [
      "Virginia Tech"
    ],
    "evidence": [
      3829,
      4898
    ],
    "reviewNote": "University name explicit in source."
  },
  {
    "id": "student-success-center",
    "name": "Student Success Center",
    "type": "Building",
    "aliases": [
      "Student Success Center"
    ],
    "evidence": [
      9047,
      9112
    ],
    "reviewNote": "Named campus building; SSC is a proposed context-dependent alias."
  },
  {
    "id": "miller-hall",
    "name": "Miller Hall",
    "type": "Building",
    "aliases": [
      "Miller Hall"
    ],
    "evidence": [
      570,
      803
    ],
    "reviewNote": "Explicit campus building name."
  },
  {
    "id": "white-hall",
    "name": "White Hall",
    "type": "Building",
    "aliases": [
      "White Hall"
    ],
    "evidence": [
      754,
      952
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "top-dog",
    "name": "Top Dog",
    "type": "Business",
    "aliases": [
      "Top Dog"
    ],
    "evidence": [
      5402,
      5740
    ],
    "reviewNote": "Named dining location, not a work of art in these examples."
  },
  {
    "id": "jmu-bookstore",
    "name": "JMU Bookstore",
    "type": "Business",
    "aliases": [
      "JMU Bookstore"
    ],
    "evidence": [
      475,
      621
    ],
    "reviewNote": "Named campus store."
  },
  {
    "id": "chandler-hall",
    "name": "Chandler Hall",
    "type": "Building",
    "aliases": [
      "Chandler Hall"
    ],
    "evidence": [
      728,
      2754
    ],
    "reviewNote": "Explicit campus building name; retain historical name."
  },
  {
    "id": "hanson-hall",
    "name": "Hanson Hall",
    "type": "Building",
    "aliases": [
      "Hanson Hall"
    ],
    "evidence": [
      775,
      1069
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "hoffman-hall",
    "name": "Hoffman Hall",
    "type": "Building",
    "aliases": [
      "Hoffman Hall"
    ],
    "evidence": [
      66,
      303
    ],
    "reviewNote": "Explicit campus building name."
  },
  {
    "id": "garber-hall",
    "name": "Garber Hall",
    "type": "Building",
    "aliases": [
      "Garber Hall"
    ],
    "evidence": [
      389,
      731
    ],
    "reviewNote": "Explicit residence-hall name; PERSON label is incorrect in these examples."
  },
  {
    "id": "bell-hall",
    "name": "Bell Hall",
    "type": "Building",
    "aliases": [
      "Bell Hall"
    ],
    "evidence": [
      413,
      2286
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "wayland-hall",
    "name": "Wayland Hall",
    "type": "Building",
    "aliases": [
      "Wayland Hall"
    ],
    "evidence": [
      881,
      1055
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "camp-heartland",
    "name": "Camp Heartland",
    "type": "Organization",
    "aliases": [
      "Camp Heartland"
    ],
    "evidence": [
      902,
      998
    ],
    "reviewNote": "Named camp/charitable program; organization-place distinction should be documented."
  },
  {
    "id": "saferides",
    "name": "SafeRides",
    "type": "Organization",
    "aliases": [
      "SafeRides"
    ],
    "evidence": [
      5037,
      5558
    ],
    "reviewNote": "Named volunteer transport service."
  },
  {
    "id": "java-city",
    "name": "Java City",
    "type": "Business",
    "aliases": [
      "Java City"
    ],
    "evidence": [
      5153,
      5371
    ],
    "reviewNote": "Coffee venue, not a city in these examples."
  },
  {
    "id": "potty-mouth",
    "name": "Potty Mouth",
    "type": "Misc.",
    "aliases": [
      "Potty Mouth"
    ],
    "evidence": [
      4990,
      5749
    ],
    "reviewNote": "Named publication. Do not label it as a person or conflate its title with its staff."
  },
  {
    "id": "zeta-tau-alpha",
    "name": "Zeta Tau Alpha",
    "type": "Organization",
    "aliases": [
      "Zeta Tau Alpha"
    ],
    "evidence": [
      368,
      412
    ],
    "reviewNote": "Named student organization, not a person."
  },
  {
    "id": "gcom",
    "name": "GCOM",
    "type": "Misc.",
    "aliases": [
      "GCOM"
    ],
    "caseSensitive": true,
    "evidence": [
      2774,
      3169
    ],
    "reviewNote": "Named course/program shorthand. Not a person; course codes need their own scope decision."
  },
  {
    "id": "virginia",
    "name": "Virginia",
    "type": "Place",
    "aliases": [
      "Virginia"
    ],
    "evidence": [
      151,
      373
    ],
    "reviewNote": "State explicitly named."
  },
  {
    "id": "darts-and-pats",
    "name": "Darts & Pats",
    "type": "Misc.",
    "aliases": [
      "Darts & Pats"
    ],
    "caseSensitive": true,
    "evidence": [
      58,
      1596
    ],
    "reviewNote": "Named newspaper column, separate from the newspaper itself; generic entry-type uses need occurrence review."
  },
  {
    "id": "homecoming",
    "name": "Homecoming",
    "type": "Misc.",
    "aliases": [
      "Homecoming"
    ],
    "evidence": [
      665,
      675
    ],
    "reviewNote": "Campus event series, not a facility or language. Distinguish occurrences by year."
  },
  {
    "id": "steakhouse",
    "name": "Steakhouse",
    "type": "Business",
    "aliases": [
      "Steakhouse"
    ],
    "evidence": [
      102,
      337
    ],
    "reviewNote": "Named campus food venue in these records. Source 337 describes historical name changes; do not flatten them silently."
  },
  {
    "id": "hhs",
    "name": "HHS",
    "type": "Building",
    "aliases": [
      "HHS"
    ],
    "caseSensitive": true,
    "evidence": [
      3544,
      4562
    ],
    "reviewNote": "Campus building shorthand in the examples; expansion requires authoritative campus documentation."
  },
  {
    "id": "dunkin",
    "name": "Dunkin",
    "type": "Business",
    "aliases": [
      "Dunkin"
    ],
    "evidence": [
      9807,
      10011
    ],
    "reviewNote": "Named business; OCR apostrophe variants should be preserved and reviewed for merging."
  },
  {
    "id": "chick-fil-a",
    "name": "Chick-fil-A",
    "type": "Business",
    "aliases": [
      "Chick-fil-A"
    ],
    "evidence": [
      2327,
      2380
    ],
    "reviewNote": "Explicit named dining business."
  },
  {
    "id": "let-s-go",
    "name": "Let's Go",
    "type": "Business",
    "aliases": [
      "Let's Go"
    ],
    "caseSensitive": true,
    "evidence": [
      724,
      785
    ],
    "reviewNote": "Named campus dining venue in these contexts, not generic exhortation or creative work."
  },
  {
    "id": "ipod",
    "name": "iPod",
    "type": "Misc.",
    "aliases": [
      "iPod"
    ],
    "evidence": [
      3697,
      3899
    ],
    "reviewNote": "Named device/product. Does not imply praise or criticism of the manufacturer."
  },
  {
    "id": "flex",
    "name": "FLEX",
    "type": "Misc.",
    "aliases": [
      "FLEX"
    ],
    "caseSensitive": true,
    "evidence": [
      468,
      486
    ],
    "reviewNote": "Named campus payment/account service. Not a standalone organization."
  },
  {
    "id": "i-81",
    "name": "I-81",
    "type": "Place",
    "aliases": [
      "I-81"
    ],
    "evidence": [
      481,
      697
    ],
    "reviewNote": "Named road; can be linked to Interstate 81 after alias review."
  },
  {
    "id": "greek-sing",
    "name": "Greek Sing",
    "type": "Misc.",
    "aliases": [
      "Greek Sing"
    ],
    "evidence": [
      296,
      1059
    ],
    "reviewNote": "Named campus competition/tradition."
  },
  {
    "id": "d-c",
    "name": "D.C.",
    "type": "Place",
    "aliases": [
      "D.C."
    ],
    "evidence": [
      303,
      1214
    ],
    "reviewNote": "Washington, D.C. abbreviation supported by explicit name in 303."
  },
  {
    "id": "warsaw-parking-deck",
    "name": "Warsaw Parking Deck",
    "type": "Building",
    "aliases": [
      "Warsaw Parking Deck"
    ],
    "evidence": [
      4938,
      8013
    ],
    "reviewNote": "Explicit named campus parking structure."
  },
  {
    "id": "jeep",
    "name": "Jeep",
    "type": "Misc.",
    "aliases": [
      "Jeep"
    ],
    "evidence": [
      1270,
      1354
    ],
    "reviewNote": "Named vehicle brand/product in source; not necessarily the company as sentiment target."
  },
  {
    "id": "madison-project",
    "name": "Madison Project",
    "type": "Organization",
    "aliases": [
      "Madison Project"
    ],
    "evidence": [
      1797,
      1871
    ],
    "reviewNote": "Named performing group."
  },
  {
    "id": "twitter",
    "name": "Twitter",
    "type": "Business",
    "aliases": [
      "Twitter"
    ],
    "evidence": [
      6016,
      7428
    ],
    "reviewNote": "Named platform; retain historical source name rather than silently renaming."
  },
  {
    "id": "alpha-kappa-lambda",
    "name": "Alpha Kappa Lambda",
    "type": "Organization",
    "aliases": [
      "Alpha Kappa Lambda"
    ],
    "evidence": [
      235,
      342
    ],
    "reviewNote": "Explicit named fraternity."
  },
  {
    "id": "caa",
    "name": "CAA",
    "type": "Organization",
    "aliases": [
      "CAA"
    ],
    "evidence": [
      258,
      533
    ],
    "reviewNote": "Source 533 supplies historical expansion Colonial Athletic Association. Do not replace historical names silently."
  },
  {
    "id": "lakeside",
    "name": "Lakeside",
    "type": "Place",
    "aliases": [
      "Lakeside"
    ],
    "evidence": [
      1197,
      1272
    ],
    "reviewNote": "Named campus area in examples. Distinguish area from individual facilities within it."
  },
  {
    "id": "netflix",
    "name": "Netflix",
    "type": "Business",
    "aliases": [
      "Netflix"
    ],
    "evidence": [
      7833,
      8338
    ],
    "reviewNote": "Named streaming platform."
  },
  {
    "id": "sheetz",
    "name": "Sheetz",
    "type": "Business",
    "aliases": [
      "Sheetz"
    ],
    "evidence": [
      3501,
      4141
    ],
    "reviewNote": "Named store/business, not a person."
  },
  {
    "id": "chesapeake-hall",
    "name": "Chesapeake Hall",
    "type": "Building",
    "aliases": [
      "Chesapeake Hall"
    ],
    "evidence": [
      2567,
      2636
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "duke-hall",
    "name": "Duke Hall",
    "type": "Building",
    "aliases": [
      "Duke Hall"
    ],
    "evidence": [
      723,
      739
    ],
    "reviewNote": "Explicit campus building name."
  },
  {
    "id": "forest-hills",
    "name": "Forest Hills",
    "type": "Place",
    "aliases": [
      "Forest Hills"
    ],
    "evidence": [
      1084,
      1202
    ],
    "reviewNote": "Named local destination in transport context; housing classification would need additional evidence."
  },
  {
    "id": "olde-mill",
    "name": "Olde Mill",
    "type": "Place",
    "aliases": [
      "Olde Mill"
    ],
    "evidence": [
      978,
      1101
    ],
    "reviewNote": "Named local place; keep distinct from nearby University Place and the shop mentioned in 1101."
  },
  {
    "id": "star-wars",
    "name": "Star Wars",
    "type": "Misc.",
    "aliases": [
      "Star Wars"
    ],
    "evidence": [
      1031,
      1409
    ],
    "reviewNote": "Named film/franchise/theme, outside original campus-institution types."
  },
  {
    "id": "z-lot",
    "name": "Z-lot",
    "type": "Place",
    "aliases": [
      "Z-lot"
    ],
    "evidence": [
      251,
      554
    ],
    "reviewNote": "Named campus parking lot; space/hyphen variants grouped."
  },
  {
    "id": "valley-mall",
    "name": "Valley Mall",
    "type": "Business",
    "aliases": [
      "Valley Mall"
    ],
    "evidence": [
      120,
      1650
    ],
    "reviewNote": "Named shopping location. Cinema is a related venue, not necessarily identical to the whole mall."
  },
  {
    "id": "alpha-sigma-alpha",
    "name": "Alpha Sigma Alpha",
    "type": "Organization",
    "aliases": [
      "Alpha Sigma Alpha"
    ],
    "evidence": [
      894,
      1181
    ],
    "reviewNote": "Explicit named sorority."
  },
  {
    "id": "ashby-crossing",
    "name": "Ashby Crossing",
    "type": "Housing",
    "aliases": [
      "Ashby Crossing"
    ],
    "evidence": [
      882,
      1598
    ],
    "reviewNote": "Explicit property/residential management context."
  },
  {
    "id": "care",
    "name": "CARE",
    "type": "Organization",
    "aliases": [
      "CARE"
    ],
    "caseSensitive": true,
    "evidence": [
      1004,
      1028
    ],
    "reviewNote": "Named campus group in context; no acronym expansion inferred."
  },
  {
    "id": "chipotle",
    "name": "Chipotle",
    "type": "Business",
    "aliases": [
      "Chipotle"
    ],
    "evidence": [
      6739,
      6818
    ],
    "reviewNote": "Named dining business, not a NORP group."
  },
  {
    "id": "frederikson-hall",
    "name": "Frederikson Hall",
    "type": "Building",
    "aliases": [
      "Frederikson Hall"
    ],
    "evidence": [
      745,
      847
    ],
    "reviewNote": "Explicit hall name as spelled in source; historical/spelling variants need separate review."
  },
  {
    "id": "hillside-hall",
    "name": "Hillside Hall",
    "type": "Building",
    "aliases": [
      "Hillside Hall"
    ],
    "evidence": [
      1063,
      2375
    ],
    "reviewNote": "Explicit hall name, distinct from broad Hillside Area."
  },
  {
    "id": "potomac-hall",
    "name": "Potomac Hall",
    "type": "Building",
    "aliases": [
      "Potomac Hall"
    ],
    "evidence": [
      2096,
      2291
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "shorts-hall",
    "name": "Shorts Hall",
    "type": "Building",
    "aliases": [
      "Shorts Hall"
    ],
    "evidence": [
      1083,
      1156
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "wampler-hall",
    "name": "Wampler Hall",
    "type": "Building",
    "aliases": [
      "Wampler Hall"
    ],
    "evidence": [
      1662,
      1808
    ],
    "reviewNote": "Explicit residence-hall name."
  },
  {
    "id": "women-s-resource-center",
    "name": "Women's Resource Center",
    "type": "Organization",
    "aliases": [
      "Women's Resource Center"
    ],
    "evidence": [
      448,
      454
    ],
    "reviewNote": "Named campus center, with explicit founding/location context."
  },
  {
    "id": "canvas",
    "name": "Canvas",
    "type": "Misc.",
    "aliases": [
      "Canvas"
    ],
    "caseSensitive": true,
    "evidence": [
      8772,
      8775
    ],
    "reviewNote": "Named educational platform, not a person or a literal art material in these examples."
  },
  {
    "id": "delta-sigma-pi",
    "name": "Delta Sigma Pi",
    "type": "Organization",
    "aliases": [
      "Delta Sigma Pi"
    ],
    "evidence": [
      426,
      664
    ],
    "reviewNote": "Explicit named business fraternity."
  },
  {
    "id": "fox-hills",
    "name": "Fox Hills",
    "type": "Place",
    "aliases": [
      "Fox Hills"
    ],
    "evidence": [
      3098,
      5274
    ],
    "reviewNote": "Named local place; do not infer precise addresses or residents' identities."
  },
  {
    "id": "jackson-hall",
    "name": "Jackson Hall",
    "type": "Building",
    "aliases": [
      "Jackson Hall"
    ],
    "evidence": [
      828,
      3422
    ],
    "reviewNote": "Explicit campus building name."
  },
  {
    "id": "lefty-driesell",
    "name": "Lefty Driesell",
    "type": "Person",
    "aliases": [
      "Lefty Driesell"
    ],
    "evidence": [
      250,
      946
    ],
    "reviewNote": "Named coach; source 946 supplies role. Other entries may mention him without targeting him."
  },
  {
    "id": "logan-hall",
    "name": "Logan Hall",
    "type": "Building",
    "aliases": [
      "Logan Hall"
    ],
    "evidence": [
      454,
      1188
    ],
    "reviewNote": "Explicit campus building name."
  },
  {
    "id": "mercy-house",
    "name": "Mercy House",
    "type": "Organization",
    "aliases": [
      "Mercy House"
    ],
    "evidence": [
      268,
      342
    ],
    "reviewNote": "Source 342 explicitly identifies a homeless shelter in Harrisonburg."
  },
  {
    "id": "panera",
    "name": "Panera",
    "type": "Business",
    "aliases": [
      "Panera"
    ],
    "evidence": [
      4823,
      7393
    ],
    "reviewNote": "Named dining business; preserve shorter source form before alias expansion."
  }
];

