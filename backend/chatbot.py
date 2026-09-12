# Chatbot: destination/preference extraction and main Touria response pipeline
import json
from config import client
from weather import get_weather
from images import replace_placeholders
from prompts import get_current_date_context, TOURIA_SYSTEM_INSTRUCTIONS
from guardrails import (
    _latest_user_text,
    is_tourism_related,
    off_topic_guardrail_response,
)

# Uses GPT to extract the user's travel destination from previous messages so weather and image APIs can be called
def extract_destination(messages):

    extraction_prompt = [
        {
            "role": "system",
            "content": """
            You are a travel assistant.

            Extract the destination city or cities from the conversation.

            Important:
            - Only return a destination if it is specific enough for travel planning.
            - A country alone is NOT enough.
            - Do not return countries such as Japan, France, Italy, or India by themselves.
            - If the user only mentions a country, return an empty destination.


            Only return a destination if the user is planning to travel there.
            Do not extract places mentioned casually.

            Rules:
            - Return only JSON.
            - If the user mentions a destination, return it.
            - If the user says they need suggestions and has no destination, return empty.
            - Include only the destination name, not extra words.

            Format:

            {
            "destination":"Seattle"
            }

            If no destination:

            {
            "destination":""
            }
            """
        }
    ]

    extraction_prompt.extend(messages)

    result = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=extraction_prompt,
        temperature=0,
        response_format={"type": "json_object"},
    )

    try:
        cleaned = result.choices[0].message.content.strip()

        cleaned = cleaned.replace("```json", "")
        cleaned = cleaned.replace("```", "")

        data = json.loads(cleaned)

        return data.get("destination", "")

    except Exception as e:
        print("Destination extraction error:", e)
        return ""

def extract_preferences(messages):

    preference_prompt = [
        {
            "role": "system",
            "content": """
You are a travel preference extractor.

Extract travel preferences from the conversation.

Return ONLY JSON.

Extract:

weather_preference:
- sunny
- cold
- tropical
- mild
- unknown

activity_preferences:
- food
- hiking
- nature
- culture
- shopping
- adventure
- relaxation

travel_style:
- relaxed
- balanced
- active
- unknown


Example:

{
"weather_preference":"sunny",
"activity_preferences":["food","nature"],
"travel_style":"relaxed"
}


If unknown:

{
"weather_preference":"unknown",
"activity_preferences":[],
"travel_style":"unknown"
}
"""
        }
    ]

    preference_prompt.extend(messages)

    result = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=preference_prompt,
        temperature=0,
        response_format={"type": "json_object"},
    )

    try:
        cleaned = result.choices[0].message.content.strip()

        cleaned = cleaned.replace("```json", "")
        cleaned = cleaned.replace("```", "")

        return json.loads(cleaned)

    except Exception as e:
        print("Preference extraction error:", e)

        return {
            "weather_preference":"unknown",
            "activity_preferences":[],
            "travel_style":"unknown"
        }

