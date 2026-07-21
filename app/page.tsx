"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type FormData = {
  requestorName: string;
  titleRank: string;
  agency: string;
  officialEmail: string;
  officePhone: string;
  incidentCaseNumber: string;
  dateOfIncident: string;
  approximateTimeOfCall: string;
  callerTelephoneNumber: string;
  incidentAddress: string;
  additionalDetails: string;
  certificationAgreed: boolean;
  electronicSignature: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
  requestorName: "",
  titleRank: "",
  agency: "",
  officialEmail: "",
  officePhone: "",
  incidentCaseNumber: "",
  dateOfIncident: "",
  approximateTimeOfCall: "",
  callerTelephoneNumber: "",
  incidentAddress: "",
  additionalDetails: "",
  certificationAgreed: false,
  electronicSignature: "",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://it.rgv911.org/api/record-requests";

const STEPS = [
  { n: 1, label: "Requestor" },
  { n: 2, label: "Incident" },
  { n: 3, label: "Details" },
  { n: 4, label: "Certify" },
];

function Card({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a3a5c] text-[#D4A843] text-xs font-bold">
          {step}
        </span>
        <h2 className="text-sm font-semibold text-[#1a3a5c] tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [signatureTimestamp, setSignatureTimestamp] = useState<Date | null>(null);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "electronicSignature" && value) {
      setSignatureTimestamp(new Date());
    }
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!formData.requestorName.trim()) next.requestorName = "Requestor name is required.";
    if (!formData.titleRank.trim()) next.titleRank = "Title/Rank is required.";
    if (!formData.agency.trim()) next.agency = "Agency is required.";
    if (!formData.officialEmail.trim()) {
      next.officialEmail = "Official email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail)) {
      next.officialEmail = "Please enter a valid email address.";
    }
    if (!formData.officePhone.trim()) next.officePhone = "Office phone number is required.";
    if (!formData.incidentCaseNumber.trim()) next.incidentCaseNumber = "Incident/Case number is required.";
    if (!formData.dateOfIncident.trim()) next.dateOfIncident = "Date of incident is required.";
    if (!formData.incidentAddress.trim()) next.incidentAddress = "Incident address or location is required.";
    if (!formData.certificationAgreed) {
      next.certificationAgreed = "You must certify this request before submitting.";
    }
    if (!formData.electronicSignature.trim()) {
      next.electronicSignature = "Electronic signature is required.";
    }
    return next;
  };

  const isFormValid = useMemo(() => Object.keys(validate()).length === 0, [formData]);

  const formatTicket = (ticketNumber: number) =>
    `TKT-${String(ticketNumber).padStart(4, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({
      requestorName: true,
      titleRank: true,
      agency: true,
      officialEmail: true,
      officePhone: true,
      incidentCaseNumber: true,
      dateOfIncident: true,
      incidentAddress: true,
      certificationAgreed: true,
      electronicSignature: true,
    });
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestorName: formData.requestorName.trim(),
          titleRank: formData.titleRank.trim(),
          agency: formData.agency.trim(),
          officialEmail: formData.officialEmail.trim(),
          officePhone: formData.officePhone.trim(),
          incidentCaseNumber: formData.incidentCaseNumber.trim(),
          dateOfIncident: formData.dateOfIncident,
          approximateTimeOfCall: formData.approximateTimeOfCall.trim() || undefined,
          callerTelephoneNumber: formData.callerTelephoneNumber.trim() || undefined,
          incidentAddress: formData.incidentAddress.trim(),
          additionalDetails: formData.additionalDetails.trim() || undefined,
          certificationAgreed: true,
          electronicSignature: formData.electronicSignature.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong. Please try again.");
      }

      if (typeof data.ticketNumber !== "number") {
        throw new Error("Invalid response from server.");
      }

      setSubmittedTicket(formatTicket(data.ticketNumber));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setSubmittedTicket(null);
    setSignatureTimestamp(null);
  };

  useEffect(() => {
    if (signatureTimestamp) return;
    if (formData.electronicSignature.trim()) {
      setSignatureTimestamp(new Date());
    }
  }, [formData.electronicSignature, signatureTimestamp]);

  const inp = (
    label: string,
    name: keyof FormData,
    inputProps: React.InputHTMLAttributes<HTMLInputElement> & { rows?: number },
    optional = false
  ) => {
    const isCheckbox = inputProps.type === "checkbox";
    const error = errors[name];
    const showError = touched[name] && error;
    const hasValue = isCheckbox
      ? (formData[name] as boolean)
      : String(formData[name]).trim().length > 0;

    const inputCls = [
      "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all duration-150",
      "placeholder-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c]",
      showError
        ? "border-red-400 bg-red-50/40"
        : hasValue
        ? "border-[#1a3a5c]/30"
        : "border-slate-200",
    ].join(" ");

    return (
      <div className={isCheckbox ? "flex flex-col gap-2" : "flex flex-col gap-1.5"}>
        {!isCheckbox && (
          <label htmlFor={name} className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
            {!optional && <span className="text-[#1a3a5c] ml-0.5">*</span>}
            {optional && <span className="ml-1.5 text-[10px] normal-case tracking-normal font-normal text-slate-400">(optional)</span>}
          </label>
        )}
        {inputProps.type === "textarea" ? (
          <textarea
            id={name}
            name={name}
            className={inputCls}
            rows={inputProps.rows as number}
            value={formData[name] as string}
            onChange={(e) => updateField(name, e.target.value as FormData[typeof name])}
            onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
            {...(() => {
              const { type, ...rest } = inputProps;
              return rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
            })()}
          />
        ) : isCheckbox ? (
          <label className={[
            "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-150",
            formData[name]
              ? "border-[#1a3a5c]/30 bg-[#1a3a5c]/5"
              : showError
              ? "border-red-300 bg-red-50/40"
              : "border-slate-200 hover:border-[#1a3a5c]/20 hover:bg-slate-50",
          ].join(" ")}>
            <input
              id={name}
              name={name}
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#1a3a5c]"
              checked={formData[name] as boolean}
              onChange={(e) => updateField(name, e.target.checked as FormData[typeof name])}
              onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
            />
            <span className="text-sm leading-relaxed text-slate-700">
              {label}
              {!optional && <span className="text-red-500 ml-0.5">*</span>}
            </span>
          </label>
        ) : (
          <input
            id={name}
            name={name}
            className={inputCls}
            value={formData[name] as string}
            onChange={(e) => updateField(name, e.target.value as FormData[typeof name])}
            onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
            {...inputProps}
          />
        )}
        {showError && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  };

  if (submittedTicket) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xl text-center">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #1a3a5c, #D4A843, #1a3a5c)" }} />
            <div className="px-10 pt-10 pb-8">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50">
                <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-[#1a3a5c] mb-1">Request Submitted!</h1>
              <p className="text-sm text-slate-500 mb-6">Your request has been received by the RGV 9-1-1 IT Department.</p>

              <div className="mb-6 rounded-xl border border-[#D4A843]/40 bg-amber-50 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Reference Number</p>
                <p className="text-3xl font-extrabold tracking-wider text-[#1a3a5c]">{submittedTicket}</p>
              </div>

              <div className="mb-7 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-left">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#1a3a5c]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#1a3a5c] mb-0.5">Someone from IT will be getting with you shortly.</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      A member of the RGV 9-1-1 IT Department will review your request and reach out to you at the email or phone number provided. Please keep your reference number handy for any follow-up.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full rounded-xl bg-[#1a3a5c] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f2338] focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:ring-offset-2"
              >
                Submit Another Request
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RGV 9-1-1 · records.rgv911.org
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Top utility bar ── */}
      <div style={{ background: "#0f2338" }} className="hidden sm:block">
        <div className="mx-auto max-w-5xl px-4 py-1.5 flex items-center justify-between">
          <p className="text-[11px] text-white/40 tracking-wide">Rio Grande Valley 9-1-1 · Information Technology Department</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-white/40">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              records.rgv911.org
            </span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-1.5 text-[11px] text-white/40">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Authorized Personnel Only
            </span>
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <header style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0f2338 60%, #162f4e 100%)" }} className="shadow-xl">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex items-center gap-5">

            {/* Logo */}
            <div className="shrink-0 relative">
              <div className="absolute inset-0 rounded-2xl bg-[#D4A843]/20 pulse-ring" />
              <div className="relative rounded-2xl bg-white/8 backdrop-blur p-2.5 ring-1 ring-white/15">
                <Image
                  src="https://res.cloudinary.com/dql3efszd/image/upload/v1736874273/RGV911-Logo_pqibpo.png"
                  alt="RGV 9-1-1 Logo"
                  width={100}
                  height={100}
                  className="h-[88px] w-auto object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </div>

            {/* Brand text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-px flex-1 max-w-[28px] bg-[#D4A843]/60" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4A843]/80">Rio Grande Valley 9-1-1</p>
                <span className="h-px flex-1 max-w-[28px] bg-[#D4A843]/60" />
              </div>
              <h1 className="text-xl font-extrabold text-white leading-tight tracking-tight sm:text-2xl lg:text-3xl">
                911 Record Request Form
              </h1>
              <p className="mt-1 text-xs text-white/50 font-medium tracking-wide">
                Information Technology Department &mdash; Public Safety Records
              </p>
              {/* Step indicators */}
              <div className="mt-3 hidden sm:flex flex-wrap gap-2">
                {STEPS.map((s, i) => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-md bg-white/8 px-2.5 py-1 ring-1 ring-white/10">
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-[#D4A843] text-[#0f2338] text-[9px] font-black">
                        {s.n}
                      </span>
                      <span className="text-[11px] text-white/60">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <svg className="h-3 w-3 text-white/20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Gold bottom accent line */}
        <div style={{ background: "linear-gradient(90deg, transparent, #D4A843, #f5d07a, #D4A843, transparent)" }} className="h-[2px] w-full opacity-60" />
      </header>

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #1a3a5c 0%, #0f2338 50%, #1e4a73 100%)", minHeight: "160px" }}>

        {/* Watermark logo */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.06]">
            <Image
              src="https://res.cloudinary.com/dql3efszd/image/upload/v1736874273/RGV911-Logo_pqibpo.png"
              alt=""
              width={180}
              height={180}
              className="h-36 w-auto object-contain"
              aria-hidden
            />
          </div>
        </div>

        {/* Hero text content */}
        <div className="relative mx-auto max-w-5xl px-4 py-8 flex flex-col items-center text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4A843]/80 mb-3">
            Secure · Official · Confidential
          </p>
          <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
            Submit your 911 recording request below. All requests are reviewed by the RGV 9-1-1 IT Department and processed in accordance with public safety records retention policy.
          </p>
          {/* Retention notice inline */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#D4A843]/25 bg-[#D4A843]/8 px-4 py-2.5 max-w-xl">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4A843]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-[11px] leading-relaxed text-[#D4A843]/80 text-left">
              <span className="font-semibold text-[#D4A843]">Retention Notice:</span>{" "}
              Recordings are retained for one (1) calendar year. Requests older than one year generally cannot be fulfilled.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          <Card step={1} title="Requestor Information">
            <div className="grid gap-4 sm:grid-cols-2">
              {inp("Requestor Name", "requestorName", { type: "text", placeholder: "Full legal name" })}
              {inp("Title / Rank", "titleRank", { type: "text", placeholder: "e.g., Sergeant, Director" })}
              {inp("Agency", "agency", { type: "text", placeholder: "Agency or department name" })}
              {inp("Official Government Email", "officialEmail", { type: "email", placeholder: "name@agency.gov" })}
              {inp("Office Phone Number", "officePhone", { type: "tel", placeholder: "(956) 000-0000" })}
            </div>
          </Card>

          <Card step={2} title="Incident Information">
            <div className="grid gap-4 sm:grid-cols-2">
              {inp("Incident / Case Number", "incidentCaseNumber", { type: "text", placeholder: "e.g., 2024-001234" })}
              {inp("Date of Incident", "dateOfIncident", { type: "date" })}
              {inp("Approximate Time of Call or Estimated Time Range", "approximateTimeOfCall", { type: "text", placeholder: "e.g., 14:30 – 14:45" }, true)}
              {inp("Caller Telephone Number if known", "callerTelephoneNumber", { type: "tel", placeholder: "(956) 000-0000" }, true)}
              <div className="sm:col-span-2">
                {inp("Incident Address or Location", "incidentAddress", { type: "text", placeholder: "Street address or detailed location description" })}
              </div>
            </div>
          </Card>

          <Card step={3} title="Additional Information">
            {inp(
              "Please provide any additional details that may assist us in locating the requested recording.",
              "additionalDetails",
              { type: "textarea", rows: 5, placeholder: "Describe any additional context, officers on scene, nature of the call, etc." },
              true
            )}
          </Card>

          <Card step={4} title="Certification & Signature">
            <div className="space-y-5">
              {inp(
                "I certify that I am requesting this recording in my official capacity on behalf of my agency for a legitimate law enforcement or governmental purpose.",
                "certificationAgreed",
                { type: "checkbox" }
              )}
              {touched.certificationAgreed && errors.certificationAgreed && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {errors.certificationAgreed}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  {inp("Electronic Signature", "electronicSignature", { type: "text", placeholder: "Type your full legal name" })}
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Typing your name constitutes your electronic signature.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Signature Timestamp
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-slate-500">
                      {signatureTimestamp
                        ? signatureTimestamp.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                        : "Auto-generated on signature"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm font-bold text-red-600">
                Retention Notice: Recordings are retained for one (1) calendar year. Requests older than one year generally cannot be fulfilled.
              </p>
            </div>
          </Card>

          {submitError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-800">Submission Error</p>
                <p className="mt-0.5 text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
            <p className="text-xs text-slate-400">
              <span className="text-red-500">*</span> Required fields
            </p>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#1a3a5c] px-7 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0f2338] focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  Submit Request
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </>
              )}
            </button>
          </div>

        </form>
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="https://res.cloudinary.com/dql3efszd/image/upload/v1736874273/RGV911-Logo_pqibpo.png"
              alt="RGV 9-1-1"
              width={28}
              height={28}
              className="h-7 w-auto object-contain opacity-50"
            />
            <span className="text-xs text-slate-400 font-medium">RGV 9-1-1</span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RGV 9-1-1. All rights reserved. &mdash; records.rgv911.org
          </p>
        </div>
      </footer>
    </div>
  );
}
