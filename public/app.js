const $ = id => document.getElementById(id);
const STORAGE_KEY = "vocabgrow-wordbook-v1";
let words = [];
try { words = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch {}
const saveWords = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function renderWords() {
  $("wordCount").textContent = words.length;
  $("navCount").textContent = words.length;
  $("emptyWords").classList.toggle("hidden", words.length > 0);
  $("wordList").innerHTML = words.slice().reverse().map(w => `
    <div class="word-item"><div class="word-flower">✿</div><div class="word-meta">
    <b>${esc(w.word)}</b><small>Added ${esc(w.date || "today")}</small></div>
    <button class="remove-word" data-remove="${esc(w.id)}" title="Remove word">×</button></div>`).join("");
}
async function refreshStatus() {
  try {
    const r = await fetch("/api/status"), d = await r.json(), pill = $("modelStatus");
    pill.className = `status-pill ${d.status}`;
    pill.innerHTML = `<i></i>${d.status === "ready" ? "Local AI ready" : d.status === "error" ? "Local AI unavailable" : "Loading local AI…"}`;
    pill.title = d.message || "";
  } catch { $("modelStatus").className = "status-pill error"; $("modelStatus").textContent = "Server not connected"; }
}
$("wordForm").addEventListener("submit", async e => {
  e.preventDefault();
  const word = $("wordInput").value.trim(); if (!word) return;
  const btn = $("learnBtn"); btn.disabled = true; btn.textContent = "Growing your word…";
  $("coachResult").classList.remove("hidden"); $("coachResult").textContent = "Your local AI coach is preparing the word…";
  try {
    const r = await fetch("/api/coach", {method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({word,level:$("levelSelect").value})});
    const d = await r.json(); if (!r.ok) throw Error(d.detail || d.error || "Request failed");
    $("coachResult").innerHTML = `<h3>✦ ${esc(word)}</h3><div>${esc(d.answer)}</div>
      <div class="result-actions"><button class="save-btn" id="saveWordBtn">＋ Save to my wordbook</button></div>`;
    $("saveWordBtn").onclick = () => {
      if (!words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
        words.push({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),word,date:new Date().toLocaleDateString()});
        saveWords(); renderWords();
      }
      $("saveWordBtn").textContent = "✓ Saved to wordbook"; $("saveWordBtn").disabled = true;
    };
  } catch (err) { $("coachResult").textContent = `Could not generate a word card.\n\n${err.message}\n\nCheck the server terminal and QVAC model status.`; }
  finally { btn.disabled = false; btn.innerHTML = `Grow this word <span>→</span>`; refreshStatus(); }
});
document.querySelectorAll(".quick-words button").forEach(b => b.onclick = () => { $("wordInput").value=b.textContent; $("wordInput").focus(); });
$("wordList").addEventListener("click", e => {
  const id=e.target.dataset.remove; if (!id) return;
  words=words.filter(w=>w.id!==id); saveWords(); renderWords();
});
$("clearWords").onclick=()=>{if(words.length&&confirm("Clear your entire wordbook from this browser?")){words=[];saveWords();renderWords();}};
$("quizBtn").onclick=async()=>{
  if(!words.length){$("quizResult").classList.remove("hidden");$("quizResult").textContent="Save a few words in your wordbook first, then generate a quiz.";return;}
  const btn=$("quizBtn");btn.disabled=true;btn.textContent="Creating your quiz…";
  $("quizResult").classList.remove("hidden");$("quizResult").textContent="Your local AI is preparing practice questions…";
  try{
    const r=await fetch("/api/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({words:words.map(w=>w.word)})});
    const d=await r.json();if(!r.ok)throw Error(d.detail||d.error||"Request failed");$("quizResult").textContent=d.answer;
  }catch(err){$("quizResult").textContent=`Quiz generation failed.\n\n${err.message}`;}
  finally{btn.disabled=false;btn.innerHTML=`✦ Generate my quiz <span>→</span>`;refreshStatus();}
};
renderWords();refreshStatus();setInterval(refreshStatus,12000);
