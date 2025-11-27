
def normalize_email(email: str) -> str:
    """
    Normalize the email address by lowercasing the domain part of it.
    """
    if not email:
        return ""
    try:
        email_name, domain_part = email.strip().rsplit('@', 1)
    except ValueError:
        return email
    else:
        email = email_name + '@' + domain_part.lower()
    return email
