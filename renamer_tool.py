import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QFont, QIcon
from gui_main import MainWindow
from utils import resource_path

def main():
    app = QApplication(sys.argv)
    app.setFont(QFont("メイリオ", 10))
    app.setWindowIcon(QIcon(resource_path("rename.ico")))
    w = MainWindow()
    w.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
