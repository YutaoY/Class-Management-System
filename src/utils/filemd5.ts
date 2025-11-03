import { Md5 } from "ts-md5";
export const fileMd5 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (ev) {
      if (ev.target) {
        const md5 = new Md5().appendAsciiStr(ev.target.result as string).end() as string;
        resolve(md5);
      } else reject('');
    };
  });
};