def get_bot_response(messages):

    # Layer 1: refuse clearly off-topic messages before the itinerary pipeline
    latest_user = _latest_user_text(messages)
    if latest_user and not is_tourism_related(latest_user):
        print("Domain guardrail: off-topic message blocked.")
        return off_topic_guardrail_response()

    destination = extract_destination(messages)
    weather_context = None

    preferences = {
        "weather_preference":"unknown",
        "activity_preferences":[],
        "travel_style":"unknown"
    }

    preferences = extract_preferences(messages)

    if destination:
        weather_context = get_weather(destination)

    preference_context = f"""
    
        USER TRAVEL PREFERENCES:

        Weather Preference:
        {preferences.get("weather_preference", "unknown")}

        Activities:
        {preferences.get("activity_preferences", [])}

        Travel Style:
        {preferences.get("travel_style", "unknown")}

        Use these preferences only when relevant.
        """
    
    system_message = {
        "role": "system",
        "content":
        (
            get_current_date_context()
            + preference_context
            + TOURIA_SYSTEM_INSTRUCTIONS
        )
    }

    # Add weather information before sending to GPT so itinerary activities and packing tips match conditions
    if weather_context and "location" in weather_context:

        system_message["content"] += f"""

        WEATHER INFORMATION:

        Destination:
        {weather_context['location']}, {weather_context['country']}

        Current temperature:
        {weather_context['temperature']}°F

        Current conditions:
        {weather_context['condition']}

        Forecast:
        {json.dumps(weather_context['forecast'], indent=2)}

        Use this information when creating the itinerary.
        Adjust:
        - outdoor activities
        - indoor alternatives
        - packing recommendations
        - timing of activities

        """

    # Adds AI instructions at the beginning of every conversation
    messages = [system_message] + messages

    chat_completion = client.chat.completions.create(
        messages=messages,
        model="gpt-4o-mini",
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    response_text = chat_completion.choices[0].message.content or ""

    def _parse_bot_json(raw_text):
        """Extract reply + suggestions from model output that should be JSON."""
        cleaned = (raw_text or "").strip()
        cleaned = cleaned.replace("```json", "").replace("```", "")
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON object found")
        data = json.loads(cleaned[start:end + 1])
        return data.get("reply", "") or "", data.get("suggestions", []) or []

    # Cleans and validates GPT output because the frontend requires a consistent JSON response format
    try:
        reply, suggestions = _parse_bot_json(response_text)
        print("CLEANED JSON:")
        print(response_text)
        print("Parsed suggestions:", suggestions)

    except Exception as e:
        print("JSON parsing failed:", e)
        print("RAW AI RESPONSE:")
        print(response_text)

        # Repair: convert plain text into JSON, but NEVER drop the full question list
        repair = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": """
Convert the following assistant message into valid JSON.

Return ONLY this shape:
{
  "reply": "...",
  "suggestions": [
    {"short": "short label", "full": "full user message"}
  ]
}

CRITICAL:
- Put the COMPLETE original message into "reply" with no shortening.
- Keep every numbered question / bullet exactly as written.
- Escape newlines inside "reply" as \\n.
- Create 3 suggestion chips that help the user answer the questions.
- No markdown fences. No explanations outside JSON.
"""
                },
                {
                    "role": "user",
                    "content": response_text
                }
            ]
        )

        try:
            repaired_raw = repair.choices[0].message.content or ""
            repaired_reply, suggestions = _parse_bot_json(repaired_raw)
            # If repair shortened the text, keep the full original message for the UI
            raw_plain = response_text.strip()
            if raw_plain and len(raw_plain) > len((repaired_reply or "").strip()) + 30:
                reply = raw_plain
            else:
                reply = repaired_reply or raw_plain
        except Exception:
            # Last resort: show the full raw AI text so questions are not lost
            reply = response_text.strip() or "Sorry, I had trouble formatting my response."
            suggestions = [
                {
                    "short": "Try again",
                    "full": "Please try generating my travel suggestions again."
                }
            ]

    def _looks_like_itinerary(text):
        t = text or ""
        return any(
            marker in t
            for marker in (
                "Family Itinerary",
                "Day 1:",
                "## Day 1",
                "## Lodging Recommendations",
                "## Dining Recommendations",
                "## Budget Summary",
                "## Packing Tips",
                "## Trip Summary",
            )
        )

    def _looks_like_summary_only(text):
        """Detect 'recap answers then promise itinerary later' replies."""
        t = (text or "").lower()
        if _looks_like_itinerary(text):
            return False
        summary_phrases = (
            "summary of your trip",
            "here’s a summary",
            "here's a summary",
            "trip details:",
            "i will now create",
            "i'll now create",
            "i will create a detailed itinerary",
            "let me create a detailed itinerary",
            "confirm itinerary",
        )
        return any(p in t for p in summary_phrases)

    # If the model only summarized answers, force one retry that builds the real plan
    if _looks_like_summary_only(reply):
        print("Detected summary-only reply; regenerating full itinerary...")
        force_itinerary_messages = messages + [
            {
                "role": "assistant",
                "content": reply,
            },
            {
                "role": "user",
                "content": (
                    "Do not summarize again. Generate the COMPLETE travel itinerary now "
                    "using all details I already provided (dates, budget, travelers/ages, "
                    "preferences, activity level, accommodation). Return valid JSON with "
                    "the full itinerary markdown inside \"reply\" using the required FORMAT "
                    "(no Trip Overview — start with Day-by-day plan, then Lodging, Dining, "
                    "Transportation, Budget Summary, Packing Tips, Trip Summary table)."
                ),
            },
        ]
        try:
            forced = client.chat.completions.create(
                messages=force_itinerary_messages,
                model="gpt-4o-mini",
                temperature=0.5,
                response_format={"type": "json_object"},
            )
            forced_text = forced.choices[0].message.content or ""
            forced_reply, forced_suggestions = _parse_bot_json(forced_text)
            if forced_reply and (
                _looks_like_itinerary(forced_reply)
                or len(forced_reply) > len(reply) + 100
            ):
                reply = forced_reply
                if forced_suggestions:
                    suggestions = forced_suggestions
                print("Forced itinerary generation succeeded.")
            else:
                print("Forced itinerary generation did not look complete; keeping prior reply.")
        except Exception as force_err:
            print("Forced itinerary generation failed:", force_err)

    # Only send weather to the frontend when a full itinerary is generated.
    # Otherwise it gets shown during the "collect trip details" stage.
    include_weather = False
    try:
        _txt = (reply or "")
        markers = [
            "Family Itinerary",
            "Day 1:",
            "## Lodging Recommendations",
            "## Dining Recommendations",
            "## Transportation Plan",
            "## Budget Summary",
            "## Packing Tips",
            "## Trip Summary",
        ]
        include_weather = any(m in _txt for m in markers)
    except Exception:
        include_weather = False

    weather_to_send = weather_context if include_weather else None

    return {
        "reply": replace_placeholders(reply),
        "suggestions": suggestions,
        "weather": weather_to_send
    }
