"""Create transparent topic and campus-entity annotations for the web explorer.

This is a deterministic first-pass coding system, not a claim of final human-coded
ground truth. Edit the dictionaries below, rerun the script, and review the low-
confidence and unclassified records before using the labels for formal research.
"""

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
RECORDS_PATH = DATA_DIR / "records.json"
ENRICHMENT_PATH = DATA_DIR / "enrichment.json"
ANALYSIS_PATH = DATA_DIR / "analysis.json"
METHOD_VERSION = "controlled-topics-campus-entities-v1.1"


TOPICS = [
    {
        "id": "parking-transportation",
        "label": "Parking & transportation",
        "description": "Parking, driving, buses, bikes, walking, and traffic.",
        "terms": [
            "parking", "parking deck", "parking services", "parking lot", "parking spot",
            "permit", "garage", "bus", "transit", "shuttle", "driver", "driving",
            "traffic", "crosswalk", "pedestrian", "bike", "bicycle", "scooter",
            "car", "vehicle", "road", "route", "campus police ticket", "tow", "towing",
        ],
    },
    {
        "id": "dining-food",
        "label": "Dining & food",
        "description": "Dining halls, campus food, meal plans, and service.",
        "terms": [
            "dining", "dining hall", "d hall", "dhall", "e hall", "ehall", "meal plan",
            "dining dollars", "flex", "food", "restaurant", "server", "waiter", "waitress",
            "cook", "cashier", "coffee", "starbucks", "festival food court", "market one",
            "mr chips", "mrs greens", "dukes dining", "pc dukes", "p.c. dukes", "breakfast", "lunch", "dinner",
        ],
    },
    {
        "id": "housing-residence",
        "label": "Housing & residence life",
        "description": "Dorms, apartments, roommates, and residential services.",
        "terms": [
            "housing", "residence hall", "residence life", "dorm", "roommate", "roommates",
            "apartment", "landlord", "lease", "rent", "ra", "hall director", "move in",
            "move-in", "laundry", "suite", "village dorm", "freshman dorm", "off campus housing",
        ],
    },
    {
        "id": "academics-faculty",
        "label": "Academics & faculty",
        "description": "Classes, teaching, advising, studying, and academic policy.",
        "terms": [
            "class", "classes", "professor", "faculty", "teacher", "instructor", "exam",
            "finals", "midterm", "homework", "assignment", "grade", "grading", "adviser",
            "advisor", "advising", "major", "minor", "course", "registration", "canvas",
            "syllabus", "lecture", "lab class", "study", "library", "book", "books", "textbook",
        ],
    },
    {
        "id": "costs-financial-aid",
        "label": "Costs & financial aid",
        "description": "Tuition, fees, costs, financial aid, and student employment.",
        "terms": [
            "tuition", "fee", "fees", "financial aid", "scholarship", "cost", "costs",
            "expensive", "price", "prices", "paycheck", "student job", "work study",
            "work-study", "billing", "student account", "loan", "refund", "money",
        ],
    },
    {
        "id": "campus-services-administration",
        "label": "Campus services & administration",
        "description": "University administration, offices, policies, and service encounters.",
        "terms": [
            "administration", "administrator", "president", "dean", "office", "staff",
            "employee", "customer service", "policy", "policies", "registrar", "bookstore",
            "mailroom", "post office", "orientation", "tour guide", "student affairs",
            "card services", "one card", "student ID", "id card", "website", "email",
        ],
    },
    {
        "id": "facilities-construction",
        "label": "Facilities & construction",
        "description": "Buildings, maintenance, utilities, accessibility, and construction.",
        "terms": [
            "construction", "building", "facility", "facilities", "maintenance", "custodian",
            "janitor", "bathroom", "restroom", "elevator", "stairs", "sidewalk", "lighting",
            "air conditioning", "heat", "heating", "water fountain", "printer", "computer lab",
            "renovation", "closed", "closure", "accessible", "accessibility", "wheelchair",
        ],
    },
    {
        "id": "safety-health",
        "label": "Safety & health",
        "description": "Public safety, policing, health, harassment, and emergencies.",
        "terms": [
            "police", "public safety", "campus police", "jmu police", "safety", "unsafe",
            "crime", "theft", "stolen", "harassment", "assault", "emergency", "ambulance",
            "rape", "sexual abuse", "sexual assault",
            "hospital", "health center", "clinic", "doctor", "nurse", "covid", "pandemic",
            "mask", "masks", "vaccine", "sick", "illness", "mental health", "counseling",
        ],
    },
    {
        "id": "student-life-behavior",
        "label": "Student life & behavior",
        "description": "Social life, courtesy, relationships, organizations, and conduct.",
        "terms": [
            "party", "parties", "fraternity", "sorority", "greek life", "drunk", "drinking",
            "alcohol", "beer", "date", "boyfriend", "girlfriend", "friend", "friends",
            "manners", "rude", "respect", "courtesy", "line cutting", "cut in line",
            "club", "student organization", "roommate", "neighbors", "noise", "loud",
        ],
    },
    {
        "id": "sports-recreation",
        "label": "Sports & recreation",
        "description": "Varsity sports, recreation, fitness, and school spirit.",
        "terms": [
            "football", "basketball", "baseball", "softball", "soccer", "volleyball",
            "lacrosse", "hockey", "tennis", "swimming", "track", "athlete", "athletics",
            "coach", "team", "game", "stadium", "tailgate", "urec", "recreation",
            "gym", "workout", "fitness", "school spirit", "marching royal dukes",
        ],
    },
    {
        "id": "technology-communications",
        "label": "Technology & communication",
        "description": "Networks, devices, online systems, and campus communication.",
        "terms": [
            "wifi", "wi fi", "wireless", "internet", "computer", "printer", "printing",
            "phone", "cell phone", "website", "app", "email", "technology", "tech support",
            "canvas", "my madison", "mymadison", "zoom", "social media", "facebook",
            "twitter", "instagram", "text message", "online", "network",
        ],
    },
    {
        "id": "weather-environment",
        "label": "Weather & environment",
        "description": "Weather, grounds, sustainability, and the natural environment.",
        "terms": [
            "weather", "snow", "ice", "rain", "storm", "cold", "hot", "heat wave",
            "wind", "tree", "trees", "grass", "grounds", "landscaping", "trash", "litter",
            "recycling", "recycle", "environment", "sustainability", "earth day", "energy",
            "power outage", "flowers", "campus cleanup",
        ],
    },
    {
        "id": "town-community",
        "label": "Harrisonburg & community",
        "description": "Harrisonburg, local businesses, neighbors, and town–gown relations.",
        "terms": [
            "harrisonburg", "downtown", "city council", "local business", "community",
            "town", "neighbor", "neighbors", "restaurant", "bar", "store", "shop",
            "rockingham", "court square", "main street", "reservoir street", "port republic",
            "route 33", "burgess road", "police department", "county",
        ],
    },
]


