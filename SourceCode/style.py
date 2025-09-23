# レイアウト系
GAP_DEFAULT   = 12
PADDING_CARD  = 12
RESIZE_MARGIN = 6

# ===== カラーパレット =====
PRIMARY_COLOR    = "#4169e1"   
HOVER_COLOR      = "#7000e0"
TITLE_COLOR      = "black"
TEXT_COLOR       = "white"

CLOSEBTN_COLOR   = "#FF0000"
MINBTN_COLOR     = "#FFD600"
MAXBTN_COLOR     = "#00C853"

# 背景/ガラス
WINDOW_BG        = "rgba(153,179,255,0)"       
GLASSROOT_BG     = "rgba(240,255,255,230)"     
GLASSROOT_BORDER = "3px solid rgba(65,105,255,255)"
TEXTPANEL_BG     = "rgba(153,179,255,220)"     

# 角丸/余白
RADIUS_WINDOW = 18
RADIUS_CARD   = 16
RADIUS_PANEL  = 10
RADIUS_BUTTON = 8
RADIUS_CLOSE  = 6

def build_qss(mode: str | None = None) -> str:
    """
    - 既定はGUIsampleの明るめガラス基調。
    - gui_main.py / widgets.py の objectName / class 互換を維持。
    """
    return f"""
    /* ===== ベース ===== */
    * {{
        font-family: "Meiryo";
        font-size: 13px;
        color: {TEXT_COLOR};
    }}
    QWidget#bgRoot {{
        background-color: {WINDOW_BG};
        border-radius: {RADIUS_WINDOW}px;
    }}
    QWidget#glassRoot {{
        background-color: {GLASSROOT_BG};
        border: {GLASSROOT_BORDER};
        border-radius: {RADIUS_CARD}px;
    }}

    /* タイトル / セクションラベル */
    QLabel#titleLabel {{
        color: {TITLE_COLOR};
        font-weight: bold;
        font-size: 14px;
    }}
    QLabel[class="SectionTitle"] {{
        color: #4169e1;
        font-weight: bold;
        font-size: 12px;
    }}

    /* パネル（左ペインなど） */
    .DarkPanel {{
        background-color: {TEXTPANEL_BG};
        border-radius: {RADIUS_PANEL}px;
        border: 1px solid black;  /* #説明: サンプル準拠で控えめな縁 */
        padding: 8px;
    }}
    .DarkPanel QLabel,
    .DarkPanel QLineEdit,
    .DarkPanel QComboBox,
    .DarkPanel QDateEdit,
    .DarkPanel QCheckBox,
    .DarkPanel QSpinBox {{
        color: {TEXT_COLOR};
        background-color: transparent;
    }}
    .DarkPanel QLineEdit,
    .DarkPanel QComboBox,
    .DarkPanel QDateEdit {{
        background-color: #696969;
        border: 1px solid #888;
        border-radius: 3px;
        padding: 2px;
    }}
    .DarkPanel QComboBox QAbstractItemView {{
        background-color: #3c3c3c;
        color: #e8e8e8;
        border: 1px solid #888;
        selection-background-color: {PRIMARY_COLOR};
    }}

    /* ボタン */
    QPushButton {{
        background-color: {PRIMARY_COLOR};
        color: white;
        border: none;
        padding: 6px 10px;
        border-radius: {RADIUS_BUTTON}px;
    }}
    QPushButton:hover {{
        background-color: {HOVER_COLOR};
    }}
    /* :pressed は暗くするだけ（Qtは CSS transform 非対応） */
    QPushButton:pressed {{
        background-color: #334bb8;
    }}

    /* ウィンドウ制御ボタン（タイトルバー右） */
    QPushButton#minBtn {{
        background: transparent;
        color: {MINBTN_COLOR};
        border-radius: {RADIUS_CLOSE}px;
        font-weight: bold; padding: 0px;
    }}
    QPushButton#minBtn:hover {{ background: rgba(153,179,255,0.06); }}
    QPushButton#maxBtn {{
        background: transparent;
        color: {MAXBTN_COLOR};
        border-radius: {RADIUS_CLOSE}px;
        font-weight: bold; padding: 0px;
    }}
    QPushButton#maxBtn:hover {{ background: rgba(153,179,255,0.06); }}
    QPushButton#closeBtn {{
        background: transparent;
        color: {CLOSEBTN_COLOR};
        border-radius: {RADIUS_CLOSE}px;
        font-weight: bold; padding: 0px;
    }}
    QPushButton#closeBtn:hover {{ background: rgba(153,179,255,0.06); }}

    /* チェック/ラジオ（視認性重視） */
    QCheckBox::indicator, QRadioButton::indicator {{
        width: 14px; height: 14px;
        border: 1px solid #888;
        background-color: #444;
    }}
    QCheckBox::indicator {{ border-radius: 3px; }}
    QRadioButton::indicator {{ border-radius: 7px; }}
    QCheckBox::indicator:hover,
    QRadioButton::indicator:hover {{
        border: 1px solid {PRIMARY_COLOR};
    }}
    QCheckBox::indicator:checked {{
        background-color: {PRIMARY_COLOR};
        border: 1px solid {PRIMARY_COLOR};
    }}
    QRadioButton::indicator:checked {{
        border: 1px solid {PRIMARY_COLOR};
        background-color: qradialgradient(
            cx:0.5, cy:0.5, radius:0.4, fx:0.5, fy:0.5,
            stop:0 white, stop:1 {PRIMARY_COLOR}
        );
    }}

    /* スライダー/スピンボックス */
    QSlider::groove:horizontal {{
        border: 1px solid #888;
        background: #444;
        height: 4px;
        border-radius: 2px;
    }}
    QSlider::handle:horizontal {{
        background: {PRIMARY_COLOR};
        border: 1px solid {PRIMARY_COLOR};
        width: 16px; height: 16px;
        margin: -7px 0;
        border-radius: 8px;
    }}
    QSpinBox {{
        border: 1px solid #888;
        background-color: #444;
        padding: 2px;
    }}

    QTableWidget {{
        background: rgba(240,240,255,0.6);
        color: #000;   /* ★ 文字は黒 */
        gridline-color: #bfc7ff;
        selection-background-color: rgba(65,105,225,0.25);
        selection-color: #000;
        alternate-background-color: rgba(240,240,255,0.35);
    }}
    QTableWidget::item {{
    color: #000;   /* ★ 各セルの文字も黒 */
    }}
    QHeaderView::section {{
        background: #e5ecff;
        color: #223;
        border: 0;
        padding: 6px;
        font-weight: bold;
    }}
    QTableCornerButton::section {{
        background: #e5ecff;
        border: 0;
    }}

    /* 区切り線（左パネル内のHLine用） */
    QFrame::separator, QFrame[frameShape="4"] {{
        color: #999;
    }}
    """
