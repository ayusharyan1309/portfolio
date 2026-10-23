"""
Guardrails — keep the assistant scoped to questions about Ayush.

The system prompt alone is not enough: visitors can wrap any task in
"...that Ayush knows" and the model will happily write the code. So:
1. Input checks run before the LLM is called (code/task requests, prompt
   injection, oversized messages) and answer with a fixed redirect.
2. History from the client is untrusted: only user/assistant turns survive,
   each one truncated, and turns that already broke scope are dropped.
3. The output guard watches the streamed answer and swaps it for the
   redirect if the model starts emitting code anyway.

Mirror of chatbot/backend/src/rag/guard.ts — keep the two in sync.
Pure standard library so it can be tested without the model dependencies.
"""

import re
from typing import Optional

MAX_MESSAGE_CHARS = 500
MAX_HISTORY_MESSAGES = 6
MAX_HISTORY_CHARS = 1000

EMAIL = "ayusharyan1309@gmail.com"
GITHUB_URL = "https://github.com/ayusharyan1309"
LEETCODE_URL = "https://leetcode.com/u/ayusharyan1309/"

REPLIES = {
    "code": (
        "I can't write or share code here — I only answer questions about Ayush's experience, projects and skills. "
        f"You can read his real code on GitHub ({GITHUB_URL}) and see his DSA practice on LeetCode ({LEETCODE_URL}). "
        "Want to know which projects he built in Java, or what he's done with Kafka?"
    ),
    "offTopic": (
        "I can only answer questions about Ayush — his experience, projects, skills, education and how to reach him. "
        f"Try asking what he built at Visionify or EventStrat, or email him at {EMAIL}."
    ),
    "tooLong": (
        f"That's a bit long for me. Please ask a short question about Ayush's work (under {MAX_MESSAGE_CHARS} characters)."
    ),
}

_I = re.IGNORECASE
_LANGUAGES = r"java|python|c\+\+|cpp|c#|javascript|js|typescript|ts|go|golang|kotlin|rust|sql|dart|c"

# "write / give me ... code", "palindrome partitioning code in java", "solve two sum"
_CODE_REQUEST = [
    re.compile(r"\b(write|give|show|share|send|provide|generate|create|print|paste|type out|output)\b[^.?!\n]{0,60}\b(code|program|snippet|function|method|class|script|pseudo-?code|regex)\b", _I),
    re.compile(r"\b(code|program|snippet|script|pseudo-?code)\s+(for|of|to|in|that|which|using)\b", _I),
    re.compile(rf"\b(solution|implementation|algorithm|approach)\s+(\w+\s+){{0,2}}(in|using)\s+({_LANGUAGES})\b", _I),
    re.compile(r"\b(solution|answer|algorithm|approach|implementation)\s+(to|for|of)\s+(this|that|the|a|an)?\s*(\w+\s+){0,3}(problem|question|challenge|puzzle)\b", _I),
    re.compile(r"(^|\b(can|could|would|will) you\s+|\bplease\s+|\bhelp me\s+(to\s+)?)(implement|solve|debug|refactor|optimi[sz]e|dry[- ]run|code)\b", _I),
    re.compile(r"\bhow (do|can|would|should|to) (i |you |we |one |he |ayush )?[^.?!\n]{0,40}\b(code|implement|program|solve|reverse|sort|traverse|parse)\b", _I),
    re.compile(r"\b(fix|review|complete|finish|correct)\s+(this|my|the following|the)\s+(code|program|function|query|bug|snippet)\b", _I),
    re.compile(r"\b(write|give|show|create|generate)\b[^.?!\n]{0,30}\bquery\s+(to|for|that)\b", _I),
    re.compile(r"\b(leetcode|gfg|geeksforgeeks|hackerrank|codeforces|dsa)\s+(problem|question|#?\d+)\b", _I),
    re.compile(r"```|#include\s*<|public\s+static\s+void|System\.out\.print|\bdef\s+\w+\s*\(|console\.log\("),
]

# Unrelated deliverables.
_TASK_REQUEST = [
    re.compile(r"\b(write|compose|draft|generate|create)\b[^.?!\n]{0,40}\b(essay|poem|story|song|joke|email|letter|article|blog|tweet|post|speech)\b", _I),
    re.compile(r"\btranslate\b", _I),
]

_PROMPT_INJECTION = [
    re.compile(r"\b(ignore|disregard|forget|override|bypass)\b[^.?!\n]{0,40}\b(previous|above|prior|earlier|all|any|your|the|these|system)\b[^.?!\n]{0,30}\b(instructions?|rules?|prompts?|guidelines?|messages?|restrictions?)\b", _I),
    re.compile(r"\b(system prompt|developer (message|mode)|initial prompt|hidden prompt|your (instructions|rules|prompt|guidelines))\b", _I),
    re.compile(r"\b(you are now|from now on,? (you|act|answer|respond|reply)|pretend (to be|you are|that you)|role-?play|jailbreak|dan mode)\b", _I),
    re.compile(r"^\s*(please\s+)?act as\b", _I),
    re.compile(r"\b(reveal|repeat|print|show)\b[^.?!\n]{0,30}\b(instructions|prompt)\b", _I),
]

# Code in the model's answer: fences, or a line that starts a declaration.
_CODE_OUTPUT = [
    re.compile(r"```"),
    re.compile(r"(^|\n)\s*(public|private|protected)\s+(static\s+)?[\w<>\[\],\s]+\s+\w+\s*\("),
    re.compile(r"(^|\n)\s*(class|interface)\s+\w+[^\n]*\{"),
    re.compile(r"(^|\n)\s*(def|function|fn|func)\s+\w+\s*\("),
    re.compile(r"(^|\n)\s*(#include|import\s+java\.|from\s+\w+\s+import\s)"),
    re.compile(r"\b(System\.out\.println|console\.log)\("),
    re.compile(r"(^|\n)\s*for\s*\(\s*(int|let|var|const)\s+\w+\s*="),
]


def check_message(message: str) -> Optional[str]:
    """Return the REPLIES key to answer with, or None if the LLM may answer."""
    if len(message) > MAX_MESSAGE_CHARS:
        return "tooLong"
    if any(p.search(message) for p in _PROMPT_INJECTION):
        return "offTopic"
    if any(p.search(message) for p in _CODE_REQUEST):
        return "code"
    if any(p.search(message) for p in _TASK_REQUEST):
        return "offTopic"
    return None


def looks_like_code(text: str) -> bool:
    return any(p.search(text) for p in _CODE_OUTPUT)


def sanitize_history(history) -> list[dict]:
    """
    Keep only well-formed user/assistant turns from the client, truncated. User
    turns that would be blocked now and assistant turns containing code are
    dropped — forged history is the easiest way around the system prompt.
    """
    if not isinstance(history, list):
        return []

    turns: list[dict] = []
    for item in history:
        if not isinstance(item, dict):
            continue
        role, content = item.get("role"), item.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str):
            continue
        text = content.strip()[:MAX_HISTORY_CHARS]
        if not text:
            continue
        if role == "user" and check_message(text):
            continue
        if role == "assistant" and looks_like_code(text):
            continue
        turns.append({"role": role, "content": text})

    recent = turns[-MAX_HISTORY_MESSAGES:]
    # Some providers require the conversation to open with a user turn.
    while recent and recent[0]["role"] != "user":
        recent.pop(0)
    return recent


class OutputGuard:
    """Accumulates the streamed answer; push() returns False once it turns into code."""

    def __init__(self) -> None:
        self._text = ""

    def push(self, chunk: str) -> bool:
        self._text += chunk
        return not looks_like_code(self._text)
