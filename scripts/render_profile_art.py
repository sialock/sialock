"""Render original 3D-inspired profile banners as PNG images.

These are artistic visualizations, not biological measurements.
Requires numpy and Pillow; run: python scripts/render_profile_art.py
"""
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W,H=1920,630
OUT=Path("assets")
OUT.mkdir(parents=True,exist_ok=True)

def rgb(s):
    return tuple(bytes.fromhex(s.lstrip("#")))

def font(n,bold=False):
    stem="/usr/share/fonts/truetype/dejavu/DejaVuSans"
    return ImageFont.truetype(stem+("-Bold" if bold else "")+".ttf",n)

def scene(seed,hue):
    rng=np.random.default_rng(seed)
    x=np.linspace(0,1,W,dtype=np.float32)[None,:,None]
    y=np.linspace(0,1,H,dtype=np.float32)[:,None,None]
    base=np.array([6,14,28],dtype=np.float32).reshape(1,1,3)
    tint=np.array(hue,dtype=np.float32).reshape(1,1,3)
    field=.09+.5*x*x+.12*np.cos(y*math.pi)
    arr=np.broadcast_to(base+field*(tint-base),(H,W,3)).copy()
    arr+=np.exp(-(((x-.77)/.25)**2+((y-.42)/.8)**2))*tint*.085
    im=Image.fromarray(np.uint8(np.clip(arr,0,255)),"RGB").convert("RGBA")
    d=ImageDraw.Draw(im,"RGBA")
    for _ in range(175):
        px=int(rng.uniform(.38,1.0)*W);py=int(rng.uniform(0,H));rad=int(rng.choice([1,1,1,2,3]))
        d.ellipse((px-rad,py-rad,px+rad,py+rad),fill=(*hue,int(rng.uniform(20,105))))
    for a in np.linspace(885,2000,14):
        d.line(((int(a),0),(int(a-110),H)),fill=(80,160,205,12),width=1)
    return im

def project(x,y,z,cx,cy,scale):
    s=1+.13*z
    return cx+scale*(x+.24*z)*s, cy+scale*(y-.14*z)*s

def illuminate(im,paths):
    layer=Image.new("RGBA",im.size,(0,0,0,0))
    g=ImageDraw.Draw(layer,"RGBA")
    for pts,col,w in paths:
        g.line(pts,fill=(*col,190),width=w*3,joint="curve")
    im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(14)))
    d=ImageDraw.Draw(im,"RGBA")
    for pts,col,w in paths:
        d.line(pts,fill=(*col,88),width=w+8,joint="curve")
        d.line(pts,fill=(*col,255),width=w,joint="curve")

def dna(im,accent):
    col=rgb(accent);blue=(60,123,221)
    ts=np.linspace(-2.6,2.6,95)
    branches=[]
    for offset in (0,math.pi):
        branches.append([project(.95*math.cos(t*2.4+offset),t,.95*math.sin(t*2.4+offset),1495,317,105) for t in ts])
    d=ImageDraw.Draw(im,"RGBA")
    for i in range(0,len(ts),4):
        d.line((branches[0][i],branches[1][i]),fill=(*col,105),width=5)
    illuminate(im,[(branches[0],col,8),(branches[1],blue,8)])
    d=ImageDraw.Draw(im,"RGBA")
    for branch,shade in zip(branches,(col,(132,174,248))):
        for i in range(0,len(branch),3):
            p=branch[i]
            d.ellipse((p[0]-4,p[1]-4,p[0]+4,p[1]+4),fill=(*shade,245))
    d.arc((1110,-26,1906,693),0,360,fill=(*col,55),width=2)
    d.arc((1150,11,1870,655),50,315,fill=(73,138,193,50),width=2)

def protein(im,accent):
    col=rgb(accent)
    t=np.linspace(0,15*math.pi,520)
    x=(.9+.14*np.sin(t*.3))*np.sin(t*.46)+.26*np.cos(2*t)
    y=(.85+.11*np.cos(t*.34))*np.cos(t*.52)+.2*np.sin(3*t*.5)
    z=.7*np.sin(t*.38)+.4*np.cos(t*.2)
    pts=[project(a,b,c,1464,314,195) for a,b,c in zip(x,y,z)]
    d=ImageDraw.Draw(im,"RGBA")
    for radius,alpha in [(235,30),(200,20),(160,12)]:
        d.ellipse((1464-radius,314-radius,1464+radius,314+radius),outline=(*col,alpha),width=3)
    illuminate(im,[(pts,col,5)])
    d=ImageDraw.Draw(im,"RGBA")
    for p in pts[::15]:
        d.ellipse((p[0]-5,p[1]-5,p[0]+5,p[1]+5),fill=(*col,220))
    d.ellipse((1424,274,1496,346),fill=(234,176,91,62),outline=(238,180,91,135),width=2)

def skyline(im,accent):
    col=rgb(accent);rng=np.random.default_rng(22)
    d=ImageDraw.Draw(im,"RGBA")
    for row in range(9):
        for column in range(14):
            x=1018+column*56+row*22
            y=476+row*15-column*8
            height=int(rng.integers(5,95))*3
            top=y-height
            if top<20:continue
            strength=int(min(190,45+height*.3))
            d.polygon(((x,y),(x+34,y-10),(x+34,top-10),(x,top)),fill=(*col,int(strength*.55)),outline=(*col,145))
            d.polygon(((x+34,y-10),(x+44,y-16),(x+44,top-16),(x+34,top-10)),fill=(27,72,91,int(strength*.6)),outline=(*col,95))
            d.polygon(((x,top),(x+34,top-10),(x+44,top-16),(x+10,top-6)),fill=(*col,strength))

DESIGNS=[
    ("hero-molecular-lab.png","Molecular Lab",dna,(34,196,176),"5EEAD4",101),
    ("hero-protein-atlas.png","Protein Atlas",protein,(126,70,166),"BDA8FF",102),
    ("hero-data-skyline.png","Research Skyline",skyline,(12,130,112),"53E5CE",103)
]
for filename,title,painter,hue,accent,seed in DESIGNS:
    im=scene(seed,hue)
    painter(im,accent)
    d=ImageDraw.Draw(im,"RGBA")
    x=102
    d.rounded_rectangle((x,57,x+14,72),radius=4,fill="#"+accent)
    d.text((x+30,45),"SIA  /  LAB",font=font(29,True),fill=(237,248,252))
    d.text((x,154),"DECODING BIOLOGY.",font=font(65,True),fill="#F6FAFC")
    d.text((x,246),"BUILDING INTELLIGENCE.",font=font(49,True),fill="#"+accent)
    d.line(((x,338),(x+257,338)),fill="#"+accent,width=3)
    d.text((x,371),"COMPUTATIONAL BIOLOGY  /  MACHINE LEARNING",font=font(26),fill=(202,221,230))
    d.text((x,467),"SINGLE-CELL  •  PROTEIN SCIENCE  •  SCIENTIFIC SOFTWARE",font=font(18),fill=(174,200,210))
    d.text((x,552),title.upper()+"   /   SIALOCK",font=font(17),fill=(144,190,197))
    im.convert("RGB").save(OUT/filename,optimize=True)
    print(filename)
