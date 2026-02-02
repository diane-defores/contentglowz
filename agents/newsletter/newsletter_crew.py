"""
Newsletter Crew - Multi-agent workflow for newsletter generation.

Pipeline: Research → Curate → Write → Review → Draft/Send

Uses:
- Composio for Gmail integration (read emails, create drafts)
- Exa AI for content research
- SendGrid for mass delivery
"""

from typing import List, Optional, Dict, Any
from crewai import Agent, Task, Crew, Process
from dotenv import load_dotenv
import os
from datetime import datetime

from agents.newsletter.newsletter_agent import (
    NewsletterAgent,
    NewsletterResearchAgent,
    NewsletterWriterAgent,
)
from agents.newsletter.schemas.newsletter_schemas import (
    NewsletterConfig,
    NewsletterDraft,
    NewsletterSection,
)
from agents.newsletter.config.newsletter_config import get_newsletter_config

load_dotenv()


class NewsletterCrew:
    """
    Multi-agent crew for newsletter generation.

    Coordinates research, writing, and delivery agents to produce
    complete newsletters from email insights and web research.
    """

    def __init__(
        self,
        llm_model: Optional[str] = None,
        use_gmail: bool = True
    ):
        """
        Initialize Newsletter Crew.

        Args:
            llm_model: LLM model for all agents
            use_gmail: Enable Gmail integration via Composio
        """
        config = get_newsletter_config()
        self.llm_model = llm_model or config["llm_model"]
        self.use_gmail = use_gmail

        # Initialize agents
        print("Initializing Newsletter Crew...")
        self.research_agent = NewsletterResearchAgent(self.llm_model)
        self.writer_agent = NewsletterWriterAgent(self.llm_model)
        print("✅ Newsletter agents initialized")

    def generate_newsletter(
        self,
        config: NewsletterConfig,
        competitor_emails: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a complete newsletter through multi-agent workflow.

        Args:
            config: Newsletter configuration
            competitor_emails: Override competitor email addresses

        Returns:
            Dictionary with newsletter draft and metadata
        """
        print("\n" + "=" * 60)
        print("NEWSLETTER GENERATION PIPELINE")
        print("=" * 60)
        print(f"Newsletter: {config.name}")
        print(f"Topics: {', '.join(config.topics)}")
        print(f"Tone: {config.tone.value}")
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60 + "\n")

        results = {
            "config": config.model_dump(),
            "stages": {},
            "draft": None,
        }

        # Merge competitor emails
        all_competitors = list(config.competitor_emails)
        if competitor_emails:
            all_competitors.extend(competitor_emails)

        # STAGE 1: Research
        print("\n📧 STAGE 1: Email & Content Research")
        print("-" * 40)

        research_task = Task(
            description=f"""
            Research content for a newsletter about: {', '.join(config.topics)}

            Your tasks:
            1. Read recent newsletter emails from Gmail (last 7 days)
            2. Analyze competitor newsletters from: {', '.join(all_competitors) or 'N/A'}
            3. Research trending content on the topics
            4. Identify 3-5 key themes or stories to cover

            Target audience: {config.target_audience}
            Tone: {config.tone.value}

            Output a structured research brief with:
            - Key insights from emails
            - Trending topics and angles
            - Recommended content themes
            - Source URLs for reference
            """,
            expected_output="Structured research brief with themes, insights, and sources",
            agent=self.research_agent.get_agent(),
        )

        # STAGE 2: Write Content
        print("\n✍️ STAGE 2: Content Writing")
        print("-" * 40)

        writing_task = Task(
            description=f"""
            Write newsletter content based on the research brief.

            Newsletter: {config.name}
            Topics: {', '.join(config.topics)}
            Tone: {config.tone.value}
            Target audience: {config.target_audience}

            Create:
            1. Compelling subject line (under 50 characters)
            2. Preview text (under 100 characters)
            3. Engaging intro paragraph
            4. {config.max_sections} content sections with:
               - Clear headings
               - Valuable insights
               - Source links where relevant
            5. Call-to-action: {config.cta_text or 'Encourage engagement'}
            6. Brief outro

            Format in clean markdown.
            """,
            expected_output="Complete newsletter in markdown format",
            agent=self.writer_agent.get_agent(),
            context=[research_task],
        )

        # Create and run crew
        crew = Crew(
            agents=[
                self.research_agent.get_agent(),
                self.writer_agent.get_agent(),
            ],
            tasks=[research_task, writing_task],
            process=Process.sequential,
            verbose=True,
        )

        print("\n🚀 Running newsletter generation pipeline...")
        crew_output = crew.kickoff()

        # Parse results
        results["stages"]["research"] = research_task.output.raw if research_task.output else None
        results["stages"]["writing"] = writing_task.output.raw if writing_task.output else None
        results["raw_output"] = str(crew_output)

        # Create draft object
        draft = NewsletterDraft(
            config=config,
            subject_line=self._extract_subject(str(crew_output)),
            preview_text=self._extract_preview(str(crew_output)),
            sections=self._parse_sections(str(crew_output)),
            plain_text=str(crew_output),
        )
        draft.word_count = len(str(crew_output).split())
        draft.estimated_read_time = draft.calculate_read_time()

        results["draft"] = draft.model_dump()

        print("\n" + "=" * 60)
        print("✅ NEWSLETTER GENERATION COMPLETE")
        print(f"Word count: {draft.word_count}")
        print(f"Read time: ~{draft.estimated_read_time} min")
        print("=" * 60)

        return results

    def _extract_subject(self, content: str) -> str:
        """Extract subject line from generated content."""
        lines = content.split("\n")
        for line in lines:
            if "subject" in line.lower() and ":" in line:
                return line.split(":", 1)[1].strip()[:50]
        return f"Newsletter - {datetime.now().strftime('%B %d, %Y')}"

    def _extract_preview(self, content: str) -> str:
        """Extract preview text from generated content."""
        lines = content.split("\n")
        for line in lines:
            if "preview" in line.lower() and ":" in line:
                return line.split(":", 1)[1].strip()[:100]
        return "This week's insights and updates"

    def _parse_sections(self, content: str) -> List[NewsletterSection]:
        """Parse content into newsletter sections."""
        sections = []
        current_section = None
        current_content = []
        order = 0

        for line in content.split("\n"):
            if line.startswith("## "):
                if current_section:
                    sections.append(NewsletterSection(
                        title=current_section,
                        content="\n".join(current_content).strip(),
                        order=order,
                    ))
                    order += 1
                current_section = line[3:].strip()
                current_content = []
            elif current_section:
                current_content.append(line)

        if current_section:
            sections.append(NewsletterSection(
                title=current_section,
                content="\n".join(current_content).strip(),
                order=order,
            ))

        return sections


# Convenience function for quick generation
def generate_newsletter(
    name: str,
    topics: List[str],
    audience: str,
    competitor_emails: Optional[List[str]] = None,
    tone: str = "professional",
) -> Dict[str, Any]:
    """
    Quick function to generate a newsletter.

    Args:
        name: Newsletter name
        topics: List of topics to cover
        audience: Target audience description
        competitor_emails: Competitor newsletters to analyze
        tone: Writing tone

    Returns:
        Generated newsletter data
    """
    from agents.newsletter.schemas.newsletter_schemas import NewsletterTone

    config = NewsletterConfig(
        name=name,
        topics=topics,
        target_audience=audience,
        tone=NewsletterTone(tone),
        competitor_emails=competitor_emails or [],
    )

    crew = NewsletterCrew()
    return crew.generate_newsletter(config)
