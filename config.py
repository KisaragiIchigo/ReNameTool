import json
import os
import sys
from datetime import datetime

TOOL_NAME = "ReNameTool"

# 規約に沿った標準ファイル名
DEFAULT_CONFIG_NAME  = f"[config]{TOOL_NAME}_config.json"
DEFAULT_SETTING_NAME = f"[config]{TOOL_NAME}_setting.json"
DEFAULT_LOG_NAME     = f"[config]{TOOL_NAME}app.log"

def _base_dir() -> str:
    if getattr(sys, "frozen", False) and hasattr(sys, "executable"):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def config_dir() -> str:

    d = os.path.join(_base_dir(), "config")
    _ensure_dir(d)
    return d

def logs_dir() -> str:

    d = os.path.join(_base_dir(), "logs")
    _ensure_dir(d)
    return d

def _normalize_name(fname: str) -> str:

    return fname if fname.startswith("[config]") else f"[config]{fname}"

def config_path(file_name: str | None = None) -> str:
    fname = _normalize_name(file_name or DEFAULT_CONFIG_NAME)
    return os.path.join(config_dir(), fname)

def log_path(file_name: str | None = None) -> str:
    """./logs 配下のログファイルパス"""
    fname = _normalize_name(file_name or DEFAULT_LOG_NAME)
    return os.path.join(logs_dir(), fname)

class ConfigStore:
    def __init__(self, file_name: str | None = None):
        self._path = config_path(file_name)

    @property
    def path(self) -> str:
        return self._path

    def load(self) -> dict | None:
        if not os.path.exists(self._path):
            return None
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            # 壊れていたら退避リネームして None 扱い
            try:
                bak = self._path + ".broken_" + datetime.now().strftime("%Y%m%d_%H%M%S")
                os.rename(self._path, bak)
            except Exception:
                pass
            return None

    def save(self, data: dict):
        # ディレクトリ念のため再作成（存在していれば何もしない）
        _ensure_dir(os.path.dirname(self._path))
        tmp = self._path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data or {}, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self._path)

# 便利: ログ出力（規約に合わせて ./logs に吐く）
def append_log(message: str, file_name: str | None = None):
    p = log_path(file_name)
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {message}\n"
    # ディレクトリ念のため
    _ensure_dir(os.path.dirname(p))
    with open(p, "a", encoding="utf-8") as f:
        f.write(line)
