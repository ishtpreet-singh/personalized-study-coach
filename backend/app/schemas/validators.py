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
    errors = []
    if not re.search(r"[a-z]", v):
        errors.append("Password must contain at least one lowercase letter.")
    if not re.search(r"[A-Z]", v):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"\d", v):
        errors.append("Password must contain at least one number.")
    if not re.search(r"""[!@#$%^&*(),.?":{}|<>_\-]""", v):
        errors.append("Password must contain at least one special character.")
    
    if errors:
        raise ValueError("\n".join(errors))
    return v