ENTITIES = [
    ("James Madison University", "ORG", ["james madison university", "jmu"]),
    ("The Breeze", "ORG", ["the breeze", "breeze staff", "breeze editorial"]),
    ("JMU Police", "ORG", ["jmu police", "campus police", "public safety office", "public safety"]),
    ("JMU Dining", "ORG", ["jmu dining", "dining services", "aramark"]),
    ("JMU Parking Services", "ORG", ["parking services", "jmu parking"]),
    ("Student Government Association", "ORG", ["student government association", "sga"]),
    ("University Recreation", "ORG", ["university recreation", "urec"]),
    ("Office of Residence Life", "ORG", ["office of residence life", "residence life", "orl"]),
    ("Harrisonburg", "PLACE", ["harrisonburg", "the burg"]),
    ("Carrier Library", "PLACE", ["carrier library", "carrier"]),
    ("Rose Library", "PLACE", ["rose library", "east campus library", "ecl"]),
    ("D-Hall", "PLACE", ["d-hall", "d hall", "dhall", "gibbons dining hall"]),
    ("E-Hall", "PLACE", ["e-hall", "e hall", "ehall", "east campus dining hall"]),
    ("Festival", "PLACE", ["festival conference", "festival food court", "festival"]),
    ("Wilson Hall", "PLACE", ["wilson hall"]),
    ("Godwin Hall", "PLACE", ["godwin hall", "godwin"]),
    ("Bridgeforth Stadium", "PLACE", ["bridgeforth stadium", "bridgeforth"]),
    ("The Quad", "PLACE", ["the quad", "quad"]),
    ("East Campus", "PLACE", ["east campus"]),
    ("Bluestone Area", "PLACE", ["bluestone area", "bluestone"]),
    ("The Village", "PLACE", ["the village", "village dorms", "village area"]),
    ("Skyline Area", "PLACE", ["skyline area", "skyline"]),
    ("Greek Life", "GROUP", ["greek life", "fraternity", "sorority"]),
    ("Marching Royal Dukes", "ORG", ["marching royal dukes", "mrds", "mrd"]),
    ("JMU Dukes", "ORG", ["jmu dukes", "dukes football", "dukes basketball"]),
]


