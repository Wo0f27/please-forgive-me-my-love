#!/usr/bin/env python3
"""Restore genuine Peach/Goma sticker animation without cropping out Peach's white fur.

Download the approved Tenor GIF sources once, preserve their native multi-frame
motion, remove only obvious white/green backdrops where necessary, and encode
lossless transparent *animated WebP* for sharp browser rendering.

This is a one-time source preparation utility. The published website has no
third-party media dependencies. Files with fewer than two real frames are
rejected, not mislabeled as animations.
"""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
from collections import Counter
import hashlib
import json
import urllib.request

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "stickers"
ORIGINALS = ROOT / ".animated-sticker-source"
PREVIEWS = ROOT / ".animated-sticker-previews"

SOURCES = {
    "sad-tears": "https://media.tenor.com/7Qz2iamu4egAAAAi/peach-goma-sad-tears.gif",
    "back-hug": "https://media1.tenor.com/m/SnuIjjNClm4AAAAC/peach-goma.gif",
    "little-kiss": "https://media.tenor.com/qSGlyWc8uv8AAAAi/peach-goma-kiss-peach-and-goma.gif",
    "comfort": "https://media.tenor.com/6k0cdiZZqbQAAAAC/peach-and-goma-goma.gif",
    "tender-hug": "https://media.tenor.com/-FI5WRxJ23kAAAAi/peach-goma-love.gif",
    "ending-hug": "https://media1.tenor.com/m/WKCutj8Z3IIAAAAC/peach-goma.gif",
}

def fetch(source: str) -> bytes:
    req = urllib.request.Request(source, headers={
        "User-Agent": "Mozilla/5.0 (compatible; PeachGomaPersonalSite/1.0)",
        "Accept": "image/webp,image/gif,image/*,*/*",
    })
    with urllib.request.urlopen(req, timeout=35) as res:
        ct = res.headers.get("Content-Type", "")
        if not ct.startswith("image/"):
            raise ValueError(f"Not an image: {ct}")
        data = res.read(14_000_001)
        if len(data) > 14_000_000:
            raise ValueError("Source exceeds 14MB")
    return data

