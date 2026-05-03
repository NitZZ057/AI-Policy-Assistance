from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from app.core.config import get_settings


class PromptRegistry:
    def __init__(self) -> None:
        prompts_dir = Path(__file__).resolve().parents[1] / "prompts"

        self._env = Environment(
            loader=FileSystemLoader(prompts_dir),
            autoescape=False,
            undefined=StrictUndefined,
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def render(self, template_name: str, context: dict[str, Any]) -> str:
        template = self._env.get_template(template_name)
        return template.render(**context).strip()


def policy_analysis_template(version: str = "v1") -> str:
    return f"policy_analysis_{version}.jinja2"


def document_qa_template(version: str = "v1") -> str:
    return f"document_qa_{version}.jinja2"
