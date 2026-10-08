const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {normalizeCalendarData} = require('../server');

test('week preference defaults to Sunday and preserves Monday', () => {
  assert.equal(normalizeCalendarData({}).weekStartsOn, 0);
  assert.equal(normalizeCalendarData({weekStartsOn:1}).weekStartsOn, 1);
  assert.equal(normalizeCalendarData({weekStartsOn:7}).weekStartsOn, 0);
});

test('weekly calculation always starts Monday regardless of display preference', () => {
  const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const context = {weekStartsOn:0, Date};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function startOfWeek('), source.indexOf('function getCalendarDayNames(')), context);
  const date = new Date(2027,0,1);
  assert.equal(context.startOfWeek(date).getDay(), 1);
  assert.equal(context.startOfWeek(date).getDate(), 28);
  context.weekStartsOn = 1;
  assert.equal(context.startOfWeek(date).getDay(), 1);
  assert.equal(context.startOfWeek(date).getDate(), 28);
  assert.equal(context.startOfWeek(new Date(2027,0,3)).getDate(), 28);
});

test('monthly grid follows display preference independently of weekly totals', () => {
  const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const context = {weekStartsOn:0, Date, addDays:(date,n)=>{const d=new Date(date); d.setDate(d.getDate()+n); return d;}};
  vm.createContext(context);
  const start = source.indexOf('function getMonthGridDays(');
  vm.runInContext(source.slice(start, source.indexOf('\n}', start)+2), context);
  const month = new Date(2027,0,1);
  assert.equal(context.getMonthGridDays(month)[0].getDay(),0);
  assert.equal(context.getMonthGridDays(month).length,42);
  context.weekStartsOn=1;
  assert.equal(context.getMonthGridDays(month)[0].getDay(),1);
});

test('account update requires authentication/password and cannot change another user or role', async () => {
  const source = fs.readFileSync(require.resolve('../server'), 'utf8');
  const route = source.slice(source.indexOf('    if (request.method === "PUT" && pathname === "/api/account")'), source.indexOf('    if (request.method === "GET" && pathname === "/api/public-holidays")'));
  let saved, result;
  const context = {
    request:{method:'PUT'}, pathname:'/api/account', response:{}, session:null,
    sendJson:(_, status, data) => { result={status,data}; },
    findUser:async () => ({username:'self',role:'user',passwordHash:'old'}),
    readJsonBody:async () => ({currentPassword:'correct',email:'me@example.com',password:'newpass',role:'admin',username:'other'}),
    verifyPassword:password => password === 'correct',
    normalizeEmail:email => email, isValidEmail:() => true,
    findDuplicateUserEmail:async () => false,
    hashPassword:() => 'newhash', updateUser:async user => {saved=user;},
    setSessionCookie:() => {}, publicUser:user => user
  };
  vm.createContext(context);
  const run = () => vm.runInContext('(async () => {'+route+'})()', context);
  await run(); assert.equal(result.status,401); assert.equal(saved,undefined);
  context.session={sub:'self'}; context.verifyPassword=()=>false;
  await run(); assert.equal(result.status,400); assert.equal(saved,undefined);
  context.verifyPassword=()=>true;
  await run(); assert.equal(result.status,200); assert.equal(saved.username,'self'); assert.equal(saved.role,'user'); assert.equal(saved.passwordHash,'newhash');
  saved=undefined; context.findDuplicateUserEmail=async()=>true;
  await run(); assert.equal(result.status,409); assert.equal(saved,undefined);
});
