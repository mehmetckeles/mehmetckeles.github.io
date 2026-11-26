/* Talep formları: Google Form'a gider, Drive'daki "Site talepleri" tablosuna düşer.
   Tabloya bağlı "Talep bildirimi" Apps Script'i her yeni talepte e-posta yollar (_bildirim/talep-bildirimi.gs). */
(function(){
  var FORM='https://docs.google.com/forms/d/e/1FAIpQLSdfu0jZr6BJRK3GxRTbwdAbm5t7yUwNxJz2gHfAoy1aWvlW6g/formResponse';
  var ALAN={tur:'entry.1679659265',ad:'entry.1228144126',tel:'entry.1329993373',kopek:'entry.2127242662',tarih:'entry.130478542',ayrinti:'entry.71232531'};
  var ETIKET={semt:'Semt',yas:'Yaşı',cinsiyet:'Cinsiyeti',kisir:'Kısırlaştırıldı mı',iliski:'Diğer köpeklerle',asi:'Aşı ve parazit',alerji:'Alerji',karakter:'Anlatılanlar',konaklama_tarihleri:'Düşünülen konaklama',uygun_zaman:'Tanışma için uygun zaman',degisiklik:'Son görüşmeden beri değişiklik',ilac:'İlaç / özel bakım'};
  function trTarih(v){if(!v)return'';var p=v.split('-');return p[2]+'.'+p[1]+'.'+p[0]}
  function gonder(f){
    var fd=new FormData(f), tur=f.dataset.form==='tanisma'?'Tanışma':'Ön rezervasyon', satir=[];
    Object.keys(ETIKET).forEach(function(k){var v=(fd.get(k)||'').toString().trim(); if(v) satir.push(ETIKET[k]+': '+v)});
    if(fd.get('degisti')==='hayir') satir.push(ETIKET.degisiklik+': yok');
    var ek=fd.getAll('ek_gun').filter(Boolean).map(trTarih);
    var ayniGun=tur!=='Tanışma'&&fd.get('giris')&&fd.get('giris')===fd.get('cikis');
    var tarih=tur==='Tanışma'?(fd.get('konaklama_tarihleri')||''):(ayniGun?('Gündüz: '+[trTarih(fd.get('giris'))].concat(ek).join(', ')):(trTarih(fd.get('giris'))+' → '+trTarih(fd.get('cikis'))));
    if(ayniGun&&ek.length) satir.unshift('Gündüz misafirliği günleri: '+[trTarih(fd.get('giris'))].concat(ek).join(', '));
    var p=new URLSearchParams();
    p.append(ALAN.tur,tur);
    p.append(ALAN.ad,((fd.get('ad')||'')+' '+(fd.get('soyad')||'')).trim());
    p.append(ALAN.tel,fd.get('telefon')||'');
    p.append(ALAN.kopek,fd.get('kopek')||'');
    p.append(ALAN.tarih,tarih);
    p.append(ALAN.ayrinti,satir.join('\n'));
    return fetch(FORM,{method:'POST',mode:'no-cors',body:p});
  }
  /* hesaplayıcıdan gelen tarihler */
  var u=new URLSearchParams(location.search);
  ['giris','cikis'].forEach(function(k){var el=document.querySelector('[name="'+k+'"]'); if(el&&u.get(k)) el.value=u.get(k)});

  /* giriş ve çıkış aynı günse: gündüz misafirliği, birden çok gün eklenebilir */
  var gIn=document.querySelector('[name="giris"]'), gOut=document.querySelector('[name="cikis"]'), kutu=document.getElementById('r-gunduz');
  /* ?tur=gunduz: yalnız getirilecek gün sorulur, alınacak gün aynı gün sayılır */
  var gunduzModu=u.get('tur')==='gunduz'&&gIn&&gOut&&kutu;
  if(gunduzModu){
    var alan=gOut.closest('.field'); alan.hidden=true; gOut.required=false;
    gIn.closest('.field').classList.add('full');
    var lbl=document.querySelector('label[for="'+gIn.id+'"]'); if(lbl) lbl.innerHTML='Getireceğiniz gün <em>*</em>';
    var ip=kutu.querySelector('.hint'); if(ip) ip.textContent='Köpeğiniz akşam evine dönüyor. Başka günler de gelecekse buraya ekleyebilirsiniz.';
  }
  (function(){
    if(!gIn||!gOut) return;
    var t=new Date(), bugun=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    gIn.min=bugun; gOut.min=gIn.value||bugun;
    var elle=!!gOut.value;
    function ayarla(){ if(!gIn.value) return; gOut.min=gIn.value; if(gunduzModu||!elle||!gOut.value||gOut.value<gIn.value){gOut.value=gIn.value;gOut.dispatchEvent(new Event('change'));} }
    gIn.addEventListener('change',ayarla); gIn.addEventListener('input',ayarla);
    gOut.addEventListener('input',function(){ if(gOut.value) elle=true; });
  })();
  if(gIn&&gOut&&kutu){
    var liste=document.getElementById('r-ekgunler');
    function bak(){kutu.hidden=gunduzModu?false:!(gIn.value&&gIn.value===gOut.value)}
    gIn.addEventListener('change',bak);gOut.addEventListener('change',bak);gIn.addEventListener('input',bak);gOut.addEventListener('input',bak);bak();
    function ekle(deger){
      if(liste.children.length>=14) return;
      var r=document.createElement('div'); r.className='ek-gun';
      r.innerHTML='<input type="date" name="ek_gun" aria-label="Ek gün" min="'+gIn.min+'"><button type="button" aria-label="Bu günü çıkar">Çıkar</button>';
      r.querySelector('button').addEventListener('click',function(){r.remove()});
      liste.appendChild(r);
      if(deger) r.querySelector('input').value=deger; else r.querySelector('input').focus({preventScroll:true});
    }
    document.getElementById('r-ekle').addEventListener('click',function(){ekle()});
    (u.get('ek')||'').split(',').filter(function(x){return /^\d{4}-\d{2}-\d{2}$/.test(x)}).forEach(ekle);
  }

  /* "değişen bir şey var mı?": Evet seçilirse ne değiştiği sorulur */
  document.querySelectorAll('input[name="degisti"]').forEach(function(r){
    r.addEventListener('change',function(){
      var alan=document.getElementById('r-degisim-alan'), t=document.getElementById('r-degisim'); if(!alan) return;
      var evet=r.form.querySelector('input[name="degisti"]:checked').value==='evet';
      alan.hidden=!evet; t.required=evet; if(evet) t.focus({preventScroll:true});
    });
  });

  /* tanıyan aileler: iletişim ve köpek bilgisi yalnızca bu cihazda saklanır, bir dahaki formda hazır gelir */
  var ANAHTAR='mck-aile', KAYIT_ALAN=['ad','soyad','telefon','kopek'];
  function oku(){try{return JSON.parse(localStorage.getItem(ANAHTAR)||'null')}catch(e){return null}}
  function yaz(f){
    var kutu=f.querySelector('#r-hatirla'); if(!kutu) return;
    try{
      if(!kutu.checked){localStorage.removeItem(ANAHTAR);return}
      var o={}; KAYIT_ALAN.forEach(function(k){var el=f.querySelector('[name="'+k+'"]'); if(el) o[k]=el.value.trim()});
      localStorage.setItem(ANAHTAR,JSON.stringify(o));
    }catch(e){}
  }
  (function(){
    var f=document.querySelector('form[data-form="rezervasyon"]'), kart=document.getElementById('r-tanidik'); if(!f||!kart) return;
    var o=oku(); if(!o||!o.ad||!o.telefon||!o.kopek) return;
    KAYIT_ALAN.forEach(function(k){var el=f.querySelector('[name="'+k+'"]'); if(el&&o[k]&&!el.value) el.value=o[k]});
    var kisi=document.getElementById('r-kisi'), kopekAlan=f.querySelector('[name="kopek"]').closest('.field');
    var ozet=document.getElementById('r-ozet');
    ozet.textContent='';
    [((o.ad||'')+' '+(o.soyad||'')).trim(), o.telefon+' · '+o.kopek].forEach(function(t){var sp=document.createElement('span'); sp.textContent=t; ozet.appendChild(sp)});
    kart.hidden=false; kisi.hidden=true; kopekAlan.hidden=true;
    document.getElementById('r-degistir').addEventListener('click',function(){kart.hidden=true; kisi.hidden=false; kopekAlan.hidden=false; f.querySelector('[name="ad"]').focus({preventScroll:true})});
  })();

  document.querySelectorAll('form[data-form]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      f.querySelectorAll('.field').forEach(function(x){x.classList.remove('bad')});
      var bad=[].slice.call(f.querySelectorAll('[required]')).filter(function(el){
        if(el.type==='radio') return !f.querySelector('input[name="'+el.name+'"]:checked');
        return !el.value.trim();});
      var warn=f.querySelector('.warn');
      if(bad.length){
        bad.forEach(function(el){el.closest('.field').classList.add('bad')});
        warn.hidden=false;
        warn.textContent=bad.length===1?'Bir soru eksik kaldı; işaretli soruya bakar mısınız?':bad.length+' soru eksik kaldı; işaretli sorulara bakar mısınız?';
        return;
      }
      warn.hidden=true;
      var btn=f.querySelector('button[type=submit]'); btn.disabled=true;
      gonder(f).then(function(){
        yaz(f);
        f.hidden=true;
        var ok=document.getElementById('tesekkur'); ok.hidden=false;
        window.scrollTo(0,0);
      }).catch(function(){
        btn.disabled=false; warn.hidden=false;
        warn.textContent='Gönderilemedi; bağlantıda bir sorun olmuş olabilir. Biraz sonra yeniden deneyebilir ya da WhatsApp\'tan yazabilirsiniz: 0505 280 64 48';
      });
    });
  });
})();
