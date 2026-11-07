"""从 Noto Sans SC 可变字体生成浏览器与 PDF 共用的字体子集。"""
import argparse
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True, type=Path, help="Google Fonts OFL NotoSansSC[wght].ttf")
args = parser.parse_args()
# 纸面文案来源：数感模块全部场景、工作区界面、SVG 纸张组件、PDF 导出模块与 worker。
paths = list((ROOT / "lib/tools/number-sense").glob("*.ts")) + [
    ROOT / "components/math-worksheet-workspace.tsx",
    ROOT / "components/number-sense-paper.tsx",
    ROOT / "lib/tools/math-pdf.ts",
] + list((ROOT / "workers").glob("*.ts"))
text = "".join(p.read_text(encoding="utf-8") for p in paths)
text += "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ +−=!?/:.,·～（）。，：；？！—–"
for weight, name in [(400, "noto-sans-sc-math-subset.ttf"), (700, "noto-sans-sc-math-bold-subset.ttf")]:
    font = instantiateVariableFont(TTFont(args.source), {"wght": weight}, inplace=True)
    options = subset.Options()
    options.hinting = False
    options.recalc_bounds = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.save(ROOT / "public/fonts" / name)
    print(name)
