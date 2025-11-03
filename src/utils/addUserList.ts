import { ElMessage } from "element-plus";
import { read, utils } from "xlsx";
import { emitter } from "./event";

export const addClassList = () => {
  const el = document.createElement('input')
  el.type = 'file'
  el.accept = '.xls,.xlsx'
  el.onchange = () => {
    if (el.files?.[0]) {
      const files = el.files;
      if (files.length <= 0) return false;
      else if (!/\.(xls|xlsx)$/.test(files[0].name.toLowerCase())) {
        ElMessage.error('请选择表格类型(.xls .xlsx)文件！')
        return false;
      }
      const fileReader = new FileReader();
      fileReader.onload = (ev) => {
        try {
          const data = ev.target?.result;
          const workbook = read(data, {
            type: 'binary'
          });
          const wsname = workbook.SheetNames[0];
          const ws = utils.sheet_to_json(workbook.Sheets[wsname]);
          if (ws.length > 0) {
            emitter.emit('addfile', ws as []);
            // addFileList(ws as []);
          }
          else ElMessage.error('添加失败：表中无内容');
        } catch (e) {
          ElMessage.error('导入失败：文件解析错误');
          return false;
        }
      };
      fileReader.readAsBinaryString(files[0]);
    }
  }
  el.click()
}