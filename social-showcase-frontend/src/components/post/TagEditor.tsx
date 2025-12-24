import { Autocomplete, Chip, TextField } from '@mui/material'

export function TagEditor(props: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  label?: string
}) {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={props.suggestions ?? []}
      value={props.value}
      onChange={(_, v) => props.onChange(v.map((x) => String(x).trim()).filter(Boolean).slice(0, 10))}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}_${index}`} />)
      }
      renderInput={(params) => <TextField {...params} label={props.label ?? '标签'} placeholder="输入后回车" />}
    />
  )
}
