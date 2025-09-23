import os, base64, re
from PySide6.QtCore import Qt, QEvent, QPoint, QTimer
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit, QComboBox,
    QCheckBox, QSpinBox, QAbstractSpinBox, QFrame, QTableWidgetItem, QSizePolicy
)
from style import build_qss, GAP_DEFAULT, PADDING_CARD, RESIZE_MARGIN
from widgets import RenameTable
from dialogs import ReadmeDialog
from processor import (
    Settings, generate_rename_plan, generate_rename_plan_in_order,
    generate_rename_plan_for_dirs, generate_rename_plan_in_order_per_dir,
    apply_rename, RenameItem, _collect_paths
)
from utils import resource_path, save_error_log
from config import ConfigStore

CFG_FILE = "ReNameTool_config.json"
CFG_KEY_GEOM = "win_geometry_b64"
CFG_KEY_HDR  = "table_header_b64"
CFG_KEY_SCOPE = "rename_scope"

LEFT_FIXED_WIDTH = 320
TARGET_FILES   = "ファイル"
TARGET_FOLDERS = "フォルダ"

def _natural_key(name_or_path: str):
    base = os.path.basename(name_or_path)
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', base)]

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ReNameTool ©️2025 KisaragiIchigo")
        self.resize(1100, 720)
        self.setWindowIcon(QIcon(resource_path("rename.ico")) if os.path.exists(resource_path("rename.ico")) else QIcon())

        # フレームレス & 全域D&D
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setAcceptDrops(True)

        outer = QVBoxLayout(self); outer.setContentsMargins(0,0,0,0)
        self.bg = QWidget(); self.bg.setObjectName("bgRoot"); outer.addWidget(self.bg)
        self.card = QWidget(); self.card.setObjectName("glassRoot")
        lay = QVBoxLayout(self.bg); lay.setContentsMargins(GAP_DEFAULT,GAP_DEFAULT,GAP_DEFAULT,GAP_DEFAULT); lay.addWidget(self.card)
        main = QVBoxLayout(self.card); main.setContentsMargins(PADDING_CARD,PADDING_CARD,PADDING_CARD,PADDING_CARD)

        # タイトルバー
        bar = QHBoxLayout()
        self.lbl_title = QLabel("リネームツール"); self.lbl_title.setObjectName("titleLabel")
        self.btn_readme_top = QPushButton("README")
        self.btn_min = QPushButton("●"); self.btn_min.setObjectName("minBtn"); self.btn_min.setFixedSize(28,28)
        self.btn_max = QPushButton("●"); self.btn_max.setObjectName("maxBtn"); self.btn_max.setFixedSize(28,28)
        self.btn_close = QPushButton("●"); self.btn_close.setObjectName("closeBtn"); self.btn_close.setFixedSize(28,28)
        self.btn_min.clicked.connect(self.showMinimized)
        self.btn_max.clicked.connect(self._toggle_max_restore)
        self.btn_close.clicked.connect(self.close)
        self.btn_readme_top.clicked.connect(self._open_readme)
        bar.addWidget(self.lbl_title); bar.addStretch(); bar.addWidget(self.btn_readme_top)
        bar.addWidget(self.btn_max); bar.addWidget(self.btn_min); bar.addWidget(self.btn_close)
        main.addLayout(bar)

        # 2カラム
        body = QHBoxLayout(); body.setSpacing(GAP_DEFAULT); main.addLayout(body, 1)

        # 左ペイン
        left = QWidget(); left.setProperty("class", "DarkPanel")
        left.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Expanding)
        left.setMinimumWidth(LEFT_FIXED_WIDTH); left.setMaximumWidth(LEFT_FIXED_WIDTH)
        llay = QVBoxLayout(left); llay.setSpacing(6)

        row_target = QHBoxLayout()
        row_target.addWidget(self._label("対象", "SectionTitle"))
        self.combo_scope = QComboBox(); self.combo_scope.addItems([TARGET_FILES, TARGET_FOLDERS])
        row_target.addWidget(self.combo_scope, 1)
        llay.addLayout(row_target)
        self.lbl_scope_hint = QLabel("※ 対象はフォルダ名です")
        self.lbl_scope_hint.setStyleSheet("color:#ffe9a8; font-size:11px;")
        self.lbl_scope_hint.setVisible(False)
        llay.addWidget(self.lbl_scope_hint)

        llay.addWidget(self._hline())

        llay.addWidget(self._label("リネーム方法", "SectionTitle"))
        self.method = QComboBox()
        self.method.addItems(["リネーム（置換）","エリア文字削除","連番","日付","フォルダ名追加","文字列追加","特定文字の移動/追加"])
        llay.addWidget(self.method)

        # 置換
        self.panel_replace = QWidget(); rp = QVBoxLayout(self.panel_replace); rp.setSpacing(4)
        rp.addWidget(self._label("置換（対象 → 置換後）", "SectionTitle"))
        self.ed_target = QLineEdit(); self.ed_repl = QLineEdit()
        row1 = QHBoxLayout(); row1.addWidget(self._line("対象1", self.ed_target)); row1.addWidget(self._line("→", self.ed_repl)); rp.addLayout(row1)
        self.cb_second = QCheckBox("第2置換を有効化"); rp.addWidget(self.cb_second)
        self.ed_target2 = QLineEdit(); self.ed_repl2 = QLineEdit()
        row2 = QHBoxLayout(); row2.addWidget(self._line("対象2", self.ed_target2)); row2.addWidget(self._line("→", self.ed_repl2)); rp.addLayout(row2)
        llay.addWidget(self.panel_replace)

        # エリア削除
        self.panel_sur = QWidget(); sp = QVBoxLayout(self.panel_sur); sp.setSpacing(4)
        sp.addWidget(self._label("エリア文字削除（開始 / 終了）", "SectionTitle"))
        self.ed_sur_start = QLineEdit(); self.ed_sur_end = QLineEdit()
        row3 = QHBoxLayout(); row3.addWidget(self._line("開始", self.ed_sur_start)); row3.addWidget(self._line("終了", self.ed_sur_end)); sp.addLayout(row3)
        llay.addWidget(self.panel_sur)

        # 連番
        self.panel_seq = QWidget(); qp = QVBoxLayout(self.panel_seq); qp.setSpacing(4)
        qp.addWidget(self._label("連番設定", "SectionTitle"))
        self.spin_digits = QSpinBox(); self.spin_digits.setRange(1,10); self.spin_digits.setValue(3)
        self.spin_digits.setButtonSymbols(QAbstractSpinBox.ButtonSymbols.NoButtons)
        self.combo_seq_mode = QComboBox(); self.combo_seq_mode.addItems(["フルリネーム","先頭に追加","末尾に追加"])
        self.cb_seq_per_folder = QCheckBox("フォルダ毎に連番")
        self.spin_seq_start = QSpinBox(); self.spin_seq_start.setRange(1,999999); self.spin_seq_start.setValue(1)
        self.btn_digits_minus = QPushButton("−"); self.btn_digits_minus.setFixedSize(36,28)
        self.btn_digits_plus  = QPushButton("＋"); self.btn_digits_plus.setFixedSize(36,28)
        row4a = QHBoxLayout(); row4a.addWidget(self._line("桁数", self.spin_digits)); row4a.addWidget(self.btn_digits_minus); row4a.addWidget(self.btn_digits_plus); row4a.addStretch()
        row4b = QHBoxLayout(); row4b.addWidget(self._line("モード", self.combo_seq_mode)); row4b.addWidget(self.cb_seq_per_folder); row4b.addWidget(self._line("開始番号", self.spin_seq_start)); row4b.addStretch()
        qp.addLayout(row4a); qp.addLayout(row4b); llay.addWidget(self.panel_seq)

        # 日付
        self.panel_date = QWidget(); dp = QVBoxLayout(self.panel_date); dp.setSpacing(4)
        dp.addWidget(self._label("日付設定", "SectionTitle"))
        self.combo_date_type = QComboBox(); self.combo_date_type.addItems(["作成日","更新日"])
        self.combo_date_mode = QComboBox(); self.combo_date_mode.addItems(["フルリネーム","先頭に追加","末尾に追加"])
        row5 = QHBoxLayout(); row5.addWidget(self._line("タイプ", self.combo_date_type)); row5.addWidget(self._line("モード", self.combo_date_mode)); dp.addLayout(row5)
        llay.addWidget(self.panel_date)

        # フォルダ名追加
        self.panel_folder = QWidget(); fp = QVBoxLayout(self.panel_folder); fp.setSpacing(4)
        fp.addWidget(self._label("フォルダ名追加", "SectionTitle"))
        self.combo_folder_pos = QComboBox(); self.combo_folder_pos.addItems(["先頭に追加","末尾に追加"])
        self.cb_include_parent = QCheckBox("親フォルダ名も含める")
        row6 = QHBoxLayout(); row6.addWidget(self._line("位置", self.combo_folder_pos)); row6.addWidget(self.cb_include_parent); fp.addLayout(row6)
        llay.addWidget(self.panel_folder)

        # 文字列追加
        self.panel_text = QWidget(); tp = QVBoxLayout(self.panel_text); tp.setSpacing(4)
        tp.addWidget(self._label("文字列追加", "SectionTitle"))
        self.ed_add_text = QLineEdit()
        self.combo_text_pos = QComboBox(); self.combo_text_pos.addItems(["先頭に追加","末尾に追加"])
        row7 = QHBoxLayout(); row7.addWidget(self._line("文字列", self.ed_add_text)); row7.addWidget(self._line("位置", self.combo_text_pos)); tp.addLayout(row7)
        llay.addWidget(self.panel_text)

        # 特定文字の移動/追加
        self.panel_move = QWidget(); mv = QVBoxLayout(self.panel_move); mv.setSpacing(4)
        mv.addWidget(self._label("特定文字の移動/追加", "SectionTitle"))
        self.ed_move_find = QLineEdit()
        self.combo_move_action = QComboBox(); self.combo_move_action.addItems(["元の文字列を削除して移動","元の文字列はそのままで新たに追加"])
        self.combo_move_pos = QComboBox(); self.combo_move_pos.addItems(["先頭に追加","末尾に追加","指定文字の後に追加"])  # ★ 追加
        self.cb_move_use_find = QCheckBox("検索した文字列を追加に使う"); self.cb_move_use_find.setChecked(True)
        self.ed_move_custom = QLineEdit(); self.ed_move_custom.setEnabled(False)
        self.cb_move_use_find.stateChanged.connect(lambda _ : self.ed_move_custom.setEnabled(not self.cb_move_use_find.isChecked()))
        # 追加オプション
        self.cb_move_delete_all = QCheckBox("一致を全部削除（OFF=最初の一回）")
        self.combo_move_sep = QComboBox(); self.combo_move_sep.addItems(["なし","スペース","_","-"])
        self.cb_move_regex = QCheckBox("検索語 正規表現")

        # ★ アンカー
        self.ed_move_anchor = QLineEdit()
        self.cb_move_anchor_regex = QCheckBox("アンカー 正規表現")

        # レイアウト
        rowm1 = QHBoxLayout(); rowm1.addWidget(self._line("検索語/正規表現", self.ed_move_find))
        rowm2 = QHBoxLayout(); rowm2.addWidget(self._line("アクション", self.combo_move_action)); rowm2.addWidget(self._line("位置", self.combo_move_pos))
        rowm3 = QHBoxLayout(); rowm3.addWidget(self.cb_move_use_find); rowm3.addWidget(self._line("自由入力（OFF時）", self.ed_move_custom))
        rowm4 = QHBoxLayout(); rowm4.addWidget(self.cb_move_delete_all); rowm4.addWidget(self._line("区切り自動付与", self.combo_move_sep))
        rowm5 = QHBoxLayout(); rowm5.addWidget(self.cb_move_regex); rowm5.addWidget(self._line("アンカー（指定文字）", self.ed_move_anchor)); rowm5.addWidget(self.cb_move_anchor_regex)

        mv.addLayout(rowm1); mv.addLayout(rowm2); mv.addLayout(rowm3); mv.addLayout(rowm4); mv.addLayout(rowm5)
        llay.addWidget(self.panel_move)

        # 共通
        llay.addWidget(self._hline())
        row_common = QHBoxLayout()
        self.cb_sub = QCheckBox("サブフォルダも含む")
        self.cb_ext = QCheckBox("拡張子も含む")
        row_common.addWidget(self.cb_sub); row_common.addWidget(self.cb_ext); row_common.addStretch()
        llay.addLayout(row_common)

        # 左下
        llay.addStretch(1)
        row8 = QVBoxLayout()
        row8_top = QHBoxLayout()
        self.btn_preview = QPushButton("プレビュー")
        self.btn_run = QPushButton("リネーム実行"); self.btn_run.setEnabled(False)
        row8_top.addStretch(); row8_top.addWidget(self.btn_preview); row8_top.addWidget(self.btn_run)
        row8.addLayout(row8_top)
        self.lbl_status = QLabel(""); self.lbl_status.setStyleSheet("color:#cfe3ff; font-size:11px;")
        row8.addWidget(self.lbl_status)
        llay.addLayout(row8)

        # 右ペイン
        right = QWidget(); rlay = QVBoxLayout(right)
        cap = QHBoxLayout()
        cap.addWidget(self._label("プレビュー", "SectionTitle")); cap.addStretch()
        self.cb_show_checked_only = QCheckBox("選択のみ表示")
        self.btn_list_clear = QPushButton("ListClear")
        cap.addWidget(self.cb_show_checked_only); cap.addWidget(self.btn_list_clear)
        rlay.addLayout(cap)
        self.table = RenameTable(); rlay.addWidget(self.table, 1)

        body.addWidget(left, 0); body.addWidget(right, 1)
        body.setStretch(0, 0); body.setStretch(1, 1)

        # フレームレス移動/リサイズ
        for host in (self.bg, self.card):
            host.setMouseTracking(True); host.installEventFilter(self)
        self._moving = False; self._resizing = False; self._resize_edges = ""; self._drag_offset = QPoint()
        self._start_mouse = QPoint(); self._start_geo = None

        # 状態
        self.paths = []; self.flat_items = []; self._sort_order = {}
        self.setStyleSheet(build_qss())

        # 設定ロード
        self.cfg = ConfigStore(CFG_FILE)
        self._restore_settings()
        self._restore_window_and_header()
        self._update_scope_hint()

        # シグナル
        self.btn_preview.clicked.connect(self._do_preview)
        self.btn_run.clicked.connect(self._do_run)
        self.btn_list_clear.clicked.connect(self._on_list_clear)
        self.method.currentTextChanged.connect(self._update_panels)
        self.table.horizontalHeader().sectionClicked.connect(self._on_header_clicked)
        self.cb_sub.stateChanged.connect(lambda _ : self._refresh_listing_after_scope_change())
        self.combo_scope.currentIndexChanged.connect(lambda _ : (self._update_scope_hint(), self._refresh_listing_after_scope_change()))
        self.btn_digits_minus.clicked.connect(lambda: self.spin_digits.setValue(max(self.spin_digits.minimum(), self.spin_digits.value()-1)))
        self.btn_digits_plus.clicked.connect(lambda: self.spin_digits.setValue(min(self.spin_digits.maximum(), self.spin_digits.value()+1)))
        self.cb_show_checked_only.stateChanged.connect(lambda _ : self._apply_selection_filter())

        self._update_panels()

    # ===== UI util =====
    def _open_readme(self):
        dlg = ReadmeDialog(self)
        dlg.move(self.frameGeometry().center() - dlg.rect().center())
        dlg.exec()

    def _label(self, text, cls=None):
        lb = QLabel(text)
        if cls: lb.setProperty("class", cls)
        return lb

    def _line(self, title, widget):
        box = QVBoxLayout(); lb = QLabel(title); lb.setProperty("class", "SectionTitle")
        box.addWidget(lb); box.addWidget(widget); w = QWidget(); w.setLayout(box); return w

    def _hline(self):
        line = QFrame(); line.setFrameShape(QFrame.HLine); line.setStyleSheet("color:#999;"); return line

    def _toast(self, text: str, ms: int = 2400):
        self.lbl_status.setText(text)
        QTimer.singleShot(ms, lambda: self.lbl_status.setText(""))

    # ===== スコープ/ドラッグ&ドロップ =====
    def _current_scope(self) -> str:
        return "folder" if self.combo_scope.currentText() == TARGET_FOLDERS else "file"

    def _update_scope_hint(self):
        self.lbl_scope_hint.setVisible(self._current_scope() == "folder")

    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls(): e.acceptProposedAction()

    def dropEvent(self, e):
        files = [u.toLocalFile() for u in e.mimeData().urls()]
        if files: self._on_dropped(files)

    def _on_dropped(self, files):
        self.paths = files
        self._refresh_listing_after_scope_change()
        self._toast("ドロップ受け取りました。")

    def _unique_dirs_from_paths(self, paths: list[str]) -> list[str]:
        s = set()
        for p in paths:
            ap = os.path.abspath(p)
            if os.path.isdir(ap): s.add(ap)
            elif os.path.isfile(ap): s.add(os.path.dirname(ap))
        return sorted(s)

    def _refresh_listing_after_scope_change(self):
        if not self.paths:
            self.table.clear_rows(); self.btn_run.setEnabled(False); return
        if self._current_scope() == "file":
            self.flat_items = _collect_paths(self.paths, include_subfolders=self.cb_sub.isChecked())
        else:
            self.flat_items = self._unique_dirs_from_paths(self.paths)
        if not self.flat_items:
            self.table.clear_rows(); self.btn_run.setEnabled(False); self._toast("対象が見つからなかったよ。"); return
        self.table.load_list_only(self.flat_items)
        self.btn_run.setEnabled(True)
        self._apply_selection_filter()

    # ===== 設定まとめ =====
    def _gather_settings(self) -> Settings:
        return Settings(
            method=self.method.currentText(),
            target=self.ed_target.text(),
            replacement=self.ed_repl.text(),
            rename_second_active=self.cb_second.isChecked(),
            target_second=self.ed_target2.text(),
            replacement_second=self.ed_repl2.text(),
            surrounded_start=self.ed_sur_start.text(),
            surrounded_end=self.ed_sur_end.text(),
            sequence_digits=self.spin_digits.value(),
            sequence_mode=self.combo_seq_mode.currentText(),
            date_mode=self.combo_date_mode.currentText(),
            date_type=self.combo_date_type.currentText(),
            folder_name_position=self.combo_folder_pos.currentText(),
            include_parent_folder=self.cb_include_parent.isChecked(),
            include_subfolders=self.cb_sub.isChecked(),
            text_position=self.combo_text_pos.currentText(),
            add_text=self.ed_add_text.text(),
            include_extension=self.cb_ext.isChecked(),
            sequence_per_folder=self.cb_seq_per_folder.isChecked(),
            sequence_start=self.spin_seq_start.value(),
            # ▼ move
            move_find=self.ed_move_find.text(),
            move_action=self.combo_move_action.currentText(),
            move_pos=self.combo_move_pos.currentText(),
            move_use_find=self.cb_move_use_find.isChecked(),
            move_custom=self.ed_move_custom.text(),
            move_delete_all=self.cb_move_delete_all.isChecked(),
            move_sep_mode=self.combo_move_sep.currentText(),
            move_regex=self.cb_move_regex.isChecked(),
            move_anchor=self.ed_move_anchor.text(),
            move_anchor_regex=self.cb_move_anchor_regex.isChecked(),
        )

    # ===== パネル切り替え =====
    def _update_panels(self):
        panels = {
            "リネーム（置換）": self.panel_replace,
            "エリア文字削除": self.panel_sur,
            "連番": self.panel_seq,
            "日付": self.panel_date,
            "フォルダ名追加": self.panel_folder,
            "文字列追加": self.panel_text,
            "特定文字の移動/追加": self.panel_move,
        }
        for p in panels.values(): p.setVisible(False)
        mode = self.method.currentText()
        if mode in panels: panels[mode].setVisible(True)

        enable_ext = (mode.startswith("リネーム"))
        self.cb_ext.setEnabled(enable_ext)
        if not enable_ext: self.cb_ext.setChecked(False)

    # ===== プレビュー/実行 =====
    def _checked_paths_in_visual_order(self) -> list[str]:
        out = []
        for r in range(self.table.rowCount()):
            cb = self.table._row_checkbox(r)
            if cb and cb.isChecked():
                out.append(self.table.item(r, self.table.COL_OLD).text())
        return out

    def _do_preview(self):
        try:
            target_paths = self._checked_paths_in_visual_order()
            if not target_paths: self._toast("チェックされた行がありません。"); return
            st = self._gather_settings()
            scope = self._current_scope()

            if scope == "folder":
                items = generate_rename_plan_for_dirs(target_paths, st, visual_order=True)
            else:
                if st.method == "連番":
                    items = generate_rename_plan_in_order_per_dir(target_paths, st) if st.sequence_per_folder else generate_rename_plan_in_order(target_paths, st)
                else:
                    items = generate_rename_plan(target_paths, st)

            plan = [{"old_path": it.old_path, "new_path": it.new_path} for it in items]
            self.table.apply_preview_result(plan)
            self.btn_run.setEnabled(True)
            self._apply_selection_filter()
            if not items: self._toast("変化なし（プレビュー空）")
        except Exception as e:
            save_error_log("preview", str(e)); self._toast(f"プレビュー中にエラー: {e}")

    def _do_run(self):
        try:
            checked_paths_ordered = self._checked_paths_in_visual_order()
            if not checked_paths_ordered: self._toast("チェックされた行がありません。"); return

            rows_for_checked = self.table.rows_for_paths(checked_paths_ordered)
            missing_calc_paths, items = [], []
            for r in rows_for_checked:
                oldp = self.table.item(r, self.table.COL_OLD).text()
                newp = self.table.item(r, self.table.COL_NEW).text()
                if newp: items.append(RenameItem(old_path=oldp, new_path=newp))
                else:    missing_calc_paths.append(oldp)

            if missing_calc_paths:
                st = self._gather_settings()
                scope = self._current_scope()
                if scope == "folder":
                    items_calc = generate_rename_plan_for_dirs(missing_calc_paths, st, visual_order=True)
                else:
                    if st.method == "連番":
                        items_calc = generate_rename_plan_in_order_per_dir(missing_calc_paths, st) if st.sequence_per_folder else generate_rename_plan_in_order(missing_calc_paths, st)
                    else:
                        items_calc = generate_rename_plan(missing_calc_paths, st)
                self.table.apply_preview_result([{"old_path": it.old_path, "new_path": it.new_path} for it in items_calc])
                items.extend(items_calc)

            if not items: self._toast("リネーム対象がありません。"); return

            results = apply_rename(items)
            self.table.update_status(results)
            self._roll_forward_rows(results)
            self._apply_selection_filter()

            ok = sum(1 for r in results if r.get("ok")); ng = len(results) - ok
            self._toast(f"完了：成功 {ok} / 失敗 {ng}")
        except Exception as e:
            save_error_log("run", str(e)); self._toast(f"実行中にエラー: {e}")

    def _roll_forward_rows(self, results: list[dict]):
        res_map = {d["old_path"]: d for d in results}
        for r in range(self.table.rowCount()):
            oldp = self.table.item(r, self.table.COL_OLD).text()
            if oldp in res_map and res_map[oldp].get("ok"):
                newp = res_map[oldp]["new_path"]
                new_name = os.path.basename(newp)
                self.table.setItem(r, self.table.COL_BEFORE, QTableWidgetItem(new_name))
                self.table.setItem(r, self.table.COL_OLD, QTableWidgetItem(newp))
                self.table.setItem(r, self.table.COL_NEW, QTableWidgetItem(""))
                self.table.setItem(r, self.table.COL_AFTER, QTableWidgetItem(""))

    def _on_list_clear(self):
        self.table.clear_rows()
        self.btn_run.setEnabled(False)
        self._toast("一覧をクリアしたよ。")

    # ヘッダクリックソート（安全＋ナチュラル）
    def _on_header_clicked(self, col: int):
        asc = self._sort_order.get(col, True)
        snap = []
        for r in range(self.table.rowCount()):
            row = {"checked": False, "cells": []}
            cb = self.table._row_checkbox(r)
            row["checked"] = bool(cb and cb.isChecked())
            for c in range(self.table.columnCount()):
                it = self.table.item(r, c)
                txt = it.text() if it else ""
                align = it.textAlignment() if it else (Qt.AlignLeft | Qt.AlignVCenter)
                row["cells"].append({"text": txt, "align": align})
            snap.append(row)

        def sort_key(row):
            if col == self.table.COL_SELECT:
                return 1 if row["checked"] else 0
            elif col in (self.table.COL_BEFORE, self.table.COL_AFTER):
                base = row["cells"][col]["text"]
                oldp = row["cells"][self.table.COL_OLD]["text"]
                path_for_key = os.path.join(os.path.dirname(oldp), base) if oldp else base
                return _natural_key(path_for_key)
            elif col == self.table.COL_DIR:
                return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', row["cells"][col]["text"])]
            else:
                return row["cells"][col]["text"].lower()

        snap.sort(key=sort_key, reverse=not asc)

        self.table.setRowCount(0)
        from PySide6.QtWidgets import QWidget as _QW, QHBoxLayout as _QHL, QCheckBox as _QCB
        for row in snap:
            r = self.table.rowCount(); self.table.insertRow(r)
            for c, cell in enumerate(row["cells"]):
                if c == self.table.COL_SELECT:
                    w = _QW(); lay = _QHL(w); lay.setContentsMargins(0,0,0,0); lay.setAlignment(Qt.AlignCenter)
                    cb = _QCB(); cb.setChecked(row["checked"]); lay.addWidget(cb)
                    self.table.setCellWidget(r, c, w)
                else:
                    it = QTableWidgetItem(cell["text"]); it.setTextAlignment(cell["align"])
                    self.table.setItem(r, c, it)

        self._sort_order[col] = not asc
        self._apply_selection_filter()

    def _apply_selection_filter(self):
        show_checked_only = self.cb_show_checked_only.isChecked()
        for r in range(self.table.rowCount()):
            cb = self.table._row_checkbox(r)
            checked = bool(cb and cb.isChecked())
            self.table.setRowHidden(r, (show_checked_only and not checked))

    # ===== 保存/復元・フレームレス =====
    def _save_settings(self):
        data = self.cfg.load() or {}
        data.update(self._gather_settings().to_dict())
        data[CFG_KEY_SCOPE] = self._current_scope()
        self.cfg.save(data)

    def _restore_settings(self):
        data = self.cfg.load()
        if not data: return
        try:
            self.method.setCurrentText(data.get("method", "リネーム（置換）"))
            self.ed_target.setText(data.get("target","")); self.ed_repl.setText(data.get("replacement",""))
            self.cb_second.setChecked(data.get("rename_second_active", False))
            self.ed_target2.setText(data.get("target_second","")); self.ed_repl2.setText(data.get("replacement_second",""))
            self.ed_sur_start.setText(data.get("surrounded_start","")); self.ed_sur_end.setText(data.get("surrounded_end",""))
            self.spin_digits.setValue(int(data.get("sequence_digits",3)))
            self.combo_seq_mode.setCurrentText(data.get("sequence_mode","フルリネーム"))
            self.combo_date_mode.setCurrentText(data.get("date_mode","末尾に追加"))
            self.combo_date_type.setCurrentText(data.get("date_type","作成日"))
            self.combo_folder_pos.setCurrentText(data.get("folder_name_position","先頭に追加"))
            self.cb_include_parent.setChecked(data.get("include_parent_folder", False))
            self.cb_sub.setChecked(data.get("include_subfolders", True))
            self.combo_text_pos.setCurrentText(data.get("text_position","先頭に追加"))
            self.ed_add_text.setText(data.get("add_text",""))
            self.cb_ext.setChecked(data.get("include_extension", False))
            self.cb_seq_per_folder.setChecked(data.get("sequence_per_folder", False))
            self.spin_seq_start.setValue(int(data.get("sequence_start", 1)))
            scope = data.get(CFG_KEY_SCOPE, "file")
            self.combo_scope.setCurrentText(TARGET_FOLDERS if scope == "folder" else TARGET_FILES)

            # ▼ move の復元
            self.ed_move_find.setText(data.get("move_find",""))
            self.combo_move_action.setCurrentText(data.get("move_action","元の文字列を削除して移動"))
            self.combo_move_pos.setCurrentText(data.get("move_pos","先頭に追加"))
            self.cb_move_use_find.setChecked(bool(data.get("move_use_find", True)))
            self.ed_move_custom.setText(data.get("move_custom",""))
            self.cb_move_delete_all.setChecked(bool(data.get("move_delete_all", False)))
            self.combo_move_sep.setCurrentText(data.get("move_sep_mode","なし"))
            self.cb_move_regex.setChecked(bool(data.get("move_regex", False)))
            self.ed_move_anchor.setText(data.get("move_anchor",""))
            self.cb_move_anchor_regex.setChecked(bool(data.get("move_anchor_regex", False)))
            self.ed_move_custom.setEnabled(not self.cb_move_use_find.isChecked())
        except Exception as e:
            save_error_log("restore_settings", str(e))

    def _restore_window_and_header(self):
        data = self.cfg.load() or {}
        gb64 = data.get(CFG_KEY_GEOM, "")
        if gb64:
            try:
                g = base64.b64decode(gb64.encode("utf-8")); self.restoreGeometry(g)
            except Exception as e:
                save_error_log("restore_geometry", str(e))
        hb64 = data.get(CFG_KEY_HDR, "")
        if hb64:
            try:
                h = base64.b64decode(hb64.encode("utf-8")); self.table.horizontalHeader().restoreState(h)
            except Exception as e:
                save_error_log("restore_header", str(e))

    def _save_window_and_header(self):
        data = self.cfg.load() or {}
        try:
            g = bytes(self.saveGeometry()); data[CFG_KEY_GEOM] = base64.b64encode(g).decode("utf-8")
            h = bytes(self.table.horizontalHeader().saveState()); data[CFG_KEY_HDR]  = base64.b64encode(h).decode("utf-8")
            data.update(self._gather_settings().to_dict()); data[CFG_KEY_SCOPE] = self._current_scope()
            self.cfg.save(data)
        except Exception as e:
            save_error_log("save_window_header", str(e))

    # フレームレス移動/リサイズ
    def eventFilter(self, obj, e):
        if obj in (self.card, self.bg):
            if e.type() == QEvent.MouseButtonPress and e.button() == Qt.LeftButton:
                if self.isMaximized(): return False
                local_pos = obj.mapFromGlobal(e.globalPosition().toPoint())
                edges = self._edge_at_obj(obj, local_pos)
                if edges:
                    self._resizing = True; self._resize_edges = edges
                    self._start_geo = self.geometry(); self._start_mouse = e.globalPosition().toPoint()
                else:
                    self._moving = True; self._drag_offset = e.globalPosition().toPoint() - self.frameGeometry().topLeft()
                return True
            elif e.type() == QEvent.MouseMove:
                if self._resizing and not self.isMaximized():
                    self._resize_to(e.globalPosition().toPoint()); return True
                if self._moving and (e.buttons() & Qt.LeftButton) and not self.isMaximized():
                    self.move(e.globalPosition().toPoint() - self._drag_offset); return True
                local_pos = obj.mapFromGlobal(e.globalPosition().toPoint())
                self._update_cursor(self._edge_at_obj(obj, local_pos)); return False
            elif e.type() == QEvent.MouseButtonRelease:
                self._resizing = False; self._moving = False; return True
        return super().eventFilter(obj, e)

    def _edge_at_obj(self, host: QWidget, pos):
        m = RESIZE_MARGIN; r = host.rect(); edges = ""
        if pos.y() <= m: edges += "T"
        if pos.y() >= r.height() - m: edges += "B"
        if pos.x() <= m: edges += "L"
        if pos.x() >= r.width() - m: edges += "R"
        if "T" in edges and "L" in edges: return "TL"
        if "T" in edges and "R" in edges: return "TR"
        if "B" in edges and "L" in edges: return "BL"
        if "B" in edges and "R" in edges: return "BR"
        return edges

    def _update_cursor(self, edges):
        if edges in ("TL","BR"): self.setCursor(Qt.SizeFDiagCursor)
        elif edges in ("TR","BL"): self.setCursor(Qt.SizeBDiagCursor)
        elif edges in ("L","R"): self.setCursor(Qt.SizeHorCursor)
        elif edges in ("T","B"): self.setCursor(Qt.SizeVerCursor)
        else: self.setCursor(Qt.ArrowCursor)

    def _resize_to(self, gpos):
        dx = gpos.x() - self._start_mouse.x(); dy = gpos.y() - self._start_mouse.y()
        geo = self._start_geo; x,y,w,h = geo.x(),geo.y(),geo.width(),geo.height()
        minw, minh = self.minimumSize().width(), self.minimumSize().height()
        e = self._resize_edges
        if "L" in e: new_w = max(minw, w - dx); x += (w - new_w); w = new_w
        if "R" in e: w = max(minw, w + dx)
        if "T" in e: new_h = max(minh, h - dy); y += (h - new_h); h = new_h
        if "B" in e: h = max(minh, h + dy)
        self.setGeometry(x, y, w, h)

    def _toggle_max_restore(self):
        ws = self.windowState()
        if ws & Qt.WindowMaximized:
            # 通常化
            self.setWindowState(ws & ~Qt.WindowMaximized) 
            self.showNormal()
        else:
            # 最大化
            try:
                self._normal_geometry_before_max = self.geometry()
            except Exception:
                pass
            self.setWindowState(ws | Qt.WindowMaximized)
            self.showMaximized()


    def closeEvent(self, ev):
        try:
            self._save_window_and_header()
        finally:
            super().closeEvent(ev)
