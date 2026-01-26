import { useConfirmStore } from '@/stores/ui/confirmStore'

export const useConfirm = () => {
  const confirm = useConfirmStore((state) => state.confirm)
  return { confirm }
}
