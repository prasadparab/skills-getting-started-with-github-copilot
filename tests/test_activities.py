import os
import sys
from fastapi.testclient import TestClient

# Ensure src is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # some known activity from the in-memory dataset
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    email = "pytest_student@example.com"

    # make sure the test email is not present initially
    res = client.get("/activities")
    assert res.status_code == 200
    participants = res.json()[activity]["participants"]
    if email in participants:
        # ensure clean state by removing if exists
        client.delete(f"/activities/{activity}/participants?email={email}")

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Unregister
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]
