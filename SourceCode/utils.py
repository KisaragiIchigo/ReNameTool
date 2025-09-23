import os, sys
from datetime import datetime

def resource_path(rel: str) -> str:
    base = getattr(sys, "_MEIPASS", os.path.abspath("."))
    return os.path.join(base, rel)

def save_error_log(tag: str, message: str):
    now = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    name = f"ReNameTool_error_{now}.log"
    with open(name, "a", encoding="utf-8") as f:
        f.write(f"[{now}] {tag}: {message}\n")
