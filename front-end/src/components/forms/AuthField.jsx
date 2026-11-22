export default function AuthField({ name, label, type = 'text', autoComplete, defaultValue, disabled, readOnly, error, aside }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label className="font-[550]" htmlFor={name}>{label}</label>
        {aside}
      </div>
      <input
        className={`mt-2 min-h-12 w-full rounded-xl border bg-surface px-4 py-3 text-ink disabled:opacity-60 ${error ? 'border-red-700' : 'border-border'}`}
        id={name} name={name} type={type} autoComplete={autoComplete} defaultValue={defaultValue}
        disabled={disabled} readOnly={readOnly} required
        aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && <p id={`${name}-error`} className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
