"""
Shared Schema Validators

FIX #10 (MEDIUM): Extracted password strength validation into a single reusable
                   function, applied consistently across UserCreate AND PasswordChangeRequest.

Before this fix, PasswordChangeRequest only checked min_length=8, allowing weak
passwords to be set via the change-password endpoint.
"""

import re


def validate_password_strength(v: str) -> str:
    """
    Shared password strength validator.

    Rules (consistent with OWASP recommendations):
      - At least one uppercase letter
      - At least one digit
      - At least one special character

    Applied in:
      - schemas/user.py: UserCreate.password
      - schemas/auth.py: PasswordChangeRequest.new_password

    Raises:
        ValueError: with a descriptive message for each failed rule.
    """
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"""[!@#$%^&*(),.?":{}|<>_\-]""", v):
        raise ValueError("Password must contain at least one special character.")
    return v
