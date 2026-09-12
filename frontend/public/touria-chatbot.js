/*
File created date: July 13, 2026
Created by: Saanvi Doppalapudi
Updated by: Aswitha (July 22, 2026) — welcome→chat flow, trip-option starter,
  thinking spinner, like/dislike/regenerate, centered chat + page-edge scrollbar
Updated by: Aswitha (July 29, 2026) — plan image lightbox, Supabase conversation history
Function of file: JavaScript for AI Tour Planner chatbot page.
  Talks to backend POST /chat, persists trips, renders history sidebar.
*/

/* global marked */

const API_BASE = "http://127.0.0.1:8000";

/* ---- DOM references ---- */
const inputMessage = document.getElementById("inputMessage");
const sendBtn = document.getElementById("sendBtn");
const chatbox = document.getElementById("chatbox");
const welcomePanel = document.getElementById("welcome-panel");
const suggestionBox = document.getElementById("suggested-replies");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
const historyPanel = document.getElementById("history-panel");
const historyToggle = document.getElementById("history-toggle");
const historyBackdrop = document.getElementById("history-backdrop");
const newChatBtn = document.getElementById("new-chat-btn");
const historyFooter = document.getElementById("history-footer");
console.log("Suggestion box:", suggestionBox);

/* Enable GFM so itinerary / Trip Summary markdown tables render as HTML tables */
if (typeof marked !== "undefined" && typeof marked.setOptions === "function") {
    marked.setOptions({ gfm: true, breaks: true });
}

/* ---- UI constants ---- */
const CHAT_PLACEHOLDER = "Ask more questions....";
const WELCOME_PLACEHOLDER = "Where are you planning to go?";
const BOT_LOGO = "/images/touria-bot-logo.png";

/* ---- Auth / guest identity ---- */
const userType = localStorage.getItem("userType") || "guest";
const userId = localStorage.getItem("userId") || null;
const isRegistered = userType === "registered" && !!userId;

/* Guests must not resume or persist Supabase history */
if (!isRegistered) {
    localStorage.removeItem("touriaActiveConversationId");
    localStorage.removeItem("touriaGuestId");
}

/* ---- Conversation state ---- */
let conversation = [];
let conversationId = isRegistered
    ? localStorage.getItem("touriaActiveConversationId") || null
    : null;
let lastBotRawText = "";
let isSending = false;
let activeTripType = localStorage.getItem("touriaTripType") || null;

function setActiveConversationId(id) {
    conversationId = id || null;
    if (!isRegistered) {
        localStorage.removeItem("touriaActiveConversationId");
        return;
    }
    if (conversationId) {
        localStorage.setItem("touriaActiveConversationId", conversationId);
    } else {
        localStorage.removeItem("touriaActiveConversationId");
    }
}

function setChatTitle(title) {
    /* Top-right trip title removed; keep helper for callers */
    void title;
}

function authQuery() {
    if (isRegistered) {
        return "user_id=" + encodeURIComponent(userId);
    }
    return "";
}

function chatIdentityPayload() {
    const payload = {};
    if (isRegistered) {
        if (conversationId) {
            payload.conversation_id = conversationId;
        }
        payload.user_id = userId;
    }
    if (activeTripType) {
        payload.trip_type = activeTripType;
    }
    const label = localStorage.getItem("touriaTripLabel");
    if (label) {
        payload.title = label.slice(0, 60);
        payload.metadata = { starter_label: label };
    }
    return payload;
}

/* ---- Step: Grow the textarea as the user types (capped at 120px) ---- */
inputMessage.addEventListener("input", function () {
    this.style.height = "44px";
    if (this.scrollHeight > 120) {
        this.style.height = "120px";
    } else {
        this.style.height = this.scrollHeight + "px";
    }
});

/**
 * Switch from welcome panel to chat layout.
 * Adds body.is-chatting so CSS can show the chat column and page-level scrollbar.
 */
