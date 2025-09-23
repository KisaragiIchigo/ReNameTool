import json, os

class ConfigStore:
    def __init__(self, filename: str):
        self.path = os.path.join(os.getcwd(), filename)

    def save(self, data: dict):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load(self) -> dict | None:
        if not os.path.exists(self.path):
            return None
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
