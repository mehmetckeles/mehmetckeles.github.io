/* Ücret hesaplayıcı.
   Fiyatlar tek yerde: Ocak 2027 güncellemesinde yalnızca FIYAT değişir. */
var FIYAT={gece:2550, gunduz:1900, teslimSiniri:"15:00",
  /* kreş: üç ay içinde en az 4 gün planlayan ailelere */
  kresIndirimi:function(gun,aralik){return (gun>=4&&aralik<=92)?20:0},
  /* ödeme sayfasında kişinin kendi kararı: %5'lik adımlarla −%5 ile +%20 arası */
  karar:{adim:5,alt:-5,ust:20},
  kopekIndirimi:function(n){return n>=3?15:(n===2?10:0)},
  geceIndirimi:function(g){return g>=10?10:(g>=5?5:0)}};

/* ödeme sayfasının 3. adımı son tutarı buradan okur */
function odemeTutar(o){window.sonOdemeTutar=o.detail;document.dispatchEvent(new CustomEvent('odeme-tutar',o));}
(function(){
  var tl=function(n){return n.toLocaleString('tr-TR')+' TL'};
  document.querySelectorAll('[data-price="night"]').forEach(function(e){e.textContent=tl(FIYAT.gece)});
  document.querySelectorAll('[data-price="day"]').forEach(function(e){e.textContent=tl(FIYAT.gunduz)});
  var iso=function(x){return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
  function nights(a,b){var A=new Date(a+'T12:00'),B=new Date(b+'T12:00');return Math.round((B-A)/864e5)}
  function row(l,v,cls){return '<div class="row'+(cls?' '+cls:'')+'"><span>'+l+'</span><span>'+v+'</span></div>'}

  function init(root){
    var q=function(c){return root.querySelector(c)};
    var n=1, out=q('.c-n'), res=q('.c-res'), rezLink=root.dataset.rez||'on-rezervasyon/';
    var oran=0, odeme=('odeme' in root.dataset);
    if(odeme) res.addEventListener('click',function(e){
      var b=e.target.closest('[data-karar]'); if(!b) return;
      oran=Math.min(FIYAT.karar.ust,Math.max(FIYAT.karar.alt,oran+(+b.dataset.karar)*FIYAT.karar.adim)); calc();
    });
    /* aynı gün seçilince: kreş için başka günler eklenebilir */
    var kutu=document.createElement('div'); kutu.className='c-gunler'; kutu.hidden=true;
    kutu.innerHTML='<div class="c-ek"></div><button type="button" class="btn ghost ek-ekle">+ Bir gün daha ekle</button>';
    q('.grid-in').after(kutu);
    var ekListe=kutu.querySelector('.c-ek');
    function ekGun(deger){
      if(ekListe.children.length>=14) return;
      var r=document.createElement('div'); r.className='ek-gun';
      r.innerHTML='<input type="date" aria-label="Kreş günü"'+(('odeme' in root.dataset)?'':' min="'+iso(new Date())+'"')+'><button type="button" aria-label="Bu günü çıkar">Çıkar</button>';
      r.querySelector('input').addEventListener('change',calc); r.querySelector('input').addEventListener('input',calc);
      r.querySelector('button').addEventListener('click',function(){r.remove();calc()});
      ekListe.appendChild(r);
      if(deger) r.querySelector('input').value=deger; else r.querySelector('input').focus({preventScroll:true});
    }
    kutu.querySelector('.ek-ekle').addEventListener('click',function(){ekGun()});
    root.querySelectorAll('[data-step]').forEach(function(b){b.addEventListener('click',function(){
      n=Math.min(10,Math.max(1,n+(+b.dataset.step))); out.textContent=n; calc();})});
    ['.c-in','.c-out','.c-time'].forEach(function(c){q(c).addEventListener('input',calc);q(c).addEventListener('change',calc)});
    /* tarihler boş başlar; kişinin yerine karar vermeyiz.
       Giriş seçilince çıkış aynı güne gelir; çıkışa kişi dokunmadıkça girişi izler.
       Kişi çıkışı kendisi seçtiyse yalnızca girişten önceye düşerse girişe çekilir. Geçmiş gün seçilemez. */
    var bugun=iso(new Date()), cikisElle=false;
    var gecmisSerbest='odeme' in root.dataset; /* ödeme sayfasında geçmiş konaklama da hesaplanır */
    if(!gecmisSerbest){q('.c-in').min=bugun; q('.c-out').min=bugun;}
    function cikisDegisti(){ if(q('.c-out').value) cikisElle=true; }
    function girisDegisti(){
      var a=q('.c-in').value, o=q('.c-out');
      if(!a) return;
      o.min=a;
      if(!cikisElle || !o.value || o.value<a) o.value=a;
      calc();
    }
    q('.c-out').addEventListener('change',cikisDegisti); q('.c-out').addEventListener('input',cikisDegisti);
    q('.c-in').addEventListener('change',girisDegisti); q('.c-in').addEventListener('input',girisDegisti);
    function calc(){
      var a=q('.c-in').value,b=q('.c-out').value,t=q('.c-time').value||'19:00';
      var bosAdim='<div class="tutar-blok"><p class="adim"><span>2</span>Ödeyeceğiniz tutar</p><p class="tutar-bos">Tarihleri girince tutar burada görünür.</p></div>';
      if(!a||!b){res.innerHTML=odeme?bosAdim:'';kutu.hidden=true;if(odeme)odemeTutar({detail:null});return}
      var g=nights(a,b);
      if(g<0){if(odeme)odemeTutar({detail:null});res.innerHTML=(odeme?bosAdim:'')+'<p class="err">Alacağınız gün, bırakacağınız günden önce olamaz.</p>';return}
      var h='',per=0,sinir=FIYAT.teslimSiniri.replace(':','.');
      kutu.hidden=g!==0;
      var gunler=[a], kres=0;
      if(g===0){
        [].forEach.call(ekListe.querySelectorAll('input'),function(i){if(i.value&&gunler.indexOf(i.value)<0)gunler.push(i.value)});
        gunler.sort();
        var k=gunler.length, aralik=nights(gunler[0],gunler[k-1]);
        per=k*FIYAT.gunduz;
        h+=row(k===1?'Gündüz misafirliği':k+' gün kreş × '+tl(FIYAT.gunduz),tl(per));
        kres=FIYAT.kresIndirimi(k,aralik);
        var kresNot=(k>=4&&!kres)?'<p class="fine">Dört günlük kreş indirimi, üç ay içindeki günlere uygulanır.</p>':'';
      }
      else{
        per=g*FIYAT.gece; h+=row(g+' gece × '+tl(FIYAT.gece),tl(g*FIYAT.gece));
        if(t>FIYAT.teslimSiniri){per+=FIYAT.gunduz;h+=row(sinir+(odeme?"'ten sonra aldınız":"'ten sonra alıyorsunuz")+" · gündüz misafirliği",tl(FIYAT.gunduz));}
        else h+=row(sinir+(odeme?"'ten önce aldınız":"'ten önce alıyorsunuz"),'0 TL');
      }
      var sub=per*n, kd=FIYAT.kopekIndirimi(n), gd=g>0?FIYAT.geceIndirimi(g):0;
      if(n>1) h+=row(n+' köpek','× '+n);
      if(kd||gd||kres||n>1) h+=row('Ara toplam',tl(sub));
      var tot=sub;
      if(kd){var x=Math.round(sub*kd/100);tot-=x;h+=row((n>=3?'3 ve daha fazla köpek':'2 köpek')+' indirimi (%'+kd+')','−'+tl(x),'minus');}
      if(gd){var y=Math.round(sub*gd/100);tot-=y;h+=row((g>=10?'10':'5')+' gece ve üzeri indirimi (%'+gd+')','−'+tl(y),'minus');}
      if(kres){var z=Math.round(sub*kres/100);tot-=z;h+=row('4 gün ve üzeri kreş indirimi (%'+kres+')','−'+tl(z),'minus');}
      if(!odeme) h+=row('Toplam',tl(tot),'total');
      if(odeme){
        /* ödeme sayfası: tek büyük rakam, döküm kapalı, − / + rakamın yanında */
        var son=Math.round(tot*(100+oran)/100), isaret=oran>0?'+%'+oran:'−%'+(-oran);
        var dokum='<details class="dokum"><summary>Hesap dökümü</summary>'+h+row('Hesaplanan tutar',tl(tot),oran!==0?'':'total')
          +(oran!==0?row((oran<0?'Kendi indiriminiz':'Kendi eklemeniz')+' ('+isaret+')',(oran<0?'−':'+')+tl(Math.abs(son-tot)),oran<0?'minus':'')+row('Ödeyeceğiniz tutar',tl(son),'total'):'')+'</details>';
        h='<div class="tutar-blok">'
          +'<p class="adim"><span>2</span>Ödeyeceğiniz tutar</p>'
          +'<div class="tutar-satir"><div class="tutar"><strong>'+tl(son)+'</strong>'+(oran!==0?'<s>'+tl(tot)+'</s>':'')+'</div>'
          +'<div class="karar">'+(oran!==0?'<output class="karar-oran">'+isaret+'</output>':'')
          +'<button type="button" class="karar-btn" data-karar="-1" aria-label="Tutarı %5 azalt"'+(oran<=FIYAT.karar.alt?' disabled':'')+'>−</button>'
          +'<button type="button" class="karar-btn" data-karar="1" aria-label="Tutarı %5 artır"'+(oran>=FIYAT.karar.ust?' disabled':'')+'>+</button>'
          +'</div></div>'
          +(oran<0?'<p class="karar-metin">Hesaplanan tutarın %'+(-oran)+' altında: '+tl(tot-son)+' eksik. Ödediğiniz ücret evin kira, fatura ve bakım giderlerini karşılıyor. Bu seçenek, ücreti kendi koşullarınıza göre ayarlayabilmeniz için var.</p>'
            :oran>0?'<p class="karar-metin">Hesaplanan tutarın %'+oran+' üzerinde: '+tl(son-tot)+' fazla. Ödediğiniz ücret evin kira, fatura ve bakım giderlerini karşılıyor; aradaki fark da bu giderlere ekleniyor.</p>':'')
          +'</div>'+dokum;
        odemeTutar({detail:{tutar:son,yazi:tl(son)}});
      }
      if(g===0&&kresNot) h+=kresNot;
      if(!('odeme' in root.dataset)) h+='<p class="fine">Tutarı ön rezervasyondan sonra telefonda birlikte teyit ederiz.</p>';
      var ekq=(g===0&&gunler.length>1)?'&ek='+gunler.filter(function(x){return x!==a}).join(','):'';
      if(!('odeme' in root.dataset)) h+='<div class="actions"><a class="btn ghost" href="'+rezLink+'?giris='+a+'&cikis='+b+ekq+'">'+(g>0?'Bu tarihlerle ön rezervasyon':(gunler.length>1?'Bu günler için ön rezervasyon':'Bu gün için ön rezervasyon'))+' <span class="ar">→</span></a></div>';
      var dk=res.querySelector('.dokum'), dkAcik=dk&&dk.open;
      res.innerHTML=h;
      if(dkAcik&&res.querySelector('.dokum')) res.querySelector('.dokum').open=true;
    }
    /* bağlantıyla gelen hazır hesap: ?giris=YYYY-AA-GG&cikis=…&saat=SS:DD&kopek=2&ek=…,…&oran=-5 */
    (function(){
      var u=new URLSearchParams(location.search), tarih=/^\d{4}-\d{2}-\d{2}$/;
      if(tarih.test(u.get('giris')||'')){ q('.c-in').value=u.get('giris'); if(!odeme) q('.c-out').min=u.get('giris'); }
      if(tarih.test(u.get('cikis')||'')){ q('.c-out').value=u.get('cikis'); cikisElle=true; }
      else if(q('.c-in').value) q('.c-out').value=q('.c-in').value;
      if(/^\d{2}:\d{2}$/.test(u.get('saat')||'')) q('.c-time').value=u.get('saat');
      else if(tarih.test(u.get('giris')||'')) q('.c-time').value='12:00';   /* saatsiz eski bağlantılar 12.00 ile hazırlanmıştı */
      var k=parseInt(u.get('kopek'),10); if(k>=1&&k<=10){ n=k; out.textContent=n; }
      (u.get('ek')||'').split(',').filter(function(x){return tarih.test(x)}).forEach(ekGun);
      var o=parseInt(u.get('oran'),10);
      if(odeme&&!isNaN(o)&&o%FIYAT.karar.adim===0) oran=Math.min(FIYAT.karar.ust,Math.max(FIYAT.karar.alt,o));
    })();
    /* hazırlama ekranı (/odeme?hazirla) için o anki hesabın bağlantısı */
    root.baglanti=function(){
      var p=new URLSearchParams(), a=q('.c-in').value, b=q('.c-out').value;
      if(!a||!b) return null;
      p.set('giris',a); p.set('cikis',b);
      if(q('.c-time').value) p.set('saat',q('.c-time').value);   /* saat her zaman yazılır */
      if(n>1) p.set('kopek',n);
      var ek=[].map.call(ekListe.querySelectorAll('input'),function(i){return i.value}).filter(Boolean);
      if(a===b&&ek.length) p.set('ek',ek.join(','));
      if(oran) p.set('oran',oran);
      return location.origin+location.pathname+'?'+p.toString().replace(/%2C/g,',').replace(/%3A/g,':');
    };
    calc();
  }
  document.querySelectorAll('[data-calc]').forEach(init);

  /* alttan açılan panel: sayfa yerinden oynamaz */
  var panel=document.getElementById('hesap-panel');
  if(panel){
    var last=null;
    function open(){last=document.activeElement;panel.hidden=false;requestAnimationFrame(function(){panel.classList.add('open')});document.body.style.overflow='hidden';var c=panel.querySelector('.sheet-close');c&&c.focus({preventScroll:true})}
    function close(){panel.classList.remove('open');document.body.style.overflow='';setTimeout(function(){panel.hidden=true},250);if(last)try{last.focus({preventScroll:true})}catch(e){}}
    document.querySelectorAll('[data-open-calc]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();open()})});
    panel.querySelectorAll('[data-close-calc]').forEach(function(b){b.addEventListener('click',close)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)close()});
    if(location.hash==='#hesapla'){open();history.replaceState(null,'',location.pathname)}
  }
})();
