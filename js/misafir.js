/* Bugünkü misafirler: "Misafirler" takviminden (Apps Script, herkese açık dağıtım) yalnızca köpek adı ve kalan gün gelir.
   Ana sayfada kırmızı kart, konaklama sayfasında liste. Köpek yüzleri kodla çizilir; renk köpeğin adından seçilir. Ev boşsa ikisi de görünmez. */
(function(){
  var U='https://script.google.com/macros/s/AKfycbwKtB63l09gq7bLoSmVAFuQLSMHf54G9StF38-EkFIHp2IwLJDZESgdLMna8PoAlIDb/exec?misafir=1';
  var rozet=document.querySelector('[data-misafir-rozet]'), liste=document.querySelector('[data-misafir-liste]');
  /* Mehmet'in söylediği görünüşler (ad küçük harfle). renk: aşağıdaki RENKLER'den biri; boy: kucuk | orta | buyuk.
     Burada olmayan köpek rastgele (adından) bir renk ve orta boy alır. */
  var KOPEK={
    'kaju':{renk:'kahverengi',boy:'orta'},
    'dobi':{renk:'beyaz-siyah',boy:'orta'}, 'dobby':{renk:'beyaz-siyah',boy:'orta'},
    'cedric':{renk:'beyaz',boy:'orta'}
  };
  var RENKLER={ 'kahverengi':['#8A5A2E','#5C3818'], 'beyaz':['#FBF8F2','#E2D9CB'], 'beyaz-siyah':['#FBF8F2','#1E1A18',1],
    'siyah':['#2B2522','#151110'], 'gri':['#9A8F86','#5E554F'], 'sari':['#E0B25A','#A97A26'], 'krem':['#F1E3C8','#C9A877'], 'kizil':['#B9643A','#7A3A1C'] };
  var RENK=[['#C8873E','#8A5520'],['#F1E3C8','#C9A877'],['#2B2522','#151110'],['#9A8F86','#5E554F'],['#E0B25A','#A97A26'],['#B9643A','#7A3A1C'],['#FFFFFF','#D9D2C7']];
  function sira(ad){var h=0;for(var i=0;i<ad.length;i++)h=(h*31+ad.charCodeAt(i))>>>0;return h}
  /* aynı gün iki köpek aynı yüzü almasın: renk + kulak birleşimi doluysa sıradakine geç */
  var dolu={}, secim={};
  function sec(ad){ if(secim[ad]) return secim[ad]; var h=sira(ad), k=Math.floor(h/7)%3;
    for(var i=0;i<RENK.length;i++){ var r=(h+i)%RENK.length; if(!dolu[r]){ dolu[r]=1; return secim[ad]=[r,k]; } }
    return secim[ad]=[h%RENK.length,k]; }
  function yuz(ad,x){   /* x: takvimden gelen renk/boy (varsa tablodan önce gelir) */
    var tablo=KOPEK[ad.toLocaleLowerCase('tr-TR')]||{}, bilgi={renk:(x&&x.renk)||tablo.renk, boy:(x&&x.boy)||tablo.boy}, s=sec(ad), kulak=s[1];
    var r=(bilgi.renk&&RENKLER[bilgi.renk])||RENK[s[0]], leke=!!r[2], koyu=(r[0]==='#2B2522');
    var boy=bilgi.boy==='kucuk'?' kucuk':bilgi.boy==='buyuk'?' buyuk':'';
    var g=koyu?'#F6F1E7':'#1A1512';
    var k = kulak===0 ? '<ellipse cx="13" cy="25" rx="7" ry="13" transform="rotate(18 13 25)" fill="'+r[1]+'"/><ellipse cx="51" cy="25" rx="7" ry="13" transform="rotate(-18 51 25)" fill="'+r[1]+'"/>'
          : kulak===1 ? '<path d="M12 22 L16 4 L28 16Z" fill="'+r[1]+'"/><path d="M52 22 L48 4 L36 16Z" fill="'+r[1]+'"/>'
          : '<path d="M10 18 Q12 6 24 12 Q18 22 14 30Z" fill="'+r[1]+'"/><path d="M54 18 Q52 6 40 12 Q46 22 50 30Z" fill="'+r[1]+'"/>';
    var lekeSvg = leke ? '<ellipse cx="38.5" cy="30" rx="7.5" ry="6.5" fill="'+r[1]+'" transform="rotate(-15 38.5 30)"/><path d="M18 22 Q24 15 30 19 Q25 23 22 29Z" fill="'+r[1]+'"/>' : '';
    return '<svg class="yuz'+boy+'" viewBox="0 0 64 64" aria-hidden="true">'+k
      +'<circle cx="32" cy="34" r="20" fill="'+r[0]+'"/>'+lekeSvg
      +'<ellipse cx="32" cy="43" rx="10" ry="8" fill="'+(koyu?'#4A403A':(r[0]==='#FBF8F2'?'#EFE6D8':'#FFF8EC'))+'" opacity=".9"/>'
      +'<circle cx="25" cy="32" r="2.6" fill="'+g+'"/>'+(leke?'<circle cx="39" cy="32" r="3.4" fill="#FBF8F2"/>':'')+'<circle cx="39" cy="32" r="2.6" fill="'+g+'"/>'
      +'<circle cx="25.8" cy="31.2" r=".8" fill="#fff"/><circle cx="39.8" cy="31.2" r=".8" fill="#fff"/>'
      +'<ellipse cx="32" cy="39.5" rx="3.6" ry="2.6" fill="#1A1512"/>'
      +'<path d="M32 42 Q32 45 29 46 M32 42 Q32 45 35 46" stroke="#1A1512" stroke-width="1.2" fill="none" stroke-linecap="round"/>'
      +'<path d="M30 46.5 Q32 52 34 46.5Z" fill="#E86A7A"/>'
      +'</svg>';
  }
  function ne(x){
    return x.tur==='gunduz' ? 'bugün gündüz misafirimiz'
      : x.kalan<=0 ? 'bu akşam evine dönüyor'
      : (x.yeni ? 'bugün geldi · ' : '')+x.kalan+' gün daha bizimle';
  }
  /* adına ikinci dokunuş köpeğin profilini açar (/kopek/); bunun için bir davet yazısı yok */
  var PROFIL='/kopek/#';
  function gelis(x){
    if(!x.gelis) return '';
    if(x.gelis===1) return 'İlk gelişi';
    var i=x.ilk?x.ilk.split('-'):null;
    return x.gelis+'. gelişi'+(i?' · ilk kez '+AY[+i[1]-1]+' '+i[0]:'');
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var AY=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'], GUN=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  function tarih(t){ var d=t?new Date(t+'T12:00'):new Date(); return d.getDate()+' '+AY[d.getMonth()]+' '+GUN[d.getDay()]; }
  function ciz(v){
    var m=(v&&v.misafirler)||[]; if(!m.length) return;
    [].forEach.call(document.querySelectorAll('[data-tarih]'),function(e){ e.textContent=tarih(v.tarih); });
    if(rozet){
      rozet.querySelector('[data-sayi]').textContent=m.length;
      rozet.querySelector('[data-yuzler]').innerHTML=m.slice(0,5).map(function(x){return '<span class="mk">'+yuz(x.ad,x)+'<span>'+esc(x.ad)+'</span></span>'}).join('');
      rozet.hidden=false;
    }
    if(liste){
      liste.querySelector('[data-sayi]').textContent=m.length;
      liste.querySelector('ul').innerHTML=m.map(function(x){
        var g=gelis(x);
        return '<li'+(g?' class="acilir" tabindex="0" role="button" aria-expanded="false"':'')+'>'+yuz(x.ad,x)+'<span class="ad">'+esc(x.ad)+'</span><span class="ne">'+esc(ne(x))+'</span>'
          +(g?'<span class="gelis" hidden>'+esc(g)+'</span>':'')+'</li>';
      }).join('');
      [].forEach.call(liste.querySelectorAll('li.acilir'),function(li,i){
        var x=m[i];
        function ac(){
          var g=li.querySelector('.gelis'), a=g.hidden;
          if(!a&&x.kimlik){ location.href=PROFIL+encodeURIComponent(x.kimlik); return; }
          g.hidden=!a; li.setAttribute('aria-expanded',a?'true':'false');
        }
        li.addEventListener('click',ac);
        li.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); ac(); } });
      });
      liste.hidden=false;
    }
  }
  window.mckYuz=yuz;   /* köpek profili sayfası da aynı yüzü çizer */
  if(!rozet&&!liste) return;
  var k='mck-misafir6', simdi=Date.now(), bugun=new Date().toDateString();
  try{ var o=JSON.parse(sessionStorage.getItem(k)||'null'); if(o&&o.gun===bugun&&simdi-o.t<600000){ ciz(o.v); return; } }catch(e){}
  fetch(U).then(function(r){return r.json()}).then(function(v){
    try{ sessionStorage.setItem(k,JSON.stringify({t:simdi,gun:bugun,v:v})); }catch(e){}
    ciz(v);
  }).catch(function(){});
})();
