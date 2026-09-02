import re
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from app.models.log_event import LogEvent

# Regex for common log patterns
# Supports:
#   2026-09-02T11:02:10.004Z [INFO] [session:d81e4b] Message
#   2026-09-02T11:02:12.887Z [APP][stdout] Message
#   2026-09-02 10:30:15 INFO Application started
#   ERROR: Database connection failed
#   2026-09-02T10:30:15 [database] WARNING: Connection timeout
LOG_PATTERN = re.compile(
    r'^(?:(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?)Z?\s+)?'
    r'(?:(?P<brackets>(?:\[[^\]]*\]\s*)+)\s*)?'
    r'(?:(?P<level>INFO|ERROR|WARNING|CRITICAL|FATAL|DEBUG|TRACE|Exception)\b[:\s]+)?'
    r'(?P<message>.*)$',
    re.IGNORECASE
)

# Pattern to detect continuation / stack-trace lines (indented or starting with "at ")
CONTINUATION_PATTERN = re.compile(r'^(?:\s{2,}|\t|at )')

# Valid log levels for extraction from bracket groups
LEVEL_NAMES = {"INFO", "ERROR", "WARNING", "CRITICAL", "FATAL", "DEBUG", "TRACE", "EXCEPTION"}


def _extract_level_and_components(bracket_str: str):
    """Parse bracket groups like '[INFO] [session:d81e4b]' or '[APP][stderr]'.
    
    Returns (level, component_string). The first bracket matching a known level
    is used as the level; remaining brackets are joined as the component.
    """
    parts = re.findall(r'\[([^\]]*)\]', bracket_str)
    level = None
    components = []
    
    for part in parts:
        if level is None and part.upper() in LEVEL_NAMES:
            level = part.upper()
        else:
            components.append(part)
    
    component = ":".join(components) if components else None
    return level, component


def parse_log_line(line: str) -> LogEvent:
    stripped = line.strip()
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    
    if not stripped:
        return LogEvent(log_id=log_id, message="", raw_log=line)
        
    match = LOG_PATTERN.match(stripped)
    if match:
        groups = match.groupdict()
        
        # Parse timestamp (handles Z suffix and plain ISO)
        timestamp_str = groups.get("timestamp")
        timestamp = None
        if timestamp_str:
            try:
                timestamp_str = timestamp_str.replace(" ", "T")
                timestamp = datetime.fromisoformat(timestamp_str).replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        
        # Extract level and component from bracket groups
        bracket_level = None
        component = None
        brackets = groups.get("brackets")
        if brackets:
            bracket_level, component = _extract_level_and_components(brackets)
        
        # The explicit bare level (e.g. "ERROR: ...") takes priority, then bracket level
        explicit_level = groups.get("level")
        if explicit_level:
            level = explicit_level.upper()
        elif bracket_level:
            level = bracket_level
        else:
            level = "UNKNOWN"
            
        if level == "EXCEPTION":
            level = "ERROR"
            
        message = groups.get("message") or stripped
        
        return LogEvent(
            log_id=log_id,
            timestamp=timestamp,
            level=level,
            component=component,
            message=message,
            raw_log=line
        )
    
    # Fallback if no pattern matches
    return LogEvent(
        log_id=log_id,
        level="UNKNOWN",
        message=stripped,
        raw_log=line
    )


def parse_log_content(content: str) -> List[LogEvent]:
    """Parse log content, grouping multi-line stack traces with their parent log entry."""
    events = []
    lines = content.splitlines()
    
    for line in lines:
        if not line.strip():
            continue
        
        # If the line looks like a continuation (indented / stack trace),
        # append it to the previous event's message and raw_log instead of
        # creating a new event.
        if events and CONTINUATION_PATTERN.match(line):
            prev = events[-1]
            events[-1] = LogEvent(
                log_id=prev.log_id,
                timestamp=prev.timestamp,
                level=prev.level,
                component=prev.component,
                message=prev.message + "\n" + line.strip(),
                raw_log=prev.raw_log + "\n" + line
            )
            continue
            
        events.append(parse_log_line(line))
        
    return events
