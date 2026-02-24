// 1) 여기 URL을 "Google Apps Script 웹앱 URL"로 교체하세요.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5b4QC4bT9YeqRkqq2ZX9rg3mrO98oBRGwn6aZEy80Tj9Xf7hVk1e2rGYEVMwEl_4C0Q/exec";

const form = document.getElementById("form");
const statusEl = document.getElementById("status");
const btnSubmit = document.getElementById("btnSubmit");
const btnSearch = document.getElementById("btnSearch");

const elName = document.getElementById("name");
const elPhone = document.getElementById("phone");
const elZonecode = document.getElementById("zonecode");
const elAddress = document.getElementById("address");
const elDetail = document.getElementById("detailAddress");
const elMemo = document.getElementById("memo");

// Toast elements
const toast = document.getElementById("toast");
const toastSpinner = document.getElementById("toastSpinner");
const toastTitle = document.getElementById("toastTitle");
const toastMsg = document.getElementById("toastMsg");
const toastClose = document.getElementById("toastClose");

let toastTimer = null;

function showToast({ title, msg = "", loading = false, type = "default", closable = false, autoHideMs = 0 }) {
  // type: default | success | error
  toast.classList.remove("hidden", "success", "error");
  if (type === "success") toast.classList.add("success");
  if (type === "error") toast.classList.add("error");

  toastTitle.textContent = title || "";
  toastMsg.textContent = msg || "";

  toastSpinner.style.display = loading ? "block" : "none";

  toastClose.classList.toggle("hidden", !closable);

  if (toastTimer) clearTimeout(toastTimer);
  if (autoHideMs && autoHideMs > 0) {
    toastTimer = setTimeout(hideToast, autoHideMs);
  }
}

function hideToast() {
  toast.classList.add("hidden");
  toast.classList.remove("success", "error");
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

toastClose.addEventListener("click", hideToast);

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function normalizePhone(raw) {
  // 숫자만 남김
  return (raw || "").replace(/[^\d]/g, "");
}

function validate() {
  const name = elName.value.trim();
  const phone = normalizePhone(elPhone.value);
  const zonecode = elZonecode.value.trim();
  const address = elAddress.value.trim();

  if (!name) return "이름은 필수입니다.";
  if (!phone) return "전화번호는 필수입니다.";
  // 한국 휴대폰 최소 체크(엄격한 검증은 상황에 따라 조정)
  if (phone.length < 10 || phone.length > 11) return "전화번호 형식이 올바르지 않습니다.";
  if (!zonecode || !address) return "우편번호/주소는 필수입니다. 주소검색을 이용해 주세요.";

  return null;
}

btnSearch.addEventListener("click", () => {
  new daum.Postcode({
    oncomplete: function(data) {
      // data.zonecode: 우편번호, data.address: 기본주소
      elZonecode.value = data.zonecode || "";
      elAddress.value = data.address || "";
      // 상세주소로 포커스 이동
      elDetail.focus();
    }
  }).open();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const err = validate();
  if (err) {
    showToast({ title: "입력 확인", msg: err, loading: false, type: "error", closable: true });
    return;
  }

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
    setStatus("설정 오류: GOOGLE_SCRIPT_URL이 비어 있습니다.");
    return;
  }

  btnSubmit.disabled = true;
  btnSearch.disabled = true;

  showToast({ title: "제출 중...", msg: "잠시만 기다려 주세요.", loading: true, type: "default", closable: false });

  const payload = {
    name: elName.value.trim(),
    phone: normalizePhone(elPhone.value),
    zonecode: elZonecode.value.trim(),
    address: elAddress.value.trim(),
    detailAddress: elDetail.value.trim(),
    memo: elMemo.value.trim(),
    // 제출 시간은 서버(Apps Script)에서 찍는 것을 권장
  };

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    // Apps Script에서 JSON 응답을 주는 방식도 가능하지만,
    // 여기서는 단순히 성공 문자열을 기준으로 처리
    if (!res.ok) throw new Error(text || "서버 응답 오류");

    showToast({ title: "제출이 완료되었습니다.", msg: "감사합니다!", loading: false, type: "success", closable: false, autoHideMs: 1400 });
    form.reset();
  } catch (error) {
    showToast({ title: "제출에 실패했습니다.", msg: "잠시 후 다시 시도해 주세요.", loading: false, type: "error", closable: true });
    console.error(error);
  } finally {
    btnSubmit.disabled = false;
    btnSearch.disabled = false;
  }
});