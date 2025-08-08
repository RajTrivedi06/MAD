import os, smtplib
from email.message import EmailMessage
from dotenv import load_dotenv, find_dotenv
from pathlib import Path

env_path = Path(__file__).parents[1] / ".env"
print(f"→ loading .env from: {env_path!s}")
load_dotenv(env_path)  # will no-op if the file doesn’t exist

msg = EmailMessage()
msg["From"] = os.getenv("SMTP_USER")
msg["To"]   = "anuragjanaswamy56@gmail.com"  # send a test to yourself
msg["Subject"] = "SMTP Test 🚀"
msg.set_content("If you see this in your inbox, Gmail SMTP is configured correctly!")

with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as s:
    s.starttls()
    s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
    s.send_message(msg)

print("✅ Test email sent!")
