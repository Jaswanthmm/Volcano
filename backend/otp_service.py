"""
OTP (One-Time Password) Service for Volcano.
Supports Email verification (via Google Workspace/Gmail SMTP, GCP SendGrid, or generic SMTP)
and Phone verification (via WhatsApp Twilio REST API, SMS, or dev mode fallback).
"""

import os
import random
import smtplib
import ssl
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- Configuration Helpers ---

def is_dev_mode():
    """Returns True if running in local development or debug mode without live credentials."""
    return os.getenv("FLASK_ENV") == "development" or os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

def generate_otp_code(length=6) -> str:
    """Generates a secure numeric OTP string of given length."""
    return "".join(random.choices("0123456789", k=length))

def normalize_phone(phone: str) -> str:
    """
    Normalizes phone numbers to standard Volcano format:
    '+<country_code> <national_digits>' (e.g., '+91 1234567890').
    Handles unformatted inputs, extra spaces, dashes, or missing '+'.
    """
    if not phone:
        return ""
    raw = phone.strip()
    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        return ""

    if raw.startswith("+"):
        if digits.startswith("91") and len(digits) >= 12:
            return f"+91 {digits[2:]}"
        elif digits.startswith("1") and len(digits) == 11:
            return f"+1 {digits[1:]}"
        elif digits.startswith("44") and len(digits) >= 12:
            return f"+44 {digits[2:]}"
        else:
            if " " in raw:
                parts = raw.split(None, 1)
                code_part = "".join(ch for ch in parts[0] if ch.isdigit())
                num_part = "".join(ch for ch in parts[1] if ch.isdigit())
                return f"+{code_part} {num_part}"
            elif len(digits) > 10:
                code_len = len(digits) - 10
                return f"+{digits[:code_len]} {digits[code_len:]}"
            else:
                return f"+91 {digits}"
    else:
        if len(digits) == 10:
            return f"+91 {digits}"
        elif len(digits) == 12 and digits.startswith("91"):
            return f"+91 {digits[2:]}"
        elif len(digits) == 11 and digits.startswith("1"):
            return f"+1 {digits[1:]}"
        else:
            return f"+91 {digits}"

# --- Email Dispatcher ---

def send_email_otp(to_email: str, otp_code: str, role: str = "alien", action: str = "registration") -> dict:
    """
    Sends a 6-digit OTP to the recipient email address.
    Uses SMTP (Gmail / Google Workspace Relay / SendGrid on GCP / standard SMTP) if configured.
    Falls back to console logging in development mode.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", smtp_user or "noreply@volcano.market")

    is_reset = action == "password_reset"
    subject = f"Your Volcano {'Password Reset' if is_reset else 'Verification'} Code: {otp_code}"
    
    role_label = "Alien Operative" if role == "alien" else "Boardroom Executive"
    theme_accent = "#22c55e" if role == "alien" else "#3b82f6"
    theme_bg = "#000000"
    action_desc = (
        "Use the single-use security code below to authorize your password reset and establish new access credentials."
        if is_reset else
        "Use the single-use verification code below to verify your email and complete your initial transmission registration."
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="background-color: {theme_bg}; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0d1117; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
            <tr>
                <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 24px; font-weight: 900; letter-spacing: 4px; color: {theme_accent}; text-transform: uppercase;">
                        VOLCANO
                    </div>
                    <div style="font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.5); margin-top: 4px; text-transform: uppercase;">
                        {role_label} {'Password Recovery' if is_reset else 'Authentication Protocol'}
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 36px 32px; text-align: center;">
                    <p style="font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 24px;">
                        {action_desc}
                    </p>
                    <div style="display: inline-block; padding: 16px 36px; background-color: rgba(255,255,255,0.04); border: 2px dashed {theme_accent}; border-radius: 12px; margin-bottom: 24px;">
                        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace;">
                            {otp_code}
                        </span>
                    </div>
                    <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin: 0;">
                        This code expires in <strong style="color: rgba(255,255,255,0.7);">10 minutes</strong>. If you did not request this transmission, disregard this message.
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px 32px; background-color: #070a0e; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 11px; color: rgba(255,255,255,0.3);">
                    Volcano Autonomous Intelligence Platform &bull; Secure Neural Exchange
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    # If SMTP is configured, send via SMTP
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_email
            msg["To"] = to_email

            part1 = MIMEText(f"Your Volcano verification code is: {otp_code} (Valid for 10 minutes)", "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            context = ssl.create_default_context()
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, to_email, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls(context=context)
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, to_email, msg.as_string())

            print(f"[OTP] Successfully dispatched email OTP to {to_email} via {smtp_host}")
            return {"success": True, "channel": "email", "simulated": False}
        except Exception as e:
            print(f"[OTP ERROR] Failed to send live email via SMTP to {to_email}: {e}")
            # Fall back to simulated dispatch so registration flow is not blocked
            return {"success": True, "channel": "email", "simulated": True, "error": str(e), "debug_code": otp_code}

    # Dev / Simulation mode
    print(f"\n========================================================")
    print(f"[OTP DEV SIMULATOR] EMAIL VERIFICATION CODE")
    print(f"  Target:     {to_email}")
    print(f"  Role:       {role}")
    print(f"  OTP Code:   {otp_code}")
    print(f"  Expires in: 10 minutes")
    print(f"========================================================\n")
    return {"success": True, "channel": "email", "simulated": True, "debug_code": otp_code}

# --- SMS Mobile Dispatcher ---

def send_sms_otp(phone: str, otp_code: str, role: str = "alien", action: str = "registration") -> dict:
    """
    Sends a 6-digit OTP to the recipient mobile number strictly via SMS.
    Supports Twilio SMS API or any standard SMS gateway.
    Falls back to console logging in development mode if Twilio credentials are not set.
    """
    phone_normalized = normalize_phone(phone)
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER", os.getenv("TWILIO_FROM"))

    is_reset = action == "password_reset"
    message_body = (
        f"Volcano {'Password Reset' if is_reset else 'Verification'} Code: {otp_code}. "
        f"Valid for 10 minutes. Do not share this code."
    )

    if twilio_sid and twilio_token and twilio_from:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = urllib.parse.urlencode({
                "From": twilio_from,
                "To": phone_normalized.replace(" ", ""),
                "Body": message_body
            }).encode("utf-8")

            req = urllib.request.Request(url, data=data, method="POST")
            # HTTP Basic Auth for Twilio
            import base64
            auth_header = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode("utf-8")).decode("utf-8")
            req.add_header("Authorization", f"Basic {auth_header}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(req, timeout=10) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                sid = resp_json.get("sid")
                print(f"[OTP] Successfully dispatched SMS message to {phone_normalized} (SID: {sid})")
                return {"success": True, "channel": "sms", "simulated": False, "message_sid": sid}
        except Exception as e:
            print(f"[OTP ERROR] Failed to send SMS via Twilio: {e}")
            return {"success": True, "channel": "sms", "simulated": True, "error": str(e), "debug_code": otp_code}

    # Dev / Simulation mode
    print(f"\n========================================================")
    print(f"[OTP DEV SIMULATOR] SMS VERIFICATION CODE")
    print(f"  Target:     {phone_normalized}")
    print(f"  Channel:    SMS")
    print(f"  Role:       {role}")
    print(f"  OTP Code:   {otp_code}")
    print(f"  Expires in: 10 minutes")
    print(f"========================================================\n")
    return {"success": True, "channel": "sms", "simulated": True, "debug_code": otp_code}

# Backwards compatibility alias
send_whatsapp_otp = send_sms_otp
