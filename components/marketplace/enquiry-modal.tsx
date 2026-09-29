"use client";

import { useState } from "react";
import { X, CheckCircle2, Send, Loader2, Building, Mail, Phone, User, MessageSquare } from "lucide-react";
import { EnquiryFormData } from "@/data/marketplace/types";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTargetType?: "company" | "product" | "general";
  targetId?: string;
  targetName?: string;
  title?: string;
  subtitle?: string;
}

export function EnquiryModal({
  isOpen,
  onClose,
  defaultTargetType = "company",
  targetId,
  targetName,
  title,
  subtitle,
}: EnquiryModalProps) {
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
    targetType: defaultTargetType,
    targetId,
    targetName,
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.company.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setErrorMessage("");
    setStatus("submitting");

    // Simulate network submission with mock delay
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        // Auto-close after successful feedback
        setStatus("idle");
        setFormData({
          name: "",
          company: "",
          email: "",
          phone: "",
          message: "",
          targetType: defaultTargetType,
          targetId,
          targetName,
        });
        onClose();
      }, 2500);
    }, 800);
  };

  const modalTitle =
    title ||
    (targetName
      ? `Send Enquiry to ${targetName}`
      : "Send B2B Enquiry");

  const modalSubtitle =
    subtitle ||
    (targetName
      ? `Direct your commercial or technical enquiry regarding ${targetName}.`
      : "Connect directly with verified energy manufacturers, utilities, and solution providers.");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0A0A0A] text-white p-6 relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block text-[9px] font-black uppercase tracking-widest text-[#00A651] bg-white/10 px-2 py-0.5 rounded mb-2">
                B2B INQUIRY
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                {modalTitle}
              </h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                {modalSubtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {status === "success" ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#00A651] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900">Enquiry Transmitted Successfully</h4>
              <p className="text-zinc-600 text-xs max-w-sm">
                Your enquiry regarding <span className="font-semibold text-zinc-900">{targetName || "the requested solution"}</span> has been recorded. The vendor team will respond directly via email.
              </p>
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  [Prototype State: Simulated Success]
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Energy Ltd"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Business Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Corporate Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Phone / Mobile
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Requirement Details / Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <textarea
                    required
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Specify project capacity, procurement timeline, technical specifications, or request for quote..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651] resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-[10px] text-zinc-400">
                  Protected under Energdive B2B Terms
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#00A651] hover:bg-[#008f45] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Enquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
