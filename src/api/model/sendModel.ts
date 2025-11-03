export interface FileParams {
  id: string
  token: string
  name: string
  size?: number
  fileid: string
  isPaw: boolean
  isOpen: boolean
  password: string
  classid: string
}

export interface LeaveParams {
  id: string
  name: string
  class: string
  token: string
  img: string
}
