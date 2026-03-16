function toggleMode(){
  document.body.classList.toggle("light");
  localStorage.setItem("smartcalc_theme", document.body.classList.contains("light") ? "light" : "dark");
}

const display=document.getElementById("calcDisplay");
let calcMemory=0;
let lastCalcAnswer=0;

function press(val){
  if(display.value==="Error") display.value="";
  display.value+=val;
}

function clearCalc(){ display.value=""; }
function deleteLast(){ display.value=display.value.slice(0,-1); }

function insertConstant(type){
  const value=type === "PI" ? Math.PI : Math.E;
  display.value += formatResult(value);
}

function insertLastAnswer(){
  display.value += formatResult(lastCalcAnswer);
}

function applySquareRoot(){
  const n=getDisplayNumber();
  if(n===null) return showToast("Introduce primero un número");
  if(n<0) return showToast("No existe raíz real de un número negativo");
  display.value=formatResult(Math.sqrt(n));
}

function applyPower2(){
  const n=getDisplayNumber();
  if(n===null) return showToast("Introduce primero un número");
  display.value=formatResult(n**2);
}

function applyReciprocal(){
  const n=getDisplayNumber();
  if(n===null) return showToast("Introduce primero un número");
  if(n===0) return showToast("No se puede dividir entre cero");
  display.value=formatResult(1/n);
}

function toggleSign(){
  const n=getDisplayNumber();
  if(n===null) return showToast("Introduce primero un número");
  display.value=formatResult(-n);
}

function tokenize(expression){
  const tokens=[];
  let num="";
  for(let i=0;i<expression.length;i++){
    const c=expression[i];
    if(/[0-9.]/.test(c)){
      num+=c;
      continue;
    }
    if(num){
      if((num.match(/\./g)||[]).length>1) throw new Error("Número inválido");
      tokens.push(num);
      num="";
    }
    if(/[+\-*/()%^]/.test(c)) tokens.push(c);
    else if(c.trim()!=="") throw new Error("Carácter no permitido");
  }
  if(num){
    if((num.match(/\./g)||[]).length>1) throw new Error("Número inválido");
    tokens.push(num);
  }
  return tokens;
}

function toRPN(tokens){
  const output=[];
  const stack=[];
  const precedence={'+':1,'-':1,'*':2,'/':2,'%':2,'^':3};

  for(let i=0;i<tokens.length;i++){
    const t=tokens[i];
    const prev=tokens[i-1];

    if(!Number.isNaN(Number(t))){
      output.push(t);
    }else if(t==='('){
      stack.push(t);
    }else if(t===')'){
      while(stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
      if(stack.pop()!=='(') throw new Error("Paréntesis sin cerrar");
    }else if(precedence[t]){
      if(t==='-' && (i===0 || (prev && (precedence[prev] || prev==='(')))) output.push('0');
      while(stack.length && precedence[stack[stack.length-1]]>=precedence[t] && !(t==='^' && stack[stack.length-1]==='^')) output.push(stack.pop());
      stack.push(t);
    }else{
      throw new Error("Token inválido");
    }
  }

  while(stack.length){
    const op=stack.pop();
    if(op==='(') throw new Error("Paréntesis sin cerrar");
    output.push(op);
  }

  return output;
}

function evalRPN(rpn){
  const stack=[];
  for(const t of rpn){
    if(!Number.isNaN(Number(t))){
      stack.push(Number(t));
      continue;
    }
    const b=stack.pop();
    const a=stack.pop();
    if(a===undefined || b===undefined) throw new Error("Expresión inválida");

    if(t==='+') stack.push(a+b);
    else if(t==='-') stack.push(a-b);
    else if(t==='*') stack.push(a*b);
    else if(t==='/'){
      if(b===0) throw new Error("División por cero");
      stack.push(a/b);
    }else if(t==='%'){
      if(b===0) throw new Error("Módulo por cero");
      stack.push(a%b);
    }else if(t==='^'){
      stack.push(a**b);
    }
  }

  if(stack.length!==1 || !Number.isFinite(stack[0])) throw new Error("Expresión inválida");
  return stack[0];
}

function formatResult(n){
  if(Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(10)));
}

function calculate(){
  const expression=display.value;
  if(!expression) return;

  try{
    const result=evalRPN(toRPN(tokenize(expression)));
    const formatted=formatResult(result);
    display.value=formatted;
    lastCalcAnswer=result;
    updateLastAnswerLabel();
    addCalcHistory(`${expression} = ${formatted}`);
  }catch(error){
    display.value="Error";
    showToast(error.message || "No se pudo calcular");
  }
}

