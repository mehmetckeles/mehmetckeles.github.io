/*
 * Site talepleri · anında bildirim
 * "Site talepleri · mehmetcihatkeles.com" tablosuna bağlı Apps Script.
 * Formdan yeni bir talep düştüğünde Mehmet'e e-posta gönderir: kişinin adı,
 * köpeği, tarihleri ve hazır mesajla açılan "WhatsApp'ta yanıtla" düğmesi.
 *
 * Ayrıca "Site talepleri" takviminde anında bir hatırlatma açar (telefon öter; ertesi gece silinir) ve
 * tek dokunuşla günleri "Misafirler" takvimine yazan "Takvime işle" bağlantısı verir.
 *
 * Kurulum: Uzantılar → Apps Script → bu dosyayı yapıştır → kur() çalıştır →
 *   Dağıt → Yeni dağıtım → Web uygulaması (Çalıştıran: ben, Erişim: yalnızca ben).
 * Deneme: sonTalebiGonder() tablodaki son talep için bildirimi yeniden yollar.
 */

var AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

var KADIN = ('ayşe fatma emine hatice zeynep elif merve büşra esra özge özlem gamze gizem derya ebru ece eda ela elçin '+
  'esin ezgi gül gülay gülşen hande hülya ipek irem kübra leyla melek melike meltem merve nazlı neslihan nihan nil nilay '+
  'nilüfer nur nuray nurcan pelin pınar rabia seda selin selma serap sevgi sevil sevim sibel sinem şeyma şule tuba tuğba '+
  'tülay yasemin yeşim zehra zerrin aslı aysun aylin aynur bahar banu başak berna betül beyza burcu canan cansu ceren cemre '+
  'damla defne dilek dilara didem duygu dilan ecem elvan emel esma feride figen filiz funda gonca gökçe hilal ilknur ilayda '+
  'işıl kader lale mine mehtap müge naz nazan nermin nesrin oya özden reyhan rukiye sema semra serpil sevda songül şebnem '+
  'şirin tuğçe türkan yağmur yıldız zuhal açelya aleyna arzu asena aybike aysel azra bengü berrak buse cennet çiğdem '+
  'ece elanur fadime feyza gülsüm hacer hale havva jale kevser lerzan mediha nalan necla nergis nevin perihan saadet sanem '+
  'selda serra simge sude şenay tijen ümran yeliz zübeyde melis melisa beril bilge ayten aynur ayşegül ebrar ilknur gülsen').split(' ');

var ERKEK = ('ahmet mehmet mustafa ali hüseyin hasan ibrahim ismail osman yusuf murat ömer ramazan halil süleyman abdullah '+
  'mahmut recep salih fatih kadir emre burak serkan kemal cem can onur tolga volkan erkan erdem ercan erhan ozan oğuz orhan '+
  'okan hakan kaan kerem koray kubilay levent metin mert mesut necati nihat nuri orçun serdar sinan tuncay tarık tamer '+
  'taner tayfun uğur ufuk yavuz yasin yiğit yunus zafer bülent cengiz cihan cihat çağlar çağatay doğan engin enes eren '+
  'ertuğrul faruk ferhat furkan gökhan güven harun ilker ilhan kenan kürşat batuhan baran barış berk berkay bora caner '+
  'emir emirhan erol ersin göktuğ görkem hamza hikmet ilyas kamil kazım koray mehmetcan muhammed musa nazım oktay özgür '+
  'rıza sami sedat selim semih sercan şahin şükrü tahsin turgut tuncer turan utku vedat veli yalçın yılmaz zeki adem '+
  'alper arda atakan aydın bekir burhan cüneyt dursun egemen eyüp ferdi gürkan hilmi ihsan irfan kutay mithat nedim '+
  'necip nevzat oğuzhan önder rüştü sadık sait sefa selçuk sertaç tufan ümit taylan yasir yener').split(' ');

var TAKVIM_BILDIRIM = 'Site talepleri';
var TAKVIM_MISAFIR = 'Misafirler';
var SUTUN_TAKVIM = 8; // H sütunu: "Takvime işlendi" damgası
// "Takvime işle" web uygulamasının adresi (Dağıt → Dağıtımları yönet). doGet değişirse aynı dağıtıma yeni sürüm verilir.
var WEB_URL = 'https://script.google.com/macros/s/AKfycbzMsFg2F_QOtQ-WPgHzruVZZfko1cSL3pE_WgezOQSErTZiNLHieQbFsgXsG4VsBlm3/exec';

function kur() {
  var ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['talepGeldi', 'temizle'].indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('talepGeldi').forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger('temizle').timeBased().everyDays(1).atHour(3).inTimezone('Europe/Istanbul').create();
  takvim(TAKVIM_BILDIRIM, '#d50000');
  takvim(TAKVIM_MISAFIR, '#0b8043');
  anahtar();
  var sayfa = ss.getSheets()[0];
  if (!sayfa.getRange(1, SUTUN_TAKVIM).getValue()) sayfa.getRange(1, SUTUN_TAKVIM).setValue('Takvim');
  konuSekmesi(ss);
}

