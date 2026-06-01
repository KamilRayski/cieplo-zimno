export default function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="toggle">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span className="toggle-slider" />
    </label>
  )
}
