# Password hashing helpers for public.users.password
import hashlib
import secrets

def hash_password(plain_password: str) -> str:
    """
    Hash a password before storing it in public.users.password.
    Format: pbkdf2_sha256$<iterations>$<salt>$<hash>
    (Plaintext must never be stored — this string is expected in Supabase.)
    """
    iterations = 120000
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    ).hex()
    return f"pbkdf2_sha256${iterations}${salt}${digest}"


def verify_password(plain_password: str, stored: str | None) -> bool:
    """Verify a plain password against a stored hash (or legacy plaintext)."""
    if not stored or not plain_password:
        return False
    try:
        parts = stored.split("$")
        if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
            _algo, iterations_s, salt, digest = parts
            check = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                int(iterations_s),
            ).hex()
            return secrets.compare_digest(check, digest)
        # Legacy rows that still hold plaintext
        return secrets.compare_digest(plain_password, stored)
    except Exception:
        return False

