export const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate()

export const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export const toIsoLocal = (d: Date) => {
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10)
}
