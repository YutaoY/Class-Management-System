import avatar from "@/assets/img/avatar/avatar.jpg";

export const getAvatar = (url?: string) => {
  return url ? url : avatar;
};