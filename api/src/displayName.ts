const displayName = ({
  source,
  target
}: {
  source: string
  target: string
}) => {
  // @ts-ignore
  const displayNames = new Intl.DisplayNames(target, { type: 'language' })
  return displayNames.of(source)
}

export default displayName