function addCalcHistory(entry){
  const history=document.getElementById("calcHistory");
  const placeholder=history.querySelector(".placeholder");
  if(placeholder) placeholder.remove();
  const item=document.createElement("div");
  item.innerText=entry;
  history.prepend(item);
  while(history.children.length>15) history.removeChild(history.lastChild);
}

function clearCalcHistory(){
  document.getElementById("calcHistory").innerHTML='<div class="placeholder">Sin operaciones todavía</div>';
}

function getDisplayNumber(){
  const value=Number(display.value);
  return Number.isFinite(value) ? value : null;
}

function memoryAdd(){
  const n=getDisplayNumber();
  if(n===null) return showToast("Resultado inválido para memoria");
  calcMemory+=n;
  updateMemoryLabel();
}

function memorySubtract(){
  const n=getDisplayNumber();
  if(n===null) return showToast("Resultado inválido para memoria");
  calcMemory-=n;
  updateMemoryLabel();
}

function memoryRecall(){
  display.value=formatResult(calcMemory);
}

function memoryClear(){
  calcMemory=0;
  updateMemoryLabel();
}

function updateMemoryLabel(){
  document.getElementById("memoryValue").innerText=formatResult(calcMemory);
}

function updateLastAnswerLabel(){
  document.getElementById("lastAnswer").innerText=formatResult(lastCalcAnswer);
}

function showPassword(){
  document.getElementById("calculatorTool").style.display="none";
  const passwordTool=document.getElementById("passwordTool");
  passwordTool.style.display="block";
  passwordTool.classList.remove("tool");
  void passwordTool.offsetWidth;
  passwordTool.classList.add("tool");
}

function showCalculator(){
  document.getElementById("passwordTool").style.display="none";
  const calculatorTool=document.getElementById("calculatorTool");
  calculatorTool.style.display="block";
  calculatorTool.classList.remove("tool");
  void calculatorTool.offsetWidth;
  calculatorTool.classList.add("tool");
}

const upper="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lower="abcdefghijklmnopqrstuvwxyz";
const numbers="0123456789";
const symbols="!@#$%^&*()_+[]{}<>?";
const ambiguous=/[O0l1I]/g;

const slider=document.getElementById("length");
const lengthValue=document.getElementById("lengthValue");
slider.oninput=()=>{
  lengthValue.innerText=slider.value;
  savePasswordPrefs();
};

["upper","lower","numbers","symbols","excludeSimilar"].forEach(id=>{
  document.getElementById(id).addEventListener("change", savePasswordPrefs);
});

function secureRandomInt(max){
  if(max<=0) throw new Error("Máximo inválido");
  const maxUint=0xffffffff;
  const limit=maxUint - (maxUint % max);
  const array=new Uint32Array(1);
  do{ crypto.getRandomValues(array); }while(array[0]>=limit);
  return array[0] % max;
}

function randomChar(set){ return set.charAt(secureRandomInt(set.length)); }

function shuffleSecure(chars){
  for(let i=chars.length-1;i>0;i--){
    const j=secureRandomInt(i+1);
    [chars[i],chars[j]]=[chars[j],chars[i]];
  }
  return chars;
}

function selectedSets(){
  const excludeSimilar=document.getElementById("excludeSimilar").checked;
  const sets=[];

  const maybePush=(enabled, charset)=>{
    if(!enabled) return;
    const clean=excludeSimilar ? charset.replace(ambiguous,"") : charset;
    if(clean.length) sets.push(clean);
  };

  maybePush(document.getElementById("upper").checked, upper);
  maybePush(document.getElementById("lower").checked, lower);
  maybePush(document.getElementById("numbers").checked, numbers);
  maybePush(document.getElementById("symbols").checked, symbols);

  return sets;
}

function generatePassword(){
  const sets=selectedSets();
  if(!sets.length){
    showToast("Selecciona al menos una opción");
    return;
  }

  const length=Number(slider.value);
  if(length<sets.length){
    showToast("Aumenta la longitud para cubrir todas las opciones elegidas");
    return;
  }

  const chars=[];
  for(const set of sets) chars.push(randomChar(set));

  const allChars=sets.join("");
  while(chars.length<length) chars.push(randomChar(allChars));

  const password=shuffleSecure(chars).join("");
  document.getElementById("password").innerText=password;

  checkStrength(password);
  addHistory(password);
}

function copyPassword(){
  const text=document.getElementById("password").innerText;
  if(!text || text==="Pulsa generar") return showToast("Primero genera una contraseña");

  navigator.clipboard.writeText(text)
    .then(()=>showToast("Contraseña copiada"))
    .catch(()=>showToast("No se pudo copiar automáticamente"));
}

