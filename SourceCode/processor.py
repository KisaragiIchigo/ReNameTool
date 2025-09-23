import os
import re
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class Settings:
    method: str
    target: str
    replacement: str
    rename_second_active: bool
    target_second: str
    replacement_second: str
    surrounded_start: str
    surrounded_end: str
    sequence_digits: int
    sequence_mode: str
    date_mode: str
    date_type: str
    folder_name_position: str
    include_parent_folder: bool
    include_subfolders: bool
    text_position: str
    add_text: str
    include_extension: bool
    sequence_per_folder: bool = False
    sequence_start: int = 1

    # ▼ 特定文字の移動/追加 用
    move_find: str = ""
    move_action: str = "元の文字列を削除して移動"     # or "元の文字列はそのままで新たに追加"
    move_pos: str = "頭に追加"                       # or "後ろに追加" or "指定文字の後に追加"
    move_use_find: bool = True                      # True: 検索語をそのまま挿入 / False: 自由入力を挿入
    move_custom: str = ""                           # 自由入力
    move_delete_all: bool = False                   # 一致箇所を全部削除（False=最初の一回）
    move_sep_mode: str = "なし"                     # なし / スペース / _ / -
    move_regex: bool = False                        # 検索語の正規表現
    move_anchor: str = ""                           # ★ アンカー（「指定文字の後に追加」用）
    move_anchor_regex: bool = False                 # ★ アンカーの正規表現

    def to_dict(self): return asdict(self)

@dataclass
class RenameItem:
    old_path: str
    new_path: str

# ---------- 収集 ----------
def _files_in_folder(folder: str, include_subfolders: bool) -> list[str]:
    out = []
    if include_subfolders:
        for r, _, files in os.walk(folder):
            for f in files:
                out.append(os.path.join(r, f))
    else:
        for f in os.listdir(folder):
            p = os.path.join(folder, f)
            if os.path.isfile(p):
                out.append(p)
    return out

def _collect_paths(paths: list[str], include_subfolders: bool) -> list[str]:
    all_files = []
    for p in paths:
        if os.path.isdir(p):
            all_files.extend(_files_in_folder(p, include_subfolders))
        elif os.path.isfile(p):
            all_files.append(p)
    return sorted(all_files)

def _add_folder_name(path: str, name: str, pos: str, include_parent: bool) -> str:
    folder = os.path.basename(os.path.dirname(path))
    if include_parent:
        parent = os.path.basename(os.path.dirname(os.path.dirname(path)))
        folder = f"{parent}_{folder}"
    return f"{folder}_{name}" if pos == "前に追加" else f"{name}_{folder}"

def _splitext_keepdot(fullname: str):
    base, ext = os.path.splitext(fullname)
    return base, ext

def _clean_separators(text: str) -> str:
    t = text.replace("  ", " ").replace("__", "_")
    return t.strip(" _")

def _maybe_sep(sep_mode: str) -> str:
    if sep_mode == "スペース": return " "
    if sep_mode == "_": return "_"
    if sep_mode == "-": return "-"
    return ""