function talepGeldi(e) {
  var sayfa = e && e.range ? e.range.getSheet() : SpreadsheetApp.getActive().getSheets()[0];
  var satir = e && e.range ? e.range.getRow() : sayfa.getLastRow();
  satiriGonder(sayfa, satir);
}

function sonTalebiGonder() {
  var sayfa = SpreadsheetApp.getActive().getSheets()[0];
  satiriGonder(sayfa, sayfa.getLastRow());
}

function satiriGonder(sayfa, satir) {
  var v = sayfa.getRange(satir, 1, 1, 7).getDisplayValues()[0];
  var t = talepOku(v);
  t.isleLink = isleLinki(t, satir);
  var b = bildirim(t, sayfa.getParent().getUrl());
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: b.konu,
    body: b.duz,
    htmlBody: b.html,
    name: 'Site talepleri'
  });
  hatirlat(t, b);
  if (t.cesit === 'uyum') konuKaydet(sayfa.getParent(), v);
}

/* ---------- köpekle ilgili konu formları: ayrı sekmede, her soru bir sütun ---------- */

var KONU_SEKME = 'Konu formları';
var KONU_SUTUN = [
  ['Geldiği an', null], ['Ad', null], ['Telefon', null], ['Köpek', null],
  ['Ne zamandır sizinle', 'Köpek ne zamandır sizinle'], ['En çok zorlayan', 'En çok zorlayan'],
  ['İşaretlenen konular', 'İşaretlenen konular'], ['Sıklık', 'Sıklık'], ['Şiddet', 'Şiddet'],
  ['İlk ne zaman fark edildi', 'İlk ne zaman fark edildi'], ['Son aylarda gidişat', 'Son aylarda gidişat'],
  ['Sahibini yorması', 'Sahibini yorması'], ['Denenenler', 'Denenenler'], ['Kiminle oluyor', 'Kiminle oluyor'],
  ['Günlük düzeni değiştirebilme', 'Günlük düzeni değiştirebilme'], ['Doldurma süresi (sn)', 'Doldurma süresi'],
  ['Anlattıkları', '#anlatti'], ['Okuma', '#okuma'], ['Telefonda ilk soru', 'Telefonda ilk soru'],
  ['Gösterilen düşünüş', 'Gösterilen düşünüş']
];
var KONU_DEGERLENDIRME = ['Görüşme tarihi', 'Telefonda ne çıktı', 'Form ne kadar yansıttı (0–10)', 'Okuma tuttu mu', 'Köpeği görünce', 'Notlar'];

function konuSekmesi(ss) {
  var sh = ss.getSheetByName(KONU_SEKME);
  if (!sh) {
    sh = ss.insertSheet(KONU_SEKME);
    var bas = KONU_SUTUN.map(function (k) { return k[0]; }).concat(KONU_DEGERLENDIRME);
    sh.getRange(1, 1, 1, bas.length).setValues([bas]).setFontWeight('bold');
    sh.getRange(1, KONU_SUTUN.length + 1, 1, KONU_DEGERLENDIRME.length).setBackground('#fff8c4');
    sh.setFrozenRows(1); sh.setFrozenColumns(2);
  }
  return sh;
}

function konuAyikla(v) {
  var metin = String(v[6]), satirlar = metin.split('\n'), d = {}, okuma = [], anlatti = [], bolum = '';
  satirlar.forEach(function (l) {
    if (l === 'OKUMA') { bolum = 'okuma'; return; }
    if (l === 'Anlattıkları:') { bolum = 'anlatti'; return; }
    if (bolum === 'anlatti') { if (/^OKUMA$/.test(l)) { bolum = 'okuma'; return; } if (l !== '' || anlatti.length) anlatti.push(l); return; }
    if (bolum === 'okuma' && /^· /.test(l)) { okuma.push(l.slice(2)); return; }
    var m = l.match(/^([^:(]+?)(?:\s*\([^)]*\))?:\s*(.*)$/);
    if (m) d[m[1].trim()] = m[2].trim();
  });
  d['#okuma'] = okuma.join('\n');
  d['#anlatti'] = anlatti.join('\n').trim();
  return d;
}

function konuKaydet(ss, v) {
  var sh = konuSekmesi(ss), d = konuAyikla(v);
  var son = sh.getLastRow();
  if (son > 1) {
    var var_ = sh.getRange(2, 1, son - 1, 3).getDisplayValues();
    if (var_.some(function (r) { return r[0] === v[0] && r[2] === v[3]; })) return;
  }
  var sayi = function (x) { var m = String(x || '').match(/^(\d+)\/10$/); return m ? +m[1] : (x || ''); };
  var satir = KONU_SUTUN.map(function (k, i) {
    if (i === 0) return v[0]; if (i === 1) return v[2]; if (i === 2) return "'" + v[3]; if (i === 3) return v[4];
    var x = d[k[1]] || ''; if (k[1] === 'Doldurma süresi') x = String(x).replace(/\s*sn$/, '');
    return sayi(x);
  });
  sh.appendRow(satir);
}

