import { ElLoading } from "element-plus"
import { fourDotsSpinnerSvg } from '@/assets/svg/loading'

const createLoading = ElLoading.service({
  lock: true,
  background: 'rgba(0, 0, 0, 0)',
  svg: fourDotsSpinnerSvg,
  svgViewBox: '0 0 40 40'
})

export const showLoading = () => {
  const loading = createLoading;

  return {
    closeLoading: () => loading.close()
  }
}
