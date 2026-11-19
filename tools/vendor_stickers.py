#!/usr/bin/env python3
"""Preserve user-authorized Peach and Goma web stickers as lightweight local PNGs.

This script is a one-time deployment preparation utility, NOT runtime code.
It downloads from currently referenced Tenor URLs, preserves existing alpha,
removes connected near-white matte backgrounds where possible, and swaps the
HTML sources to local paths only when the file was saved successfully.
No generative modification, subject replacement, or image synthesis occurs.
"""
from __future__ import annotations

from collections import deque
from io import BytesIO
from pathlib import Path
import urllib.request

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stickers"
HTML = ROOT / "index.html"
SOURCES = {
    "sad-tears": "https://media.tenor.com/7Qz2iamu4egAAAAi/peach-goma-sad-tears.gif",
    "comfort": "https://media.tenor.com/Ca7voVE7eoUAAAAC/peachcat-peachcat-and-goma.gif",
    "back-hug": "https://media1.tenor.com/m/SnuIjjNClm4AAAAC/peach-goma.gif",
    "little-kiss": "https://media.tenor.com/qSGlyWc8uv8AAAAi/peach-goma-kiss-peach-and-goma.gif",
    "tender-hug": "https://media.tenor.com/zBljNGMfvlAAAAAe/couple-tear.png",
    "ending-hug": "https://media.tenor.com/0D5fTCGQzZIAAAAe/sending-hugs.png",
}

def near_white(pixel):
    r, g, b, a = pixel
    return a >= 235 and min(r, g, b) >= 230 and max(r,g,b)-min(r,g,b) <= 38

def remove_connected_white_matte(img: Image.Image) -> Image.Image:
    """Remove only near-white pixels connected to the outer edge, protecting
    white cats enclosed by darker contours. This is intentionally conservative.
    """
    w, h = img.size
    pix = img.load()
    opaque_corners = [pix[x,y] for x,y in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]]
    if sum(near_white(p) for p in opaque_corners) < 2:
        return img
    # If there is already substantial alpha, the art likely has its own cutout.
    if img.getchannel("A").getextrema()[0] < 210:
        return img
    candidates = deque()
    visited = bytearray(w*h)
    def add(x,y):
        idx=y*w+x
        if not visited[idx] and near_white(pix[x,y]):
            visited[idx]=1
            candidates.append((x,y))
    for x in range(w):
        add(x,0); add(x,h-1)
    for y in range(h):
        add(0,y); add(w-1,y)
    removed=0
    while candidates:
        x,y=candidates.popleft()
        pix[x,y]=(0,0,0,0)
        removed+=1
        if x: add(x-1,y)
        if x+1<w: add(x+1,y)
        if y: add(x,y-1)
        if y+1<h: add(x,y+1)
    print(f"    Matting: {removed} background pixels removed of {w*h}", flush=True)
    return img

def get_image(url: str) -> Image.Image:
    headers={
        "User-Agent":"Mozilla/5.0 (compatible; personal-sticker-archival/1.0)",
        "Accept":"image/avif,image/webp,image/gif,image/png,image/jpeg,*/*",
    }
    req=urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req,timeout=25) as resp:
        content_type=resp.headers.get("Content-Type","")
        if not content_type.startswith("image/"):
            raise ValueError(f"Unexpected content type: {content_type}")
        raw=resp.read(9_000_001)
        if len(raw)>9_000_000:
            raise ValueError("Source image exceeds 9 MB cap")
    src=Image.open(BytesIO(raw))
    if src.width*src.height>5_000_000:
        raise ValueError("Source image exceeds pixel limit")
    # A still first frame is chosen deliberately so reduced-motion readers
    # see the same gentle artwork, without GIF movement in a long apology.
    src.seek(0)
    return ImageOps.exif_transpose(src.convert("RGBA"))

def optimize(img:Image.Image) -> Image.Image:
    img=remove_connected_white_matte(img)
    alpha=img.getchannel("A")
    bbox=alpha.getbbox()
    if bbox:
        left,top,right,bottom=bbox
        padding=10
        img=img.crop((max(0,left-padding),max(0,top-padding),min(img.width,right+padding),min(img.height,bottom+padding)))
    img.thumbnail((420,420),Image.Resampling.LANCZOS)
    return img

def main():
    ASSETS.mkdir(parents=True,exist_ok=True)
    html=HTML.read_text(encoding="utf-8")
    saved=0
    failed=[]
    for name,url in SOURCES.items():
        dest=ASSETS/(name+".png")
        try:
            if not dest.exists():
                image=optimize(get_image(url))
                image.save(dest,format="PNG",optimize=True)
                print(f"Saved {name}: {image.size}, {dest.stat().st_size:,} bytes",flush=True)
            else:
                print(f"Already have {name}",flush=True)
            local=f"./assets/stickers/{name}.png"
            if url in html:
                html=html.replace(url,local)
            saved+=1
        except Exception as exc:
            failed.append(name)
            print(f"WARNING: could not package {name}: {type(exc).__name__}: {exc}",flush=True)
    HTML.write_text(html,encoding="utf-8")
    print(f"Packaged {saved}/{len(SOURCES)} images; missing: {', '.join(failed) or 'none'}",flush=True)

if __name__=="__main__":
    main()