function checkStrength(pass){
  let score=0;
  const tips=[];

  if(pass.length>=12) score++; else tips.push("Usa 12+ caracteres");
  if(pass.length>=20) score++;
  if(/[A-Z]/.test(pass)) score++; else tips.push("Incluye mayúsculas");
  if(/[a-z]/.test(pass)) score++; else tips.push("Incluye minúsculas");
  if(/[0-9]/.test(pass)) score++; else tips.push("Incluye números");
  if(/[^A-Za-z0-9]/.test(pass)) score++; else tips.push("Incluye símbolos");
  if(/(.)\1{2,}/.test(pass)) { score=Math.max(0,score-1); tips.push("Evita repeticiones consecutivas"); }

  const maxScore=6;
  const percent=(score/maxScore)*100;

  const bar=document.getElementById("strengthBar");
  const text=document.getElementById("strengthText");
  const tip=document.getElementById("passwordTip");

  bar.style.width=`${percent}%`;

  if(score<=2){
    bar.style.background="red";
    text.innerText="Fortaleza: Débil";
  }else if(score<=4){
    bar.style.background="orange";
    text.innerText="Fortaleza: Media";
  }else if(score===5){
    bar.style.background="#84cc16";
    text.innerText="Fortaleza: Fuerte";
  }else{
    bar.style.background="green";
    text.innerText="Fortaleza: Muy fuerte";
  }

  tip.innerText=tips.length ? `Sugerencia: ${tips[0]}` : "Excelente combinación de seguridad";
}

function addHistory(pass){
  const history=document.getElementById("history");
  const placeholder=history.querySelector(".placeholder");
  if(placeholder) placeholder.remove();
  const item=document.createElement("div");
  item.innerText=pass;
  history.prepend(item);
  while(history.children.length>20) history.removeChild(history.lastChild);
}

function clearPasswordHistory(){
  document.getElementById("history").innerHTML='<div class="placeholder">Sin contraseñas generadas</div>';
}

function showToast(message){
  const toast=document.getElementById("toast");
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toast.classList.remove("show"), 2200);
}

function savePasswordPrefs(){
  const prefs={
    length:Number(slider.value),
    upper:document.getElementById("upper").checked,
    lower:document.getElementById("lower").checked,
    numbers:document.getElementById("numbers").checked,
    symbols:document.getElementById("symbols").checked,
    excludeSimilar:document.getElementById("excludeSimilar").checked,
  };
  localStorage.setItem("smartcalc_pwd_prefs", JSON.stringify(prefs));
}

function loadPrefs(){
  const theme=localStorage.getItem("smartcalc_theme");
  if(theme==="light") document.body.classList.add("light");

  try{
    const prefs=JSON.parse(localStorage.getItem("smartcalc_pwd_prefs") || "{}");
    if(prefs.length) slider.value=Math.min(64,Math.max(6,prefs.length));
    ["upper","lower","numbers","symbols","excludeSimilar"].forEach(id=>{
      if(typeof prefs[id]==="boolean") document.getElementById(id).checked=prefs[id];
    });
  }catch{}

  lengthValue.innerText=slider.value;
  updateMemoryLabel();
  updateLastAnswerLabel();
  clearCalcHistory();
  clearPasswordHistory();
}

document.addEventListener("keydown", (event)=>{
  const key=event.key;
  const inPasswordView=document.getElementById("passwordTool").style.display==="block";
  if(inPasswordView) return;

  if(event.ctrlKey && key.toLowerCase()==='l'){
    event.preventDefault();
    clearCalc();
    return;
  }

  if(/[0-9]/.test(key) || ["+","-","*","/","%",".","(",")","^"].includes(key)){
    press(key);
  }else if(key==="Enter"){
    event.preventDefault();
    calculate();
  }else if(key==="Backspace"){
    deleteLast();
  }else if(key==="Escape" || key==="Delete"){
    clearCalc();
  }else if(key.toLowerCase()==='s'){
    applySquareRoot();
  }else if(key.toLowerCase()==='q'){
    applyPower2();
  }else if(key.toLowerCase()==='i'){
    applyReciprocal();
  }else if(key.toLowerCase()==='n'){
    toggleSign();
  }else if(key.toLowerCase()==='p'){
    insertConstant('PI');
  }else if(key.toLowerCase()==='e'){
    insertConstant('E');
  }else if(key.toLowerCase()==='a'){
    insertLastAnswer();
  }
});

loadPrefs();
