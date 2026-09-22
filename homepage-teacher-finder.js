(function () {
  'use strict';
  const root = document.getElementById('teacher-finder');
  if (!root) return;
  const picker = root.querySelector('#teacherRegionPicker');
  const selection = root.querySelector('#finderSelection');
  const directory = root.querySelector('#teacherDirectory');
  const params = new URL(location.href).searchParams;
  const paidTrial = params.get('trial_type') === 'paid' && (params.get('mode') === 'trial' || params.get('finder') === 'trial');
  let paidPlan = ['economy','standard','premium'].includes(params.get('plan')) ? params.get('plan') : 'economy';
  let selectedRegion = new URL(location.href).searchParams.get('region') || 'Songdo';
  if (!['Songdo','Seoul'].includes(selectedRegion)) selectedRegion = 'Songdo';
  const api = () => window.NADOTeacherDirectory;
  function render() {
    picker.hidden = false;
    root.dataset.finderMode = paidTrial ? 'trial' : 'regular';
    root.querySelector('#paidTrialPlanFilter').hidden = !paidTrial;
    root.querySelectorAll('[data-paid-plan]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.paidPlan===paidPlan)));
    root.querySelector('.finder-discount-note').hidden = paidTrial;
    const teacherType=api()?.getState().teacherType || '';
    root.querySelectorAll('[data-teacher-type]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.teacherType===teacherType)));
    selection.hidden = true;
    selection.querySelector('span').textContent = selectedRegion === 'Seoul' ? '서울' : '송도';
    directory.hidden = !selectedRegion;
    const url = new URL(paidTrial ? 'trial.html?lesson_kind=trial&trial_type=paid&plan='+paidPlan : 'apply.html',location.href);
    if (['localhost', '127.0.0.1', '::1', 'terminal.local'].includes(location.hostname)) url.searchParams.set('test', '1');
    root.querySelector('[data-manual-apply]').href = url.href;
  }
  function apply() {
    api()?.setMode(paidTrial ? 'trial' : 'regular', {trialType:paidTrial?'paid':'',planFilter:paidTrial?paidPlan:''});
    if (selectedRegion) api()?.selectRegion(selectedRegion);
    else api()?.resetRegion(false);
    render();
    const url = new URL(location.href);
    ['finder','trial_type','plan','region'].forEach(key => url.searchParams.delete(key));
    if (paidTrial) { url.searchParams.set('mode','trial'); url.searchParams.set('lesson_kind','trial'); url.searchParams.set('trial_type','paid'); url.searchParams.set('plan',paidPlan); }
    if (selectedRegion) url.searchParams.set('region',selectedRegion);
    history.replaceState(history.state,'',url);
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-directory-region]');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    selectedRegion = button.dataset.directoryRegion;apply();
  },true);
  root.querySelectorAll('[data-teacher-type]').forEach(button=>button.addEventListener('click',()=>{api()?.setTeacherType(button.dataset.teacherType);render();}));
  root.querySelectorAll('[data-paid-plan]').forEach(button=>button.addEventListener('click',()=>{paidPlan=button.dataset.paidPlan;apply();}));
  root.querySelector('#finderChange').addEventListener('click',()=>{selectedRegion='';apply();});
  document.querySelectorAll('[data-open-trial]').forEach(link=>{link.removeAttribute('data-open-trial');link.href='trial.html';});
  window.addEventListener('nado:teacher-directory-ready',apply,{once:true});
  window.addEventListener('nado:teacher-directory-updated',render);
  window.addEventListener('popstate',()=>location.reload());
  window.NADOHomepageTeacherFinder = Object.freeze({getState:()=>({selectedRegion,mode:paidTrial?'trial':'regular'})});
  render();
}());