def remove_solid_backdrop(img: Image.Image) -> Image.Image:
    rgba = np.asarray(img.convert("RGBA")).copy()
    h,w = rgba.shape[:2]
    rgb = rgba[:,:,:3]
    if rgba[0,0,3] < 60 and rgba[0,w-1,3] < 60:
        return Image.fromarray(rgba, "RGBA")
    # The foreground is identified by the colored characters and ink outlines.
    # A 13px closing mask keeps Peach's enclosed white body opaque.
    diff = np.sqrt(np.sum(np.square(rgb.astype(np.float32)-255),axis=2))
    green = (rgb[:,:,1].astype(float)>rgb[:,:,0]*1.12) & (
        rgb[:,:,1].astype(float)>rgb[:,:,2]*1.06) & (rgb[:,:,1]>94)
    ink = np.uint8((diff>50) & ~green) * 255
    closed = cv2.morphologyEx(ink,cv2.MORPH_CLOSE,np.ones((13,13),np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(closed,8)
    if n <= 1:
        raise ValueError("No safe foreground segmentation")
    major = max(range(1,n),key=lambda i:stats[i,cv2.CC_STAT_AREA])
    mask = np.uint8(labels==major)*255
    flood=mask.copy()
    helper=np.zeros((h+2,w+2),np.uint8)
    cv2.floodFill(flood,helper,(0,0),255)
    mask=cv2.bitwise_or(mask,cv2.bitwise_not(flood))
    # Explicitly remove matte touching the image's borders (NOT cat interiors).
    pale=(np.min(rgb,axis=2)>237)|green
    _,groups=cv2.connectedComponents(np.uint8(pale),8)
    edgegroups=set(np.unique(np.concatenate([
        groups[0,:],groups[-1,:],groups[:,0],groups[:,-1]
    ])))
    for group in edgegroups:
        if group!=0: mask[groups==group]=0
    mask[green]=0
    mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
    mask=cv2.GaussianBlur(mask,(3,3),.6)
    # A tiny green-ground remnant at the far-right edge of one known original.
    if (w,h)==(472,468): mask[:,w-7:]=0
    rgba[:,:,3]=np.minimum(mask,rgba[:,:,3])
    return Image.fromarray(rgba,"RGBA")

def process(name: str, url: str) -> dict:
    data=fetch(url)
    im=Image.open(BytesIO(data))
    if im.width<120 or im.height<120 or im.width*im.height>3_000_000:
        raise ValueError(f"Unexpected source dimensions {im.size}")
    if getattr(im,"n_frames",1)<2:
        raise ValueError("Source is a still image, not an animation")
    ORIGINALS.mkdir(parents=True,exist_ok=True)
    (ORIGINALS / (name+".gif")).write_bytes(data)
    frames=[]
    timings=[]
    for frame in range(im.n_frames):
        im.seek(frame)
        rgba=im.convert("RGBA")
        if not (rgba.getpixel((0,0))[3]<60 and rgba.getpixel((rgba.width-1,0))[3]<60):
            rgba=remove_solid_backdrop(rgba)
        frames.append(rgba)
        timings.append(max(40,int(im.info.get("duration") or 100)))
    if len(frames)<2:
        raise ValueError("No animation")
    OUT.mkdir(parents=True,exist_ok=True)
    destination=OUT/(name+".webp")
    # lossless WebP: full-resolution colors and native frame timing with alpha.
    frames[0].save(destination,format="WEBP",save_all=True,
       append_images=frames[1:],duration=timings,loop=0,lossless=True,
       method=6,exact=True)
    check=Image.open(destination)
    if check.n_frames<2:
        raise ValueError("Encoded output lost animation")
    if check.convert("RGBA").getpixel((0,0))[3]>30:
        raise ValueError("Animated sticker still has an opaque background")
    if destination.stat().st_size>9_000_000:
        raise ValueError("Animated sticker exceeds 9MB output cap")
    result=dict(name=name,source=url,frames=check.n_frames,width=check.width,
       height=check.height,duration_ms=sum(timings),bytes=destination.stat().st_size,
       sha256=hashlib.sha256(destination.read_bytes()).hexdigest())
    # Reference preview: frame 0, middle, last on pastel backdrop.
    PREVIEWS.mkdir(parents=True,exist_ok=True)
    canvas=Image.new("RGBA",(240*3,235),"#f9e6eb")
    for order,number in enumerate([0,check.n_frames//2,check.n_frames-1]):
        check.seek(number)
        f=check.convert("RGBA")
        f.thumbnail((224,205),Image.Resampling.LANCZOS)
        canvas.alpha_composite(f,(240*order+(240-f.width)//2,(210-f.height)//2))
        ImageDraw.Draw(canvas).text((240*order+8,212),f"{name} frame {number}",fill="#69455a")
    canvas.save(PREVIEWS/(name+".png"),optimize=True)
    print(f"RESTORED {name}: {check.n_frames} frames {check.size}, "
          f"{sum(timings)}ms, {destination.stat().st_size:,} bytes",flush=True)
    return result

def main():
    success,failed=[],[]
    for name,url in SOURCES.items():
        try: success.append(process(name,url))
        except Exception as e:
            print(f"ERROR {name}: {type(e).__name__}: {e}",flush=True)
            failed.append(name)
    manifest=ROOT/"assets"/"stickers"/"animations.json"
    manifest.write_text(json.dumps({
       "format":"lossless animated WebP","purpose":"Restored original GIF motion with transparency",
       "animations":success,"failed":failed
    },indent=2)+"\n",encoding="utf-8")
    print(f"READY {len(success)}/{len(SOURCES)} animated stickers; failures={failed}",flush=True)
    # Only the first three known originals must succeed. Additional sources
    # remain optional and keep their preexisting still-image fallbacks.
    required={"sad-tears","back-hug","little-kiss"}
    if not required.issubset({r["name"] for r in success}):
        raise SystemExit("Missing required original animated stickers")

if __name__=="__main__":
    main()
