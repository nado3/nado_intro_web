const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8');
function setup(directory=false){
 const elements={};
 const element=id=>elements[id]||=( {value:'',innerHTML:'',textContent:'',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},querySelector(){return {focus(){}};}} );
 const buttons=['09:00','09:30'].map(time=>({dataset:{firstTime:time},disabled:false,setAttribute(){}}));
 const answers={firstLessonOptions:[{date:'2026-09-22',time:'09:30'}]};
 class FixedDate extends Date { constructor(...args){super(...(args.length?args:['2026-09-21T12:00:00']));} }
 const context={Date:FixedDate,answers,firstLessonCalendarDate:'',DIRECTORY_SELECTION:directory,
 document:{getElementById:element},qcardWrap:{querySelectorAll:()=>buttons,querySelector:element},
 validFirstLessonOption:({date})=>date>='2026-09-21'&&(!directory||new Date(date+'T12:00:00').getDay()===2),
 availableFirstLessonDates:()=>['2026-09-21','2026-09-22'],
 localDateInputValue:date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'),
 escapeApplicationHtml:x=>x,firstLessonOptionLabel:x=>x.date+' '+x.time,setNextState(){},syncFirstLessonOptions(){},step:{}};
 const start=source.indexOf("    const dateInput = document.getElementById('firstLessonDate');",source.indexOf("} else if (step.type === 'firstlesson') {",source.indexOf('setNextState(step)')));
 assert.ok(start>0);
 vm.runInNewContext(source.slice(start,source.indexOf('    let drag = null;',start)),context);
 const click=(kind,value)=>element('firstLessonCalendar').listeners.click({target:{closest:selector=>selector==='[data-calendar-'+kind+']'?{disabled:false,dataset:{[kind==='date'?'calendarDate':'calendarMonth']:value}}:null}});
 return {elements,answers,click,buttons};
}
test('inline calendar opens immediately and retains time choices across dates',()=>{
 const {elements,answers,click}=setup();
 assert.match(elements.firstLessonCalendar.innerHTML,/2026년 9월/);
 assert.equal(elements.firstLessonDate.value,'2026-09-22');
 assert.match(elements.firstLessonCalendar.innerHTML,/data-calendar-date="2026-09-20"[^>]*disabled/);
 click('date','2026-09-23');assert.equal(elements.firstLessonDate.value,'2026-09-23');
 click('date','2026-09-22');assert.equal(answers.firstLessonOptions[0].time,'09:30');
 click('month','1');assert.match(elements.firstLessonCalendar.innerHTML,/2026년 10월/);
 click('month','1');click('month','1');click('month','1');
 assert.match(elements.firstLessonCalendar.innerHTML,/2027년 1월/);
});
test('teacher-selected calendar disables dates outside teacher availability',()=>{
 const {elements}=setup(true);
 assert.match(elements.firstLessonCalendar.innerHTML,/data-calendar-date="2026-09-23"[^>]*disabled/);
 assert.doesNotMatch(elements.firstLessonCalendar.innerHTML,/data-calendar-date="2026-09-22"[^>]*disabled/);
});
