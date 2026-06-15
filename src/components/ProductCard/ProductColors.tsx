'use client';

import Image from 'next/image';

import { getColorHex } from '../../lib/colorMap';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

interface ColorData {
  value: string;
  imageUrl?: string | null;
  colors?: string[] | null;
}

interface ProductColorsProps {
  colors: Array<string | ColorData>;
  isCompact?: boolean;
  maxVisible?: number;
  /**
   * Special-offers tile — Figma `305:2171`: fixed px size + gap (overrides `isCompact` wh/h).
   */
  swatchSizePx?: number;
  gapPx?: number;
}

/**
 * Component for displaying product color options
 */
export function ProductColors({
  colors,
  isCompact = false,
  maxVisible = 6,
  swatchSizePx,
  gapPx,
}: ProductColorsProps) {
  if (!colors || colors.length === 0) {
    return null;
  }

  const useFigmaSwatches =
    typeof swatchSizePx === 'number' && typeof gapPx === 'number';

  return (
    <div
      className={`flex flex-wrap items-center ${
        useFigmaSwatches
          ? 'mb-0'
          : `gap-1.5 ${isCompact ? 'mb-1' : 'mb-2'}`
      }`}
      style={useFigmaSwatches ? { gap: gapPx } : undefined}
    >
      {colors.slice(0, maxVisible).map((colorData, index) => {
        const colorValue = typeof colorData === 'string' ? colorData : colorData.value;
        const imageUrl = typeof colorData === 'object' ? colorData.imageUrl : null;
        const colorsHex = typeof colorData === 'object' ? colorData.colors : null;
        
        // Determine color hex: use colorsHex[0] if available, otherwise use getColorHex
        const colorHex = colorsHex && Array.isArray(colorsHex) && colorsHex.length > 0 
          ? colorsHex[0] 
          : getColorHex(colorValue);
        
        return (
          <div
            key={index}
            className={`rounded-full border border-gray-300 flex-shrink-0 overflow-hidden ${
              useFigmaSwatches ? '' : isCompact ? 'h-4 w-4' : 'h-5 w-5'
            }`}
            style={
              useFigmaSwatches
                ? imageUrl
                  ? {
                      width: swatchSizePx,
                      height: swatchSizePx,
                      minWidth: swatchSizePx,
                      minHeight: swatchSizePx,
                    }
                  : {
                      width: swatchSizePx,
                      height: swatchSizePx,
                      minWidth: swatchSizePx,
                      minHeight: swatchSizePx,
                      backgroundColor: colorHex,
                    }
                : imageUrl
                  ? {}
                  : { backgroundColor: colorHex }
            }
            title={colorValue}
            aria-label={`Color: ${colorValue}`}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={colorValue}
                width={useFigmaSwatches ? swatchSizePx : isCompact ? 16 : 20}
                height={useFigmaSwatches ? swatchSizePx : isCompact ? 16 : 20}
                className="h-full w-full object-cover"
                loading="lazy"
                unoptimized={shouldBypassNextImageOptimizer(imageUrl)}
                onError={(e) => {
                  const fallbackColor = colorHex || '#CCCCCC';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.style.backgroundColor = fallbackColor;
                  }
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
          </div>
        );
      })}
      {colors.length > maxVisible && (
        <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-500`}>
          +{colors.length - maxVisible}
        </span>
      )}
    </div>
  );
}




