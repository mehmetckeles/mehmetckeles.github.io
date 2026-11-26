/* /uyum/: köpekle ilgili konu formu. Cevaplar Google Form'a gider ("Site talepleri" tablosu);
   talebin altına Mehmet için bir "Okuma" eklenir: puanların birlikte ne söylediği. */
(function(){
  var FORM='https://docs.google.com/forms/d/e/1FAIpQLSdfu0jZr6BJRK3GxRTbwdAbm5t7yUwNxJz2gHfAoy1aWvlW6g/formResponse';
  var ALAN={tur:'entry.1679659265',ad:'entry.1228144126',tel:'entry.1329993373',kopek:'entry.2127242662',tarih:'entry.130478542',ayrinti:'entry.71232531'};
  var f=document.getElementById('f-uyum'); if(!f) return;
  var bas=null; f.addEventListener('input',function(){ if(!bas) bas=Date.now(); },true); f.addEventListener('change',function(){ if(!bas) bas=Date.now(); },true);

  var yalniz=document.getElementById('u-yalniz'), evSoru=f.querySelector('[data-soru="ev"]');
  yalniz.addEventListener('change',function(){
    evSoru.classList.toggle('pasif',yalniz.checked);
    evSoru.querySelectorAll('input').forEach(function(i){ if(yalniz.checked) i.checked=false; });
  });

  var anaKutu=document.getElementById('u-ana'), anaSec=document.getElementById('u-ana-sec');
  f.querySelectorAll('input[name="konu"]').forEach(function(i){ i.addEventListener('change',function(){
    var s=secili('konu'), once=(f.querySelector('input[name="ana"]:checked')||{}).value;
    anaSec.innerHTML='';
    s.forEach(function(v){ var l=document.createElement('label'); l.innerHTML='<input type="radio" name="ana"><span></span>';
      l.querySelector('input').value=v; l.querySelector('span').textContent=v; if(v===once) l.querySelector('input').checked=true; anaSec.appendChild(l); });
    anaKutu.hidden=s.length<2;
  }); });

  function deger(ad){var el=f.querySelector('input[name="'+ad+'"]:checked'); return el?+el.value:null}
  function secili(ad){return [].slice.call(f.querySelectorAll('input[name="'+ad+'"]:checked')).map(function(i){return i.value})}

  /* ---- Okuma: on cevabın birlikte söylediği ---- */
  function okuma(c){
    var o=[], ilk=null, siddet=(c.siklik+c.siddet)/2, uzun=c.sizinle!=='Bir yıldan az';
    var riskli=/Hırlama|İnsanlara|Köpeklere/.test(c.ana)||c.konu.some(function(k){return /Hırlama/.test(k)});
    if(c.konu.length>=4) o.push('Çok konu işaretlenmiş ('+c.konu.length+'); asıl dert: '+c.ana+'.');
    if(riskli && c.siddet>=7){ o.push('Güvenlik: tepki ya da ısırma var ve şiddeti yüksek ('+c.siddet+'). Önce kimseye zarar gelmemesi için ne yapılabileceği konuşulmalı.'); ilk=ilk||'Son olay ne zamandı, kime ya da neye yönelikti, sonunda ne oldu?'; }
    if(siddet>=7 && c.gidisat>=6) o.push('Ağırlaşıyor: sık ve şiddetli ('+c.siklik+'/'+c.siddet+'), son aylarda kötüye gidiyor ('+c.gidisat+'). Görüşme gecikmemeli.');
    else if(siddet>=7) o.push('Yoğun ama yerinde sayıyor: sık ve şiddetli ('+c.siklik+'/'+c.siddet+'), gidişat '+c.gidisat+'.');
    if(c.siklik<=2 && c.siddet>=8){ o.push('Seyrek ama sert: az oluyor ama olduğunda şiddetli. Tek bir olayın gölgesi olabilir.'); ilk=ilk||'Bunu en son ne zaman gördünüz? O gün olanı baştan anlatır mısınız?'; }
    if(c.baslangic==='Sizinle yaşarken başladı'){ o.push('Sahibinin yanındayken başlamış: o dönemde evde ya da sahibin hayatında değişen bir şeye bakmak.'); ilk=ilk||'Bu başladığında evde ya da sizin hayatınızda ne değişmişti?'; }
    else if(c.baslangic==='Bir olaydan sonra başladı'){ o.push('Bir olaydan sonra başlamış: olay belli, ondan sonra köpeğin dünyasında ne değiştiğine bakmak.'); ilk=ilk||'O olay neydi, sonrasında evde neler değişti?'; }
    else if(c.baslangic==='Size geldiği ilk günlerde vardı') o.push('Köpek bu durumla gelmiş: önceki hayatından taşıdığı bir şey olabilir.');
    if(uzun && c.denenen<=3){ o.push('Ertelenmiş: köpek '+c.sizinle.toLowerCase()+' sizinle, denenen az ('+c.denenen+').'); ilk=ilk||'Bu kadar zamandır sizi bir şey yapmaktan alıkoyan neydi?'; }
    if(c.denenen>=8 && c.gidisat>=5){ o.push('Çok şey denenmiş, düzelmemiş ('+c.denenen+'). Yöntemler sık değişmiş ya da tutarsız uygulanmış olabilir.'); ilk=ilk||'Neleri, hangi sırayla, ne kadar süre denediniz?'; }
    if(c.yuk>=8 && c.hazir<=4){ o.push('Yorgun ve hazır değil: yük '+c.yuk+', hazırlık '+c.hazir+'. Büyük bir plan değil, tek ve küçük bir adım işe yarar.'); ilk=ilk||'Şu an sizi en çok yoran an hangisi?'; }
    else if(c.yuk>=7 && c.hazir>=7) o.push('Yorgun ama istekli: yük '+c.yuk+', hazırlık '+c.hazir+'. Net bir plan iyi karşılanır.');
    if(c.ev!==null && c.ev<=3){ o.push('Daha çok formu doldurana karşı oluyor ('+c.ev+'): asıl soru köpekle onun arasında olabilir.'); ilk=ilk||'Evde başka biri varken de oluyor mu, yoksa daha çok siz yalnızken mi?'; }
    else if(c.ev!==null && c.ev>=7){ o.push('Daha çok evdeki diğer kişilerle oluyor ('+c.ev+'): onları da dinlemek gerekebilir.'); ilk=ilk||'Evde kiminle, nasıl oluyor? O kişi o anda ne yapıyor?'; }
    if(c.siddet>=8 && c.yuk<=2) o.push('Şiddet yüksek ama sahibini az yoruyor: alışılmış ya da küçümseniyor olabilir.');
    if(c.yuk>=8 && siddet<=3) o.push('Davranış hafif ama sahibi çok yoruluyor: yük davranıştan çok başka bir yerden geliyor olabilir.');
    if(c.hazir<=3) o.push('Günlük düzeni değiştirmeye hazırlık düşük ('+c.hazir+'): telefonda önce ne beklediğini, neyi yapabileceğini sormak.');
    if(c.cumle && c.cumle.length>300) o.push('Uzun yazmış ('+c.cumle.length+' karakter): anlatacak bir hikâyesi var, telefonda önce onu dinlemek.');
    /* cevap deseni */
    var p=[c.siklik,c.siddet,c.gidisat,c.yuk,c.denenen,c.hazir];
    var ayni=p.every(function(x){return x===p[0]}), uc=p.every(function(x){return x===0||x===10});
    if(ayni) o.push('Dikkat: ölçeklerin hepsinde aynı sayı ('+p[0]+') işaretlenmiş; sorular okunmadan geçilmiş olabilir.');
    else if(uc) o.push('Dikkat: yalnız 0 ve 10 işaretlenmiş; ya çok net ya da aceleyle doldurulmuş.');
    if(c.saniye && c.saniye<25) o.push('Dikkat: form '+c.saniye+' saniyede doldu.');
    if(!o.length) o.push('Belirgin bir desen yok: orta düzey bir tablo. Telefonda somut bir son olayı sormak.');
    return {satirlar:o, ilk:ilk||'Bunu en son ne zaman gördünüz? O an ne oldu?'};
  }
  window.uyumOkuma=okuma;

  f.addEventListener('submit',function(e){
    e.preventDefault();
    var eksik=[];
    f.querySelectorAll('.soru, .field').forEach(function(x){x.classList.remove('bad')});
    if(!secili('konu').length) eksik.push(f.querySelector('[data-soru="konu"]'));
    ['siklik','siddet','gidisat','yuk','denenen','hazir'].forEach(function(a){ if(deger(a)===null) eksik.push(f.querySelector('[data-soru="'+a+'"]')) });
    if(!yalniz.checked && deger('ev')===null) eksik.push(evSoru);
    if(secili('konu').length>1 && !f.querySelector('input[name="ana"]:checked')) eksik.push(f.querySelector('[data-soru="konu"]'));
    ['baslangic','sizinle'].forEach(function(a){ if(!f.querySelector('input[name="'+a+'"]:checked')) eksik.push(f.querySelector('[data-soru="'+a+'"]')) });
    ['ad','telefon','kopek'].forEach(function(n){var el=f.querySelector('[name="'+n+'"]'); if(!el.value.trim()) eksik.push(el.closest('.field'))});
    var warn=f.querySelector('.warn');
    if(eksik.length){
      eksik.forEach(function(x){x.classList.add('bad')});
      warn.hidden=false; warn.textContent=eksik.length===1?'Bir soru eksik kaldı; işaretli soruya bakar mısınız?':eksik.length+' soru eksik kaldı; işaretli sorulara bakar mısınız?';
      return;
    }
    warn.hidden=true;
    var konu=secili('konu'), anaEl=f.querySelector('input[name="ana"]:checked');
    var c={konu:konu,ana:konu.length>1&&anaEl?anaEl.value:konu[0],siklik:deger('siklik'),siddet:deger('siddet'),
      baslangic:f.querySelector('input[name="baslangic"]:checked').value,sizinle:f.querySelector('input[name="sizinle"]:checked').value,
      gidisat:deger('gidisat'),yuk:deger('yuk'),denenen:deger('denenen'),ev:yalniz.checked?null:deger('ev'),hazir:deger('hazir'),
      saniye:bas?Math.round((Date.now()-bas)/1000):null, cumle:f.querySelector('[name="cumle"]').value.trim()};
    var ok=okuma(c), d=window.dusunusSec(c);
    var satir=[
      'En çok zorlayan: '+c.ana,
      'İşaretlenen konular: '+c.konu.join(', '),
      'Sıklık (son bir ay): '+c.siklik+'/10',
      'Şiddet: '+c.siddet+'/10',
      'İlk ne zaman fark edildi: '+c.baslangic,
      'Köpek ne zamandır sizinle: '+c.sizinle,
      'Son aylarda gidişat (0 çok daha iyi, 5 aynı, 10 çok daha kötü): '+c.gidisat+'/10',
      'Sahibini yorması: '+c.yuk+'/10',
      'Denenenler: '+c.denenen+'/10',
      'Kiminle oluyor (0 daha çok formu doldurana, 5 herkese, 10 daha çok başkalarına): '+(c.ev===null?'evde yalnız':c.ev+'/10'),
      'Günlük düzeni değiştirebilme: '+c.hazir+'/10'
    ];
    if(c.saniye) satir.push('Doldurma süresi: '+c.saniye+' sn');
    if(c.cumle) satir.push('','Anlattıkları:',c.cumle);
    satir.push('','OKUMA'); ok.satirlar.forEach(function(s){satir.push('· '+s)});
    satir.push('','Telefonda ilk soru: '+ok.ilk);
    satir.push('Gösterilen düşünüş: '+d.no+'. '+d.ad);
    var p=new URLSearchParams();
    p.append(ALAN.tur,'Uyum çalışması');
    p.append(ALAN.ad,f.querySelector('[name="ad"]').value.trim());
    p.append(ALAN.tel,f.querySelector('[name="telefon"]').value.trim());
    p.append(ALAN.kopek,f.querySelector('[name="kopek"]').value.trim());
    p.append(ALAN.tarih,'Konu: '+c.ana+(c.konu.length>1?' (+'+(c.konu.length-1)+')':''));
    p.append(ALAN.ayrinti,satir.join('\n'));
    var btn=f.querySelector('button[type=submit]'); btn.disabled=true;
    fetch(FORM,{method:'POST',mode:'no-cors',body:p}).then(function(){
      document.getElementById('u-d-ad').textContent=d.ad;
      document.getElementById('u-d-metin').textContent=d.metin;
      var h=document.getElementById('u-d-haiku'); h.innerHTML=''; d.haiku.forEach(function(m){var sp=document.createElement('span');sp.textContent=m;h.appendChild(sp)});
      document.querySelector('.uyum h1').hidden=true; document.querySelector('.uyum .lead').hidden=true; document.querySelector('.uyum .back').hidden=true;
      f.hidden=true; document.getElementById('tesekkur').hidden=false; window.scrollTo(0,0);
    }).catch(function(){
      btn.disabled=false; warn.hidden=false; warn.textContent='Gönderilemedi; bağlantıda bir sorun olmuş olabilir. Biraz sonra yeniden deneyebilir ya da WhatsApp\'tan yazabilirsiniz: 0505 280 64 48';
    });
  });
})();
