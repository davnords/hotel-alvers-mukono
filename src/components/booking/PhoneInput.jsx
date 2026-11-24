"use client";
// Phone field where the "+" for the country code is always visible.
// The value passed to onChange always starts with "+" (or is empty).
import s from "./booking.module.css";

export default function PhoneInput({ id = "phone", value, onChange, required }) {
  const shown = String(value || "").replace(/^\+/, "");
  return (
    <div className={s.phoneWrap}>
      <span className={s.phonePlus} aria-hidden="true">+</span>
      <input id={id} type="tel" inputMode="tel" className={`${s.input} ${s.phoneInput}`} required={required}
        placeholder="256 7XX XXX XXX" autoComplete="tel" value={shown}
        onChange={(e) => {
          const v = e.target.value.replace(/^\s*\+/, "");
          onChange(v.trim() ? "+" + v : "");
        }} />
    </div>
  );
}