function enterChatMode() {
    if (document.body.classList.contains("is-chatting")) {
        return;
    }
    // Step 1: Flip body class — CSS uses this for chat layout + container scroll
    document.body.classList.add("is-chatting", "chat-transition");
    // Step 2: Animate welcome out, then remove it from the layout
    if (welcomePanel) {
        welcomePanel.classList.add("is-leaving");
        window.setTimeout(function () {
            welcomePanel.setAttribute("hidden", "");
        }, 380);
    }
    // Step 3: Update input placeholder for follow-up questions
    inputMessage.placeholder = CHAT_PLACEHOLDER;
}

/**
 * Show a spinning Touria logo while waiting for the API reply.
 */
function showThinking() {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "bot", "thinking");
    msgDiv.id = "thinking-indicator";

    const avatar = document.createElement("img");
    avatar.className = "bot-avatar bot-avatar--spin";
    avatar.src = BOT_LOGO;
    avatar.alt = "Touria is thinking";

    const label = document.createElement("span");
    label.className = "thinking-label";
    label.textContent = "Touria is planning...";

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(label);
    chatbox.appendChild(msgDiv);
    scrollChat();
}

/** Remove the thinking row once a real bot reply (or error) is ready. */
function hideThinking() {
    const thinking = document.getElementById("thinking-indicator");
    if (thinking) {
        thinking.remove();
    }
}

/**
 * Scroll the chat into view.
 * IMPORTANT: Scroll the full-width .container (not .chatbox) so the scrollbar
 * stays on the far right of the page while messages stay centered.
 */
function scrollChat() {
    setTimeout(function () {
        const scroller = document.querySelector(".container") || chatbox;
        scroller.scrollTo({
            top: scroller.scrollHeight,
            behavior: "smooth"
        });
    }, 80);
}

function showSuggestions(suggestions) {

    if (!suggestionBox) return;

    suggestionBox.innerHTML = "";

    if (!suggestions || suggestions.length === 0) {
        return;
    }

    suggestions.forEach(reply => {

        const suggestion = document.createElement("div");
        suggestion.classList.add("suggestion");
        suggestion.innerText = reply.short;

        suggestion.addEventListener("mouseenter", function () {
            inputMessage.placeholder = reply.full;
        });

        suggestion.addEventListener("mouseleave", function () {
            inputMessage.placeholder = CHAT_PLACEHOLDER;
        });

        suggestion.addEventListener("click", function () {
            inputMessage.value = reply.full;
            inputMessage.focus();
        });

        suggestionBox.appendChild(suggestion);
    });
}


/**
 * Improve plan images: show full picture (no crop), click opens lightbox.
 */
function enhancePlanImages(container) {
    const images = container.querySelectorAll("img");
    images.forEach(function (img) {
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        img.style.maxWidth = "100%";
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.maxHeight = "320px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "12px";
        img.style.cursor = "zoom-in";
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", "View full image");
        img.title = "Click to view full image";

        img.addEventListener("error", function () {
            img.style.display = "none";
        });

        function openFull() {
            openPlanLightbox(img.src, img.alt || "");
        }

        img.addEventListener("click", openFull);
        img.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFull();
            }
        });
    });
}

/* ---- Plan image lightbox (same UX as home popular destinations) ---- */
const planLightbox = document.getElementById("plan-lightbox");
const planLightboxImage = document.getElementById("lightbox-image");
const planLightboxCaption = document.getElementById("lightbox-caption");
const planLightboxClose = document.getElementById("lightbox-close");

function openPlanLightbox(src, caption) {
    if (!planLightbox || !planLightboxImage || !planLightboxCaption) {
        return;
    }
    planLightboxImage.src = src;
    planLightboxImage.alt = caption || "Plan photo";
    planLightboxCaption.textContent = caption || "";
    planLightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    if (planLightboxClose) {
        planLightboxClose.focus();
    }
}

function closePlanLightbox() {
    if (!planLightbox || !planLightboxImage || !planLightboxCaption) {
        return;
    }
    planLightbox.hidden = true;
    planLightboxImage.src = "";
    planLightboxImage.alt = "";
    planLightboxCaption.textContent = "";
    document.body.classList.remove("lightbox-open");
}

