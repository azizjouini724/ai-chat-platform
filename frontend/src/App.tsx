import { ModeToggle } from "@/components/mode-toggle"

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold text-primary">Chatini 🌤️</h1>
      <p className="text-muted-foreground">Connect • Chat • Share</p>
      <ModeToggle />
    </div>
  )
}

export default App