# ---------- 変換コア ----------
def _transform_name(path: str, name: str, ext: str, st: Settings, counter: int) -> str:
    # 全モードの名称変換をここで集約。変更なしは "" を返してスキップ。
    original_full = f"{name}{ext}"
    new_name, new_ext = name, ext

    # --- 置換 ---
    if st.method.startswith("リネーム"):
        if st.include_extension:
            full = f"{new_name}{new_ext}"
            if st.target:
                full = full.replace(st.target, st.replacement)
            if st.rename_second_active and st.target_second:
                full = full.replace(st.target_second, st.replacement_second)
            new_name, new_ext = _splitext_keepdot(full)
        else:
            if st.target and st.target in new_name:
                new_name = new_name.replace(st.target, st.replacement)
            if st.rename_second_active and st.target_second and st.target_second in new_name:
                new_name = new_name.replace(st.target_second, st.replacement_second)

    # --- エリア文字削除 ---
    elif st.method.startswith("エリア文字削除"):
        if st.surrounded_start:
            s = new_name.find(st.surrounded_start)
            if s != -1:
                e = new_name.find(st.surrounded_end, s + len(st.surrounded_start)) if st.surrounded_end else -1
                if e != -1:
                    new_name = new_name[:s] + new_name[e + len(st.surrounded_end):]

    # --- 連番 ---
    elif st.method == "連番":
        digits = max(1, int(st.sequence_digits))
        seq = str(counter).zfill(digits)
        mode = st.sequence_mode
        if mode == "フルリネーム":
            new_name = seq
        elif mode == "前に追加":
            new_name = f"{seq}_{new_name}"
        else:  # 後に追加
            new_name = f"{new_name}_{seq}"

    # --- 日付 ---
    elif st.method == "日付":
        ts = os.path.getctime(path) if st.date_type == "作成日" else os.path.getmtime(path)
        tag = "[DateCreated]" if st.date_type == "作成日" else "[DateUpdated]"
        d = datetime.fromtimestamp(ts).strftime("%Y_%m_%d-%H_%M_%S")
        ds = f"{tag}{d}"
        mode = st.date_mode
        if mode == "フルリネーム":
            new_name = ds
        elif mode == "前に追加":
            new_name = f"{ds}_{new_name}"
        else:
            new_name = f"{new_name}_{ds}"

    # --- 文字列追加（先頭/最後） ---
    elif st.method == "文字列追加":
        new_name = f"{st.add_text}{new_name}" if st.text_position == "先頭に追加" else f"{new_name}{st.add_text}"

    # --- フォルダ名追加 ---
    elif st.method == "フォルダ名追加":
        new_name = _add_folder_name(path, new_name, st.folder_name_position, st.include_parent_folder)

    # --- 特定文字の移動/追加（正規表現・全部削除・区切り・アンカー対応） ---
    elif st.method == "特定文字の移動/追加":
        base = new_name
        find = (st.move_find or "")

        # 1) 追加テキストの決定（検索語を使う or 自由入力）
        if st.move_use_find:
            if st.move_regex:
                m = re.search(find, base) if find else None
                if not m:
                    return ""  # 検索語が見つからない→スキップ
                ins = m.group(0)
                find_matched = True
            else:
                if not find or (find not in base):
                    return ""  # 見つからない→スキップ
                ins = find
                find_matched = True
        else:
            # 自由入力：挿入文字
            ins = st.move_custom or ""
            if not ins:
                return ""  # 追加文字が空→スキップ
            # 自由入力でも、find が指定されている場合は一致必須
            if find:
                find_matched = bool(re.search(find, base) if st.move_regex else (find in base))
                if not find_matched:
                    return ""  # 見つからない→スキップ
            else:
                find_matched = False  # find 未指定

        # 2) 位置分岐
        pos = st.move_pos  # "頭に追加" / "後ろに追加" / （拡張）"指定文字の後に追加"
        sep = _maybe_sep(st.move_sep_mode)

        # --- (A) 指定文字の後に追加（アンカー） ---
        if pos not in ("頭に追加", "後ろに追加"):
            anchor = getattr(st, "move_anchor", "") or ""
            use_anchor_regex = bool(getattr(st, "move_anchor_regex", False))
            if not anchor:
                return ""  # アンカー未指定→スキップ

            # アンカー検索（最初の一致のみ）
            if use_anchor_regex:
                am = re.search(anchor, base)
                if not am:
                    return ""  # 見つからない→スキップ
                idx = am.end()
            else:
                idx = base.find(anchor)
                if idx == -1:
                    return ""  # 見つからない→スキップ
                idx += len(anchor)

            # （任意）移動モードなら "find" を削除
            if st.move_action == "元の文字列を削除して移動" and find:
                if st.move_regex:
                    base = re.sub(find, "", base, count=0 if st.move_delete_all else 1) if re.search(find, base) else base
                else:
                    if find in base:
                        base = base.replace(find, "") if st.move_delete_all else base.replace(find, "", 1)

            left, right = base[:idx], base[idx:]
            mid = (sep if (left and ins and sep) else "")
            new_name = f"{left}{mid}{ins}{right}"

        # --- (B) 頭/後ろ に追加 ---
        else:
            # 「削除して移動」のときは必ず検索語が存在していること
            if st.move_action == "元の文字列を削除して移動":
                if not find:
                    return ""  # 検索語未指定で削除は不可
                # ここまで来たら find_matched は必須で True のはずだが、念のため確認
                if not (re.search(find, base) if st.move_regex else (find in base)):
                    return ""  # 見つからない→スキップ
                if st.move_regex:
                    base = re.sub(find, "", base, count=0 if st.move_delete_all else 1)
                else:
                    base = base.replace(find, "") if st.move_delete_all else base.replace(find, "", 1)
            else:
                # 「元の文字列はそのまま追加」でも、検索語を使う設定なら一致必須
                if st.move_use_find and not find_matched:
                    return ""  # 見つからない→スキップ

            if pos == "頭に追加":
                new_name = f"{ins}{sep}{base}" if (base and ins and sep) else f"{ins}{base}"
            else:  # 後ろに追加
                new_name = f"{base}{sep}{ins}" if (base and ins and sep) else f"{base}{ins}"

        # 仕上げクリーン
        new_name = _clean_separators(new_name)

    # === 変更なしならスキップ ===
    if f"{new_name}{new_ext}" == original_full:
        return ""
    return os.path.join(os.path.dirname(path), f"{new_name}{new_ext}")


def _transform_dirname(path: str, st: Settings, counter: int) -> str:
    d = os.path.dirname(path)
    name = os.path.basename(path)
    ext = ""
    return _transform_name(path, name, ext, st, counter)

