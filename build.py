#!/usr/bin/env python3
"""mehmetcihatkeles.com · yazılar derleyicisi

Kullanım:  python3 build.py
- icerik/yazilar/*.md dosyalarını okur
- yazilar.html (liste) ve yazi/<slug>.html (okuma sayfaları) üretir
- post/<eski-wix-adresi>/index.html yönlendirme sayfalarını üretir

Yeni yazı eklemek: icerik/yazilar/ altına aynı biçimde bir .md dosyası koyup
bu betiği çalıştırmak yeterli.

.md biçimi:
  ---  ön bilgi (slug, baslik, dizi, bolum, alt, tarih, eski)  ---
  > "alıntı" | kaynak          giriş alıntısı
  ## Başlık                    ara başlık
  ---                          bölüm ayracı
  - madde / 1. madde           kaynakça maddesi (## Kaynaklar altında)
  [1]                          dipnot göndermesi
  !! metin                     yazar notu (yazının sonunda)
"""
import html, os, re, glob, json
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]
FAVICON = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%23151515%27/%3E%3Crect x=%2710%27 y=%2734%27 width=%2744%27 height=%2714%27 fill=%27%23F3FF53%27/%3E%3Ctext x=%2732%27 y=%2745%27 text-anchor=%27middle%27 font-family=%27Poppins,Arial,sans-serif%27 font-weight=%27600%27 font-size=%2726%27 fill=%27%23F6F6F2%27%3Emck%3C/text%3E%3C/svg%3E"
SITE = "https://mehmetcihatkeles.com"

def tr_date(s):
    y, m, d = map(int, s.split("-"))
    return f"{d} {AYLAR[m-1]} {y}"

def parse(path):
    raw = open(path, encoding="utf-8").read()
    _, fm, body = raw.split("---\n", 2)
    meta = {}
    for line in fm.strip().splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    blocks = [b.strip() for b in re.split(r"\n\s*\n", body.strip()) if b.strip()]
    words = len(re.findall(r"\w+", body))
    meta["dk"] = max(1, round(words / 200))
    meta["blocks"] = blocks
    return meta

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\[(\d+)\]", r'<sup><button type="button" class="fn" data-k="\1" aria-expanded="false" aria-label="Kaynak \1">\1</button></sup>', t)
    return t

def render_body(blocks):
    out, in_src, src_items, src_ordered = [], False, [], False
    def flush_src():
        nonlocal src_items
        if src_items:
            tag = "ol" if src_ordered else "ul"
            lis = "".join(f'<li id="k-{i+1}">{inline(x)}</li>' for i, x in enumerate(src_items))
            out.append(f'<{tag} class="sources">{lis}</{tag}>')
            src_items = []
    for b in blocks:
        if b.startswith("> "):
            q, _, src = b[2:].partition(" | ")
            out.append(f'<blockquote class="epi"><p>{inline(q)}</p><cite>{inline(src)}</cite></blockquote>')
        elif b.startswith("## "):
            flush_src()
            h = b[3:].strip()
            in_src = h.lower() == "kaynaklar"
            out.append(f'<h2{" class=\"src-h\"" if in_src else ""}>{inline(h)}</h2>')
        elif b == "---":
            out.append('<hr class="sep" aria-hidden="true">')
        elif b.startswith("!! "):
            flush_src()
            out.append(f'<aside class="note">{inline(b[3:])}</aside>')
        elif in_src and re.match(r"^(- |\d+\. )", b):
            for line in b.splitlines():
                m = re.match(r"^(- |\d+\. )(.*)", line)
                if m:
                    src_ordered = m.group(1) != "- "
                    src_items.append(m.group(2))
        else:
            out.append(f"<p>{inline(b)}</p>")
    flush_src()
    return "\n".join(out)