/* Bir kez: ana sekmedeki eski konu formlarını yeni sekmeye taşır (tekrar yazmaz). */
function konuFormlariniDoldur() {
  var ss = SpreadsheetApp.getActive(), ana = ss.getSheets()[0];
  var v = ana.getRange(2, 1, Math.max(ana.getLastRow() - 1, 0), 7).getDisplayValues();
  v.forEach(function (r) { if (/^uyum/i.test(r[1])) konuKaydet(ss, r); });
}

/* ---------- takvim ---------- */

function takvim(ad, renk) {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty('takvim:' + ad);
  var c = id ? CalendarApp.getCalendarById(id) : null;
  if (!c) {
    var bul = CalendarApp.getOwnedCalendarsByName(ad);
    c = bul.length ? bul[0] : CalendarApp.createCalendar(ad, { color: renk, timeZone: 'Europe/Istanbul' });
    p.setProperty('takvim:' + ad, c.getId());
  }
  return c;
}

function anahtar() {
  var p = PropertiesService.getScriptProperties();
  var k = p.getProperty('anahtar');
  if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('anahtar', k); }
  return k;
}

function imza(satir) {
  var b = Utilities.computeHmacSha256Signature(String(satir), anahtar());
  return Utilities.base64EncodeWebSafe(b).slice(0, 16);
}

function isleLinki(t, satir) {
  var gunVar = (t.cesit === 'gunduz' && t.gunler && t.gunler.length) || (t.cesit === 'konaklama' && t.giris && t.cikis);
  if (!gunVar) return '';
  return WEB_URL + '?s=' + satir + '&k=' + imza(satir);
}

/* Talep gelir gelmez: "Site talepleri" takviminde iki dakika sonrasına kısa bir kayıt; telefon takvimin sesiyle uyarır. */
function hatirlat(t, b) {
  var bas = new Date(Date.now() + 2 * 60 * 1000);
  var son = new Date(bas.getTime() + 15 * 60 * 1000);
  // Takvim açıklamada HTML bağlantıyı gösterir: uzun adresler yerine iki kısa, dokunulabilir satır.
  var baglantilar = [t.wa ? '<a href="' + b.link + '">WhatsApp\'ta yanıtla</a>' : 'Telefon okunamadı: ' + esc(t.tel)];
  if (t.isleLink) baglantilar.push('<a href="' + t.isleLink + '">Takvime işle</a>');
  var bilgi = ['Telefon: ' + t.tel, 'Köpek: ' + t.kopek, 'Tarihler: ' + t.tarihler];
  if (t.ayrinti) bilgi.push(t.ayrinti);
  var acik = esc(b.metin) + '<br><br>' + baglantilar.join('<br>') + '<br><br>' + esc(bilgi.join('\n')).replace(/\n/g, '<br>');
  var ev = takvim(TAKVIM_BILDIRIM, '#d50000').createEvent(b.konu, bas, son, { description: acik });
  ev.removeAllReminders();
  ev.addPopupReminder(0);
}

/* Her gece 03.00 civarı: "Site talepleri" takvimindeki önceki günlerin hatırlatmalarını siler.
   Talebin kendisi e-postada ve tabloda kalır; "Misafirler" takvimine dokunulmaz. */
function temizle() {
  var bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  var bas = new Date(bugun.getTime() - 60 * 24 * 60 * 60 * 1000);
  takvim(TAKVIM_BILDIRIM, '#d50000').getEvents(bas, bugun).forEach(function (ev) {
    if (ev.getEndTime() <= bugun) ev.deleteEvent();
  });
}

function gunTarihi(d) { return new Date(d.y, d.a - 1, d.g); }

