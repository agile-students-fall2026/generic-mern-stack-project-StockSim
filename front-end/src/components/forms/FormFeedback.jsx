export default function FormFeedback({ feedback }) {
  if (!feedback?.message) return null
  return (
    <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`text-sm leading-relaxed ${feedback.type === 'error' ? 'text-red-700' : 'text-muted'}`}>
      {feedback.message}
    </p>
  )
}
