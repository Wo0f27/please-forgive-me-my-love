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

def remove_connected_background(img: Image.Image, name: str) -> Image.Image:
    """Use outlined character contours so a white cat is not hollowed out
    when near-white space is removed. Conservatively preserve existing alpha.
    """
    from PIL import ImageFilter, ImageChops

    w,h = img.size
    pixels = img.load()
    corners = [pixels[x,y] for x,y in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]]
    opaque = [p for p in corners if p[3]>=220]

    if name=="back-hug":
        out=img.copy()
        op=out.load()
        removed=0
        for y in range(h):
            for x in range(w):
                rr,gg,bb,aa=op[x,y]
                if aa>0 and gg>rr*1.10 and gg>bb*1.08 and gg>105:
                    op[x,y]=(rr,gg,bb,0)
                    removed+=1
        print(f"    Removed {removed} green backdrop pixels",flush=True)
        return out

    if img.getchannel("A").getextrema()[0] < 100 and len(opaque)<2:
        return img
    if len(opaque)<2:
        return img

    channels = [sorted(p[i] for p in opaque) for i in range(3)]
    bg = tuple(ch[len(ch)//2] for ch in channels)
    def difference(color):
        return sum((color[i]-bg[i])**2 for i in range(3))**0.5

    if sum(difference(p[:3])<45 for p in opaque)<2:
        return img
    print(f"    Inferred backdrop RGB {bg}",flush=True)
    ink=Image.new("L",(w,h),0)
    ip=ink.load()
    threshold=42 if max(bg)>200 else 36
    for y in range(h):
        for x in range(w):
            rr,gg,bb,aa=pixels[x,y]
            if aa>35 and difference((rr,gg,bb))>threshold:
                ip[x,y]=255
    edge=ink.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.MinFilter(13))
    ep=edge.load()
    outside=bytearray(w*h)
    q=deque()
    def push(x,y):
        i=y*w+x
        if not outside[i] and ep[x,y]<128:
            outside[i]=1
            q.append((x,y))
    for x in range(w):
        push(x,0);push(x,h-1)
    for y in range(h):
        push(0,y);push(w-1,y)
    while q:
        x,y=q.popleft()
        if x:push(x-1,y)
        if x+1<w:push(x+1,y)
        if y:push(x,y-1)
        if y+1<h:push(x,y+1)
    mask=Image.new("L",(w,h),0)
    mp=mask.load()
    retained=0
    for y in range(h):
        for x in range(w):
            if not outside[y*w+x]:
                mp[x,y]=255
                retained+=1
    mask=mask.filter(ImageFilter.GaussianBlur(0.5))
    mask=ImageChops.darker(mask,img.getchannel("A"))
    out=img.copy()
    out.putalpha(mask)
    print(f"    Preserved {retained} character pixels of {w*h}",flush=True)
    return out

def get_image(url: str, name: str) -> Image.Image:
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
    # Upload the unmodified originals as a temporary private QA artifact.
    # This allows checking difficult white-on-white illustrations by eye.
    original_dir = ROOT / ".source-stickers"
    original_dir.mkdir(parents=True,exist_ok=True)
    suffix = Path(url.split("?")[0]).suffix or ".img"
    (original_dir / (name + suffix)).write_bytes(raw)
    src=Image.open(BytesIO(raw))
    if src.width*src.height>5_000_000:
        raise ValueError("Source image exceeds pixel limit")
    # A still first frame is chosen deliberately so reduced-motion readers
    # see the same gentle artwork, without GIF movement in a long apology.
    src.seek(0)
    return ImageOps.exif_transpose(src.convert("RGBA"))

def optimize(img:Image.Image, name:str) -> Image.Image:
    img=remove_connected_background(img,name)
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
            image=optimize(get_image(url,name),name)
            image.save(dest,format="PNG",optimize=True)
            print(f"Saved {name}: {image.size}, {dest.stat().st_size:,} bytes",flush=True)
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