def head(title, desc, prefix, extra=""):
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="https://mehmetcihatkeles.com/img/paylasim.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Mehmet Cihat Keleş">
<meta property="og:locale" content="tr_TR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F6F6F2">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="icon" href="{FAVICON}">
<link rel="stylesheet" href="{prefix}css/site.css">
<link rel="stylesheet" href="{prefix}css/yazilar.css">{extra}
</head>
<body>
"""

def header(prefix):
    p = prefix
    return f"""<header class="top" id="top">
  <div class="wrap">
    <a class="brand" href="{p}index.html">Mehmet Cihat Keleş</a>
    <nav class="main" aria-label="Ana menü">
      <a href="{p}konaklama.html">Konaklama</a>
      <a href="{p}okullar.html">Okullar</a>
      <a href="{p}tut.html">Temel Uyum Terapisi</a>
      <a href="{p}yazilar.html" aria-current="page">Yazılar</a>
      <a href="{p}cv.html">CV</a>
      <button class="theme" type="button" data-theme-toggle>Gece</button>
    </nav>
    <div class="sag"><a class="planla-btn" href="/planla/">Planla</a><button class="menu-btn" type="button" aria-expanded="false" aria-controls="sheet" data-menu>Menü</button></div>
  </div>
</header>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Menü">
  <div class="sheet-top">
    <a class="brand" href="{p}index.html">Mehmet Cihat Keleş</a>
    <button class="menu-btn" type="button" data-menu-close style="display:inline-block">Kapat</button>
  </div>
  <ol>
    <li><a href="{p}konaklama.html" data-close><small>01</small>Konaklama</a></li>
    <li><a href="{p}okullar.html" data-close><small>02</small>Okullar</a></li>
    <li><a href="{p}tut.html" data-close><small>03</small>Temel Uyum Terapisi</a></li>
    <li><a href="{p}yazilar.html" data-close><small>04</small>Yazılar</a></li>
    <li><a href="{p}cv.html" data-close><small>05</small>CV</a></li>
  </ol>
  <div class="sheet-foot">
    <span class="label">Ataşehir · İstanbul</span>
    <button class="theme" type="button" data-theme-toggle>Gece</button>
  </div>
</div>
"""

def footer(prefix):
    p = prefix
    return f"""<footer id="iletisim">
  <div class="wrap">
    <div class="foot" style="margin-top:0;border-top:none;padding-top:0">
      <nav aria-label="Alt menü">
        <a href="{p}index.html">Ana sayfa</a>
        <a href="{p}konaklama.html">Konaklama</a>
        <a href="{p}okullar.html">Okullar</a>
        <a href="{p}tut.html">Temel Uyum Terapisi</a>
        <a href="{p}yazilar.html">Yazılar</a>
        <a href="{p}cv.html">CV</a>
        <a href="/okula/">Köpeksel Bilgiler Okulası</a> <a href="https://www.linkedin.com/in/mckeles/" rel="noopener">LinkedIn</a>
      </nav>
      <small>© 2026 Mehmet Cihat Keleş · Powered and secured by Randle Patrick McMurphy</small>
    </div>
  </div>
</footer>
<script src="{p}js/site.js"></script>
"""

def card(y, prefix):
    seri = f'{html.escape(y["dizi"])} · Bölüm {y["bolum"]}' if y.get("dizi") else "Deneme"
    alt = f'<p>{html.escape(y["alt"])}</p>' if y.get("alt") and not y.get("dizi") else ""
    return f"""<article class="post"><a href="{prefix}yazi/{y['slug']}.html">
  <span class="meta">{tr_date(y['tarih'])} · {y['dk']} dk</span>
  <h3>{html.escape(y['baslik'])}</h3>
  <span class="series">{seri}</span>{alt}
