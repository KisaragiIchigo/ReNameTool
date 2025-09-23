from PySide6.QtCore import Qt
from PySide6.QtWidgets import QDialog, QVBoxLayout, QTextBrowser, QPushButton, QHBoxLayout

README_MD = r"""
# ReNameTool
©️2025 KisaragiIchigo

## 特長
- **どこにD&DしてもOK**：ウィンドウ全域でドラッグ＆ドロップ受け付け
- **即時リスト化**：ドロップ直後に「リネーム前」一覧を表示（プレビュー前）
- **2列追加**：先頭に「選択（チェック）」「状態（○/✕/ー）」を常設
- **プレビュー**：右列「リネーム後」に変換予定名を表示（未プレビューでも実行可能）
- **連続リネーム**：実行後は結果を「リネーム前」に繰上げ、パスも更新して続けて操作OK
- **連番は表の見た目順で振る**：ヘッダクリックで並べ替え→その順で 01, 02, 03...
- **フォルダ毎に連番**：チェックONでディレクトリごとにカウンタをリセット
- **チェックボックス超視認性**：大きめインジケータ＆配色
- **「拡張子も含む」**：置換モード時に拡張子も対象にできる
- **ウィンドウ位置/サイズ・列幅/順序の保存**：次回起動時に復元
- **Delキーで除外**：行選択して Del（またはBackspace）で「選択」チェックをOFF
- **ナチュラルソート**：リネーム前/後の並びは数値を考慮した自然な順
- **特定文字の移動/追加**：検索語を頭/後ろに移動または追加  
  - 追加オプション：**全部削除** / **区切り自動付与（スペース/_/-）** / **正規表現モード** / **親フォルダにも適用**

## 基本操作
1. フォルダ/ファイルをD&D
2. 左側で「リネーム方法」を選択  
   - 置換 / エリア文字削除 / 連番 / 日付 / フォルダ名追加 / 文字列追加 / **特定文字の移動/追加**
3. 必要に応じて「サブフォルダも含む」「（置換時）拡張子も含む」をON
4. **プレビュー**で右列に変換予定名を出す（未プレビューで**リネーム実行**も可）

## 連番について
- 付番は**テーブルの現在並び**準拠
- 「フォルダ毎に連番」ONでディレクトリごとにカウンタをリセット
- 桁数は「桁数」、開始番号は「開始番号」で指定

## 特定文字の移動/追加 Tips
- 例）`"20250505 天気 晴れ.jpg" / "天気20250101 くもり.jpg"`  
  - 検索語：`天気`
  - アクション：**元の文字列を削除して移動**（全部削除ONなら全一致を削除）
  - 位置：**頭に追加**
  - 区切り：`スペース`  
  → `天気 20250505 晴れ.jpg` / `天気 20250101 くもり.jpg`
- **正規表現**例：`r"(天気|気象)"` を検索、**自由入力**に `"[天気]"` を指定して**後ろに追加**  
  → `... [天気]`（既存の「天気/気象」は削除して移動 or そのまま追加）

## 親フォルダにも適用（ファイル対象時）
- 実行時に**フォルダ改名→ファイル改名**の順で2段階処理します
- プレビュー表示はファイル中心のため、フォルダの変化は実行時のトーストで通知します

## 既知の注意
- 同名ファイルは `[重複001]` などで衝突回避
- 権限/ロック中のアイテムは `✕`（エラーログ参照）
"""

class ReadmeDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("README ©️2025 KisaragiIchigo")
        self.resize(740, 560)

        lay = QVBoxLayout(self)
        self.viewer = QTextBrowser()
        self.viewer.setOpenExternalLinks(True)
        self.viewer.setMarkdown(README_MD)
        lay.addWidget(self.viewer, 1)

        btn_row = QHBoxLayout()
        btn_close = QPushButton("閉じる")
        btn_close.clicked.connect(self.accept)
        btn_row.addStretch(1)
        btn_row.addWidget(btn_close)
        lay.addLayout(btn_row)

        self.setStyleSheet("""
            QTextBrowser {
                background: #0f1420;
                border: 1px solid #2b3246;
                border-radius: 8px;
                padding: 10px;
            }
        """)
