import random

SPAM_KEYWORDS = ["crypto", "bitcoin", "scam", "cheap", "viagra", "free money", "click here"]
TAGS_POOL = ["Quantum Mechanics", "Bio-Tech", "AI Algorithms", "Space Propulsion", "Cybernetics", "Renewable Energy", "Neuro-Link", "Robotics"]

def analyze_signal(title, content):
    """
    Analyzes the signal for quality assurance.
    Returns a dict with {valid: bool, reason: str, value: str, tags: str}
    """
    combined_text = (title + " " + content).lower()
    
    # 1. Spam Filter
    if len(content) < 10:
        return {"valid": False, "reason": "Signal too weak (content too short)."}
    
    for kw in SPAM_KEYWORDS:
        if kw in combined_text:
            return {"valid": False, "reason": f"Firewall blocked restricted keyword: '{kw}'"}

    # 2. Valuation (Mock AI)
    # Generate a random value between $10k and $5M
    base_val = random.randint(10, 5000)
    value_str = f"${base_val},000"

    # 3. Tagging
    # Pick 1-2 random tags
    tags = ", ".join(random.sample(TAGS_POOL, k=random.randint(1, 2)))

    return {
        "valid": True,
        "value": value_str,
        "tags": tags
    }
