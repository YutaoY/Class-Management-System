import axios from "axios";

const getTaskPage = async (id: string, token: string, classid: string, page: number, size: number,) => {
  const res = await axios.post(`${import.meta.env.VITE_API_URL}/task-all`, { id, token, classid, page, size, divide: true })
  return res;
};

onmessage = async (event: MessageEvent<{
  id: string;
  token: string;
  classid: string;
  page: number;
  size: number;
}>) => {
  const { id, token, classid, page, size } = event.data;
  try {
    const result = await getTaskPage(id, token, classid, page, size);
    postMessage({
      page, size,
      type: 'success',
      data: result.data
    });
  } catch (error) {
    postMessage({
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};