if (planLightboxClose) {
    planLightboxClose.addEventListener("click", closePlanLightbox);
}

if (planLightbox) {
    planLightbox.addEventListener("click", function (event) {
        if (event.target === planLightbox) {
            closePlanLightbox();
        }
    });
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && planLightbox && !planLightbox.hidden) {
        closePlanLightbox();
    }
});

/**
 * Build like / dislike / regenerate controls under each bot reply.
 */
function buildBotActions(rawText, botMessageEl) {
    const actions = document.createElement("div");
    actions.className = "bot-actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.title = "Helpful";
    upBtn.setAttribute("aria-label", "Thumbs up");
    upBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i>';

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.title = "Not helpful";
    downBtn.setAttribute("aria-label", "Thumbs down");
    downBtn.innerHTML = '<i class="fa-regular fa-thumbs-down"></i>';

    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.title = "Regenerate";
    refreshBtn.setAttribute("aria-label", "Regenerate");
    refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';

    // Toggle like (mutually exclusive with dislike)
    upBtn.addEventListener("click", function () {
        upBtn.classList.toggle("is-active");
        downBtn.classList.remove("is-active");
        if (upBtn.classList.contains("is-active")) {
            upBtn.innerHTML = '<i class="fa-solid fa-thumbs-up"></i>';
            downBtn.innerHTML = '<i class="fa-regular fa-thumbs-down"></i>';
            botMessageEl.dataset.feedback = "like";
            sendFeedback(botMessageEl.dataset.messageId, "like");
        } else {
            upBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i>';
            delete botMessageEl.dataset.feedback;
            sendFeedback(botMessageEl.dataset.messageId, null);
        }
    });

    // Toggle dislike (mutually exclusive with like)
    downBtn.addEventListener("click", function () {
        downBtn.classList.toggle("is-active");
        upBtn.classList.remove("is-active");
        if (downBtn.classList.contains("is-active")) {
            downBtn.innerHTML = '<i class="fa-solid fa-thumbs-down"></i>';
            upBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i>';
            botMessageEl.dataset.feedback = "dislike";
            sendFeedback(botMessageEl.dataset.messageId, "dislike");
        } else {
            downBtn.innerHTML = '<i class="fa-regular fa-thumbs-down"></i>';
            delete botMessageEl.dataset.feedback;
            sendFeedback(botMessageEl.dataset.messageId, null);
        }
    });

    // Ask the API again for the last user turn (drops previous assistant message)
    refreshBtn.addEventListener("click", function () {
        regenerateLastReply(botMessageEl);
    });

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(refreshBtn);

    return actions;
}

/**
 * Append a user or bot message bubble to the chat column.
 * Bot messages: markdown HTML + action icons + avatar.
 */
function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);

    const textBubble = document.createElement("div");
    textBubble.classList.add("text-bubble");

    // Step 1: Render markdown when marked.js is available
    if (typeof marked !== "undefined") {
        textBubble.innerHTML = marked.parse(text);
        enhancePlanImages(textBubble);
    } else {
        textBubble.textContent = text;
    }

    if (sender === "bot") {
        // Step 2a: Bot layout — text, feedback actions, then logo
        lastBotRawText = text;
        const botBlock = document.createElement("div");
        botBlock.className = "bot-block";
        botBlock.appendChild(textBubble);
        botBlock.appendChild(buildBotActions(text, msgDiv));

        const avatar = document.createElement("img");
        avatar.className = "bot-avatar";
        avatar.src = BOT_LOGO;
        avatar.alt = "Touria";
        botBlock.appendChild(avatar);

        msgDiv.appendChild(botBlock);
    } else {
        // Step 2b: User layout — sky-blue pill only
        msgDiv.appendChild(textBubble);
    }

    // Step 3: Add to DOM and scroll page container to bottom
    chatbox.appendChild(msgDiv);
    scrollChat();
    return msgDiv;
}

/**
 * Call backend /chat with full conversation history and append the assistant reply.
 */
