(function () {
  'use strict';

  let dialog = document.getElementById('applicationPathDialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'applicationPathDialog';
    dialog.className = 'application-path-dialog';
    dialog.setAttribute('aria-labelledby', 'applicationPathTitle');
    dialog.innerHTML = `<div class="application-path-dialog__surface">
      <button type="button" class="application-path-dialog__close" data-application-chooser-close aria-label="신청 방법 선택 닫기">×</button>
      <h2 id="applicationPathTitle">어떻게 신청하시겠어요?</h2>
      <p class="application-path-dialog__intro">원하는 방법을 선택해주세요.</p>
      <div class="application-path-dialog__options">
        <div class="application-choice-row"><a class="application-path-dialog__option" href="apply.html"><strong>1. 바로 신청하기</strong></a><button type="button" class="application-choice-help" aria-expanded="false" aria-controls="directHelp" aria-label="바로 신청하기 설명">?</button><p id="directHelp" class="application-choice-tooltip" hidden>기입한 정보를 바탕으로 선생님과 자동으로 매칭 됩니다.</p></div>
        <div class="application-choice-row"><a class="application-path-dialog__option" href="teachers.html"><strong>2. 선생님 둘러보고 신청하기</strong></a><button type="button" class="application-choice-help" aria-expanded="false" aria-controls="browseHelp" aria-label="선생님 둘러보고 신청하기 설명">?</button><p id="browseHelp" class="application-choice-tooltip" hidden>선생님을 직접 선택하고 선생님의 스케줄에 맞춰서 매칭 됩니다.</p></div>
      </div></div>`;
    document.body.appendChild(dialog);
  }

  // The home page supplies its own dialog; enhance both existing and generated markup.
  dialog.querySelectorAll('.application-path-dialog__option').forEach((link, index) => {
    if (link.closest('.application-choice-row')) return;
    const row = document.createElement('div'); row.className = 'application-choice-row';
    link.replaceWith(row); row.appendChild(link);
    const id = 'applicationHelp' + index;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'application-choice-help';
    button.textContent = '?'; button.setAttribute('aria-expanded','false'); button.setAttribute('aria-controls',id); button.setAttribute('aria-label',link.textContent.trim()+' 설명');
    const tip = document.createElement('p'); tip.id=id; tip.className='application-choice-tooltip'; tip.hidden=true;
    tip.textContent=index===0?'기입한 정보를 바탕으로 선생님과 자동으로 매칭 됩니다.':'선생님을 직접 선택하고 선생님의 스케줄에 맞춰서 매칭 됩니다.';
    row.append(button,tip);
  });
  const helpButtons = [...dialog.querySelectorAll('.application-choice-help')];
  function hideHelp(except) {
    helpButtons.forEach(button => {
      if (button === except) return;
      document.getElementById(button.getAttribute('aria-controls')).hidden = true;
      button.setAttribute('aria-expanded', 'false');
    });
  }
  helpButtons.forEach(button => {
    const row = button.closest('.application-choice-row');
    const label = document.createElement('div'); label.className = 'application-choice-label';
    row.prepend(label);
    label.append(row.querySelector('a'), button);
    button.addEventListener('click', () => {
      const tip = document.getElementById(button.getAttribute('aria-controls'));
      const opening = tip.hidden;
      hideHelp(); tip.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
    });
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.application-choice-help')) hideHelp();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideHelp(); });
  dialog.addEventListener('close', () => hideHelp());
  const triggers = Array.from(document.querySelectorAll('[data-application-chooser]'));
  const closeButton = dialog.querySelector('[data-application-chooser-close]');
  const firstChoice = dialog.querySelector('.application-path-dialog__option');
  let returnFocus = null;

  let directAction = null;
  function showChoices(options) {
    returnFocus = options.trigger || document.activeElement;
    directAction = options.onDirect || null;
    const kind = options.kind || 'regular';
    dialog.querySelectorAll('.application-path-dialog__option').forEach((link,index)=>{
      const url = new URL(index===0 ? (kind==='trial'?'trial.html':'apply.html') : 'teachers.html',location.href);
      url.searchParams.set('lesson_kind',kind);
      if (index===1) url.searchParams.set('mode',kind);
      if (options.trialType) url.searchParams.set('trial_type',options.trialType);
      if (options.trialType==='paid' && index===1) url.searchParams.set('plan','economy');
      if (new URL(location.href).searchParams.get('test')==='1') url.searchParams.set('test','1');
      link.href=url.href;
    });
    document.getElementById('navLinks')?.classList.remove('mobile-open');
    const menu = document.getElementById('navToggle');
    if (menu) { menu.textContent = '☰'; menu.setAttribute('aria-expanded', 'false'); }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.requestAnimationFrame(() => firstChoice?.focus());
  }

  function openDialog(event) {
    event.preventDefault();
    showChoices({kind:event.currentTarget.dataset.lessonKind || 'regular',trigger:event.currentTarget});
  }
  firstChoice.addEventListener('click',event=>{
    if (!directAction) return;
    event.preventDefault();
    const action=directAction; directAction=null;
    closeDialog(); action();
  });
  window.NADOApplicationChooser = Object.freeze({open:showChoices});

  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  triggers.forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.addEventListener('click', openDialog);
  });
  closeButton?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    const returnTarget = returnFocus?.isConnected && returnFocus.getClientRects().length
      ? returnFocus
      : document.getElementById('navToggle');
    returnTarget?.focus({ preventScroll: true });
    returnFocus = null;
  });
}());
