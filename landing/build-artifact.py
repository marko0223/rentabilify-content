#!/usr/bin/env python3
"""Genera la versión Artifact de home.html.

El host de Artifacts envuelve el archivo en <!doctype><head></head><body>,
asi que se quitan esas etiquetas y se deja solo <title>, <link>, <style> y el cuerpo.
"""
import re, sys, pathlib

src = pathlib.Path(__file__).parent / "home.html"
dst = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("rentabilify-home.artifact.html")

s = src.read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", s, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", s, re.S).group(1)

keep = "".join(
    m.group(0) + "\n"
    for m in re.finditer(r"<title>.*?</title>|<link\b[^>]*>|<style>.*?</style>", head, re.S)
)
dst.write_text(keep + body, encoding="utf-8")
print(f"{dst} — {dst.stat().st_size} bytes")
