# Pydantic request/response models for Touria API
from pydantic import BaseModel

class User(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str

# Creates a data model for login information
class LoginUser(BaseModel):
    email: str
    password: str

# Chatbot model, sends conversation history through list
class ChatRequest(BaseModel):
    message: list
    conversation_id: str | None = None
    user_id: str | None = None
    guest_session_id: str | None = None
    trip_type: str | None = None
    title: str | None = None
    metadata: dict | None = None


class ConversationCreate(BaseModel):
    user_id: str | None = None
    guest_session_id: str | None = None
    title: str | None = "New trip"
    trip_type: str | None = None
    metadata: dict | None = None


class FeedbackRequest(BaseModel):
    feedback: str | None = None  # "like", "dislike", or null to clear


class TripProfileUpdate(BaseModel):
    conversation_id: str
    origin: str | None = None
    destination: str | None = None
    travel_dates: str | None = None
    traveler_count: int | None = None
    age_group: str | None = None
    budget_amount: float | None = None
    budget_currency: str | None = None
    preferences: dict | None = None
    activity_level: str | None = None
    accommodation: str | None = None
