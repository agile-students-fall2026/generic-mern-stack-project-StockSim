import { Link } from 'react-router'

function AuthLayout({ children }) {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[52rem] px-6 py-[clamp(2rem,8vw,6rem)]">
      <Link to="/" className="mb-12 inline-block border-b-4 border-accent pb-2 text-2xl leading-[normal] font-[750] tracking-[-0.04em] no-underline">
        StockSim
      </Link>
      {children}
    </main>
  )
}

export default AuthLayout
