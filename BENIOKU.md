# mehmetcihatkeles.com

Mehmet Cihat Keleş'in kişisel sitesi. GitHub Pages'te yayınlanır.

## Sayfalar
- `index.html` ana sayfa · `konaklama.html` konaklama, ücret hesaplama ve formlar
- `tut.html` Temel Uyum Terapisi · `cv.html` CV · `yazilar.html` + `yazi/` yazılar

## Yeni yazı eklemek
1. `icerik/yazilar/` altına mevcut yazılardaki biçimde bir `.md` dosyası koy.
2. `python3 build.py` çalıştır. Yazı sayfası, Yazılar listesi ve ana sayfadaki "Son yazılar" güncellenir.

## Fiyatı güncellemek
`js/hesap.js` dosyasının başındaki `var FIYAT={gece:..., gunduz:...}` satırı. Ücret, hesaplayıcı ve gündüz ücreti oradan beslenir.
Fiyat geçmişi tablosuna yeni satır aynı dosyada, `<table class="hist">` içine eklenir.

## Formlar
Tanışma (`tanisma-gorusmesi/`) ve ön rezervasyon (`on-rezervasyon/`) formları Google Form'a gönderir (`js/form.js` içinde `FORM` ve `ALAN`).
Cevaplar Drive'daki "Site talepleri · mehmetcihatkeles.com" tablosuna düşer; her yeni talepte e-posta bildirimi gelir.

## Eski adresler
`post/…` ve `blog/`, `on-rezervasyon/` gibi klasörler, Wix'teki eski adresleri yeni sayfalara yönlendirir.

## Yazı boyutları

Sitedeki bütün yazı boyutları `css/site.css` dosyasının başındaki dokuz basamaklı ölçekten gelir (`--t-etiket`, `--t-kucuk`, `--t-metin`, `--t-govde`, `--t-giris`, `--t-ara`, `--t-bolum`, `--t-sayfa`, `--t-vitrin`). Yeni bir öğe eklerken bunlardan birini kullanın; yeni bir piksel değeri yazmayın. Bir basamağı değiştirmek, o basamağı kullanan her yeri birlikte değiştirir.

## Paylaşım görseli ve arama motorları

- Bağlantı WhatsApp, Instagram ya da başka bir yerde paylaşıldığında görünen görsel `img/paylasim.jpg` (1200×630). Değiştirmek için aynı adla yenisini koymak yeterli.
- `sitemap.xml` ve `robots.txt` arama motorları için. Yeni bir yazı eklendiğinde `sitemap.xml`'e bir satır eklenir.

## Dil

Müşteriye dönük her kelime, müşterinin yerinden ve onun yaptığı işle yazılır; işletmenin iç terimi yazılmaz. Sitede bir zamanlar "Teslim saati" yazıyordu. Müşteri bunu "köpeğimi size teslim edeceğim saat" diye okudu, oysa kastedilen köpeği geri alacağı saatti. Bu yüzden hesaplamada ve formlarda "Bırakacağınız gün", "Alacağınız gün", "Alacağınız saat" yazar. Yeni bir metin eklerken şunu sorun: Bunu ilk kez okuyan biri kendi kafasında hangi sahneyi kuruyor?

## Ücret ve ödeme sistemi

Bütün hesaplar `js/hesap.js` içindeki `FIYAT` bloğundan çalışır: gecelik ve gündüz ücreti, 15.00 sınırı, köpek, gece ve kreş indirimleri, ödeme sayfasındaki −%5 / +%20 ayarı. Bazı rakamlar sayfalarda düz yazı olarak da geçer (konaklama ve ücret sayfasındaki indirim satırları, "2026 boyunca sabit", fiyat geçmişi tablosu); fiyat değişince onlar da elle güncellenir. Ayrıntılı çalışma dosyası: https://claude.ai/artifact/K44dQGpXiZu4YuAqFWQL21

