#!/usr/bin/env python3
"""Test individual endpoints"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from lifeos_backend.main import app, health_check, get_financeiro_state
from fastapi.testclient import TestClient

client = TestClient(app)

print("[TEST 1] Health endpoint...")
try:
    response = client.get("/health")
    print(f"  Status: {response.status_code}")
    print(f"  Body: {response.json()}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n[TEST 2] Financeiro endpoint...")
try:
    response = client.get("/financeiro")
    print(f"  Status: {response.status_code}")
    data = response.json()
    print(f"  Divida: {data.get('totalDivida')}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n[TEST 3] Chat endpoint...")
try:
    response = client.post("/chat", json={"message": "oi", "context": None})
    print(f"  Status: {response.status_code}")
    data = response.json()
    print(f"  Reply: {data.get('reply')[:50]}...")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n[DONE]")
