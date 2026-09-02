import re
from typing import List
from app.models.log_event import LogEvent, DetectedError

# Keywords indicating an error
ERROR_KEYWORDS = re.compile(
    r'\b(?:Exception|Traceback|Failed|Connection refused|Timeout|crash|crashed|fatal|critical)\b',
    re.IGNORECASE
)

def detect_errors(events: List[LogEvent]) -> List[DetectedError]:
    detected = []
    
    for event in events:
        # Check by log level
        if event.level in ["ERROR", "FATAL", "CRITICAL"]:
            detected.append(
                DetectedError(
                    log_id=event.log_id,
                    level=event.level,
                    message=event.message,
                    timestamp=event.timestamp
                )
            )
            continue
            
        # Check by keywords in the message
        if ERROR_KEYWORDS.search(event.message):
            # Promote level to ERROR if it was just INFO/UNKNOWN but has error keywords
            level = event.level if event.level not in ["INFO", "UNKNOWN"] else "ERROR"
            detected.append(
                DetectedError(
                    log_id=event.log_id,
                    level=level,
                    message=event.message,
                    timestamp=event.timestamp
                )
            )
            
    return detected