</a></article>"""

def main():
    yazilar = [parse(f) for f in glob.glob(os.path.join(ROOT, "icerik/yazilar/*.md"))]
    yazilar.sort(key=lambda y: (y["tarih"], int(y["bolum"] or 0)), reverse=True)
    os.makedirs(os.path.join(ROOT, "yazi"), exist_ok=True)

    # ---- okuma sayfaları
    for y in yazilar:
        seri = [s for s in yazilar if y.get("dizi") and s.get("dizi") == y["dizi"]]
        seri.sort(key=lambda s: int(s["bolum"]))
        nav = ""
        if seri:
            items = []
            for s in seri:
                cur = ' aria-current="page"' if s["slug"] == y["slug"] else ""
                items.append(f'<li><a href="{s["slug"]}.html"{cur}><span>Bölüm {s["bolum"]}</span>{html.escape(s["baslik"])}</a></li>')
            nav = f'<nav class="series-nav" aria-label="Dizinin bölümleri"><p class="label">{html.escape(y["dizi"])}</p><ol>{"".join(items)}</ol></nav>'
        diger = [o for o in yazilar if o["slug"] != y["slug"]][:3]
        kicker = f'{html.escape(y["dizi"])} · Bölüm {y["bolum"]}' if y.get("dizi") else "Deneme"
        alt = f'<p class="dek">{html.escape(y["alt"])}</p>' if y.get("alt") else ""
        desc = y.get("alt") or y["baslik"]
        page = head(f'{y["baslik"]} · Mehmet Cihat Keleş', desc, "../",
                    f'\n<meta property="og:type" content="article">\n<link rel="canonical" href="{SITE}/yazi/{y["slug"]}.html">')
        page += '<div class="progress" aria-hidden="true"><span id="bar"></span></div>\n'
        page += header("../")
        page += f"""<main class="read">
  <div class="wrap">
    <header class="read-head">
      <p class="label"><a href="../yazilar.html">Yazılar</a> · {kicker}</p>
      <h1>{html.escape(y['baslik'])}</h1>
      {alt}
      <p class="byline">Mehmet Cihat Keleş · {tr_date(y['tarih'])} · {y['dk']} dk okuma</p>
    </header>
    <article class="prose-read">
{render_body(y['blocks'])}
    </article>
    {nav}
    <section class="more-reads" aria-label="Diğer yazılar">
      <p class="label">Diğer yazılar</p>
      <div class="posts">{"".join(card(o, "../") for o in diger)}</div>
      <p class="more"><a href="../yazilar.html">Tüm yazılar →</a></p>
    </section>
  </div>
</main>
"""
        page += footer("../")
        page += """<script>
(function(){var b=document.getElementById('bar'),a=document.querySelector('.prose-read');
function u(){var r=a.getBoundingClientRect(),h=r.height-innerHeight*0.6,p=Math.min(1,Math.max(0,-r.top/(h>0?h:1)));b.style.width=(p*100)+'%'}
addEventListener('scroll',u,{passive:true});addEventListener('resize',u);u();
/* dipnotlar: kaynak, numaranın hemen altında açılır; sayfa kaymaz */
document.querySelectorAll('.fn').forEach(function(btn){btn.addEventListener('click',function(){
  var p=btn.closest('p'),k=btn.dataset.k,id='fn-pop-'+k+'-'+[].indexOf.call(document.querySelectorAll('.fn'),btn),ex=document.getElementById(id);
  if(ex){ex.remove();btn.setAttribute('aria-expanded','false');return}
  var src=document.getElementById('k-'+k);if(!src)return;
  var box=document.createElement('div');box.className='fn-pop';box.id=id;
  box.innerHTML='<span class="fn-n">'+k+'</span>'+src.innerHTML+'<button type="button" class="fn-x" aria-label="Kapat">×</button>';
  box.querySelector('.fn-x').addEventListener('click',function(){box.remove();btn.setAttribute('aria-expanded','false');btn.focus({preventScroll:true})});
  p.insertAdjacentElement('afterend',box);btn.setAttribute('aria-expanded','true');
})});
})();
</script>
</body>
</html>
"""
        open(os.path.join(ROOT, "yazi", y["slug"] + ".html"), "w", encoding="utf-8").write(page)

    # ---- liste sayfası
    diziler = {}
    for y in yazilar:
        if y.get("dizi"):
            diziler.setdefault(y["dizi"], []).append(y)
    page = head("Yazılar · Mehmet Cihat Keleş", "Mehmet Cihat Keleş'in kişisel denemeleri: okuduklarım, düşündüklerim, aklıma takılanlar.", "")
    page += header("")
    seri_html = ""
    for d, ys in diziler.items():
        ys = sorted(ys, key=lambda s: int(s["bolum"]))
        lis = "".join(f'<li><a href="yazi/{s["slug"]}.html"><span class="n">{int(s["bolum"]):02d}</span><span class="t">{html.escape(s["baslik"])}</span><span class="m">{s["dk"]} dk</span></a></li>' for s in ys)
        seri_html += f"""<section class="series-box">
  <p class="label">Dizi · {len(ys)} bölüm</p>
  <h2>{html.escape(d)}</h2>
  <p class="dek">{html.escape(ys[0]['alt'])}</p>
  <ol>{lis}</ol>
