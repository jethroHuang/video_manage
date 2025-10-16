import { reactive, toRefs } from 'vue'

type MenuItem = { label: string; action?: () => void; danger?: boolean; disabled?: boolean }

const state = reactive({
  visible: false,
  x: 0,
  y: 0,
  items: [] as MenuItem[]
})

export function useContextMenu() {
  function showMenu({ x, y, items }: { x: number; y: number; items: MenuItem[] }) {
    state.visible = true
    state.x = x
    state.y = y
    state.items = items
    const off = () => {
      state.visible = false
      window.removeEventListener('click', off)
    }
    setTimeout(() => window.addEventListener('click', off))
  }

  function click(it: MenuItem) {
    it.action?.()
    state.visible = false
  }

  return { showMenu, click, ...toRefs(state) }
}


