import smtplib
from email.mime.text import MIMEText
from settings import settings

def send_otp_email(to_email: str, otp: str):
    subject = "Your DeepTraaff OTP Code"
    body = f"""
    Your OTP is: {otp}

    This OTP will expire in 5 minutes.
    If you did not request this, ignore this message.
    """

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.email_sender
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.email_sender, settings.email_app_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print("Email sending error:", e)
        return False
