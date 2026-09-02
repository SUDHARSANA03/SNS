import json
import asyncio
from typing import List, Dict, Any
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from app.core.config import settings
from app.models.analysis import AnalysisResponse
from app.models.log_event import LogEvent, DetectedError

PROMPT_TEMPLATE = """You are an expert software debugging and log analysis system.
Analyze the following logs and detected errors to identify the root cause of the issues.

Rules:
1. Identify possible root causes.
2. Explain the sequence of events.
3. Identify relationships between errors.
4. Distinguish facts from hypotheses.
5. NEVER claim something happened unless supported by logs.
6. Reference specific log IDs as evidence.
7. Provide confidence for each conclusion.
8. Suggest debugging steps.
9. ONLY output valid JSON. Do not include markdown code blocks around the JSON.
10. If there is insufficient evidence to determine the root cause, still output the JSON but note it in the reasoning and summary.

The JSON response MUST match this schema exactly:
{
  "summary": "Brief explanation of what happened",
  "root_cause_analysis": [
    {
      "cause": "Cause description",
      "type": "hypothesis or fact",
      "confidence": 0.8,
      "evidence_log_ids": ["log_123"],
      "reasoning": "Explanation"
    }
  ],
  "timeline": [
    {
      "log_id": "log_120",
      "event": "Description of event"
    }
  ],
  "recommendations": [
    "Step 1", "Step 2"
  ]
}

Detected Errors:
{errors}

Logs:
{logs}
"""

async def analyze_logs_with_llm(events: List[LogEvent], errors: List[DetectedError]) -> AnalysisResponse:
    client = ChatNVIDIA(
        model=settings.NVIDIA_MODEL,
        temperature=0.2, # Lower temperature for more deterministic JSON output
        top_p=0.95,
        max_tokens=4096,
        chat_template_kwargs={"enable_thinking": True},
    )
    
    logs_str = json.dumps([e.model_dump() for e in events], default=str)
    errors_str = json.dumps([e.model_dump() for e in errors], default=str)
    
    prompt = PROMPT_TEMPLATE.replace("{logs}", logs_str).replace("{errors}", errors_str)
    
    # We use ainvoke for async processing
    # The ChatNVIDIA supports standard langchain interfaces
    try:
        # Run synchronously in a thread pool to simulate async if ainvoke isn't fully supported
        response = await asyncio.to_thread(client.invoke, [{"role": "user", "content": prompt}])
        content = response.content
        
        # Try to extract JSON if it was wrapped in markdown blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        parsed = json.loads(content)
        return AnalysisResponse(**parsed)
    except Exception as e:
        # Fallback or error response
        return AnalysisResponse(
            summary=f"Failed to analyze logs via LLM: {str(e)}",
            root_cause_analysis=[],
            timeline=[],
            recommendations=["Verify LLM API configuration"]
        )