async function requestBotReply() {
    const response = await fetch(API_BASE + "/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            Object.assign(
                {
                    message: conversation
                },
                chatIdentityPayload()
            )
        )
    });

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log("FULL BACKEND RESPONSE:", data);
    console.log("SUGGESTIONS:", data.suggestions);

    if (data.conversation_id) {
        setActiveConversationId(data.conversation_id);
        refreshHistoryList();
    }

    // Create the reply text
    let reply = data.reply;

    function isItineraryReplyText(text) {
        if (!text) return false;
        const t = String(text);
        return (
            t.includes("Family Itinerary") ||
            t.includes("Day 1:") ||
            t.includes("## Lodging Recommendations") ||
            t.includes("## Dining Recommendations") ||
            t.includes("## Budget Summary") ||
            t.includes("## Packing Tips") ||
            t.includes("## Trip Summary")
        );
    }

    // Add weather section only for full itinerary replies
    if (data.weather && isItineraryReplyText(reply)) {

        console.log("Weather information:", data.weather);

        reply += `
    ---
    ## Weather Forecast
    Destination: ${data.weather.location}, ${data.weather.country}
    Current Conditions:
    ${data.weather.condition}
    Current Temperature:
    ${data.weather.temperature}°F
    Upcoming Forecast:
    `;
        data.weather.forecast.forEach(day => {

            reply += `
    ${day.date}
    - High: ${day.high}°F
    - Low: ${day.low}°F
    - Rain Chance: ${day.rain_chance}%
    - Conditions: ${day.condition}
    `;

        });
    }
    // Save assistant message
    if (reply) {
        conversation.push({
            role: "assistant",
            content: reply
        });
    }
    // Display chatbot message
    const botEl = appendMessage(reply, "bot");
    if (botEl && data.assistant_message_id) {
        botEl.dataset.messageId = data.assistant_message_id;
    }
    // Display suggestion buttons
    if (Array.isArray(data.suggestions)) {
        showSuggestions(data.suggestions);
    } else {
        console.log("No suggestions received");
    }
}

/**
 * Regenerate: remove last assistant turn from history + DOM, then request again.
 */
async function regenerateLastReply(botMessageEl) {
    if (isSending) {
        return;
    }

    // Step 1: Find the last assistant message in conversation history
    let lastAssistantIndex = -1;
    for (let i = conversation.length - 1; i >= 0; i--) {
        if (conversation[i].role === "assistant") {
            lastAssistantIndex = i;
            break;
        }
    }

    if (lastAssistantIndex === -1) {
        return;
    }

    // Step 2: Drop that turn so the API regenerates from the prior user message
    conversation.splice(lastAssistantIndex, 1);
    if (botMessageEl && botMessageEl.parentNode) {
        botMessageEl.remove();
    }

    // Step 3: Re-request with thinking indicator
    isSending = true;
    sendBtn.disabled = true;
    showThinking();

    try {
        await requestBotReply();
    } catch (error) {
        console.error(error);
        appendMessage("Error: Could not regenerate the response.", "bot");
    } finally {
        hideThinking();
        isSending = false;
        sendBtn.disabled = false;
        inputMessage.focus();
    }
}

/**
 * Main send flow: show user message → POST /chat → show bot reply.
 * @param {string} [presetText] Optional text (used when auto-starting from trip cards).
 */
async function sendMessage(presetText) {
    const message = (presetText != null ? String(presetText) : inputMessage.value).trim();

    if (!message || isSending) {
        return;
    }

    // Step 1: Lock UI and enter chat layout
    isSending = true;
    enterChatMode();
    appendMessage(message, "user");

    if (suggestionBox) {
        suggestionBox.innerHTML = "";
    }

    // Step 2: Append user turn to history sent to the API
    conversation.push({
        role: "user",
        content: message
    });

    // Step 3: Clear the input only when the user typed (not for preset auto-starts)
    if (presetText == null) {
        inputMessage.value = "";
        inputMessage.style.height = "44px";
    }

    sendBtn.disabled = true;
    showThinking();

    // Step 4: Request bot reply
    try {
        await requestBotReply();
    } catch (error) {
        console.error(error);
        appendMessage("Error: Could not reach the server.", "bot");
    } finally {
        hideThinking();
        isSending = false;
        sendBtn.disabled = false;
        inputMessage.focus();
    }
}

