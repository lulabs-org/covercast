let _appOrigin = ''

export function getAppOrigin(): string {
  return _appOrigin
}

export function setAppOrigin(origin: string): void {
  _appOrigin = origin
}
