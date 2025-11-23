from typing import Literal
import os

MediaType = Literal["audio", "video"]

try:
    import whisper  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    whisper = None

_whisper_model = None


def _get_whisper_model():
    """Lazily load the Whisper model if the library is available.

    Model name can be configured via WHISPER_MODEL_NAME env var, defaulting to
    "base" which在质量和速度之间比较均衡。如果本地算力有限，可以改为
    "tiny" 或 "small"。
    """

    global _whisper_model
    if whisper is None:
        return None

    if _whisper_model is None:
        model_name = os.getenv("WHISPER_MODEL_NAME", "base")
        _whisper_model = whisper.load_model(model_name)
    return _whisper_model


def transcribe_media_file(filepath: str, media_type: MediaType, filename: str) -> str:
    """ASR integration entrypoint used by the rest of the backend.

    Behaviour:
    - If openai-whisper is installed and模型加载成功，则使用本地 Whisper 模型
      对传入的音频/视频文件做转写，返回识别到的文本。
    - 如果 Whisper 未安装或推理失败，则退回到之前的占位文本，保证整体
      流程不中断，并在占位文本中给出简单提示，方便你后续安装依赖。
    """

    model = _get_whisper_model()
    if model is None:
        return (
            f"[Stub Transcript] Media '{filename}' of type '{media_type}' is stored at "
            f"'{filepath}'. Whisper is not installed. Install 'openai-whisper' and ffmpeg "
            "to enable real ASR."
        )

    try:
        # Whisper 使用 ffmpeg 解码，支持常见音频/视频容器格式，直接传文件路径即可。
        result = model.transcribe(filepath)
        text = (result.get("text") or "").strip()
        if not text:
            return (
                f"[ASR] No speech recognized in media '{filename}'. "
                "Check audio quality or try a different file."
            )
        return text
    except Exception as exc:  # pragma: no cover - defensive fallback
        return (
            f"[Stub Transcript] Failed to run Whisper on media '{filename}' of type "
            f"'{media_type}'. Reason: {exc}. File is stored at '{filepath}'."
        )