/**
 * If the user arrived from touria-plan-welcome.html, auto-send a starter message
 * built from localStorage trip type + label, then clear the start flag.
 */
async function autostartFromTripOption() {
    // Step 1: Only run when the welcome page set the auto-start flag
    const shouldStart = localStorage.getItem("touriaStartChat") === "1";
    if (!shouldStart) {
        return;
    }

    const label =
        localStorage.getItem("touriaTripLabel") ||
        "I want help planning a trip";
    const tripType = localStorage.getItem("touriaTripType") || "other";

    // Step 2: Clear flag so refresh does not re-send the same starter
    localStorage.removeItem("touriaStartChat");

    // Step 3: Build a natural first user message that includes the trip category
    const starter =
        label +
        ". Trip category: " +
        tripType +
        ". Help me plan this trip.";

    await sendMessage(starter);
}

/* ---- Guest banner (optional) ---- */
const welcomeMessage = document.getElementById("welcome-message");

if (userType === "guest" && welcomeMessage) {
    welcomeMessage.hidden = false;
    welcomeMessage.innerHTML = `
        You're using Touria as a guest.
        <a href="login.html">Log in</a> to save your trips.
    `;
}

async function sendFeedback(messageId, feedback) {
    if (!messageId) {
        return;
    }
    try {
        await fetch(API_BASE + "/messages/" + encodeURIComponent(messageId) + "/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedback: feedback })
        });
    } catch (err) {
        console.error("Feedback save failed:", err);
    }
}

function formatHistoryTime(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
        return "";
    }
}

async function refreshHistoryList() {
    if (!historyList) {
        return;
    }
    if (!isRegistered) {
        historyList.innerHTML = "";
        if (historyEmpty) {
            historyEmpty.hidden = false;
            historyEmpty.textContent =
                "Guest chats are not saved. Log in to keep your trip history.";
        }
        return;
    }
    try {
        const res = await fetch(API_BASE + "/conversations?" + authQuery());
        if (!res.ok) {
            throw new Error("history fetch failed");
        }
        const data = await res.json();
        const items = data.conversations || [];
        historyList.innerHTML = "";
        if (historyEmpty) {
            historyEmpty.hidden = items.length > 0;
            if (items.length === 0) {
                historyEmpty.textContent =
                    "No saved trips yet. Start chatting to build your history.";
            }
        }
        items.forEach(function (conv) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "history-item" + (conv.id === conversationId ? " is-active" : "");
            btn.setAttribute("role", "listitem");
            btn.innerHTML =
                '<span class="history-item-title"></span>' +
                '<span class="history-item-meta"></span>';
            btn.querySelector(".history-item-title").textContent = conv.title || "New trip";
            const metaParts = [];
            if (conv.trip_type) metaParts.push(conv.trip_type);
            metaParts.push(formatHistoryTime(conv.updated_at));
            btn.querySelector(".history-item-meta").textContent = metaParts.filter(Boolean).join(" · ");
            btn.addEventListener("click", function () {
                loadConversation(conv.id);
                closeHistoryDrawer();
            });
            historyList.appendChild(btn);
        });
    } catch (err) {
        console.error(err);
        if (historyEmpty) {
            historyEmpty.hidden = false;
            historyEmpty.textContent =
                "History unavailable. Run supabase_conversations.sql in Supabase, then try again.";
        }
    }
}

