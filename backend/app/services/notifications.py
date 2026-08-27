"""
Fires an email when a conflict is detected. Kept as one function so routers
just call notify_conflict(...) and don't care about Resend's API shape.
"""
import resend

from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY


def notify_conflict(work_order_title: str, requesting_dept: str, conflicts: list[dict], recipient_emails: list[str]):
    if not recipient_emails:
        return None

    conflict_lines = "\n".join(
        f"- {'🔴' if c['severity'] == 'red' else '🟡'} {c['name']} ({c['layer']}) — {c['distance_meters']}m away"
        for c in conflicts
    )

    html = f"""
    <h2>⚠️ Conflict Detected: {work_order_title}</h2>
    <p>Requested by: {requesting_dept}</p>
    <p>The following infrastructure conflicts were found:</p>
    <pre>{conflict_lines}</pre>
    <p>Please coordinate before excavation begins.</p>
    """

    return resend.Emails.send({
        "from": settings.ALERT_FROM_EMAIL,
        "to": recipient_emails,
        "subject": f"🚧 Coordination Required: {work_order_title}",
        "html": html,
    })
