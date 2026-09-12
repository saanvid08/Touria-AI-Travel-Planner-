#File created date: July 7, 2025
#Created by: Saanvi Doppalapudi
#Updated by: Aswitha (July 22, 2026) — Supabase Auth, Wikipedia image enrichment, itinerary prompt
#Updated by: Aswitha (July 30, 2026) — split modules (config, chatbot, conversations, etc.)
#Function of file: FastAPI app entrypoint — routes for auth, chat, profile, and conversation history

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

from config import origins, supabase, supabase_admin, _supabase_url, _supabase_key
from models import (
    User,
    LoginUser,
    ChatRequest,
    ConversationCreate,
    FeedbackRequest,
    TripProfileUpdate,
)
from auth_utils import hash_password, verify_password
from chatbot import get_bot_response
from conversations import (
    ensure_conversation,
    save_message,
    maybe_update_conversation_title,
    _now_iso,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def _profile_payload(row: dict, email: str, meta: dict | None = None):
    meta = meta or {}
    return {
        "id": str(row.get("id") or ""),
        "email": row.get("email") or email,
        "firstName": row.get("first_name") or meta.get("first_name") or "",
        "lastName": row.get("last_name") or meta.get("last_name") or "",
        "createdAt": row.get("created_at"),
    }


# Handles new user registration:
# - creates Supabase authentication account
# - stores user profile information
# - returns registration status
@app.post("/register")
async def register(user: User):
    # --- MySQL registration (replaced by Supabase Auth) ---
    # sql = """
    # INSERT INTO users (first_name, last_name, email, password)
    # VALUES (%s, %s, %s, %s)
    # """
    # values = (
    #     user.firstName,
    #     user.lastName,
    #     user.email,
    #     user.password
    # )
    # cursor.execute(sql, values)
    # db.commit()
    # return {
    #     "message": "User registered successfully!"
    # }

    try:
        # Creates an Auth user that is already confirmed (no confirmation email).
        # Requires SUPABASE_KEY to be the service_role key in .env
        # Use supabase_admin so a prior /login cannot break admin auth headers.
        auth_user = None
        email = user.email.strip().lower()
        try:
            response = supabase_admin.auth.admin.create_user(
                {
                    "email": email,
                    "password": user.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "first_name": user.firstName,
                        "last_name": user.lastName,
                    },
                }
            )
            auth_user = response.user
        except Exception as create_err:
            # Auth user may already exist (check Authentication → Users, not only public.users).
            err_text = str(create_err).lower()
            already_exists = any(
                phrase in err_text
                for phrase in (
                    "already been registered",
                    "already registered",
                    "user already exists",
                    "duplicate",
                    "email_exists",
                )
            )
            if not already_exists:
                raise HTTPException(status_code=400, detail=str(create_err))

            # 1) Same password → reuse Auth user and finish public.users profile.
            try:
                verify_client = create_client(_supabase_url, _supabase_key)
                login_res = verify_client.auth.sign_in_with_password(
                    {"email": email, "password": user.password}
                )
                auth_user = login_res.user
            except Exception:
                auth_user = None

            # 2) Orphan Auth user (in auth.users but missing from public.users):
            #    complete signup with the password they just entered.
            if auth_user is None:
                listed = supabase_admin.auth.admin.list_users()
                auth_list = (
                    listed
                    if isinstance(listed, list)
                    else getattr(listed, "users", None) or []
                )
                orphan = next(
                    (
                        u
                        for u in auth_list
                        if (getattr(u, "email", None) or "").lower() == email
                    ),
                    None,
                )
                if orphan is None:
                    raise HTTPException(
                        status_code=400,
                        detail="This email is already registered. Please sign in instead.",
                    )

                profile = (
                    supabase_admin.table("users")
                    .select("id")
                    .eq("id", str(orphan.id))
                    .limit(1)
                    .execute()
                )
                if profile.data:
                    raise HTTPException(
                        status_code=400,
                        detail="This email is already registered. Please sign in instead.",
                    )

                supabase_admin.auth.admin.update_user_by_id(
                    str(orphan.id),
                    {
                        "password": user.password,
                        "email_confirm": True,
                        "user_metadata": {
                            "first_name": user.firstName,
                            "last_name": user.lastName,
                        },
                    },
                )
                auth_user = orphan

        if auth_user is None:
            raise HTTPException(status_code=400, detail="Registration failed.")

        # Upsert with service_role client so RLS cannot block profile writes
        # (upsert needs UPDATE; shared client may hold a user JWT after login).
        supabase_admin.table("users").upsert(
            {
                "id": str(auth_user.id),
                "first_name": user.firstName,
                "last_name": user.lastName,
                "email": email,
                "password": hash_password(user.password),
            }
        ).execute()

        return {
            "message": "User registered successfully!",
            "user": {
                "id": str(auth_user.id),
                "email": email,
                "firstName": user.firstName,
                "lastName": user.lastName,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Handles user authentication:
# - verifies credentials through Supabase Auth (fresh client — shared client
#   can keep a prior JWT and break subsequent sign-ins)
# - falls back to public.users password hash if Auth rejects the password
@app.post("/login")
async def login(login_user: LoginUser):
    email = (login_user.email or "").strip().lower()
    password = login_user.password or ""
    if not email or not password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # 1) Prefer Supabase Auth with a disposable client (avoids JWT pollution).
    try:
        auth_client = create_client(_supabase_url, _supabase_key)
        response = auth_client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        if response.user is not None:
            profile = (
                supabase_admin.table("users")
                .select("id, first_name, last_name, email, created_at")
                .eq("id", str(response.user.id))
                .limit(1)
                .execute()
            )
            row = (profile.data or [None])[0] or {"id": str(response.user.id)}
            return {
                "message": "Login successful!",
                "user": _profile_payload(
                    row, email, response.user.user_metadata or {}
                ),
            }
    except Exception as e:
        print("Auth login error:", e)

    # 2) Fallback: verify against hashed password in public.users
    try:
        profile = (
            supabase_admin.table("users")
            .select("id, first_name, last_name, email, created_at, password")
            .ilike("email", email)
            .limit(1)
            .execute()
        )
        row = (profile.data or [None])[0]
        if row and verify_password(password, row.get("password")):
            # Keep Auth in sync so future logins can use Auth again
            try:
                supabase_admin.auth.admin.update_user_by_id(
                    str(row["id"]),
                    {"password": password, "email_confirm": True},
                )
            except Exception as sync_err:
                print("Auth password sync error:", sync_err)
            return {
                "message": "Login successful!",
                "user": _profile_payload(row, email),
            }
    except HTTPException:
        raise
    except Exception as e:
        print("Hash login error:", e)

    raise HTTPException(status_code=401, detail="Invalid email or password.")


# Receives frontend chat messages, sends them to the AI system, and returns the generated itinerary response
@app.post("/chat")
async def chat(request: ChatRequest):
    print(request.message)

    conversation_id = None
    try:
        conversation_id = ensure_conversation(request)
    except Exception as e:
        print("Conversation ensure error:", e)

    # Persist the latest user turn (last message in the list)
    last_user = None
    if request.message:
        for msg in reversed(request.message):
            if msg.get("role") == "user":
                last_user = msg.get("content")
                break
    assistant_message_id = None

    if conversation_id and last_user:
        # Avoid duplicating if client re-sends full history: only save if last stored isn't identical
        try:
            recent = (
                supabase_admin.table("messages")
                .select("role, content")
                .eq("conversation_id", conversation_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            last_row = (recent.data or [None])[0]
            if not last_row or last_row.get("content") != last_user or last_row.get("role") != "user":
                save_message(conversation_id, "user", last_user, source="user")
        except Exception as e:
            print("Save user message error:", e)

    response = get_bot_response(request.message)
    print("Suggestions:", response["suggestions"])

    if conversation_id and response.get("reply"):
        try:
            saved = save_message(
                conversation_id,
                "assistant",
                response["reply"],
                source="llm",
                metadata={"suggestions": response.get("suggestions") or []},
            )
            if saved:
                assistant_message_id = saved.get("id")
            maybe_update_conversation_title(
                conversation_id, request.message, response.get("reply")
            )
        except Exception as e:
            print("Save assistant message error:", e)

    response["conversation_id"] = conversation_id
    response["assistant_message_id"] = assistant_message_id
    return response


@app.get("/profile")
async def get_profile(
    user_id: str | None = Query(default=None),
    email: str | None = Query(default=None),
):
    if not user_id and not email:
        raise HTTPException(status_code=400, detail="user_id or email required")
    query = supabase.table("users").select("id, first_name, last_name, email, created_at")
    if user_id:
        query = query.eq("id", user_id)
    else:
        query = query.eq("email", email)
    result = query.limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    row = result.data[0]
    return {
        "id": row["id"],
        "email": row.get("email"),
        "firstName": row.get("first_name") or "",
        "lastName": row.get("last_name") or "",
        "createdAt": row.get("created_at"),
    }


@app.get("/conversations")
async def list_conversations(
    user_id: str | None = Query(default=None),
    guest_session_id: str | None = Query(default=None),
):
    # Guests never receive saved history
    if not user_id:
        return {"conversations": []}

    result = (
        supabase_admin.table("conversations")
        .select("id, title, trip_type, status, summary, metadata, created_at, updated_at")
        .eq("status", "active")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"conversations": result.data or []}


@app.post("/conversations")
async def create_conversation(body: ConversationCreate):
    if not body.user_id:
        raise HTTPException(
            status_code=400,
            detail="Conversation history requires a registered account.",
        )
    row = {
        "user_id": body.user_id,
        "title": body.title or "New trip",
        "trip_type": body.trip_type,
        "status": "active",
        "metadata": body.metadata or {},
        "updated_at": _now_iso(),
    }
    created = supabase_admin.table("conversations").insert(row).execute()
    if not created.data:
        raise HTTPException(status_code=500, detail="Could not create conversation.")
    return created.data[0]


@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    conv = (
        supabase.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .limit(1)
        .execute()
    )
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = (
        supabase.table("messages")
        .select("id, role, content, source, feedback, metadata, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    profile = (
        supabase.table("trip_profiles")
        .select("*")
        .eq("conversation_id", conversation_id)
        .limit(1)
        .execute()
    )
    return {
        "conversation": conv.data[0],
        "messages": msgs.data or [],
        "trip_profile": (profile.data or [None])[0],
    }


@app.patch("/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, body: dict):
    allowed = {"title", "status", "summary", "trip_type", "metadata"}
    patch = {k: v for k, v in (body or {}).items() if k in allowed}
    if not patch:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    patch["updated_at"] = _now_iso()
    updated = (
        supabase.table("conversations")
        .update(patch)
        .eq("id", conversation_id)
        .execute()
    )
    return {"conversation": (updated.data or [None])[0]}


@app.post("/messages/{message_id}/feedback")
async def set_message_feedback(message_id: str, body: FeedbackRequest):
    feedback = body.feedback
    if feedback not in (None, "like", "dislike"):
        raise HTTPException(status_code=400, detail="feedback must be like, dislike, or null")
    updated = (
        supabase.table("messages")
        .update({"feedback": feedback})
        .eq("id", message_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": updated.data[0]}


@app.put("/trip-profiles")
async def upsert_trip_profile(body: TripProfileUpdate):
    row = {"conversation_id": body.conversation_id, "updated_at": _now_iso()}
    for field in (
        "origin",
        "destination",
        "travel_dates",
        "traveler_count",
        "age_group",
        "budget_amount",
        "budget_currency",
        "preferences",
        "activity_level",
        "accommodation",
    ):
        value = getattr(body, field)
        if value is not None:
            row[field] = value
    result = supabase.table("trip_profiles").upsert(row).execute()
    return {"trip_profile": (result.data or [None])[0]}


# Used to verify that the backend server is running correctly
@app.get("/")
async def root():

    return {
        "message": "Backend is running"
    }

