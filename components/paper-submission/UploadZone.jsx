"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, RefreshCcw, UploadCloud } from "lucide-react";

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes) {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isValidFile(file, allowedExtensions) {
    if (!file) return false;
    const lowerCaseName = file.name.toLowerCase();
    return allowedExtensions.some((ext) => lowerCaseName.endsWith(ext.toLowerCase()));
}

export default function UploadZone({
    file,
    onFileSelect,
    disabled = false,
    label = "Paper PDF",
    helperText = "PDF only, maximum size 20 MB.",
    accept = ".pdf,application/pdf",
    allowedExtensions = [".pdf"],
    maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
    maxFileSizeLabel = "20 MB",
}) {
    const inputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState("");

    const validateAndSelectFile = (nextFile) => {
        if (!nextFile) return;

        if (!isValidFile(nextFile, allowedExtensions)) {
            setError(`Only ${allowedExtensions.join(", ")} files are allowed.`);
            return;
        }


        if (nextFile.size > maxFileSizeBytes) {
            setError(`The file exceeds the ${maxFileSizeLabel} limit.`);
            return;
        }

        setError("");
        onFileSelect(nextFile);
    };

    const handleInputChange = (event) => {
        validateAndSelectFile(event.target.files?.[0]);
        event.target.value = "";
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);

        if (disabled) return;

        validateAndSelectFile(event.dataTransfer.files?.[0]);
    };

    const openFilePicker = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <label
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--dash-text-dim)" }}
                >
                    {label}
                </label>
                <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>{helperText}</span>
            </div>

            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openFilePicker();
                    }
                }}
                onDragEnter={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!disabled) setIsDragOver(true);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!disabled) setIsDragOver(true);
                }}
                onDragLeave={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsDragOver(false);
                }}
                onDrop={handleDrop}
                className={`rounded-2xl border border-dashed p-6 transition-all duration-200 ${
                    disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
                style={{
                    background: "var(--dash-surface-2)",
                    borderColor: error
                        ? "rgba(248, 113, 113, 0.65)"
                        : isDragOver
                            ? "var(--dash-accent)"
                            : file
                                ? "var(--dash-border-gold)"
                                : "var(--dash-border-subtle)",
                    boxShadow: isDragOver ? "0 0 0 3px rgba(9, 182, 151, 0.12)" : "none",
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled}
                />

                {file ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: "rgba(9, 182, 151, 0.12)" }}
                            >
                                <FileText className="h-5 w-5" style={{ color: "var(--dash-accent)" }} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold" style={{ color: "var(--dash-text)" }}>{file.name}</p>
                                <p className="mt-1 text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                    {formatFileSize(file.size)} • Click or drop a new file to replace it
                                </p>
                            </div>
                        </div>

                        <div
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                            style={{ background: "var(--dash-accent-dim)", color: "var(--dash-accent)" }}
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Replace file
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div
                            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={{ background: isDragOver ? "rgba(9, 182, 151, 0.12)" : "rgba(9, 182, 151, 0.08)" }}
                        >
                            <UploadCloud
                                className="h-6 w-6"
                                style={{ color: isDragOver ? "var(--dash-accent)" : "var(--dash-text-muted)" }}
                            />
                        </div>
                        <p className="text-base font-semibold" style={{ color: "var(--dash-text)" }}>Drag and drop your PDF here</p>
                        <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>or click to browse from your device</p>
                    </div>
                )}
            </div>

            {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : null}
        </div>
    );
}
