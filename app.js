// 1) 여기 URL을 "Google Apps Script 웹앱 URL"로 교체하세요.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrnlzmlupzYMOAMhL4uV24Del1GeHNVN09QyT42EoSA4m2wZQF0hn3C4DzxP36YnXPLg/exec";

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
    setStatus(err);
    return;
  }

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
    setStatus("설정 오류: GOOGLE_SCRIPT_URL이 비어 있습니다.");
    return;
  }

  btnSubmit.disabled = true;
  btnSearch.disabled = true;
  setStatus("제출 중...");

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

    setStatus("제출이 완료되었습니다.");
    form.reset();
  } catch (error) {
    setStatus("제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    console.error(error);
  } finally {
    btnSubmit.disabled = false;
    btnSearch.disabled = false;
  }
});