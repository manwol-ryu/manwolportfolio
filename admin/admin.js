const editor = document.getElementById('json-editor');
const status = document.getElementById('editor-status');
const loadButton = document.getElementById('load-json');
const validateButton = document.getElementById('validate-json');
const downloadButton = document.getElementById('download-json');
const copyButton = document.getElementById('copy-json');

const jsonPath = 'data/site.json';

function setStatus(message, type = 'info') {
  status.textContent = message;
  status.className = `status ${type}`;
}

async function loadJson() {
  try {
    setStatus('데이터를 불러오는 중입니다...', 'info');
    const res = await fetch(jsonPath, { cache: 'no-store' });
    if (!res.ok) throw new Error(`로드 실패: ${res.status}`);
    const data = await res.json();
    editor.value = JSON.stringify(data, null, 2);
    setStatus('JSON이 정상적으로 로드되었습니다.', 'success');
  } catch (error) {
    editor.value = '';
    setStatus(`불러오기 오류: ${error.message}`, 'error');
  }
}

function validateJson() {
  const text = editor.value.trim();
  if (!text) {
    setStatus('편집기에 JSON 텍스트가 없습니다.', 'error');
    return;
  }
  try {
    JSON.parse(text);
    setStatus('JSON 형식이 올바릅니다.', 'success');
  } catch (error) {
    setStatus(`JSON 오류: ${error.message}`, 'error');
  }
}

function downloadJson() {
  try {
    const text = editor.value.trim();
    if (!text) throw new Error('저장할 JSON이 없습니다. 먼저 데이터를 로드하거나 편집하세요.');
    JSON.parse(text);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'site.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus('파일 다운로드가 준비되었습니다.', 'success');
  } catch (error) {
    setStatus(`다운로드 오류: ${error.message}`, 'error');
  }
}

async function copyJson() {
  try {
    const text = editor.value.trim();
    if (!text) throw new Error('복사할 JSON이 없습니다. 먼저 데이터를 로드하거나 편집하세요.');
    await navigator.clipboard.writeText(text);
    setStatus('JSON이 클립보드에 복사되었습니다.', 'success');
  } catch (error) {
    setStatus(`복사 오류: ${error.message}`, 'error');
  }
}

loadButton.addEventListener('click', loadJson);
validateButton.addEventListener('click', validateJson);
downloadButton.addEventListener('click', downloadJson);
copyButton.addEventListener('click', copyJson);

window.addEventListener('load', loadJson);
