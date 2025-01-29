import discord
from discord.ext import commands
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

class GithubAgent(commands.Bot):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.github_repo = os.getenv("GITHUB_REPO")
        self.run(os.getenv("DISCORD_TOKEN"))

    async def on_ready(self):
        print(f'{self.user} has connected to Discord!')

    async def submit_issue(self, title, body):
        """Submit an issue to GitHub repository"""
        headers = {
            "Authorization": f"Bearer {self.github_token}",
            "Content-Type": "application/json"
        }
        data = {
            "title": title,
            "body": body,
            "labels": ["bug"]
        }
        response = requests.post(
            f"https://api.github.com/repos/{self.github_repo}/issues",
            headers=headers,
            json=data
        )
        if response.status_code == 201:
            return "Issue submitted successfully!"
        return f"Failed to submit issue: {response.text}"

    async def get_urgent_issues(self):
        """Get urgent issues from GitHub repository"""
        headers = {
            "Authorization": f"Bearer {self.github_token}"
        }
        response = requests.get(
            f"https://api.github.com/repos/{self.github_repo}/issues?labels=urgent",
            headers=headers
        )
        if response.status_code == 200:
            issues = response.json()
            return "Urgent Issues:\n" + "\n".join([f"- {issue['title']}" for issue in issues])
        return "No urgent issues found or failed to retrieve issues"

intents = discord.Intents.default()
intents.typing = False
intents.presences = False

bot = GithubAgent(command_prefix="!", intents=intents)

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    if message.content.startswith("!submit_issue"):
        _, title, body = message.content.split(" ", 2)
        result = await bot.submit_issue(title, body)
        await message.channel.send(result)

    if message.content.startswith("!get_urgent"):
        result = await bot.get_urgent_issues()
        await message.channel.send(result)

bot.run("YOUR_DISCORD_TOKEN")