/* "Takvime işle" bağlantısı: yalnızca Mehmet'in hesabıyla açılır (web uygulaması, erişim: yalnızca ben). */
function doGet(e) {
  if (e.parameter.misafir) return misafirlerJson();
  if (e.parameter.profil) return profilJson(String(e.parameter.profil));
  var satir = parseInt(e.parameter.s, 10);
  if (!satir || e.parameter.k !== imza(satir)) return sayfaYaz('Bağlantı geçersiz', 'Bu bağlantı tanınmadı.');
  var sayfa = SpreadsheetApp.getActive().getSheets()[0];
  var damga = sayfa.getRange(satir, SUTUN_TAKVIM).getDisplayValue();
  var t = talepOku(sayfa.getRange(satir, 1, 1, 7).getDisplayValues()[0]);
  var kim = (t.kopekAdi || 'Köpek') + ' · ';
  if (damga) return sayfaYaz('Zaten işlenmiş', t.adSoyad + ' talebi daha önce takvime işlenmiş (' + damga + ').');
  var c = takvim(TAKVIM_MISAFIR, '#0b8043');
  var acik = [t.adSoyad, 'Telefon: ' + t.tel, 'Köpek: ' + t.kopek, t.ayrinti].join('\n');
  var yazilan;
  if (t.cesit === 'gunduz' && t.gunler && t.gunler.length) {
    t.gunler.forEach(function (d) { c.createAllDayEvent(kim + 'gündüz · ' + t.adSoyad, gunTarihi(d), { description: acik }); });
    yazilan = liste(t.gunler.map(function (d) { return tarihYaz(d, t.buYil); })) + ' (' + t.gunler.length + ' gün, gündüz misafirliği)';
  } else if (t.cesit === 'konaklama' && t.giris && t.cikis) {
    var bitis = gunTarihi(t.cikis); bitis.setDate(bitis.getDate() + 1);
    c.createAllDayEvent(kim + 'konaklama · ' + t.adSoyad, gunTarihi(t.giris), bitis, { description: acik });
    yazilan = tarihYaz(t.giris, t.buYil) + ' – ' + tarihYaz(t.cikis, t.buYil) + ' (konaklama)';
  } else {
    return sayfaYaz('Tarih yok', 'Bu talepte takvime yazılacak belli bir gün yok.');
  }
  sayfa.getRange(satir, SUTUN_TAKVIM).setValue('Takvime işlendi · ' + Utilities.formatDate(new Date(), 'Europe/Istanbul', 'dd.MM.yyyy HH:mm'));
  return sayfaYaz('Takvime işlendi', t.adSoyad + ' · ' + (t.kopekAdi || '') + '<br>' + esc(yazilan) + '<br><br>"Misafirler" takviminde.');
}

function sayfaYaz(baslik, metin) {
  var html = '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:460px;margin:12vh auto;padding:0 22px;color:#1a1a1a">' +
    '<h1 style="font-size:26px;margin:0 0 14px">' + esc(baslik) + '</h1>' +
    '<p style="font-size:18px;line-height:1.5;margin:0">' + metin + '</p></div>';
  return HtmlService.createHtmlOutput(html).setTitle(baslik);
}

/* ---------- talebi okuma ---------- */

function kucuk(s) { return String(s).replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase(); }
function buyukBas(s) {
  s = kucuk(s);
  var ilk = s.charAt(0);
  ilk = ilk === 'i' ? 'İ' : (ilk === 'ı' ? 'I' : ilk.toUpperCase());
  return ilk + s.slice(1);
}
function kelimeler(s) { return String(s).trim().split(/\s+/).filter(Boolean).map(buyukBas).join(' '); }

function hitap(adSoyad) {
  var ad = kelimeler(adSoyad).split(' ')[0] || '';
  if (!ad) return 'Merhaba';
  var k = kucuk(ad);
  if (KADIN.indexOf(k) > -1) return 'Merhaba ' + ad + ' Hanım';
  if (ERKEK.indexOf(k) > -1) return 'Merhaba ' + ad + ' Bey';
  return 'Merhaba ' + ad;
}