Her değişiklikten sonra uçtan uca test: depo klasöründe `python3 -m http.server 8767` açıkken `python3 _testler/hesap_testi.py` (19 Kasım 2026: 66/66).

## Panel

mehmetcihatkeles.com/panel: yalnızca Mehmet için, arama motorlarına kapalı (robots.txt ve noindex) paylaşım paneli. Sayfaların listesi panel/index.html içindeki G nesnesinde; yeni bir sayfa eklenince oraya bir satır eklenir. Tarihten Köpekler'in en yeni yazısını articles.json'dan kendisi bulur. Ana ekrana eklenebilir (panel/manifest.webmanifest).

## Talep bildirimi

Ön rezervasyon ve tanışma formları Google Form'a, oradan Drive'daki "Site talepleri · mehmetcihatkeles.com" tablosuna düşer. Tabloya bağlı "Talep bildirimi" adlı Apps Script (Uzantılar → Apps Script) her yeni satırda cihatk@gmail.com'a "Yeni talep · Ad Soyad · …" başlıklı bir e-posta yollar: ad, telefon, köpek, tarihler, ayrıntılar ve hazır mesajla WhatsApp'ı açan "WhatsApp'ta yanıtla" düğmesi. Kodun bir kopyası _bildirim/talep-bildirimi.gs; değişiklik önce orada yapılır, sonra Apps Script'e yapıştırılır. kur() tetikleyiciyi ve iki takvimi kurar, sonTalebiGonder() son talep için bildirimi yeniden yollar.

Gmail kendinize gönderilen e-postada ses çıkarmadığı için (ve Google Formlar'ın kendi bildirimi Gmail'de gelen kutusuna düşmediği için) telefonu öttüren şey takvim: her talepte kırmızı "Site talepleri" takviminde iki dakika sonrasına, 0 dakikalık hatırlatmalı kısa bir kayıt açılır; temizle() her gece 03.00 civarı önceki günlerin bu kayıtlarını siler. E-postada ve bu kayıtta "WhatsApp'ta yanıtla" ve "Takvime işle" bağlantıları var. "Takvime işle" bir web uygulamasıdır (Dağıt → Dağıtımları yönet; Çalıştıran: Mehmet, Erişim: yalnızca Mehmet; adres koddaki WEB_URL): imzalı bağlantıyla açılınca gündüz günlerini ayrı ayrı, konaklamayı bırakış–alış arası tek şerit olarak yeşil "Misafirler" takvimine tüm gün kaydı yazar ve tablonun H sütununa "Takvime işlendi" damgası basar; ikinci dokunuşta yeniden yazmaz. Tanışma taleplerinde gün olmadığı için yalnız WhatsApp bağlantısı vardır. doGet değişirse aynı dağıtıma yeni sürüm verilir (adres değişmez); öteki işlevler kaydedilir kaydedilmez geçerlidir. Hazır mesajlar: gündüz misafirliği ve konaklama "… tarihlerindeki … talebinizi aldım. Görüşmek üzere.", tanışma "… tanışma talebinizi aldım. Uygun bir günü birlikte belirlemek için sizi arayacağım." Hitap ("Özge Hanım / Ali Bey") sık kullanılan adlardan tahmin edilir, tahmin edilemezse yalnız ad yazılır.

## Hızlı kapı (tanıyan aileler için)

Her sayfanın başında, Menü'nün yanında sarı "Planla" düğmesi var (/planla/: gündüz misafirliği, konaklama, ödeme, tanışma). Ana sayfanın en üstünde de "Gündüz misafirliği planla" ve "Konaklama planla" düğmeleri ile Ödeme ve Ücreti hesapla bağlantıları duruyor. Gündüz misafirliği /on-rezervasyon/?tur=gunduz adresine gider: form yalnız "Getireceğiniz gün"ü sorar, alınacak gün aynı gün sayılır, başka günler "+ Bir gün daha ekle" ile eklenir. Başlıktaki düğme build.py şablonunda da var; yeni sayfalara kendiliğinden gelir.
