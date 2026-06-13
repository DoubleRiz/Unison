export type RGBTuple = [number, number, number];

export const TEXT_COLORS: Record<string, { label: string; hex: string; pdfRgb: RGBTuple; borderRgb: RGBTuple }> = {
  default: { label: 'White', hex: '#94a3b8', pdfRgb: [50, 50, 50], borderRgb: [150, 150, 150] },
  amber: { label: 'Amber', hex: '#f59e0b', pdfRgb: [161, 85, 0], borderRgb: [217, 119, 6] },
  cyan: { label: 'Cyan', hex: '#06b6d4', pdfRgb: [0, 120, 150], borderRgb: [8, 145, 178] },
  purple: { label: 'Purple', hex: '#a855f7', pdfRgb: [100, 40, 180], borderRgb: [147, 51, 234] },
  red: { label: 'Red', hex: '#ef4444', pdfRgb: [190, 30, 30], borderRgb: [220, 38, 38] },
};

export const TEXT_SIZES: Record<string, { label: string; description: string; pdfFontSize: number; pdfLineSpacing: number; uiClass: string }> = {
  sm: { label: 'S', description: 'Small', pdfFontSize: 9, pdfLineSpacing: 5, uiClass: 'text-xs' },
  md: { label: 'M', description: 'Medium', pdfFontSize: 12, pdfLineSpacing: 7, uiClass: 'text-sm' },
  lg: { label: 'L', description: 'Large', pdfFontSize: 17, pdfLineSpacing: 10, uiClass: 'text-base font-semibold' },
};
