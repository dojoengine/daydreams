import pytest
from discord_agent import GithubAgent
import requests
from unittest.mock import patch

@pytest.fixture
def mock_discord():
    with patch('discord.Bot') as mock_bot:
        yield mock_bot

def test_submit_issue_success(mock_discord, mocker):
    # Mock successful API response
    mock_response = mocker.Mock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"number": 123}

    mocker.patch('requests.post', return_value=mock_response)

    agent = GithubAgent(command_prefix="!", intents=discord.Intents.default())
    result = agent.submit_issue("Test Issue", "This is a test issue")
    assert "Issue submitted successfully!" in result

def test_submit_issue_failure(mock_discord, mocker):
    # Mock failed API response
    mock_response = mocker.Mock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"

    mocker.patch('requests.post', return_value=mock_response)

    agent = GithubAgent(command_prefix="!", intents=discord.Intents.default())
    result = agent.submit_issue("Test Issue", "This is a test issue")
    assert "Failed to submit issue" in result

def test_get_urgent_issues_success(mock_discord, mocker):
    # Mock successful API response with sample data
    mock_response = mocker.Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {"number": 1, "title": "Issue 1"},
        {"number": 2, "title": "Issue 2"}
    ]

    mocker.patch('requests.get', return_value=mock_response)

    agent = GithubAgent(command_prefix="!", intents=discord.Intents.default())
    result = agent.get_urgent_issues()
    assert "Urgent Issues:" in result
    assert "Issue 1" in result
    assert "Issue 2" in result

def test_get_urgent_issues_failure(mock_discord, mocker):
    # Mock failed API response
    mock_response = mocker.Mock()
    mock_response.status_code = 404
    mock_response.text = "Not Found"

    mocker.patch('requests.get', return_value=mock_response)

    agent = GithubAgent(command_prefix="!", intents=discord.Intents.default())
    result = agent.get_urgent_issues()
    assert "No urgent issues found" in result
