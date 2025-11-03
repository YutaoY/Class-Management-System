import { fourDotsSpinnerSvg } from '@/assets/svg/loading'
import { useUserStore } from '@/store/modules/user'
import { menuData } from '@/mock/menuData'
import { MenuListType } from '@/types/menu'
import { ElLoading } from 'element-plus'
import axios from 'axios'
import { ApiStatus } from '@/utils/http/status'

const isLogin = computed(() => useUserStore().isLogin)
const userInfo = computed(() => useUserStore().getUserInfo)

// 菜单接口
export const menuService = {
  // 获取菜单列表，模拟网络请求
  getMenuList(): Promise<{ menuList: MenuListType[]; closeLoading: () => void }> {
    const loading = createLoading
    return new Promise((resolve) => {
      if (!isLogin.value) {
        setTimeout(() => {
          resolve({
            menuList: [menuData[0]],
            closeLoading: () => loading.close()
          })
        }, 1000);
      }
      else axios.post(`${import.meta.env.VITE_API_URL}/menu-get`, { id: userInfo.value.id, token: userInfo.value.token })
        .then(res => {
          if (res.data.err == ApiStatus.success)
            resolve({
              menuList: res.data.result,
              closeLoading: () => loading.close()
            })
          else useUserStore().logOut();
        })
        .catch(err => {
          useUserStore().logOut();
        })
    })
  }
}

const createLoading = ElLoading.service({
  lock: true,
  background: 'rgba(0, 0, 0, 0)',
  svg: fourDotsSpinnerSvg,
  svgViewBox: '0 0 40 40'
})
