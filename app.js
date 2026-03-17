const display = document.getElementById("calcDisplay");
const slider = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

let calcMemory = 0;
let lastCalcAnswer = 0;

const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lower = "abcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const symbols = "!@#$%^&*()_+[]{}<>?";
const ambiguous = /[O0l1I]/g;

function showTool(toolId){
  document.querySelectorAll('.tool').forEach(el => el.classList.remove('active'));
  document.getElementById(toolId).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  if(toolId === 'calculatorTool') document.getElementById('tabCalc').classList.add('active');
  if(toolId === 'passwordTool') document.getElementById('tabPass').classList.add('active');
  if(toolId === 'timeTool') document.getElementById('tabTime').classList.add('active');
}

function toggleMode(){
  document.body.classList.toggle('light');
  localStorage.setItem('smartcalc_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function press(val){
  if(display.value === 'Error') display.value = '';
  display.value += val;
}
function clearCalc(){ display.value = ''; }
function deleteLast(){ display.value = display.value.slice(0, -1); }
function insertConstant(type){ display.value += type === 'PI' ? 'PI' : 'E'; }
function insertLastAnswer(){ display.value += String(lastCalcAnswer); }

function factorial(n){
  if(!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Factorial solo admite enteros entre 0 y 170');
  let f = 1;
  for(let i = 2; i <= n; i++) f *= i;
  return f;
}

function evaluateExpression(expr){
  const clean = expr.replace(/\s+/g, '').replace(/π/g, 'PI').replace(/Ans/g, String(lastCalcAnswer));
  if(!/^[0-9+\-*/%^().,A-Za-z]*$/.test(clean)) throw new Error('Caracteres no permitidos');

  const transformed = clean
    .replace(/\^/g, '**')
    .replace(/\bPI\b/g, 'Math.PI')
    .replace(/\bE\b/g, 'Math.E')
    .replace(/\bsin\(/g, 'Math.sin(')
    .replace(/\bcos\(/g, 'Math.cos(')
    .replace(/\btan\(/g, 'Math.tan(')
    .replace(/\basin\(/g, 'Math.asin(')
    .replace(/\bacos\(/g, 'Math.acos(')
    .replace(/\batan\(/g, 'Math.atan(')
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\bcbrt\(/g, 'Math.cbrt(')
    .replace(/\blog\(/g, 'Math.log10(')
    .replace(/\bln\(/g, 'Math.log(')
    .replace(/\bexp\(/g, 'Math.exp(')
    .replace(/\babs\(/g, 'Math.abs(')
    .replace(/\bfloor\(/g, 'Math.floor(')
    .replace(/\bceil\(/g, 'Math.ceil(')
    .replace(/\bround\(/g, 'Math.round(')
    .replace(/\bfact\(/g, 'factorial(');

  if(/[A-Za-z]/.test(transformed.replace(/Math|factorial|log10/g, ''))) throw new Error('Función inválida');

  const result = Function('factorial', `return (${transformed});`)(factorial);
  if(!Number.isFinite(result)) throw new Error('Resultado inválido');
  return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(10)));
}

function calculate(){
  if(!display.value) return;
  try{
    const expression = display.value;
    const result = evaluateExpression(expression);
    display.value = result;
    lastCalcAnswer = Number(result);
    updateMemoryLabels();
    addCalcHistory(`${expression} = ${result}`);
  }catch(error){
    display.value = 'Error';
    showToast(error.message);
  }
}

function addCalcHistory(entry){
  const history = document.getElementById('calcHistory');
  const item = document.createElement('div');
  item.innerText = entry;
  history.prepend(item);
  while(history.children.length > 25) history.removeChild(history.lastChild);
}
function clearCalcHistory(){ document.getElementById('calcHistory').innerHTML = ''; }

function memoryAdd(){
  const n = Number(display.value);
  if(Number.isFinite(n)){ calcMemory += n; updateMemoryLabels(); }
}
function memorySubtract(){
  const n = Number(display.value);
  if(Number.isFinite(n)){ calcMemory -= n; updateMemoryLabels(); }
}
function memoryRecall(){ display.value = String(calcMemory); }
function memoryClear(){ calcMemory = 0; updateMemoryLabels(); }
function updateMemoryLabels(){
  document.getElementById('memoryValue').innerText = String(Number(calcMemory.toFixed(10)));
  document.getElementById('lastAnswer').innerText = String(Number(lastCalcAnswer.toFixed(10)));
}

slider.oninput = () => {
  lengthValue.innerText = slider.value;
  savePasswordPrefs();
};
["upper", "lower", "numbers", "symbols", "excludeSimilar"].forEach(id => {
  document.getElementById(id).addEventListener('change', savePasswordPrefs);
});

function secureRandomInt(max){
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}
function randomChar(set){ return set.charAt(secureRandomInt(set.length)); }

function selectedSets(){
  const exclude = document.getElementById('excludeSimilar').checked;
  const sets = [];
  const addSet = (enabled, set) => {
    if(!enabled) return;
    const clean = exclude ? set.replace(ambiguous, '') : set;
    if(clean) sets.push(clean);
  };
  addSet(document.getElementById('upper').checked, upper);
  addSet(document.getElementById('lower').checked, lower);
  addSet(document.getElementById('numbers').checked, numbers);
  addSet(document.getElementById('symbols').checked, symbols);
  return sets;
}

function generatePassword(){
  const sets = selectedSets();
  if(!sets.length) return showToast('Selecciona al menos una opción');

  const length = Number(slider.value);
  if(length < sets.length) return showToast('Aumenta la longitud');

  const chars = [];
  sets.forEach(set => chars.push(randomChar(set)));
  const all = sets.join('');
  while(chars.length < length) chars.push(randomChar(all));

  for(let i = chars.length - 1; i > 0; i--){
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const pass = chars.join('');
  document.getElementById('password').innerText = pass;
  checkStrength(pass);
  addHistory(pass);
}

function copyPassword(){
  const text = document.getElementById('password').innerText;
  if(!text || text === 'Pulsa generar') return showToast('Genera una contraseña primero');
  navigator.clipboard.writeText(text).then(() => showToast('Contraseña copiada'));
}

function checkStrength(pass){
  let score = 0;
  if(pass.length >= 12) score++;
  if(pass.length >= 18) score++;
  if(/[A-Z]/.test(pass)) score++;
  if(/[a-z]/.test(pass)) score++;
  if(/[0-9]/.test(pass)) score++;
  if(/[^A-Za-z0-9]/.test(pass)) score++;

  const bar = document.getElementById('strengthBar');
  const txt = document.getElementById('strengthText');
  const tip = document.getElementById('passwordTip');
  bar.style.width = `${(score / 6) * 100}%`;

  if(score <= 2){ bar.style.background = '#ef4444'; txt.innerText = 'Fortaleza: Débil'; }
  else if(score <= 4){ bar.style.background = '#f59e0b'; txt.innerText = 'Fortaleza: Media'; }
  else { bar.style.background = '#22c55e'; txt.innerText = 'Fortaleza: Fuerte'; }

  tip.innerText = score < 6 ? 'Tip: activa símbolos y usa más longitud para mayor seguridad.' : 'Excelente combinación de seguridad.';
}

function addHistory(pass){
  const history = document.getElementById('history');
  const item = document.createElement('div');
  item.innerText = pass;
  history.prepend(item);
  while(history.children.length > 20) history.removeChild(history.lastChild);
}
function clearPasswordHistory(){ document.getElementById('history').innerHTML = ''; }

let stopwatchElapsed = 0;
let stopwatchStart = 0;
let stopwatchTimer = null;

function formatStopwatch(ms){
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return `${h}:${m}:${s}.${cs}`;
}
function updateStopwatch(){
  const now = Date.now();
  document.getElementById('stopwatchDisplay').innerText = formatStopwatch(stopwatchElapsed + (now - stopwatchStart));
}
function startStopwatch(){
  if(stopwatchTimer) return;
  stopwatchStart = Date.now();
  stopwatchTimer = setInterval(updateStopwatch, 30);
}
function pauseStopwatch(){
  if(!stopwatchTimer) return;
  stopwatchElapsed += Date.now() - stopwatchStart;
  clearInterval(stopwatchTimer);
  stopwatchTimer = null;
}
function resetStopwatch(){
  pauseStopwatch();
  stopwatchElapsed = 0;
  document.getElementById('stopwatchDisplay').innerText = '00:00:00.00';
  document.getElementById('lapList').innerHTML = '';
}
function lapStopwatch(){
  const lap = document.createElement('div');
  const current = stopwatchTimer ? stopwatchElapsed + (Date.now() - stopwatchStart) : stopwatchElapsed;
  lap.innerText = `Vuelta ${document.getElementById('lapList').children.length + 1}: ${formatStopwatch(current)}`;
  document.getElementById('lapList').prepend(lap);
}

let timerDuration = 300;
let timerRemaining = 300;
let timerInterval = null;

function formatTimer(totalSec){
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
function updateTimerDisplay(){
  document.getElementById('timerDisplay').innerText = formatTimer(timerRemaining);
}
function setTimerFromInputs(){
  const min = Number(document.getElementById('timerMinutes').value) || 0;
  const sec = Number(document.getElementById('timerSeconds').value) || 0;
  timerDuration = (min * 60) + sec;
  timerRemaining = timerDuration;
  updateTimerDisplay();
}
function startTimer(){
  if(timerInterval) return;
  if(timerRemaining <= 0) setTimerFromInputs();
  if(timerRemaining <= 0) return showToast('Define un tiempo mayor a 0');

  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();
    if(timerRemaining <= 0){
      clearInterval(timerInterval);
      timerInterval = null;
      showToast('⏰ ¡Temporizador finalizado!');
    }
  }, 1000);
}
function pauseTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
}
function resetTimer(){
  pauseTimer();
  setTimerFromInputs();
}

document.getElementById('timerMinutes').addEventListener('input', resetTimer);
document.getElementById('timerSeconds').addEventListener('input', resetTimer);

function showToast(message){
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function savePasswordPrefs(){
  const prefs = {
    length: Number(slider.value),
    upper: document.getElementById('upper').checked,
    lower: document.getElementById('lower').checked,
    numbers: document.getElementById('numbers').checked,
    symbols: document.getElementById('symbols').checked,
    excludeSimilar: document.getElementById('excludeSimilar').checked,
  };
  localStorage.setItem('smartcalc_pwd_prefs', JSON.stringify(prefs));
}

function loadPrefs(){
  if(localStorage.getItem('smartcalc_theme') === 'light') document.body.classList.add('light');
  try {
    const prefs = JSON.parse(localStorage.getItem('smartcalc_pwd_prefs') || '{}');
    if(prefs.length) slider.value = Math.min(64, Math.max(6, prefs.length));
    ["upper", "lower", "numbers", "symbols", "excludeSimilar"].forEach(id => {
      if(typeof prefs[id] === 'boolean') document.getElementById(id).checked = prefs[id];
    });
  } catch {}

  lengthValue.innerText = slider.value;
  updateMemoryLabels();
  setTimerFromInputs();
}

document.addEventListener('keydown', (event) => {
  if(!document.getElementById('calculatorTool').classList.contains('active')) return;
  const key = event.key;
  if(/[0-9]/.test(key) || ['+','-','*','/','%','.','(',')','^'].includes(key)) press(key);
  else if(key === 'Enter'){ event.preventDefault(); calculate(); }
  else if(key === 'Backspace') deleteLast();
  else if(key === 'Escape') clearCalc();
});

loadPrefs();
