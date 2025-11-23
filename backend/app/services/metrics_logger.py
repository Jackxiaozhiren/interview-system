import json
import os
import threading
from datetime import datetime
from typing import Any, Dict, Optional

_METRICS_LOG_LOCK = threading.Lock()
_METRICS_LOG_PATH = os.getenv("INTERVIEW_METRICS_LOG_PATH", "metrics.log")


def _write_metrics(payload: Dict[str, Any]) -> None:
    """Append a single JSON metrics row to the metrics log.

    This helper is deliberately best-effort: any failure here should not break
    the main request flow. When something goes wrong we just print a warning.
    """
    try:
        row = dict(payload)
        row.setdefault("ts", datetime.utcnow().isoformat())
        line = json.dumps(row, ensure_ascii=False)
        with _METRICS_LOG_LOCK:
            with open(_METRICS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(line + "\n")
    except Exception as e:  # pragma: no cover - metrics must never break core logic
        print(f"[metrics_logger] failed to write metrics: {e}")


def log_session_report_metrics(
    *,
    user_id: Optional[str],
    session_id: str,
    evaluation: Dict[str, Any],
    diagnostics: Optional[Dict[str, Any]] = None,
) -> None:
    """Log a structured row for a session-level InterviewEvaluation.

    `evaluation` is expected to be a dict produced from the Pydantic model.
    The potentially very长的 `feedback` 字段会被移除，以避免日志过大。
    """
    eval_copy = dict(evaluation)
    # feedback 可能很长，这里不写入 metrics.log
    eval_copy.pop("feedback", None)

    payload: Dict[str, Any] = {
        "type": "session_report",
        "user_id": user_id,
        "session_id": session_id,
        "evaluation": eval_copy,
    }
    if diagnostics:
        payload["diagnostics"] = diagnostics

    _write_metrics(payload)


def log_media_report_metrics(
    *,
    user_id: Optional[str],
    session_id: str,
    media_id: str,
    media_type: str,
    audio_features: Optional[Dict[str, Any]] = None,
    video_features: Optional[Dict[str, Any]] = None,
) -> None:
    """Log a structured row for a media-level multimodal evaluation."""
    payload: Dict[str, Any] = {
        "type": "media_report",
        "user_id": user_id,
        "session_id": session_id,
        "media_id": media_id,
        "media_type": media_type,
    }
    if audio_features is not None:
        payload["audio_features"] = audio_features
    if video_features is not None:
        payload["video_features"] = video_features

    _write_metrics(payload)
