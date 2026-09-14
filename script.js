/* ---------- Data: each variety has its own pool of uniquely-ID'd melons ---------- */
    function makeStock(prefix, count, start){
      const ids = [];
      for(let i=0;i<count;i++){ ids.push(`${prefix}-${String(start+i).padStart(5,'0')}`); }
      return ids;
    }

    const melons = [
      { id:1, name:'Cantaloupe', desc:'Sweet & Juicy', price:120, color:'#E8A33D', lines:'#C97C1E',
        reviews:'4.8 (124 reviews)', about:'Grown with natural farming methods on our family farm since 1986, ensuring the sweetest flavor and best quality in every slice.',
        stock: makeStock('N', 12, 123) },
      { id:2, name:'Honey Dew', desc:'Crisp & Fresh', price:110, color:'#CFE0A0', lines:'#9BB35E',
        reviews:'4.7 (98 reviews)', about:'Pale green flesh with a crisp bite and delicate honeyed sweetness, hand-picked at peak ripeness.',
        stock: makeStock('N', 8, 201) },
      { id:3, name:'Golden Melon', desc:'Rich & Aromatic', price:130, color:'#E9C24A', lines:'#C79A20',
        reviews:'4.9 (156 reviews)', about:'Our signature variety — deeply aromatic with a rich, almost caramel sweetness. Limited harvest each season.',
        stock: makeStock('N', 5, 301) },
      { id:4, name:'Winter Melon', desc:'Mild & Cooling', price:90, color:'#BFD9C7', lines:'#7FA98B',
        reviews:'4.6 (61 reviews)', about:'A gentle, mild melon prized in soups and desserts, grown in our shaded eastern plots.',
        stock: makeStock('N', 10, 401) },
    ];

    const reservations = []; // { unitId, varietyId, name, color, lines, price, paymentType, amountPaid, reservedOn, growthStage, delivery:{step}|null, actual:{date,weight,brix}, guess:null, gift:null }
    const DEPOSIT_AMOUNT = 50;
    const growthStages = ['Seed','Flower','Small Fruit','Growing','Ready to Harvest'];
    const growthPct = [10,30,55,80,100];
    const deliverySteps = ['Harvested','Preparing','Out for Delivery','Delivered'];

    let pendingVarietyId = null;
    let pendingPayment = 'deposit';
    let userPoints = 250;
    let activeGameUnitId = null;
    let farmVisitBooked = false;
    let selectedActivities = [];

    /* ---------- Farm Journal (educational content for while customers wait) ---------- */
    const articles = [
      { id:'grown', icon:'🌱', title:'How Our Melons Are Grown', teaser:'From seed to vine — a walk through the growing process on our family farm.',
        body:`<p>Every melon starts as a single seed, hand-selected from last season's best fruit. We sow seeds in nursery beds, where they germinate for about two weeks before the seedlings are strong enough to move outdoors.</p>
        <p>Once transplanted, the vines spread across raised soil mounds that keep the roots well-drained. Our farmers train each vine along the mound by hand, trimming excess leaves so sunlight reaches the developing fruit evenly.</p>
        <p>From seed to harvest takes roughly 75–90 days depending on the variety, with the final two weeks being the most important — this is when the fruit fills out and its sugars concentrate.</p>` },
      { id:'sweetness', icon:'🍯', title:'How Sweetness Develops', teaser:'Why the last two weeks on the vine matter more than any other stage.',
        body:`<p>Sweetness in a melon isn't added — it's built up slowly as the plant converts sunlight into sugars and sends them into the fruit. We measure this with a Brix reading, which tells us the sugar concentration in the juice.</p>
        <p>In the final 10–14 days before harvest, the vine redirects almost all of its energy into the fruit. Warm days and cool nights during this window help sugars accumulate faster, which is why we watch the weather closely as harvest approaches.</p>
        <p>We only pick once a melon reaches its target Brix level for that variety — never earlier — so every melon that leaves our farm has reached full natural sweetness.</p>` },
      { id:'watering', icon:'💧', title:'Our Watering Methods', teaser:'Drip irrigation, careful timing, and why we water less as harvest nears.',
        body:`<p>We use drip irrigation, delivering water directly to the root zone instead of spraying the whole field. This keeps the leaves dry, reduces disease, and uses far less water than overhead sprinklers.</p>
        <p>Young vines are watered generously to establish strong roots. But as the fruit matures, we deliberately reduce watering — a slightly "thirsty" vine in the final weeks produces a sweeter, more concentrated melon.</p>
        <p>Timing this reduction correctly is one of the most important (and hardest-learned) skills of melon farming, refined over generations on our farm.</p>` },
      { id:'organic', icon:'🌿', title:'Our Organic Farming Practices', teaser:'How we protect the soil and the fruit without synthetic chemicals.',
        body:`<p>We rotate crops between seasons to keep the soil healthy and break pest cycles naturally, rather than relying on synthetic pesticides. Compost made from our own farm waste feeds the soil ahead of every planting.</p>
        <p>Beneficial insects and companion planting help keep pests in check, and we hand-inspect vines regularly so problems are caught early and treated with natural remedies.</p>
        <p>The result is fruit grown the way it was on this land since 1986 — good for the soil, good for the vines, and good for the people who eventually enjoy the melon.</p>` }
    ];

    function renderLearn(){
      document.getElementById('learnGrid').innerHTML = articles.map(a => `
        <div class="learn-card" onclick="openArticle('${a.id}')">
          <div class="ic">${a.icon}</div>
          <h3>${a.title}</h3>
          <p>${a.teaser}</p>
          <div class="read-more">Read more →</div>
        </div>`).join('');
    }

    function openArticle(id){
      const a = articles.find(x=>x.id===id);
      if(!a) return;
      document.getElementById('articleIcon').textContent = a.icon;
      document.getElementById('articleTitle').textContent = a.title;
      document.getElementById('articleBody').innerHTML = a.body + `<div class="learn-teaser"><b>Have a question of your own?</b> Tap the chat button in the corner and ask us directly.</div>`;
      document.getElementById('articleOverlay').classList.add('open');
    }
    function closeArticle(){ document.getElementById('articleOverlay').classList.remove('open'); }

    /* ---------- Simple messaging feature ---------- */
    const chatFaqs = [
      { q:'When will my melon be ready?', a:'Most melons are ready 12–18 days after reservation, depending on the variety. You can track exact progress anytime under "My Melons".' },
      { q:'How sweet is this variety?', a:'Each variety has its own natural sweetness range — Golden Melon runs richest, Winter Melon is mildest. We only harvest once a melon hits its target sweetness (Brix) level.' },
      { q:'Can I visit the farm?', a:'Yes! During harvest season you can book a visit to pick your reserved melon, take photos, taste fresh fruit, and meet the farmers. Head to "Visit the Farm" from the home page.' },
      { q:'Do you offer refunds?', a:'If something goes wrong with your reservation, message us here and our team will sort it out personally — just describe what happened.' },
      { q:'How is my melon delivered?', a:'Once harvested, your melon is hand-packed and moves through preparation and out-for-delivery steps, which you can watch update live in "My Melons".' }
    ];

    function renderChatSuggestions(){
      document.getElementById('chatSuggestions').innerHTML = chatFaqs.slice(0,3).map(f =>
        `<div class="chat-chip" onclick="askChat('${f.q.replace(/'/g,"\\'")}')">${f.q}</div>`
      ).join('');
    }

    function appendChatBubble(text, who){
      const body = document.getElementById('chatBody');
      const el = document.createElement('div');
      el.className = `chat-bubble ${who}`;
      el.textContent = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }

    function botReplyFor(question){
      const lower = question.toLowerCase();
      const match = chatFaqs.find(f => lower.includes(f.q.toLowerCase().split(' ')[1]) || lower.includes(f.q.toLowerCase()));
      if(match) return match.a;
      if(lower.includes('ready') || lower.includes('when')) return chatFaqs[0].a;
      if(lower.includes('sweet') || lower.includes('brix')) return chatFaqs[1].a;
      if(lower.includes('visit') || lower.includes('farm')) return chatFaqs[2].a;
      if(lower.includes('refund') || lower.includes('problem')) return chatFaqs[3].a;
      if(lower.includes('deliver')) return chatFaqs[4].a;
      return "Thanks for your message! A member of our farm team will get back to you personally soon. In the meantime, feel free to browse the Farm Journal to learn more about how your melon is grown.";
    }

    function askChat(q){
      appendChatBubble(q, 'user');
      setTimeout(()=> appendChatBubble(botReplyFor(q), 'bot'), 450);
    }

    function sendChatMessage(){
      const input = document.getElementById('chatInput');
      const val = input.value.trim();
      if(!val) return;
      askChat(val);
      input.value = '';
    }

    function openChat(){
      const body = document.getElementById('chatBody');
      if(body.childElementCount === 0){
        appendChatBubble("Hi! 👋 I'm here to help with anything about your melon, our farm, or your reservation.", 'bot');
      }
      renderChatSuggestions();
      document.getElementById('chatOverlay').classList.add('open');
    }
    function closeChat(){ document.getElementById('chatOverlay').classList.remove('open'); }

    /* ---------- Occasional surprise gifts ---------- */
    const giftPool = [
      { icon:'🌱', text:'A packet of heirloom melon seeds for your own garden' },
      { icon:'💌', text:'A handwritten thank-you card from our farmers' },
      { icon:'📖', text:'A small recipe booklet using fresh melon' },
      { icon:'🍯', text:'A jar of local honey from a neighboring farm' }
    ];
    function maybeAssignGift(){
      if(Math.random() < 0.4){
        return giftPool[Math.floor(Math.random()*giftPool.length)];
      }
      return null;
    }

    /* ---------- Farm visit booking ---------- */
    const visitActivities = [
      { id:'harvest', icon:'🍈', label:'Harvest my reserved melon' },
      { id:'photos', icon:'📷', label:'Take photos on the farm' },
      { id:'taste', icon:'🍽️', label:'Taste fresh melons' },
      { id:'learn', icon:'🧑‍🌾', label:'Learn from the farmers' }
    ];

    function toggleActivity(id){
      if(selectedActivities.includes(id)) selectedActivities = selectedActivities.filter(x=>x!==id);
      else selectedActivities.push(id);
      renderVisit();
    }

    function renderVisit(){
      const c = document.getElementById('visitWrap');
      if(farmVisitBooked){
        c.innerHTML = `
          <div class="visit-confirm">
            <div class="ic">✅</div>
            <h3 style="margin-bottom:6px;">Visit Booked!</h3>
            <p style="color:var(--muted); font-size:13.5px; line-height:1.6;">We can't wait to welcome you to the farm during harvest season. A confirmation with directions and timing will be sent to your email.</p>
          </div>`;
        return;
      }
      c.innerHTML = `
        <p style="color:var(--muted); font-size:13.5px; line-height:1.7; margin-bottom:18px;">Turn your reservation into an experience — come out during harvest season and take part in the farm day-of. Choose what you'd like to do:</p>
        <div class="activity-grid">
          ${visitActivities.map(a => `
            <div class="activity-check ${selectedActivities.includes(a.id)?'checked':''}" onclick="toggleActivity('${a.id}')">
              <span>${a.icon}</span><span>${a.label}</span>
            </div>`).join('')}
        </div>
        <div class="visit-field">
          <label>Preferred date (during harvest season)</label>
          <input type="date" id="visitDate">
        </div>
        <div class="visit-field">
          <label>Number of guests</label>
          <input type="number" id="visitGuests" min="1" value="1">
        </div>
        <button class="btn btn-purple btn-block" onclick="bookVisit()">Confirm Farm Visit</button>
      `;
    }

    function bookVisit(){
      const date = document.getElementById('visitDate').value;
      if(!date){ showToast('Pick a date for your visit first'); return; }
      if(selectedActivities.length===0){ showToast('Choose at least one activity'); return; }
      farmVisitBooked = true;
      updatePoints(50);
      showToast('Farm visit booked! See you at harvest time 🚜');
      renderVisit();
      checkBadges();
    }

    /* ---------- Gamified badges ---------- */
    const badgeDefs = [
      { id:'first', icon:'🌱', label:'First Reservation', pts:50, condition: () => reservations.length >= 1 },
      { id:'harvest', icon:'🏆', label:'Harvest Master', pts:100, condition: () => reservations.some(r => r.delivery && r.delivery.step === deliverySteps.length-1) },
      { id:'loyal', icon:'💛', label:'Loyal Customer', pts:200, condition: () => reservations.length >= 3 },
      { id:'explorer', icon:'🎁', label:'Farm Explorer', pts:50, condition: () => farmVisitBooked },
      { id:'supporter', icon:'⭐', label:'Top Supporter', pts:150, condition: () => userPoints >= 500 }
    ];
    let unlockedBadges = [];

    function checkBadges(){
      badgeDefs.forEach(b => {
        if(!unlockedBadges.includes(b.id) && b.condition()){
          unlockedBadges.push(b.id);
          updatePoints(b.pts);
          showToast(`🏅 Badge unlocked: ${b.label} (+${b.pts} pts)`);
        }
      });
      renderBadges();
    }

    function renderBadges(){
      const el = document.getElementById('badgesGrid');
      if(!el) return;
      el.innerHTML = badgeDefs.map(b => {
        const unlocked = unlockedBadges.includes(b.id);
        return `
        <div class="badge ${unlocked ? '' : 'locked'}">
          <div class="circle ${unlocked ? '' : 'locked-circle'}">${b.icon}</div>${b.label}<br>${unlocked ? 'Unlocked' : `+${b.pts} pts`}
        </div>`;
      }).join('');
    }

    function updatePoints(delta){
      userPoints += delta;
      const el = document.getElementById('pointsNum');
      if(el) el.textContent = userPoints;
    }

    function randomActuals(){
      const daysAhead = 12 + Math.floor(Math.random()*7); // 12-18 days
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      const weight = Math.round((1.6 + Math.random()*1.8) * 10) / 10; // 1.6-3.4 kg
      const brix = Math.round((12 + Math.random()*4) * 10) / 10; // 12-16
      return { date: d.toISOString().slice(0,10), weight, brix };
    }

    function melonSVG(color, lines){
      return `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="52" r="40" fill="${color}"/>
        <path d="M15 40 Q50 25 85 40" stroke="${lines}" stroke-width="2" fill="none" opacity=".6"/>
        <path d="M12 52 Q50 40 88 52" stroke="${lines}" stroke-width="2" fill="none" opacity=".6"/>
        <path d="M15 64 Q50 78 85 64" stroke="${lines}" stroke-width="2" fill="none" opacity=".6"/>
        <path d="M40 14 Q50 8 46 20" stroke="#6B8F4E" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="55" cy="16" rx="8" ry="5" fill="#6B8F4E" transform="rotate(-20 55 16)"/>
      </svg>`;
    }

    function renderHomeGrid(){
      document.getElementById('homeGrid').innerHTML = melons.map(m => {
        const soldOut = m.stock.length === 0;
        return `
        <div class="melon-card" onclick="${soldOut ? '' : `openDetail(${m.id})`}" style="${soldOut ? 'opacity:.55; cursor:default;' : ''}">
          <div class="melon-thumb">${melonSVG(m.color, m.lines)}<div class="stock-pill">${soldOut ? 'Sold out' : m.stock.length + ' left'}</div></div>
          <div class="name">${m.name}</div>
          <div class="desc">${m.desc}</div>
          <div class="price">฿${m.price}/kg</div>
          <button class="btn btn-purple btn-block" ${soldOut ? 'disabled' : ''} onclick="event.stopPropagation(); ${soldOut ? '' : `openDetail(${m.id})`}">${soldOut ? 'Sold Out' : 'Reserve'}</button>
        </div>`;
      }).join('');
    }

    function openDetail(id){
      const m = melons.find(x=>x.id===id);
      document.getElementById('detailVisual').innerHTML = melonSVG(m.color, m.lines);
      document.getElementById('detailInfo').innerHTML = `
        <h1>${m.name}</h1>
        <div class="sub">${m.desc}</div>
        <div class="rating">★★★★★ &nbsp;${m.reviews}</div>
        <div class="price-big">฿${m.price} <span>/kg</span></div>
        <p class="about">${m.about}</p>
        <div class="stat-row">
          <div class="stat"><b>12–18</b>days to harvest</div>
          <div class="stat"><b>${m.stock.length}</b>melons available</div>
        </div>
        <button class="btn btn-purple" ${m.stock.length===0?'disabled':''} onclick="openReservation(${m.id})">${m.stock.length===0?'Sold Out':'Reserve Now'}</button>
      `;
      go('detail');
      window.scrollTo({top:0, behavior:'smooth'});
    }

    function openReservation(varietyId){
      pendingVarietyId = varietyId;
      pendingPayment = 'deposit';
      const m = melons.find(x=>x.id===varietyId);
      const nextId = m.stock[0];

      document.getElementById('resThumb').innerHTML = melonSVG(m.color, m.lines);
      document.getElementById('resUnitId').textContent = `ID: ${nextId}`;
      document.getElementById('resName').textContent = m.name;
      document.getElementById('resPrice').textContent = `฿${m.price}/kg`;
      document.getElementById('fullTitle').textContent = `Full Payment (฿${m.price})`;
      document.getElementById('resBack').onclick = () => openDetail(varietyId);

      selectPayment('deposit');
      go('reservation');
      window.scrollTo({top:0, behavior:'smooth'});
    }

    function selectPayment(type){
      pendingPayment = type;
      const m = melons.find(x=>x.id===pendingVarietyId);
      document.getElementById('optDeposit').classList.toggle('selected', type==='deposit');
      document.getElementById('optFull').classList.toggle('selected', type==='full');
      document.getElementById('optDeposit').querySelector('input').checked = type==='deposit';
      document.getElementById('optFull').querySelector('input').checked = type==='full';
      document.getElementById('totalLabel').textContent = type==='deposit' ? 'Total (Deposit)' : 'Total (Full Payment)';
      document.getElementById('totalAmount').textContent = type==='deposit' ? `฿${DEPOSIT_AMOUNT}` : `฿${m.price}`;
    }

    function confirmReservation(){
      const m = melons.find(x=>x.id===pendingVarietyId);
      if(m.stock.length === 0){ showToast('Sorry, that melon was just reserved by someone else.'); return; }
      const unitId = m.stock.shift(); // assign & remove from available stock

      reservations.push({
        unitId,
        varietyId: m.id,
        name: m.name,
        color: m.color,
        lines: m.lines,
        price: m.price,
        paymentType: pendingPayment,
        amountPaid: pendingPayment==='deposit' ? DEPOSIT_AMOUNT : m.price,
        reservedOn: new Date().toLocaleDateString(),
        growthStage: 0,
        delivery: null,
        actual: randomActuals(),
        guess: null,
        gift: maybeAssignGift()
      });

      showToast(`Reserved ${unitId} — ${pendingPayment==='deposit' ? `deposit ฿${DEPOSIT_AMOUNT} paid` : `paid in full (฿${m.price})`}`);
      go('myMelons');
      checkBadges();
    }

    function advanceGrowth(unitId){
      const r = reservations.find(x=>x.unitId===unitId);
      if(!r || r.growthStage >= growthStages.length-1) return;
      r.growthStage++;
      renderMyMelons();
    }

    function startDelivery(unitId){
      const r = reservations.find(x=>x.unitId===unitId);
      if(!r) return;
      r.delivery = { step:0 };
      showToast(`${unitId} harvested — delivery started`);
      renderMyMelons();
    }

    function advanceDelivery(unitId){
      const r = reservations.find(x=>x.unitId===unitId);
      if(!r || !r.delivery || r.delivery.step >= deliverySteps.length-1) return;
      r.delivery.step++;
      if(r.delivery.step === deliverySteps.length-1){
        showToast(`${unitId} delivered!`);
        checkBadges();
      }
      renderMyMelons();
    }

    function openGame(unitId){
      const r = reservations.find(x=>x.unitId===unitId);
      if(!r || r.guess) return;
      activeGameUnitId = unitId;
      document.getElementById('gameSub').innerHTML = `Take a guess on <b>${r.unitId} — ${r.name}</b> and win rewards if you're right.`;
      document.getElementById('guessDate').value = '';
      document.getElementById('guessWeight').value = '';
      document.getElementById('guessBrix').value = '';
      document.getElementById('gameOverlay').classList.add('open');
    }
    function closeGame(){ document.getElementById('gameOverlay').classList.remove('open'); }

    function submitGuess(){
      const r = reservations.find(x=>x.unitId===activeGameUnitId);
      if(!r) return;
      const gDate = document.getElementById('guessDate').value;
      const gWeight = parseFloat(document.getElementById('guessWeight').value);
      const gBrix = parseFloat(document.getElementById('guessBrix').value);
      if(!gDate || isNaN(gWeight) || isNaN(gBrix)){
        showToast('Fill in all three guesses first');
        return;
      }

      const dateDiff = Math.abs((new Date(gDate) - new Date(r.actual.date)) / 86400000);
      const dateCorrect = dateDiff <= 2;
      const weightCorrect = Math.abs(gWeight - r.actual.weight) <= 0.3;
      const brixCorrect = Math.abs(gBrix - r.actual.brix) <= 1;
      const correctCount = [dateCorrect, weightCorrect, brixCorrect].filter(Boolean).length;

      let rewardText, pointsEarned;
      if(correctCount === 3){ rewardText = 'Free delivery + 15% discount coupon + 200 pts'; pointsEarned = 200; }
      else if(correctCount === 2){ rewardText = '10% discount coupon + 100 pts'; pointsEarned = 100; }
      else if(correctCount === 1){ rewardText = '+50 pts for a close guess'; pointsEarned = 50; }
      else { rewardText = '+20 pts for playing'; pointsEarned = 20; }

      r.guess = { date:gDate, weight:gWeight, brix:gBrix, correctCount, rewardText, pointsEarned };
      updatePoints(pointsEarned);
      closeGame();
      showToast(`${correctCount}/3 correct — you earned ${rewardText}`);
      renderMyMelons();
      checkBadges();
    }

    function renderMyMelons(){
      const c = document.getElementById('resGrid');
      if(reservations.length === 0){
        c.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No melons reserved yet.<br>Browse the home page to reserve your first one.</div>`;
        return;
      }
      c.innerHTML = reservations.map((r) => {
        const pct = growthPct[r.growthStage];
        const payBadge = r.paymentType==='deposit'
          ? `<span class="pay-badge deposit">Deposit paid (฿${r.amountPaid})</span>`
          : `<span class="pay-badge full">Paid in full (฿${r.amountPaid})</span>`;

        let bottom = '';
        if(!r.delivery){
          const gameBlock = r.guess
            ? `<div class="guess-result">🎯 Your guess: ${r.guess.correctCount}/3 correct — ${r.guess.rewardText}</div>`
            : (r.growthStage < growthStages.length-1
                ? `<button class="guess-btn" onclick="openGame('${r.unitId}')">🎮 Guess the Harvest & Win</button>`
                : '');
          const journalNudge = r.growthStage < growthStages.length-1
            ? `<div class="learn-teaser" style="margin:10px 0 0;">🌱 While it grows — <span style="color:var(--purple-deep); font-weight:600; cursor:pointer;" onclick="go('learn')">read the Farm Journal</span></div>`
            : '';
          const giftBanner = r.gift
            ? `<div class="gift-banner">${r.gift.icon} A little something extra will arrive with your order: ${r.gift.text}</div>`
            : '';
          bottom = `
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div class="progress-label"><span>${growthStages[r.growthStage]}</span><span>${pct}%</span></div>
            ${r.growthStage < growthStages.length-1
              ? `<button class="btn btn-outline btn-sm btn-block" onclick="advanceGrowth('${r.unitId}')" style="margin-bottom:8px;">🔄 Simulate growth</button>`
              : `<button class="btn btn-purple btn-sm btn-block" onclick="startDelivery('${r.unitId}')" style="margin-bottom:8px;">Harvest & Start Delivery</button>`}
            ${gameBlock}
            ${giftBanner}
            ${journalNudge}
          `;
        } else {
          const giftBanner = r.gift
            ? `<div class="gift-banner">${r.gift.icon} A little something extra is on its way: ${r.gift.text}</div>`
            : '';
          bottom = `
            <ul class="delivery-list">
              ${deliverySteps.map((s,i) => `
                <li class="${i < r.delivery.step ? 'done' : i===r.delivery.step ? 'current' : ''}">
                  <span class="dchk">${i <= r.delivery.step ? '✓' : ''}</span>${s}
                </li>`).join('')}
            </ul>
            ${r.delivery.step < deliverySteps.length-1
              ? `<button class="btn btn-outline btn-sm btn-block" onclick="advanceDelivery('${r.unitId}')">🔄 Simulate next step</button>`
              : `<div style="text-align:center; font-size:12.5px; color:var(--green); font-weight:600;">✓ Delivered</div>`}
            ${giftBanner}
          `;
        }

        return `
        <div class="res-card">
          <div class="top">
            <div class="res-thumb">${melonSVG(r.color, r.lines)}</div>
            <div>
              <div class="unit-id">ID: ${r.unitId}</div>
              <div class="name">${r.name}</div>
              <div class="meta">Reserved ${r.reservedOn}</div>
              ${payBadge}
            </div>
          </div>
          ${bottom}
        </div>`;
      }).join('');
    }

    const navItems = [
      { id:'home', label:'Home', icon:'⌂' },
      { id:'learn', label:'Learn', icon:'📖' },
      { id:'myMelons', label:'My Melons', icon:'🍈' },
      { id:'rewards', label:'Rewards', icon:'★' },
      { id:'profile', label:'Profile', icon:'☺' },
    ];

    function renderNav(active){
      document.getElementById('navLinks').innerHTML = navItems.map(t => `
        <li><button class="${t.id===active?'active':''}" onclick="go('${t.id}')">${t.label}</button></li>
      `).join('');
      document.getElementById('tabbar').innerHTML = navItems.map(t => `
        <button class="tab ${t.id===active?'active':''}" onclick="go('${t.id}')">
          <span class="dot"></span><span class="ic">${t.icon}</span>${t.label}
        </button>`).join('');
    }

    function go(view){
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.getElementById('page-'+view).classList.add('active');
      renderNav(['home','learn','myMelons','rewards','profile'].includes(view) ? view : 'home');
      if(view==='home') renderHomeGrid();
      if(view==='myMelons') renderMyMelons();
      if(view==='learn') renderLearn();
      if(view==='visit') renderVisit();
      if(view==='rewards') renderBadges();
    }

    function scrollToGrid(){ document.getElementById('gridAnchor').scrollIntoView({behavior:'smooth', block:'start'}); }
    function openAuth(){ document.getElementById('authOverlay').classList.add('open'); }
    function closeAuth(){ document.getElementById('authOverlay').classList.remove('open'); showToast('Logged in'); }

    function showToast(msg){
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(()=>t.classList.remove('show'), 2400);
    }

    document.getElementById('heroSvg').innerHTML = melonSVG('#E8A33D', '#C97C1E');
    renderHomeGrid();
    renderNav('home');
    renderLearn();
    renderBadges();