async function loadConversation(id) {
    if (!id || isSending) {
        return;
    }
    try {
        const res = await fetch(API_BASE + "/conversations/" + encodeURIComponent(id));
        if (!res.ok) {
            throw new Error("load failed");
        }
        const data = await res.json();
        const conv = data.conversation || {};
        const messages = data.messages || [];

        setActiveConversationId(conv.id);
        setChatTitle(conv.title || "Trip");
        activeTripType = conv.trip_type || activeTripType;
        conversation = messages
            .filter(function (m) {
                return m.role === "user" || m.role === "assistant";
            })
            .map(function (m) {
                return { role: m.role, content: m.content, id: m.id, feedback: m.feedback };
            });

        chatbox.innerHTML = "";
        if (suggestionBox) {
            suggestionBox.innerHTML = "";
        }
        enterChatMode();

        conversation.forEach(function (m) {
            const el = appendMessage(m.content, m.role === "assistant" ? "bot" : "user");
            if (el && m.id && m.role === "assistant") {
                el.dataset.messageId = m.id;
                if (m.feedback) {
                    el.dataset.feedback = m.feedback;
                    const actions = el.querySelector(".bot-actions");
                    if (actions) {
                        const buttons = actions.querySelectorAll("button");
                        if (m.feedback === "like" && buttons[0]) {
                            buttons[0].classList.add("is-active");
                            buttons[0].innerHTML = '<i class="fa-solid fa-thumbs-up"></i>';
                        }
                        if (m.feedback === "dislike" && buttons[1]) {
                            buttons[1].classList.add("is-active");
                            buttons[1].innerHTML = '<i class="fa-solid fa-thumbs-down"></i>';
                        }
                    }
                }
            }
        });
        refreshHistoryList();
    } catch (err) {
        console.error(err);
        appendMessage("Could not load that trip. Please try again.", "bot");
    }
}

function startNewChat() {
    if (isSending) {
        return;
    }
    setActiveConversationId(null);
    conversation = [];
    chatbox.innerHTML = "";
    if (suggestionBox) {
        suggestionBox.innerHTML = "";
    }
    setChatTitle("New trip");
    document.body.classList.remove("is-chatting", "chat-transition");
    if (welcomePanel) {
        welcomePanel.removeAttribute("hidden");
        welcomePanel.classList.remove("is-leaving");
    }
    inputMessage.placeholder = WELCOME_PLACEHOLDER;
    refreshHistoryList();
    closeHistoryDrawer();
    inputMessage.focus();
}

function openHistoryDrawer() {
    document.body.classList.add("history-open");
    if (historyBackdrop) {
        historyBackdrop.hidden = false;
    }
}

function closeHistoryDrawer() {
    document.body.classList.remove("history-open");
    if (historyBackdrop) {
        historyBackdrop.hidden = true;
    }
}

function renderHistoryFooter() {
    if (!historyFooter) {
        return;
    }
    if (isRegistered) {
        const first = localStorage.getItem("firstName") || "";
        const email = localStorage.getItem("email") || "";
        historyFooter.innerHTML =
            '<div class="history-user">' +
            '<div class="history-user-avatar">' +
            (first ? first.charAt(0).toUpperCase() : "T") +
            "</div>" +
            '<div><p class="history-user-name"></p><p class="history-user-email"></p></div>' +
            "</div>";
        historyFooter.querySelector(".history-user-name").textContent =
            first || "Traveler";
        historyFooter.querySelector(".history-user-email").textContent = email;
    } else {
        historyFooter.innerHTML =
            '<p class="history-guest-note">Guest mode — chats are not saved.</p>' +
            '<a class="history-login-link" href="login.html">Log in to save trips</a>';
    }
}

/* ---- Wire up send controls and initial placeholder ---- */
inputMessage.placeholder = WELCOME_PLACEHOLDER;

sendBtn.addEventListener("click", function () {
    sendMessage();
});

inputMessage.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

if (newChatBtn) {
    newChatBtn.addEventListener("click", startNewChat);
}
if (historyToggle) {
    historyToggle.addEventListener("click", openHistoryDrawer);
}
if (historyBackdrop) {
    historyBackdrop.addEventListener("click", closeHistoryDrawer);
}

renderHistoryFooter();
refreshHistoryList();

// Resume last active conversation only for registered users
(async function bootChat() {
    const shouldStart = localStorage.getItem("touriaStartChat") === "1";
    if (shouldStart) {
        await autostartFromTripOption();
        return;
    }
    if (isRegistered && conversationId) {
        await loadConversation(conversationId);
    }
})();
