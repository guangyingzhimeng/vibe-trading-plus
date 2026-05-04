"""Regression tests for prefixed API deployments."""

from __future__ import annotations

from fastapi.testclient import TestClient

import api_server


def test_api_path_prefix_is_stripped_before_route_matching() -> None:
    client = TestClient(api_server.app)

    response = client.get("/vibe-trading/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
