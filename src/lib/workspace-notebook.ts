export const NOTEBOOK_LIMIT=200000;
export function validateCells(value: unknown): string[] {
  if(!Array.isArray(value) || value.length<1 || value.length>50 || !value.every(c=>typeof c==='string') || value.join('').length>NOTEBOOK_LIMIT)
    throw new Error('Use 1–50 code cells, with at most 200,000 characters in total.');
  return value;
}
export function exportCells(cells: string[]): string {
  return validateCells(cells).map(code=>`# %%\n${code}`).join('\n\n');
}
export function importCells(source: string): string[] {
  const parts=source.replace(/\r\n/g,'\n').split(/^# %%\s*$/m);
  if(parts.length===1)return validateCells(parts);
  if(!parts[0].trim())parts.shift();
  return validateCells(parts.map(code=>code.replace(/^\n/,'').replace(/\n\n$/,'')));
}
