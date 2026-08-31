import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 dark:scale-0 transition-transform" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 dark:scale-100 transition-transform" />
      <span className="sr-only">Changer le thème</span>
    </Button>
  )
}