// utils/screenshot.ts
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { ElLoading, ElMessage } from 'element-plus';
import { ApiStatus } from './http/status';

export const captureDivAsImage = async (
  element: HTMLElement,
  filename: string = 'screenshot.png'
): Promise<void> => {

  const handleloading = ElLoading.service({
    text: '图片处理中...',
    fullscreen: true
  })

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 提高分辨率
      logging: false,
      useCORS: true, // 解决跨域图片问题
      scrollY: -window.scrollY, // 处理滚动条
      allowTaint: true
    });

    handleloading.close()

    const getimageloading = ElLoading.service({
      text: '保存图片中...',
      fullscreen: true
    })

    const fileid = `${new Date().getTime()}-${uuidv4()}`
    axios.post(`${import.meta.env.VITE_API_URL}/screenshot`, {
      id: fileid,
      base: canvas.toDataURL('image/png')
    }).then(res => {
      getimageloading.close()
      if (res.data.err === ApiStatus.success) {
        const link = document.createElement('a');
        link.href = `${import.meta.env.VITE_API_URL}/down-screenshot?fileid=${fileid}&filename=${filename}`;
        link.click();
      } else ElMessage.error("图片保存失败！")
    }).catch(err => {
      getimageloading.close()
      ElMessage.error("保存图片出错！")
      console.log("获取截图失败：", err);
    })
  } catch (error) {
    handleloading.close()
    ElMessage.error("图片处理出错！")
    console.error('截图失败:', error);
    throw error;
  }
};