def phrase_pattern(phrase):
    words = [re.escape(part) for part in re.split(r"[\s-]+", phrase.strip()) if part]
    return re.compile(r"(?<!\w)" + r"[\s-]+".join(words) + r"(?!\w)", re.IGNORECASE)


TOPIC_PATTERNS = {
    topic["id"]: [(term, phrase_pattern(term)) for term in topic["terms"]]
    for topic in TOPICS
}
ENTITY_PATTERNS = [
    (canonical, entity_type, [(alias, phrase_pattern(alias)) for alias in aliases])
    for canonical, entity_type, aliases in ENTITIES
]


def classify_topics(text):
    scores = {}
    matched_terms = {}
    for topic in TOPICS:
        matches = []
        score = 0
        for term, pattern in TOPIC_PATTERNS[topic["id"]]:
            count = len(pattern.findall(text))
            if count:
                matches.append(term)
                score += min(count, 2) * (2 if " " in term or "-" in term else 1)
        if score:
            scores[topic["id"]] = score
            matched_terms[topic["id"]] = matches

    if not scores:
        return "unclassified", [], "unclassified", [], {}

    ranked = sorted(scores, key=lambda topic_id: (-scores[topic_id], topic_id))
    primary = ranked[0]
    top_score = scores[primary]
    runner_up = scores[ranked[1]] if len(ranked) > 1 else 0
    secondary = [
        topic_id for topic_id in ranked[1:]
        if scores[topic_id] >= max(2, round(top_score * 0.6))
    ][:2]

    if top_score >= 5 and top_score - runner_up >= 2:
        confidence = "high"
    elif top_score >= 2 and top_score > runner_up:
        confidence = "medium"
    else:
        confidence = "low"

    return primary, secondary, confidence, matched_terms[primary], scores


def extract_entities(text):
    found = []
    for canonical, entity_type, aliases in ENTITY_PATTERNS:
        matched_aliases = [alias for alias, pattern in aliases if pattern.search(text)]
        if matched_aliases:
            found.append({"name": canonical, "type": entity_type, "matched": matched_aliases[0]})
    return found


def pat_share(darts, pats):
    classified = darts + pats
    return round(pats / classified, 4) if classified else None


def summarize_counter(counter):
    darts = counter.get("DART", 0)
    pats = counter.get("PAT", 0)
    combined = counter.get("DART AND PAT", 0)
    return {
        "darts": darts,
        "pats": pats,
        "combined": combined,
        "total": darts + pats + combined,
        "patShare": pat_share(darts, pats),
    }


