import { Providers } from './app/Providers'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