function kopekAdi(s) {
  var parca = String(s).split(/[,(\/;:\-–]/)[0].trim();
  if (!parca) return '';
  if (/\s(ve|&|ile)\s/i.test(' ' + parca + ' ')) return kelimeler(parca).replace(/ (Ve|İle) /g, function (m) { return kucuk(m); });
  return buyukBas(parca.split(/\s+/)[0]);
}

function tarihCoz(s) {
  var m = String(s).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return m ? { g: +m[1], a: +m[2], y: +m[3] } : null;
}
function tarihYaz(d, buYil) {
  return d.g + ' ' + AYLAR[d.a - 1] + (d.y !== buYil ? ' ' + d.y : '');
}
function liste(arr) {
  if (arr.length < 2) return arr.join('');
  return arr.slice(0, -1).join(', ') + ' ve ' + arr[arr.length - 1];
}

function telefon(s) {
  var r = String(s).replace(/\D/g, '');
  if (/^0\d{10}$/.test(r)) r = '9' + r;
  else if (/^5\d{9}$/.test(r)) r = '90' + r;
  return r.length >= 11 ? r : '';
}

function talepOku(v) {
  var t = { zaman: v[0], tur: v[1], adSoyad: kelimeler(v[2]), tel: v[3], kopek: v[4], tarihler: v[5], ayrinti: v[6] };
  var buYil = new Date().getFullYear();
  var ham = String(v[5]);
  t.kopekAdi = kopekAdi(v[4]);
  t.hitap = hitap(v[2]);
  t.wa = telefon(v[3]);
  if (/^uyum/i.test(t.tur)) {
    t.cesit = 'uyum';
    t.konu = ham.replace(/^Konu:\s*/, '');
  } else if (/^tan[ıi]şma/i.test(t.tur)) {
    t.cesit = 'tanisma';
  } else if (/^g[üu]nd[üu]z/i.test(ham)) {
    t.cesit = 'gunduz';
    t.gunler = (ham.match(/\d{1,2}\.\d{1,2}\.\d{4}/g) || []).map(tarihCoz);
  } else {
    var iki = ham.split(/→|->/);
    t.cesit = 'konaklama';
    t.giris = tarihCoz(iki[0]);
    t.cikis = iki[1] ? tarihCoz(iki[1]) : null;
  }
  t.buYil = buYil;
  return t;
}

/* ---------- mesaj ---------- */

function whatsappMetni(t) {
  var icin = t.kopekAdi ? t.kopekAdi + ' için ' : '';
  if (t.cesit === 'uyum') {
    return t.hitap + ', ' + (t.kopekAdi ? t.kopekAdi + ' hakkında ' : '') + 'yazdıklarınızı aldım. Okuyup üzerine düşüneceğim, sonra sizi arayacağım.';
  }
  if (t.cesit === 'tanisma') {
    return t.hitap + ', ' + icin + 'tanışma talebinizi aldım. Uygun bir günü birlikte belirlemek için sizi arayacağım.';
  }
  if (t.cesit === 'gunduz' && t.gunler && t.gunler.length) {
    var g = t.gunler.map(function (d) { return tarihYaz(d, t.buYil); });
    return t.hitap + ', ' + icin + liste(g) + (g.length > 1 ? ' tarihlerindeki' : ' tarihindeki') +
      ' gündüz misafirliği talebinizi aldım. Görüşmek üzere.';
  }
  if (t.cesit === 'konaklama' && t.giris && t.cikis) {
    return t.hitap + ', ' + icin + tarihYaz(t.giris, t.buYil) + ' – ' + tarihYaz(t.cikis, t.buYil) +
      ' tarihlerindeki konaklama talebinizi aldım. Görüşmek üzere.';
  }
  return t.hitap + ', ' + icin + 'ön rezervasyon talebinizi aldım. Görüşmek üzere.';
}

function ozet(t) {
  if (t.cesit === 'uyum') return 'Köpekle ilgili konu' + (t.konu ? ' · ' + t.konu : '');
  if (t.cesit === 'tanisma') return 'Tanışma';
  if (t.cesit === 'gunduz') {
    var n = t.gunler ? t.gunler.length : 0;
    return 'Gündüz misafirliği' + (n ? ', ' + n + ' gün' : '');
  }
  if (t.giris && t.cikis) return 'Konaklama, ' + tarihYaz(t.giris, t.buYil) + ' – ' + tarihYaz(t.cikis, t.buYil);
  return 'Ön rezervasyon';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bildirim(t, tabloUrl) {
  var metin = whatsappMetni(t);
  var link = t.wa ? 'https://wa.me/' + t.wa + '?text=' + encodeURIComponent(metin) : '';
  var deneme = /deneme/i.test(t.tur + ' ' + t.adSoyad) ? 'Deneme · ' : '';
  var konu = deneme + 'Yeni talep · ' + (t.adSoyad || 'İsimsiz') + ' · ' + ozet(t);

  var satirlar = [
    ['Tür', t.tur], ['Ad', t.adSoyad], ['Telefon', t.tel], ['Köpek', t.kopek],
    ['Tarihler', t.tarihler], ['Ayrıntılar', t.ayrinti], ['Geldiği an', t.zaman]
  ].filter(function (r) { return String(r[1]).trim(); });

  var duz = konu + '\n\n' + satirlar.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') +
    '\n\nHazır yanıt:\n' + metin + (link ? '\n\nWhatsApp\'ta yanıtla: ' + link : '') + (t.isleLink ? '\nTakvime işle: ' + t.isleLink : '') + '\n\nTablo: ' + tabloUrl;

  var tr = satirlar.map(function (r) {
    var deger = r[0] === 'Telefon' && t.wa
      ? '<a href="tel:+' + t.wa + '" style="color:#1a1a1a">' + esc(r[1]) + '</a>'
      : esc(r[1]).replace(/\n/g, '<br>');
    return '<tr><td style="padding:6px 14px 6px 0;color:#777;vertical-align:top;white-space:nowrap">' + r[0] +
      '</td><td style="padding:6px 0;color:#1a1a1a">' + deger + '</td></tr>';
  }).join('');

  var dugme = link
    ? '<a href="' + link + '" style="display:inline-block;background:#1f8f4e;color:#fff;text-decoration:none;' +
      'font-weight:600;font-size:17px;padding:14px 26px;border-radius:10px">WhatsApp\'ta yanıtla</a>'
    : '<p style="color:#a33">Telefon numarası okunamadı; yanıtı elle göndermek gerekiyor.</p>';

  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.5;max-width:560px">' +
    '<p style="margin:0 0 4px;color:#777;font-size:13px">' + esc(deneme) + 'mehmetcihatkeles.com · yeni talep</p>' +
    '<h2 style="margin:0 0 16px;font-size:21px;color:#1a1a1a">' + esc(t.adSoyad || 'İsimsiz') + ' · ' + esc(ozet(t)) + '</h2>' +
    '<table style="border-collapse:collapse;margin:0 0 20px">' + tr + '</table>' +
    '<p style="margin:0 0 6px;color:#777;font-size:13px">Hazır yanıt</p>' +
    '<div style="background:#f3f1ea;border-radius:10px;padding:12px 14px;margin:0 0 18px;color:#1a1a1a">' + esc(metin) + '</div>' +
    dugme + (t.isleLink ? ' &nbsp; <a href="' + t.isleLink + '" style="display:inline-block;background:#fff;color:#0b8043;' +
      'border:2px solid #0b8043;text-decoration:none;font-weight:600;font-size:17px;padding:12px 22px;border-radius:10px">Takvime işle</a>' : '') +
    '<p style="margin:22px 0 0;font-size:13px;color:#777">WhatsApp düğmesi bu mesajla açar; göndermeden önce değiştirebilirsiniz.' +
    (t.isleLink ? ' Takvime işle, günleri "Misafirler" takvimine yazar. ' : ' ') +
    '<a href="' + tabloUrl + '" style="color:#777">Tüm talepler</a></p>' +
    '</div>';

  return { konu: konu, duz: duz, html: html, metin: metin, link: link };
}


/* ---------- Sitedeki "Bugünkü misafirlerimiz" ----------
   "Misafirler" takviminden bugünün köpeklerini okur; yalnızca köpeğin adı ve kaç gün kalacağı çıkar
   (aile adı, telefon, tarih çıkmaz). Başlığı "İPTAL" ile başlayan ya da içinde "gizli" geçen kayıtlar görünmez.
   Aynı köpek iki kez yazılmışsa bir kez sayılır. 10 dakika önbellekte tutulur.
   Site bunu ayrı bir dağıtımla okur: Dağıt → Yeni dağıtım → Web uygulaması, Çalıştıran: ben, Erişim: Herkes.
   (Takvime işle bağlantıları imza ister; herkese açık dağıtım onları açmaz.) */
function misafirlerJson() {
  var on = CacheService.getScriptCache(), k = 'misafirler5-' + Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyyMMdd');
  var veri = on.get(k);
  if (!veri) {
    veri = JSON.stringify(bugunkuMisafirler());
    on.put(k, veri, 600);
  }
  return ContentService.createTextOutput(veri).setMimeType(ContentService.MimeType.JSON);
}

function bugunkuMisafirler() {
  var c = CalendarApp.getCalendarsByName(TAKVIM_MISAFIR)[0];
  if (!c) return { misafirler: [] };
  var bugun = new Date(Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyy-MM-dd') + 'T12:00:00');
  var gorulen = {}, liste = [];
  c.getEventsForDay(bugun).forEach(function (ev) {
    var baslik = ev.getTitle() || '';
    if (/^\s*İPTAL/i.test(baslik) || /gizli/i.test(baslik) || !ev.isAllDayEvent()) return;
    var parca = baslik.split('·').map(function (x) { return x.trim(); });
    var ad = parca[0];
    if (!ad || gorulen[ad.toLocaleLowerCase()]) return;
    gorulen[ad.toLocaleLowerCase()] = 1;
    var bas = ev.getAllDayStartDate(), son = ev.getAllDayEndDate();   // son: ertesi gün (hariç)
    var gun = function (d) { return Math.round((new Date(Utilities.formatDate(d, 'Europe/Istanbul', 'yyyy-MM-dd') + 'T12:00:00') - bugun) / 864e5); };
    var kalan = gun(son) - 1;   // bugünden sonra kaç gün daha (0: bugün gidiyor)
    var tek = gun(son) - gun(bas) <= 1;   // tek günlük kayıt: gündüz misafirliği
    var tur = ((parca[1] || '').indexOf('gündüz') === 0 || tek) ? 'gunduz' : 'konaklama';
    // açıklamadaki "Renk: …" ve "Boy: …" satırları (yalnız bu iki bilgi siteye çıkar)
    var acik = ev.getDescription() || '', kayit = { ad: ad, tur: tur, kalan: kalan, yeni: gun(bas) === 0 };
    var r = acik.match(/(?:^|\n|<br>)\s*renk\s*:\s*([^\n<]+)/i), b = acik.match(/(?:^|\n|<br>)\s*boy\s*:\s*([^\n<]+)/i);
    if (r) kayit.renk = renkAdi(r[1]);
    if (b) kayit.boy = boyAdi(b[1]);
    var km = acik.match(/(?:^|\n|<br>)\s*kimlik\s*:\s*([^\n<]+)/i);
    kayit._kimlik = km ? sade(km[1]) : null;
    kayit._bas = Utilities.formatDate(bas, 'Europe/Istanbul', 'yyyy-MM-dd');
    liste.push(kayit);
  });
  try { gelisSayilari(c, liste); } catch (hata) { console.log('geliş sayısı: ' + hata); }
  liste.forEach(function (x) { delete x._kimlik; delete x._bas; });
  return { tarih: Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyy-MM-dd'), misafirler: liste };
}

function sade(x) { return String(x).toLocaleLowerCase('tr').replace(/[çğışöü]/g, function (c) { return { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ş': 's', 'ö': 'o', 'ü': 'u' }[c]; }).replace(/\s+/g, ' ').trim(); }
function renkAdi(x) {
  var t = sade(x);
  if (/beyaz/.test(t) && /siyah/.test(t)) return 'beyaz-siyah';
  var l = ['kahverengi', 'beyaz', 'siyah', 'gri', 'sari', 'krem', 'kizil'];
  for (var i = 0; i < l.length; i++) if (t.indexOf(l[i]) > -1) return l[i];
  if (/kahve/.test(t)) return 'kahverengi';
  if (/altin|golden/.test(t)) return 'sari';
  return undefined;
}
function boyAdi(x) { var t = sade(x); return /kucuk|mini|minik/.test(t) ? 'kucuk' : /buyuk|iri/.test(t) ? 'buyuk' : /orta/.test(t) ? 'orta' : undefined; }

/* ---------- Kaçıncı gelişi ----------
   Geçmiş (Ocak 2022 – Ekim 2026) bu tablonun "Misafir geçmişi" sekmesinde: bir köpek bir satır,
   gelişleri "Tarihler" sütununda (yyaagg, sonda g = gündüz). "Takma adlar" sekmesi farklı yazımları
   aynı köpeğe bağlar (Dobi → dobby). 1 Kasım 2026'dan sonrası doğrudan "Misafirler" takviminden sayılır.
   Aynı adlı iki farklı köpek için takvim açıklamasına "Kimlik: maya-jack" gibi bir satır yazılır.
   Siteye yalnızca sayı ve ilk gelişin ayı çıkar. */
var GECMIS_SEKME = 'Misafir geçmişi', TAKMA_SEKME = 'Takma adlar', GECMIS_SON = '2026-11-01';
function gelisSayilari(takvim, liste) {
  var ss = SpreadsheetApp.getActive(), takma = {}, gecmis = {};
  var t = ss.getSheetByName(TAKMA_SEKME);
  if (t) t.getDataRange().getValues().slice(1).forEach(function (r) { if (r[0]) takma[sade(r[0])] = sade(r[1]); });
  var g = ss.getSheetByName(GECMIS_SEKME);
  if (g) g.getDataRange().getValues().slice(1).forEach(function (r) {
    if (!r[0]) return;
    gecmis[sade(r[0])] = String(r[5]).replace(/^'/, '').split(/\s+/).filter(String).map(function (x) {
      return '20' + x.slice(0, 2) + '-' + x.slice(2, 4) + '-' + x.slice(4, 6);
    });
  });
  var kimlikBul = function (ad, acik) {
    var km = (acik || '').match(/(?:^|\n|<br>)\s*kimlik\s*:\s*([^\n<]+)/i), k = km ? sade(km[1]) : sade(ad);
    return takma[k] || k;
  };
  // 1 Kasım 2026'dan bugüne Misafirler takvimindeki kayıtlar (iptaller hariç, aynı gün iki kez yazılmışsa bir)
  var yeni = {}, bugun = new Date();
  takvim.getEvents(new Date(GECMIS_SON + 'T00:00:00+03:00'), new Date(bugun.getTime() + 864e5)).forEach(function (ev) {
    var baslik = ev.getTitle() || '';
    if (/^\s*İPTAL/i.test(baslik) || !ev.isAllDayEvent()) return;
    var k = kimlikBul(baslik.split('·')[0].trim(), ev.getDescription());
    var gun = Utilities.formatDate(ev.getAllDayStartDate(), 'Europe/Istanbul', 'yyyy-MM-dd');
    (yeni[k] = yeni[k] || {})[gun] = 1;
  });
  liste.forEach(function (x) {
    var k = x._kimlik ? (takma[x._kimlik] || x._kimlik) : kimlikBul(x.ad, '');
    var tarihler = (gecmis[k] || []).filter(function (d) { return d < GECMIS_SON; })
      .concat(Object.keys(yeni[k] || {}).filter(function (d) { return d <= x._bas; }));
    tarihler = tarihler.filter(function (d, i, a) { return a.indexOf(d) === i; }).sort();
    if (tarihler.indexOf(x._bas) < 0) tarihler.push(x._bas);
    x.gelis = tarihler.filter(function (d) { return d <= x._bas; }).length;
    x.ilk = tarihler[0].slice(0, 7);
    x.kimlik = k;
  });
}

/* ---------- Köpek profili ----------
   ?profil=kaju — sitedeki /kopek/ sayfası bunu herkese açık dağıtımdan okur. Çıkan: köpeğin adı, bugüne kadarki
   gelişlerin tarihi ve kaç gece sürdüğü, toplamlar. Aile adı, telefon ve ileri tarihli kayıtlar çıkmaz.
   Geçmiş: "Misafir geçmişi" (Tarihler + Geceler sütunları); 1 Kasım 2026'dan sonrası "Misafirler" takvimi. */
function profilVerisi(istek) {
  var ss = SpreadsheetApp.getActive(), takma = {}, k = sade(istek);
  var t = ss.getSheetByName(TAKMA_SEKME);
  if (t) t.getDataRange().getValues().slice(1).forEach(function (r) { if (r[0]) takma[sade(r[0])] = sade(r[1]); });
  k = takma[k] || k;
  var ad = '', gelisler = {};
  var g = ss.getSheetByName(GECMIS_SEKME);
  if (g) g.getDataRange().getValues().slice(1).forEach(function (r) {
    if (sade(r[0]) !== k) return;
    ad = r[1];
    var tar = String(r[5]).replace(/^'/, '').split(/\s+/).filter(String), gece = String(r[6] || '').split(/\s+/);
    tar.forEach(function (x, i) {
      var gun = '20' + x.slice(0, 2) + '-' + x.slice(2, 4) + '-' + x.slice(4, 6);
      if (gun >= GECMIS_SON) return;
      var n = /g$/.test(x) ? 0 : (parseInt(gece[i], 10) || 1);
      gelisler[gun] = { gun: gun, gece: n, tur: n ? 'konaklama' : 'gunduz' };
    });
  });
  var c = CalendarApp.getCalendarsByName(TAKVIM_MISAFIR)[0];
  if (c) c.getEvents(new Date(GECMIS_SON + 'T00:00:00+03:00'), new Date(Date.now() + 400 * 864e5)).forEach(function (ev) {
    var baslik = ev.getTitle() || '';
    if (/^\s*İPTAL/i.test(baslik) || !ev.isAllDayEvent()) return;
    var parca = baslik.split('·').map(function (x) { return x.trim(); });
    var km = (ev.getDescription() || '').match(/(?:^|\n|<br>)\s*kimlik\s*:\s*([^\n<]+)/i), e = km ? sade(km[1]) : sade(parca[0]);
    if ((takma[e] || e) !== k) return;
    if (!ad) ad = parca[0];
    var bas = Utilities.formatDate(ev.getAllDayStartDate(), 'Europe/Istanbul', 'yyyy-MM-dd');
    var n = Math.round((ev.getAllDayEndDate() - ev.getAllDayStartDate()) / 864e5) - 1;
    var gunduz = (parca[1] || '').indexOf('gündüz') === 0 || n < 1;
    gelisler[bas] = { gun: bas, gece: gunduz ? 0 : n, tur: gunduz ? 'gunduz' : 'konaklama' };
  });
  var liste = Object.keys(gelisler).sort().map(function (d) { return gelisler[d]; });
  return { kimlik: k, ad: ad || istek, liste: liste };
}

function profilJson(istek) {
  var on = CacheService.getScriptCache(), bugun = Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyy-MM-dd');
  var anahtar = 'profil1-' + sade(istek).replace(/[^a-z0-9-]/g, '').slice(0, 40) + '-' + bugun, veri = on.get(anahtar);
  if (!veri) {
    var v = profilVerisi(istek);
    // yalnızca bugüne kadarki gelişler: ileri tarihli kayıtlar herkese açık sayfada görünmez
    var l = v.liste.filter(function (x) { return x.gun <= bugun; });
    var kon = l.filter(function (x) { return x.tur === 'konaklama'; });
    var uzun = kon.reduce(function (a, x) { return x.gece > a.gece ? x : a; }, { gece: 0 });
    veri = JSON.stringify({
      ad: v.ad, kimlik: v.kimlik, kayitBaslangic: '2022-01', bugun: bugun,
      gelis: l.length, konaklama: kon.length, gunduz: l.length - kon.length,
      gece: kon.reduce(function (a, x) { return a + x.gece; }, 0),
      enUzun: uzun.gece ? { gun: uzun.gun, gece: uzun.gece } : null,
      liste: l
    });
    on.put(anahtar, veri, 600);
  }
  return ContentService.createTextOutput(veri).setMimeType(ContentService.MimeType.JSON);
}
