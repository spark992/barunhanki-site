(function(){
  const SETTINGS_URL = '/content/settings.json';
  let cmsSettings = {};

  function normalizePhone(value){ return String(value || '').replace(/[^0-9+]/g,''); }
  function walkText(root, replacements){
    const walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      const parent=node.parentElement;
      if(!parent || ['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName)) continue;
      let t=node.nodeValue;
      for(const [from,to] of replacements){ if(from && to!=null) t=t.split(from).join(String(to)); }
      node.nodeValue=t;
    }
  }
  function setText(selector, value){ if(value==null || value==='') return; document.querySelectorAll(selector).forEach(el=>el.textContent=value); }
  function applySettings(s){
    cmsSettings=s || {};
    const brand=s.brand || '바른한끼';
    const price=s.price || '1인분 7,500원';
    const phone=s.phone || '010-5955-2375';
    const kakao=s.kakao || 'br2375';
    const delivery=s.delivery || '대구 전 지역 / 외곽지역은 주문 전 배달 가능 여부 문의';
    const order=s.order || '전날 예약 주문';
    const deadline=s.change_deadline || '당일 오전 9시까지';
    const mealTitle=s.meal_plan_title || '8월 식단표';
    const mealImage=s.meal_plan_image || '';

    // Replace repeated visible defaults across header/hero/info/contact/footer.
    walkText(document.body, [
      ['바른한끼', brand],
      ['1인분 7,500원', price],
      ['010-5955-2375', phone],
      ['br2375', kakao],
      ['당일 오전 9시까지', deadline]
    ]);

    // Header logo uses split colored spans; make the full brand editable without breaking layout.
    const red=document.querySelector('.brandRed'), orange=document.querySelector('.brandOrange');
    if(red && orange){ red.textContent=brand; orange.textContent=''; }

    // Phone/SMS links.
    const phoneHref=normalizePhone(phone);
    document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.setAttribute('href','tel:'+phoneHref));
    document.querySelectorAll('a[href^="sms:"]').forEach(a=>a.setAttribute('href','sms:'+phoneHref));

    // Specific CMS fields.
    setText('[data-cms="meal_plan_title"]', mealTitle);
    setText('[data-cms="delivery"]', delivery);
    setText('[data-cms="order"]', order);
    setText('[data-cms="change_deadline"]', deadline);

    // Keep order/delivery summary box synchronized.
    const infoBoxes=document.querySelectorAll('#delivery .infoBox');
    if(infoBoxes[1]){
      const items=infoBoxes[1].querySelectorAll('li');
      const values=[price, order, deadline, phone, kakao, delivery];
      items.forEach((li,i)=>{
        if(values[i]==null) return;
        const strong=li.querySelector('strong');
        const label=strong ? strong.textContent : '';
        li.innerHTML='';
        if(label){ const b=document.createElement('strong'); b.textContent=label; li.appendChild(b); li.appendChild(document.createTextNode(' '+values[i])); }
        else li.textContent=values[i];
      });
    }

    // Meal-plan image: CMS stores uploaded files as /images/uploads/....
    if(mealImage){
      const img=document.querySelector('[data-cms-image="meal_plan_image"]');
      if(img){ img.src=mealImage; img.alt=brand+' '+mealTitle; }
    }

    // Page metadata.
    document.title=brand+' | 대구 월정기 도시락';
    const desc=document.querySelector('meta[name="description"]');
    if(desc) desc.setAttribute('content',brand+' 대구 월정기 도시락. '+price+'. '+order+', 수량 변경 '+deadline+'. '+delivery+'.');

    // contact heading
    document.querySelectorAll('[data-cms-brand-contact]').forEach(el=>el.textContent=brand+' 주문·문의');
  }

  // Used by every Kakao button on the existing page.
  window.copyKakao=function(){
    const id=(cmsSettings && cmsSettings.kakao) || 'br2375';
    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(id).then(()=>alert('카카오톡 ID '+id+'가 복사되었습니다.'));
    } else alert('카카오톡에서 '+id+'를 검색해주세요.');
  };

  fetch(SETTINGS_URL+'?v='+Date.now(), {cache:'no-store'})
    .then(r=>{ if(!r.ok) throw new Error('settings '+r.status); return r.json(); })
    .then(applySettings)
    .catch(err=>console.warn('CMS 설정을 불러오지 못해 기본값으로 표시합니다.',err));
})();
