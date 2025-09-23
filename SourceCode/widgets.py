import os
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QLabel, QTableWidget, QTableWidgetItem, QAbstractItemView, QCheckBox,
    QWidget, QHBoxLayout, QHeaderView
)

class DropArea(QLabel):
    def __init__(self, on_files_dropped, parent=None):
        super().__init__(parent)
        self.setObjectName("dropArea")
        self.setText("ここにフォルダ/ファイルをドラッグ＆ドロップ（複数OK）\n※ウィンドウのどこに落としてもOK")
        self.setAlignment(Qt.AlignCenter)
        self.setAcceptDrops(True)
        self._callback = on_files_dropped

    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls():
            e.acceptProposedAction()

    def dropEvent(self, e):
        files = [u.toLocalFile() for u in e.mimeData().urls()]
        if files:
            self._callback(files)
            self.setText("受け取りました：\n" + "\n".join(files[-5:]))

def _centered_checkbox(checked=True) -> QWidget:
    w = QWidget()
    lay = QHBoxLayout(w)
    lay.setContentsMargins(0,0,0,0)
    lay.setAlignment(Qt.AlignCenter)
    cb = QCheckBox(); cb.setChecked(checked)
    lay.addWidget(cb)
    return w

class RenameTable(QTableWidget):
    VISIBLE_COLS = ["選択", "状態", "リネーム前", "リネーム後", "ディレクトリ"]
    HIDDEN_COLS  = ["old_path", "new_path"]

    COL_SELECT = 0
    COL_STATUS = 1
    COL_BEFORE = 2
    COL_AFTER  = 3
    COL_DIR    = 4
    COL_OLD    = 5
    COL_NEW    = 6

    def __init__(self, parent=None):
        super().__init__(0, len(self.VISIBLE_COLS) + len(self.HIDDEN_COLS), parent)
        self.setHorizontalHeaderLabels(self.VISIBLE_COLS + self.HIDDEN_COLS)
        self.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.setAlternatingRowColors(True)
        self.verticalHeader().setDefaultSectionSize(32)

        # 列幅: ユーザー操作可
        hdr = self.horizontalHeader()
        hdr.setSectionResizeMode(QHeaderView.Interactive)
        hdr.setStretchLastSection(False)

        # ヘッダの文字揃え
        for col in range(len(self.VISIBLE_COLS)):
            item = self.horizontalHeaderItem(col)
            if not item:
                continue
            if col in (self.COL_SELECT, self.COL_STATUS):
                item.setTextAlignment(Qt.AlignCenter)
            else:
                item.setTextAlignment(Qt.AlignLeft | Qt.AlignVCenter)

        # クリックソート（本体は gui_main 側で制御）
        self.setSortingEnabled(False)

        # 隠し列
        self.setColumnHidden(self.COL_OLD, True)
        self.setColumnHidden(self.COL_NEW, True)

        # 初期幅
        self.setColumnWidth(self.COL_SELECT, 60)
        self.setColumnWidth(self.COL_STATUS, 60)
        self.setColumnWidth(self.COL_BEFORE, 220)
        self.setColumnWidth(self.COL_AFTER,  260)
        self.setColumnWidth(self.COL_DIR,    360)

    def clear_rows(self):
        self.setRowCount(0)

    def load_list_only(self, file_paths: list[str]):
        self.clear_rows()
        for p in file_paths:
            row = self.rowCount()
            self.insertRow(row)

            before = os.path.basename(p)
            directory = os.path.dirname(p)

            self.setCellWidget(row, self.COL_SELECT, _centered_checkbox(True))

            st = QTableWidgetItem("ー"); st.setTextAlignment(Qt.AlignCenter)
            self.setItem(row, self.COL_STATUS, st)

            self.setItem(row, self.COL_BEFORE, QTableWidgetItem(before))
            self.setItem(row, self.COL_AFTER,  QTableWidgetItem(""))
            self.setItem(row, self.COL_DIR,    QTableWidgetItem(directory))

            self.setItem(row, self.COL_OLD, QTableWidgetItem(p))
            self.setItem(row, self.COL_NEW, QTableWidgetItem(""))

    def apply_preview_result(self, plan_items: list[dict]):
        mapping = {d["old_path"]: d["new_path"] for d in plan_items}
        for r in range(self.rowCount()):
            oldp = self.item(r, self.COL_OLD).text()
            if oldp in mapping:
                newp = mapping[oldp]
                new_name = os.path.basename(newp)
                self.item(r, self.COL_NEW).setText(newp)
                self.item(r, self.COL_AFTER).setText(new_name)
                self.item(r, self.COL_AFTER).setTextAlignment(Qt.AlignLeft | Qt.AlignVCenter)

    def update_status(self, results: list[dict]):
        status_map = {d["old_path"]: ("○" if d.get("ok") else "✕") for d in results}
        for r in range(self.rowCount()):
            oldp = self.item(r, self.COL_OLD).text()
            if oldp in status_map:
                it = self.item(r, self.COL_STATUS)
                it.setText(status_map[oldp])
                it.setTextAlignment(Qt.AlignCenter)

    def _row_checkbox(self, row: int) -> QCheckBox | None:
        cell = self.cellWidget(row, self.COL_SELECT)
        if not cell: return None
        if cell.layout() and cell.layout().count():
            w = cell.layout().itemAt(0).widget()
            if isinstance(w, QCheckBox):
                return w
        return None

    def checked_old_paths(self) -> list[str]:
        out = []
        for r in range(self.rowCount()):
            cb = self._row_checkbox(r)
            if cb and cb.isChecked():
                out.append(self.item(r, self.COL_OLD).text())
        return out

    def rows_for_paths(self, paths: list[str]) -> list[int]:
        wanted = set(paths)
        rows = []
        for r in range(self.rowCount()):
            if self.item(r, self.COL_OLD).text() in wanted:
                rows.append(r)
        return rows

    # ▼ 追加：Delキーで選択行を除外（チェックOFF）
    def keyPressEvent(self, e):
        if e.key() in (Qt.Key_Delete, Qt.Key_Backspace):
            ranges = self.selectedRanges()
            for rg in ranges:
                for r in range(rg.topRow(), rg.bottomRow() + 1):
                    cb = self._row_checkbox(r)
                    if cb:
                        cb.setChecked(False)
            e.accept()
            return
        super().keyPressEvent(e)
