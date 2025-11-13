# 🎨 Sistema de Diseño SIGECA

Sistema de diseño moderno basado en **Tailwind CSS**, **shadcn/ui** (New York style) y **Radix UI**.

---

## 🚀 Instalado

### Dependencias

- ✅ **Tailwind CSS** - Utility-first CSS framework
- ✅ **shadcn/ui** - Componentes copiables (New York style)
- ✅ **Radix UI** - Primitivos accesibles
- ✅ **lucide-react** - Iconos modernos
- ✅ **class-variance-authority** - Variantes de componentes
- ✅ **tailwind-merge** - Merge de clases Tailwind
- ✅ **react-hook-form** - Manejo de formularios
- ✅ **zod** - Validación de esquemas
- ✅ **sonner** - Sistema de notificaciones toast

---

## 📁 Estructura

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/              ← Componentes shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── select.tsx
│   │       ├── command.tsx
│   │       ├── popover.tsx
│   │       ├── dialog.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── form.tsx
│   │       └── sonner.tsx
│   ├── lib/
│   │   └── utils.ts         ← Utilidad cn() para merge de clases
│   ├── styles/
│   │   └── globals.css      ← Variables CSS OKLCH + Tailwind
│   └── types/
├── tailwind.config.js       ← Configuración Tailwind
├── postcss.config.js        ← Configuración PostCSS
└── components.json          ← Configuración shadcn/ui
```

---

## 🎨 Tokens de Color (OKLCH)

Los colores se definen usando el espacio de color **OKLCH** (perceptualmente uniforme).

### Variables CSS (src/styles/globals.css)

```css
:root {
  --radius: 0.625rem; /* Border radius global */

  /* Modo Claro */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... más variables */
}

.dark {
  /* Modo Oscuro */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... más variables */
}
```

### Personalizar Colores

1. Abre `src/styles/globals.css`
2. Modifica los valores en `:root` (modo claro) y `.dark` (modo oscuro)
3. Formato: `L C H` (Lightness Chroma Hue)

**Ejemplo:** Cambiar el color primario a verde:
```css
:root {
  --primary: 142 71% 45%; /* Verde */
}

.dark {
  --primary: 142 76% 73%; /* Verde claro para dark mode */
}
```

---

## 🌓 Modo Claro/Oscuro

### Implementación Futura

Para implementar el cambio de tema, necesitarás:

1. **Instalar next-themes** (compatible con Vite):
```bash
npm install next-themes
```

2. **Crear ThemeProvider** (`src/components/theme-provider.tsx`):
```tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"

    root.classList.add(theme === "system" ? systemTheme : theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

3. **Envolver App con ThemeProvider** (`src/main.tsx`):
```tsx
import { ThemeProvider } from './components/theme-provider'

<ThemeProvider>
  <App />
</ThemeProvider>
```

4. **Crear botón de toggle** (usa el hook `useTheme()`):
```tsx
import { useTheme } from './components/theme-provider'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

---

## 🧩 Componentes Disponibles

### Button
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Botón</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="icon">🔥</Button>
```

### Card
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido principal
  </CardContent>
  <CardFooter>
    Footer opcional
  </CardFooter>
</Card>
```

### Input
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="tu@email.com" />
</div>
```

### Textarea
```tsx
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

<div>
  <Label htmlFor="message">Mensaje</Label>
  <Textarea id="message" placeholder="Escribe tu mensaje..." />
</div>
```

### Select
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona una opción" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
    <SelectItem value="option3">Opción 3</SelectItem>
  </SelectContent>
</Select>
```

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Dialog</DialogTitle>
      <DialogDescription>
        Descripción del contenido del dialog.
      </DialogDescription>
    </DialogHeader>
    <div>Contenido del dialog...</div>
  </DialogContent>
</Dialog>
```

### Alert Dialog
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Dropdown Menu
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menú</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configuración</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Table
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableCaption>Lista de usuarios</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Rol</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Juan Pérez</TableCell>
      <TableCell>juan@example.com</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>María García</TableCell>
      <TableCell>maria@example.com</TableCell>
      <TableCell>Usuario</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Pestaña 1</TabsTrigger>
    <TabsTrigger value="tab2">Pestaña 2</TabsTrigger>
    <TabsTrigger value="tab3">Pestaña 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Contenido de la pestaña 1
  </TabsContent>
  <TabsContent value="tab2">
    Contenido de la pestaña 2
  </TabsContent>
  <TabsContent value="tab3">
    Contenido de la pestaña 3
  </TabsContent>
</Tabs>
```

### Form (con react-hook-form + zod)
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Ingresa un email válido.",
  }),
})

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de usuario</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                Tu nombre público de usuario.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  )
}
```

### Notificaciones Toast (Sonner)

**1. Agregar el Toaster a tu layout principal** (`src/App.tsx` o `src/main.tsx`):
```tsx
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <>
      {/* Tu contenido */}
      <Toaster />
    </>
  )
}
```

**2. Usar toast en cualquier componente:**
```tsx
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function MyComponent() {
  return (
    <div className="space-x-2">
      <Button onClick={() => toast.success("Operación exitosa!")}>
        Success
      </Button>
      <Button onClick={() => toast.error("Hubo un error")}>
        Error
      </Button>
      <Button onClick={() => toast.info("Información útil")}>
        Info
      </Button>
      <Button onClick={() => toast.warning("Advertencia!")}>
        Warning
      </Button>
      <Button
        onClick={() => toast.promise(
          fetch('/api/data'),
          {
            loading: 'Cargando...',
            success: 'Datos cargados!',
            error: 'Error al cargar',
          }
        )}
      >
        Promise
      </Button>
    </div>
  )
}
```

---

## 🛠️ Agregar Más Componentes

Para agregar componentes de shadcn/ui:

```bash
# Instalar CLI de shadcn/ui globalmente
npm install -g shadcn-ui

# Agregar componentes
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
```

Los componentes se copiarán automáticamente a `src/components/ui/`.

---

## 📚 Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons](https://lucide.dev/icons/)
- [OKLCH Color Picker](https://oklch.com/)

---

## 🎯 Próximos Pasos

1. ✅ **Fase 1:** Setup base completado
2. ✅ **Fase 2:** Componentes clave agregados (Input, Select, Dialog, Table, Tabs, Form, Sonner)
3. ⏳ **Fase 3:** Refactorizar componentes existentes para usar Tailwind
4. ⏳ **Fase 4:** Implementar ThemeProvider (modo claro/oscuro)
5. ⏳ **Fase 5:** Actualizar layout con nuevo diseño
6. ⏳ **Fase 6:** Mejorar responsive design

---

**¡Sistema de diseño listo para usar!** 🎉
