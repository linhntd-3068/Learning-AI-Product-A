"""Render the Sprint 1 burndown (from docs/lab5/backlog.json → simulation.burndown) as SVG and PNG.
PNG is produced with headless Chrome so no plotting library is needed.

Usage: python scripts/github-project/render_burndown_chart.py
Output: docs/lab5/sprint1-burndown.svg, docs/lab5/sprint1-burndown.png
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "lab5"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
W, H, L, R, T, B = 900, 420, 70, 30, 50, 60


def main():
    sim = json.loads((OUT / "backlog.json").read_text(encoding="utf-8"))["simulation"]
    bd = sim["burndown"]
    total = sim["committed"]["hours"]
    n = len(bd)
    x = lambda i: L + (W - L - R) * i / n                      # i = 0 … n (day 0 = sprint start)
    y = lambda v: T + (H - T - B) * (1 - v / total)
    ideal = [(x(0), y(total))] + [(x(d["day"]), y(d["ideal_remaining_h"])) for d in bd]
    actual = [(x(0), y(total))] + [(x(d["day"]), y(d["actual_remaining_h"])) for d in bd]
    pts = lambda ps: " ".join(f"{a:.1f},{b:.1f}" for a, b in ps)
    grid = "".join(f'<line x1="{L}" x2="{W-R}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="#e5e5e5"/><text x="{L-8}" y="{y(v)+4:.1f}" text-anchor="end" font-size="12" fill="#555">{v:.0f}</text>'
                   for v in [total * k / 4 for k in range(5)])
    xt = "".join(f'<text x="{x(d["day"]):.1f}" y="{H-B+18}" text-anchor="middle" font-size="11" fill="#555">{d["date"][5:]}</text>' for d in bd)
    events = sim.get("events", [])
    marks, seen = "", {}
    for ev in events:
        d = ev.get("effect_day", ev.get("day", 1))
        if d <= n:
            px = x(d)
            seen[d] = seen.get(d, -1) + 1
            marks += f'<line x1="{px:.1f}" x2="{px:.1f}" y1="{T}" y2="{H-B}" stroke="#d93f0b" stroke-dasharray="3 3"/><text x="{px+3:.1f}" y="{T+12+14*seen.get(d, 0)}" font-size="11" fill="#d93f0b">{ev["id"]}</text>'
    last = bd[-1]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Arial, sans-serif">
<rect width="{W}" height="{H}" fill="#fff"/>
<text x="{L}" y="24" font-size="16" font-weight="bold" fill="#222">{sim["sprint"]} — Burndown (giờ còn lại) · SIMULATED</text>
{grid}{xt}{marks}
<line x1="{L}" x2="{L}" y1="{T}" y2="{H-B}" stroke="#999"/><line x1="{L}" x2="{W-R}" y1="{H-B}" y2="{H-B}" stroke="#999"/>
<polyline points="{pts(ideal)}" fill="none" stroke="#8a8a8a" stroke-width="2" stroke-dasharray="6 4"/>
<polyline points="{pts(actual)}" fill="none" stroke="#ff2200" stroke-width="3"/>
<circle cx="{actual[-1][0]:.1f}" cy="{actual[-1][1]:.1f}" r="4" fill="#ff2200"/>
<text x="{actual[-1][0]-6:.1f}" y="{actual[-1][1]-8:.1f}" text-anchor="end" font-size="12" fill="#ff2200">còn {last["actual_remaining_h"]:.0f} h</text>
<rect x="{W-R-230}" y="{T}" width="220" height="44" fill="#fff" stroke="#ddd"/>
<line x1="{W-R-220}" x2="{W-R-190}" y1="{T+15}" y2="{T+15}" stroke="#8a8a8a" stroke-width="2" stroke-dasharray="6 4"/><text x="{W-R-184}" y="{T+19}" font-size="12">Lý tưởng</text>
<line x1="{W-R-220}" x2="{W-R-190}" y1="{T+33}" y2="{T+33}" stroke="#ff2200" stroke-width="3"/><text x="{W-R-184}" y="{T+37}" font-size="12">Thực tế (giả lập)</text>
<text x="{L}" y="{H-12}" font-size="11" fill="#555">Tổng cam kết {total:.0f} h · đường đứt đỏ = sự kiện gây trễ (xem bảng rủi ro)</text>
</svg>'''
    (OUT / "sprint1-burndown.svg").write_text(svg, encoding="utf-8")
    html = OUT / "_burndown.html"
    html.write_text(f"<!doctype html><meta charset=utf-8><body style='margin:0'>{svg}</body>", encoding="utf-8")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", f"--screenshot={OUT / 'sprint1-burndown.png'}",
                    f"--window-size={W},{H}", "--hide-scrollbars", html.as_uri()], check=True, capture_output=True)
    html.unlink()
    print("wrote", OUT / "sprint1-burndown.png")


if __name__ == "__main__":
    main()