def main():
    records = json.loads(RECORDS_PATH.read_text(encoding="utf-8"))
    topic_lookup = {topic["id"]: topic for topic in TOPICS}
    topic_counts = defaultdict(Counter)
    topic_years = defaultdict(lambda: defaultdict(Counter))
    entity_counts = defaultdict(Counter)
    entity_types = {}
    confidence_counts = Counter()
    annotations = []
    issue_counts = defaultdict(Counter)

    for record in records:
        text = record.get("text") or ""
        primary, secondary, confidence, evidence, scores = classify_topics(text)
        entities = extract_entities(text)
        annotations.append({
            "id": record["id"],
            "primaryTopic": primary,
            "secondaryTopics": secondary,
            "topicConfidence": confidence,
            "topicEvidence": evidence,
            "topicScores": scores,
            "entities": entities,
        })
        confidence_counts[confidence] += 1
        issue_counts[record["date"]][record["kind"]] += 1
        topic_counts[primary][record["kind"]] += 1
        topic_years[primary][record["year"]][record["kind"]] += 1
        for entity in entities:
            entity_counts[entity["name"]][record["kind"]] += 1
            entity_types[entity["name"]] = entity["type"]

    topics_summary = []
    topic_ids = [topic["id"] for topic in TOPICS] + ["unclassified"]
    for topic_id in topic_ids:
        metadata = topic_lookup.get(topic_id, {
            "label": "Unclassified",
            "description": "No controlled-vocabulary topic matched in this first pass.",
            "terms": [],
        })
        topics_summary.append({
            "id": topic_id,
            "label": metadata["label"],
            "description": metadata["description"],
            "terms": metadata["terms"],
            **summarize_counter(topic_counts[topic_id]),
            "years": [
                {"year": year, **summarize_counter(topic_years[topic_id][year])}
                for year in sorted(topic_years[topic_id])
            ],
        })

    entities_summary = [
        {
            "name": name,
            "type": entity_types[name],
            **summarize_counter(counts),
        }
        for name, counts in entity_counts.items()
    ]
    entities_summary.sort(key=lambda row: (-row["total"], row["name"]))

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    classified_issues = [
        (counts.get("DART", 0), counts.get("PAT", 0))
        for counts in issue_counts.values()
        if counts.get("DART", 0) + counts.get("PAT", 0)
    ]
    editorial_balance = {
        "classifiedIssues": len(classified_issues),
        "exactlyBalancedIssues": sum(darts == pats for darts, pats in classified_issues),
        "withinOneIssues": sum(abs(darts - pats) <= 1 for darts, pats in classified_issues),
    }
    editorial_balance["exactlyBalancedShare"] = round(
        editorial_balance["exactlyBalancedIssues"] / editorial_balance["classifiedIssues"], 4
    )
    editorial_balance["withinOneShare"] = round(
        editorial_balance["withinOneIssues"] / editorial_balance["classifiedIssues"], 4
    )
    ENRICHMENT_PATH.write_text(
        json.dumps({
            "generatedAt": generated_at,
            "methodVersion": METHOD_VERSION,
            "records": annotations,
        }, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    ANALYSIS_PATH.write_text(
        json.dumps({
            "generatedAt": generated_at,
            "methodVersion": METHOD_VERSION,
            "methodNote": (
                "Automated first-pass labels from a controlled campus vocabulary. "
                "They are suitable for exploration and require human validation for formal research."
            ),
            "editorialBalance": editorial_balance,
            "confidenceCounts": dict(sorted(confidence_counts.items())),
            "topics": topics_summary,
            "entities": entities_summary,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps({
        "records": len(records),
        "methodVersion": METHOD_VERSION,
        "confidenceCounts": confidence_counts,
        "topics": [
            {
                "label": topic["label"],
                "total": topic["total"],
                "patShare": topic["patShare"],
            }
            for topic in sorted(topics_summary, key=lambda row: -row["total"])
        ],
        "topEntities": entities_summary[:15],
        "files": {
            ENRICHMENT_PATH.name: ENRICHMENT_PATH.stat().st_size,
            ANALYSIS_PATH.name: ANALYSIS_PATH.stat().st_size,
        },
    }, indent=2, default=dict))


if __name__ == "__main__":
    main()