</section>"""
    page += f"""<main>
  <section class="list-hero">
    <div class="wrap">
      <p class="label">Yazılar</p>
      <h1>Okuduklarım, <b>düşündüklerim.</b></h1>
      <p class="lead">Köpeklerin dışında kalan kişisel denemelerim burada. Köpekler üzerine yazdıklarımın hepsi <a href="/okula/">Köpeksel Bilgiler Okulası</a>'nda.</p>
    </div>
  </section>
  <section class="list-body">
    <div class="wrap">
      {seri_html}
      <div class="list-all">
        <p class="label">Tüm yazılar · {len(yazilar)}</p>
        <div class="posts">{"".join(card(y, "") for y in yazilar)}</div>
      </div>
    </div>
  </section>
</main>
"""
    page += footer("") + "</body>\n</html>\n"
    open(os.path.join(ROOT, "yazilar.html"), "w", encoding="utf-8").write(page)

    # ---- eski Wix adresleri için yönlendirmeler
    for y in yazilar:
        if not y.get("eski"):
            continue
        d = os.path.join(ROOT, "post", y["eski"])
        os.makedirs(d, exist_ok=True)
        hedef = f"/yazi/{y['slug']}.html"
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(
            f'<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>{html.escape(y["baslik"])}</title>'
            f'<meta http-equiv="refresh" content="0; url={hedef}"><link rel="canonical" href="{SITE}{hedef}"></head>'
            f'<body><a href="{hedef}">{html.escape(y["baslik"])}</a></body></html>')

    # ---- ana sayfadaki son üç yazı
    ip = os.path.join(ROOT, "index.html")
    s = open(ip, encoding="utf-8").read()
    s = re.sub(r"<!--SON-YAZILAR-->.*?<!--/SON-YAZILAR-->",
               lambda m: "<!--SON-YAZILAR-->" + "".join(card(y, "") for y in yazilar[:3]) + "<!--/SON-YAZILAR-->", s, flags=re.S)
    open(ip, "w", encoding="utf-8").write(s)


    # ---- eski Wix sayfaları için yönlendirmeler
    ESKI = {
        "blog": "/yazilar.html", "fiyat-gecmisi": "/konaklama.html#fiyat-gecmisi",
        "contact": "/#iletisim", "kopekegitmeni": "/", "about-1": "/", "about-4": "/", "services-7": "/tut.html",
        "akademi": "/", "kidu": "/", "projects": "/", "loves": "/", "photography": "/", "challenges": "/",
        "test": "/", "sevgiligunluk": "/",
    }
    for eski, hedef in ESKI.items():
        d = os.path.join(ROOT, eski)
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(
            f'<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Mehmet Cihat Keleş</title>'
            f'<meta http-equiv="refresh" content="0; url={hedef}"><link rel="canonical" href="{SITE}{hedef}"></head>'
            f'<body><a href="{hedef}">Devam et</a></body></html>')

    json.dump([{k: y[k] for k in ("slug","baslik","dizi","bolum","tarih","dk")} for y in yazilar],
              open(os.path.join(ROOT, "icerik/yazilar.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(yazilar)} yazı derlendi.")

if __name__ == "__main__":
    main()
