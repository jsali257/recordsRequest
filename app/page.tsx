"use client";

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

  const sectionTitle = (number: number, text: string) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-navy font-bold text-sm">
        {number}
      </div>
      <h2 className="text-lg font-semibold text-navy">{text}</h2>
    </div>
  );

  const field = (
    label: string,
    name: keyof FormData,
    inputProps: React.InputHTMLAttributes<HTMLInputElement> & { rows?: number },
    optional = false
  ) => {
    const isCheckbox = inputProps.type === "checkbox";
    const error = errors[name];
    const showError = touched[name] && error;
    const baseInputClass =
      "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy disabled:opacity-60";

    return (
      <div className={isCheckbox ? "flex flex-col gap-2" : "flex flex-col gap-1.5"}>
        {!isCheckbox && (
          <label htmlFor={name} className="text-sm font-medium text-slate-700">
            {label}
            {!optional && <span className="text-red-600 ml-0.5">*</span>}
          </label>
        )}
        {inputProps.type === "textarea" ? (
          <textarea
            id={name}
            name={name}
            className={baseInputClass}
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
          <div className="flex items-start gap-3">
            <input
              id={name}
              name={name}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy"
              checked={formData[name] as boolean}
              onChange={(e) => updateField(name, e.target.checked as FormData[typeof name])}
              onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
            />
            <label htmlFor={name} className="text-sm leading-5 text-slate-700">
              {label}
              {!optional && <span className="text-red-600 ml-0.5">*</span>}
            </label>
          </div>
        ) : (
          <input
            id={name}
            name={name}
            className={baseInputClass}
            value={formData[name] as string}
            onChange={(e) => updateField(name, e.target.value as FormData[typeof name])}
            onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
            {...inputProps}
          />
        )}
        {showError && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  };

  if (submittedTicket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-xl rounded-lg bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Request Submitted Successfully</h1>
          <p className="text-lg font-semibold text-slate-800 mb-1">Reference Number: {submittedTicket}</p>
          <p className="text-sm text-slate-600 mb-6">
            A member of the RGV 9-1-1 team will review your request. Please keep your reference number for follow-up inquiries.
          </p>
          <button
            onClick={handleReset}
            className="rounded-md bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-navy text-white shadow">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-white text-navy">
              <span className="text-xl font-extrabold leading-none">911</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">RGV 9-1-1</p>
              <p className="text-lg font-bold">Record Request Portal</p>
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold sm:text-right sm:text-3xl">
            911 Record Request Form
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 rounded-md border-l-4 border-gold bg-amber-50 p-4 text-sm text-slate-800 shadow-sm">
          <p className="font-semibold text-navy">Retention Notice</p>
          <p>
            911 recordings are retained for one (1) calendar year from the date of the call. Requests
            for recordings older than one year generally cannot be fulfilled.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {sectionTitle(1, "Requestor Information")}
            <div className="grid gap-5 sm:grid-cols-2">
              {field("Requestor Name", "requestorName", { type: "text", placeholder: "Full name" })}
              {field("Title / Rank", "titleRank", { type: "text", placeholder: "e.g., Sergeant, Director" })}
              {field("Agency", "agency", { type: "text", placeholder: "Agency name" })}
              {field("Official Government Email", "officialEmail", {
                type: "email",
                placeholder: "name@agency.gov",
              })}
              {field("Office Phone Number", "officePhone", { type: "tel", placeholder: "(555) 123-4567" })}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {sectionTitle(2, "Incident Information")}
            <div className="grid gap-5 sm:grid-cols-2">
              {field("Incident / Case Number", "incidentCaseNumber", {
                type: "text",
                placeholder: "Case number",
              })}
              {field("Date of Incident", "dateOfIncident", { type: "date" })}
              {field(
                "Approximate Time of Call or Estimated Time Range",
                "approximateTimeOfCall",
                { type: "text", placeholder: "e.g., 14:30 - 14:45" },
                true
              )}
              {field("Caller Telephone Number if known", "callerTelephoneNumber", {
                type: "tel",
                placeholder: "(555) 987-6543",
              }, true)}
              {field("Incident Address or Location", "incidentAddress", {
                type: "text",
                placeholder: "Street address or location description",
              })}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {sectionTitle(3, "Additional Information")}
            {field(
              "Please provide any additional details that may assist us in locating the requested recording.",
              "additionalDetails",
              { type: "textarea", rows: 5, placeholder: "Enter additional details..." },
              true
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {sectionTitle(4, "Certification")}
            <div className="space-y-5">
              {field(
                "I certify that I am requesting this recording in my official capacity on behalf of my agency for a legitimate law enforcement or governmental purpose.",
                "certificationAgreed",
                { type: "checkbox" }
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                {field("Electronic Signature", "electronicSignature", {
                  type: "text",
                  placeholder: "Type your full name",
                })}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Signature Timestamp</label>
                  <input
                    type="text"
                    readOnly
                    value={
                      signatureTimestamp
                        ? signatureTimestamp.toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Auto-generated on signature"
                    }
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>
          </section>

          {submitError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
              {submitError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="inline-flex items-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              )}
              Submit Request
            </button>
          </div>
        </form>
      </main>

      <footer className="bg-navy py-6 text-center text-xs text-slate-300">
        &copy; {new Date().getFullYear()} RGV 9-1-1. All rights reserved.
      </footer>
    </div>
  );
}
