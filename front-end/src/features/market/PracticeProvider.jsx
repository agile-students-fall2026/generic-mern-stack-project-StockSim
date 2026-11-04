import { useRef, useState } from 'react'
import { PracticeContext } from './PracticeContext.js'
import { emptyAccount, executeTrade, isPracticeAccount } from './practice.js'

const key = 'stocksim-practice-v1'
function readAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return isPracticeAccount(saved) ? saved : emptyAccount
  } catch { return emptyAccount }
}

export default function PracticeProvider({ children }) {
  const [account, setAccount] = useState(readAccount)
  const current = useRef(account)
  const [storageWarning, setStorageWarning] = useState(false)
  function save(next) {
    current.current = next
    setAccount(next)
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageWarning(false) }
    catch { setStorageWarning(true) }
  }
  function toggleWatch(symbol) {
    const previous = current.current
    save({ ...previous, watchlist: previous.watchlist.includes(symbol) ? previous.watchlist.filter((item) => item !== symbol) : [...previous.watchlist, symbol] })
  }
  function trade(stock, side, quantity, id) {
    const next = executeTrade(current.current, stock, side, quantity, id, new Date().toISOString())
    save(next)
    return next.trades.find((item) => item.id === id)
  }
  return <PracticeContext.Provider value={{ account, toggleWatch, trade }}>
    {storageWarning && <p role="status" className="bg-selected p-3 text-center text-sm">Browser storage is unavailable. Your practice changes last only until this page is reloaded.</p>}
    {children}
  </PracticeContext.Provider>
}
