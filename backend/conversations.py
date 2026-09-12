# Conversation / message persistence helpers (Supabase)
import datetime
from fastapi import HTTPException
from config import supabase_admin
from models import ChatRequest

def _now_iso():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()


def _derive_title_from_messages(messages, fallback="New trip"):
    """Build a short list title from early user messages."""
    for msg in messages or []:
        if msg.get("role") != "user":
            continue
        text = (msg.get("content") or "").strip().replace("\n", " ")
        if not text:
            continue
        lower = text.lower()
        if "trip category" in lower and len(text) < 120:
            continue
        if len(text) > 48:
            return text[:45].rstrip() + "…"
        return text
    return fallback


def ensure_conversation(request: ChatRequest):
    """Create or validate a conversation row; return conversation_id.

    Guests are ephemeral — do not create or resume Supabase history without
    a registered user_id.
    """
    if not request.user_id:
        return None

    conv_id = request.conversation_id
    if conv_id:
        existing = (
            supabase_admin.table("conversations")
            .select("id")
            .eq("id", conv_id)
            .eq("user_id", request.user_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            return conv_id

    title = request.title or "New trip"
    row = {
        "user_id": request.user_id,
        "title": title,
        "trip_type": request.trip_type,
        "status": "active",
        "metadata": request.metadata or {},
        "updated_at": _now_iso(),
    }

    created = supabase_admin.table("conversations").insert(row).execute()
    if not created.data:
        raise HTTPException(status_code=500, detail="Could not create conversation.")
    return created.data[0]["id"]


def save_message(conversation_id, role, content, source="llm", metadata=None):
    if not conversation_id or not content:
        return None
    inserted = (
        supabase_admin.table("messages")
        .insert(
            {
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
                "source": source,
                "metadata": metadata or {},
            }
        )
        .execute()
    )
    supabase_admin.table("conversations").update(
        {"updated_at": _now_iso()}
    ).eq("id", conversation_id).execute()
    if inserted.data:
        return inserted.data[0]
    return None


def maybe_update_conversation_title(conversation_id, messages, reply):
    """Set a better title once we have a real destination-ish user message."""
    try:
        current = (
            supabase_admin.table("conversations")
            .select("title")
            .eq("id", conversation_id)
            .limit(1)
            .execute()
        )
        title = (current.data or [{}])[0].get("title") or "New trip"
        if title not in ("New trip", "New Trip") and not title.startswith("I'm planning"):
            return
        derived = _derive_title_from_messages(messages, title)
        # Prefer destination from reply heading if present
        if reply and reply.lstrip().startswith("#"):
            first_line = reply.lstrip().split("\n", 1)[0].lstrip("# ").strip()
            if first_line:
                derived = first_line[:60]
        if derived and derived != title:
            supabase_admin.table("conversations").update(
                {"title": derived, "updated_at": _now_iso()}
            ).eq("id", conversation_id).execute()
    except Exception as e:
        print("Title update error:", e)