# ---------- プレビュー重複回避 ----------
def _assign_unique_targets(plan: list[RenameItem]) -> list[RenameItem]:
    old_set = {it.old_path for it in plan}
    final_per_dir: dict[str, set[str]] = {}
    out: list[RenameItem] = []
    for it in plan:
        d = os.path.dirname(it.new_path) if os.path.isfile(it.old_path) else os.path.dirname(it.old_path)
        if d not in final_per_dir:
            final_per_dir[d] = set()
        base, ext = os.path.splitext(os.path.basename(it.new_path))
        cand = os.path.join(d, f"{base}{ext}")
        seq = 1
        def used(p: str) -> bool: return (p in final_per_dir[d])
        while used(cand) or (os.path.exists(cand) and cand not in old_set):
            cand = os.path.join(d, f"{base}[重複{seq:03d}]{ext}")
            seq += 1
        final_per_dir[d].add(cand)
        out.append(RenameItem(old_path=it.old_path, new_path=cand))
    return out

# ---------- 計画生成 ----------
def generate_rename_plan(paths: list[str], st: Settings) -> list[RenameItem]:
    files = _collect_paths(paths, st.include_subfolders)
    per_dir_counter = {}
    raw: list[RenameItem] = []
    start = max(1, int(st.sequence_start))
    for f in files:
        d = os.path.dirname(f)
        cur = per_dir_counter.get(d, start - 1) + 1
        per_dir_counter[d] = cur
        name, ext = os.path.splitext(os.path.basename(f))
        new_path = _transform_name(f, name, ext, st, cur)
        if new_path:
            raw.append(RenameItem(old_path=f, new_path=new_path))
    return _assign_unique_targets(raw)

def generate_rename_plan_in_order(ordered_paths: list[str], st: Settings) -> list[RenameItem]:
    raw: list[RenameItem] = []
    start = max(1, int(st.sequence_start))
    for i, f in enumerate(ordered_paths, start=start):
        name, ext = os.path.splitext(os.path.basename(f))
        new_path = _transform_name(f, name, ext, st, i)
        if new_path:
            raw.append(RenameItem(old_path=f, new_path=new_path))
    return _assign_unique_targets(raw)

def generate_rename_plan_in_order_per_dir(ordered_paths: list[str], st: Settings) -> list[RenameItem]:
    per_dir_counter = {}
    raw: list[RenameItem] = []
    start = max(1, int(st.sequence_start))
    for f in ordered_paths:
        d = os.path.dirname(f)
        cur = per_dir_counter.get(d, start - 1) + 1
        per_dir_counter[d] = cur
        name, ext = os.path.splitext(os.path.basename(f))
        new_path = _transform_name(f, name, ext, st, cur)
        if new_path:
            raw.append(RenameItem(old_path=f, new_path=new_path))
    return _assign_unique_targets(raw)

def generate_rename_plan_for_dirs(paths: list[str], st: Settings, visual_order: bool = True) -> list[RenameItem]:
    seen = set()
    targets = []
    for p in paths:
        d = os.path.abspath(p)
        if d not in seen:
            seen.add(d); targets.append(d)
    raw: list[RenameItem] = []
    start = max(1, int(st.sequence_start))
    for idx, d in enumerate(targets, start=start if visual_order else 1):
        counter = idx if st.method == "連番" else 1
        new_path = _transform_dirname(d, st, counter)
        if not new_path:
            continue
        if os.path.dirname(new_path) == os.path.dirname(d):
            raw.append(RenameItem(old_path=d, new_path=new_path))
        else:
            parent = os.path.dirname(d)
            base = os.path.basename(new_path)
            raw.append(RenameItem(old_path=d, new_path=os.path.join(parent, base)))
    return _assign_unique_targets(raw)

# ---------- 実行 ----------
def _temp_name_for(path: str) -> str:
    d = os.path.dirname(path)
    name, ext = os.path.splitext(os.path.basename(path))
    return os.path.join(d, f".__tmp__{name}__{uuid.uuid4().hex}{ext}")

def apply_rename(items: list[RenameItem]) -> list[dict]:
    results = []
    if not items: return results
    temps = {}
    try:
        for it in items:
            t = _temp_name_for(it.old_path)
            os.rename(it.old_path, t)
            temps[it.old_path] = t
    except Exception as e:
        for src, tmp in temps.items():
            if os.path.exists(tmp):
                try: os.rename(tmp, src)
                except Exception: pass
        for it in items:
            ok = it.old_path in temps
            results.append({"old_path": it.old_path, "new_path": it.new_path, "ok": ok, "error": None if ok else str(e)})
        return results

    old_set = set(it.old_path for it in items)
    placed = {}
    for it in items:
        d = os.path.dirname(it.new_path)
        base, ext = os.path.splitext(os.path.basename(it.new_path))
        cand = os.path.join(d, f"{base}{ext}")
        seq = 1
        while (os.path.exists(cand) and cand not in old_set) or (cand in placed.values()):
            cand = os.path.join(d, f"{base}[重複{seq:03d}]{ext}")
            seq += 1
        try:
            os.rename(temps[it.old_path], cand)
            placed[it.old_path] = cand
            results.append({"old_path": it.old_path, "new_path": cand, "ok": True, "error": None})
        except Exception as e:
            results.append({"old_path": it.old_path, "new_path": cand, "ok": False, "error": str(e)})
    return results
