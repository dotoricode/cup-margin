"use client";

import { useState, type FormEvent } from "react";

const betaContactEmail = "hi@cup-margin.co.kr";

export function WaitlistMailtoForm() {
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!waitlistEmail.trim()) {
      document.getElementById("waitlist-email")?.focus();
      setWaitlistSubmitted(false);
      return;
    }
    setWaitlistSubmitted(true);
    window.location.href = buildBetaMailtoHref(waitlistEmail);
  }

  return (
    <form onSubmit={submitWaitlist} className="rounded-2xl bg-[#f8fbff] p-4 sm:p-5">
      <label className="block text-sm font-bold text-[#273951]" htmlFor="waitlist-email">이메일</label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          value={waitlistEmail}
          onChange={(event) => {
            setWaitlistEmail(event.target.value);
            setWaitlistSubmitted(false);
          }}
          placeholder="owner@example.com"
          className="min-h-12 flex-1 rounded-lg border border-[#d8e3ee] bg-white px-4 text-base font-medium text-[#061b31] outline-none transition focus:border-[#0b2545]"
          required
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0b2545] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#123a63]"
        >
          베타 신청 메일 보내기
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--cm-muted)]">
        {waitlistSubmitted ? `메일 앱을 열었어요. 전송 버튼까지 누르면 ${betaContactEmail}로 신청 메일이 갑니다.` : "전송 버튼까지 누르면 신청 메일이 갑니다. 스팸 없이 베이직 오픈 시점에만 1회 안내드릴게요."}
      </p>
    </form>
  );
}

function buildBetaMailtoHref(email: string) {
  const trimmedEmail = email.trim();
  const subject = encodeURIComponent("컵마진 베타 무료 사용 신청");
  const body = encodeURIComponent(`안녕하세요. 컵마진 베타 무료 사용을 신청합니다.\n\n회신 받을 이메일: ${trimmedEmail || ""}\n매장/상황 메모: `);
  return `mailto:${betaContactEmail}?subject=${subject}&body=${body}`;
}
