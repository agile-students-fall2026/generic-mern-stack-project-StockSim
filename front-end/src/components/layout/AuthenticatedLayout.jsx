import { useAuth } from '../../context/AuthContext.js'
import PracticeProvider from '../../features/market/PracticeProvider.jsx'
import AppLayout from './AppLayout.jsx'

export default function AuthenticatedLayout() {
  const { user } = useAuth()
  return <PracticeProvider key={user.id} accountId={user.id}><AppLayout /></PracticeProvider>
}
