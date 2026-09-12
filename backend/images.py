# Wikipedia / Wikimedia image lookup and IMAGE_PLACEHOLDER replacement
import re
import urllib.parse
import requests

_image_cache = {}

# Filters Wikimedia images to remove irrelevant images like logos, icons, maps, and low-quality images before showing them to users
def is_good_image(url, title=""):
    if not url:
        return False

    bad_words = [
        "logo",
        "icon",
        "map",
        "flag",
        "diagram",
        "svg",
        "symbol",
        "coat_of_arms",
        "seal_",
        "satellite",
        "floor_plan",
        "blueprint",
        "screenshot",
        "qr_code",
        "pictogram",
    ]

    # Avoid "view FROM the landmark" style photos when we want the landmark itself
    bad_view_phrases = [
        "view from",
        "views from",
        "seen from",
        "from the top",
        "from top of",
        "looking down",
        "aerial view of city",
        "cityscape from",
    ]

    haystack = f"{url} {title}".lower().replace("-", " ").replace("_", " ")

    for word in bad_words:
        if word.replace("_", " ") in haystack or word in haystack.replace(" ", "_"):
            return False

    for phrase in bad_view_phrases:
        if phrase in haystack:
            return False

    return True


def _image_match_score(place: str, title: str, width: int, height: int):
    """Higher score = better match for showing the actual place/landmark."""
    place_l = (place or "").lower()
    title_l = (title or "").lower().replace("_", " ").replace("-", " ")
    score = 0

    tokens = [t for t in re.split(r"\W+", place_l) if len(t) > 2]
    for token in tokens:
        if token in title_l:
            score += 12

    # Prefer photos that look like the attraction itself
    for phrase in ("tower", "monument", "palace", "cathedral", "temple", "bridge", "museum", "castle", "park", "beach"):
        if phrase in place_l and phrase in title_l:
            score += 8

    # Soft preference against generic city/aerial when place is a specific landmark
    if "aerial" in title_l or "panorama" in title_l:
        score -= 6
    if "city" in title_l and "tower" in place_l:
        score -= 4

    # Prefer larger images
    score += min(width, 2000) // 200
    score += min(height, 2000) // 250
    return score


def _wikipedia_thumbnail(place: str):
    """Use Wikipedia page summary thumbnail — usually the canonical photo of the place."""
    try:
        title = place.strip().replace(" ", "_")
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
        response = requests.get(
            url,
            headers={"User-Agent": "TouriaTravelPlanner/1.0"},
            timeout=5,
        )
        if response.status_code != 200:
            return None
        data = response.json()
        thumb = (data.get("thumbnail") or {}).get("source")
        original = (data.get("originalimage") or {}).get("source")
        candidate = original or thumb
        if candidate and is_good_image(candidate, data.get("title", place)):
            return candidate
    except Exception as e:
        print("Wikipedia thumbnail error:", e)
    return None


def _commons_search_best(place: str, query: str):
    """Search Wikimedia Commons and return the best-scoring image URL for this place."""
    try:
        url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": 20,
            "prop": "imageinfo|info",
            "inprop": "url",
            "iiprop": "url|size|extmetadata",
            "iiurlwidth": 1200,
            "format": "json",
        }
        response = requests.get(
            url,
            params=params,
            headers={"User-Agent": "TouriaTravelPlanner/1.0"},
            timeout=6,
        )
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        best_url = None
        best_score = -999

        for page in pages.values():
            title = page.get("title", "")
            image_info = page.get("imageinfo")
            if not image_info:
                continue
            info = image_info[0]
            width = info.get("width", 0) or 0
            height = info.get("height", 0) or 0
            if width < 500 or height < 300:
                continue
            image = info.get("thumburl") or info.get("url")
            if not image or not is_good_image(image, title):
                continue
            score = _image_match_score(place, title, width, height)
            if score > best_score:
                best_score = score
                best_url = image

        return best_url
    except Exception as e:
        print("Commons image error:", e)
        return None


# Searches Wikimedia / Wikipedia for travel images that show the place itself
def get_place_image_url(place: str):
    """
    Gets the best available photo of a place (landmark/attraction itself when possible).
    Falls back to related location photos if an exact match is unavailable.
    """

    if not place:
        return None

    key = place.lower().strip()

    if key in _image_cache:
        return _image_cache[key]

    # 1) Wikipedia canonical thumbnail
    wiki = _wikipedia_thumbnail(place)
    if wiki:
        _image_cache[key] = wiki
        return wiki

    # 2) Targeted Commons searches (exact place first, then related)
    queries = [
        f'"{place}"',
        f"{place} landmark",
        f"{place} tourist attraction",
        f"{place} exterior",
        place,
    ]

    for query in queries:
        found = _commons_search_best(place, query)
        if found:
            _image_cache[key] = found
            return found

    # 3) Broader related search using leading tokens (e.g. "Eiffel" from "Eiffel Tower")
    tokens = [t for t in re.split(r"\W+", place) if len(t) > 2]
    if tokens:
        related = _commons_search_best(place, " ".join(tokens[:3]))
        if related:
            _image_cache[key] = related
            return related

    _image_cache[key] = None
    return None

# Replaces AI-generated image placeholders with actual image URLs before sending the itinerary back to the frontend
def replace_placeholders(reply):

    pattern = r"IMAGE_PLACEHOLDER:\s*(.*)"

    def replace(match):
        place = match.group(1).strip()

        image = get_place_image_url(place)
        if image:
            return f"![{place}]({image})"

        return ""
    return re.sub(pattern, replace, reply)
