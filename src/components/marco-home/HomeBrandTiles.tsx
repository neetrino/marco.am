'use client';

import Image from 'next/image';
import { MARCO_BRANDS } from './marcoHomeAssets';

const TILES = [
  { src: MARCO_BRANDS.hisense, w: 267, h: 43, padX: 48, padY: 50 },
  { src: MARCO_BRANDS.samsung, w: 256, h: 85, padX: 54, padY: 28 },
  { src: MARCO_BRANDS.lg, w: 218, h: 100, padX: 73, padY: 22 },
  { src: MARCO_BRANDS.panasonic, w: 257, h: 41, padX: 53, padY: 51 },
] as const;

export function HomeBrandTiles() {
  return (
    <div className="absolute left-[calc(50%-0.04px)] top-[226px] flex -translate-x-1/2 gap-[31px]">
      {TILES.map((tile) => (
        <div
          key={tile.src}
          className="relative h-[143.52px] w-[363.978px] shrink-0 rounded-[32px] bg-surface-default"
        >
          <div
            className="absolute flex items-center justify-center"
            style={{
              paddingLeft: tile.padX,
              paddingRight: tile.padX,
              paddingTop: tile.padY,
              paddingBottom: tile.padY,
              inset: 0,
            }}
          >
            <Image
              src={tile.src}
              alt=""
              width={tile.w}
              height={tile.h}
              className="max-h-full max-w-full object-contain"
              unoptimized
            />
          </div>
        </div>
      ))}
    </div>
  );
}
