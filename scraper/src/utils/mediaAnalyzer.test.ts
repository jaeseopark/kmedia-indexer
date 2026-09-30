/**
 * Media Analyzer Unit Tests
 * Uses real post titles from TorrentTip forums
 * Parameterized tests with vitest
 */

import { describe, it, expect } from 'vitest';
import { analyzeMediaTitle, getCategoryCode } from './mediaAnalyzer.js';

/**
 * Real post titles from TorrentTip c/2/13 (Korean Drama)
 * https://torrenttip246.top/c/2/13
 */
const KOREAN_DRAMA_TITLES = [
  '신병 시즌4 - 사보타주.E12.260929.720p-NEXT',
  '엄마가 미쳤어요.E02.260929.720p-NEXT',
  '포핸즈.E10.260927.1080p.H265-F1RST',
  '포핸즈.E09.1080p.NF.WEB-DL.AAC2.0.H.264-MrHulk',
  '그래 이혼하자.E11.1080p.H264.AAC.VIU.WEB-DL-LoveBug',
  '로또 1등도 출근합니다.E05.1080p.DSNP.WEB-DL.AAC2.0.H.264-Marco',
  '메이드 인 코리아 시즌2.E05.1080p.DSNP.WEB-DL.DDP5.1.H.264-SCOPE',
];

/**
 * Real post titles from TorrentTip c/4/16 (Entertainment/Variety)
 * https://torrenttip246.top/c/4/16
 */
const VARIETY_SHOW_TITLES = [
  '시간추적자 설록.E12.260929.720p-NEXT',
  '한문철의 블랙박스 리뷰.E188.260929.720p-NEXT',
  '스모킹건.E158.260929.720p-NEXT',
  '불꽃야구 시즌2.E20.260928.부산과학기술대학교 2부.WEB.1080p',
  '식스센스 B사이드.E03.260927.1080p.H265-F1RST',
  '냉장고를 부탁해 since 2014.E90.260927.720p-NEXT',
  '살림하는 남자들 시즌2 - 추석기획.E462.260926.720p-NEXT',
];

/**
 * Parameterized test cases for media analysis
 * Format: [title, expectedResolution, expectedReleaseType]
 */
const MEDIA_ANALYSIS_TEST_CASES: Array<[string, string, string]> = [
  // Korean Drama titles
  ['신병 시즌4 - 사보타주.E12.260929.720p-NEXT', '720p', 'unknown'],
  ['포핸즈.E10.260927.1080p.H265-F1RST', '1080p', 'unknown'],
  ['포핸즈.E09.1080p.NF.WEB-DL.AAC2.0.H.264-MrHulk', '1080p', 'webdl'],
  ['그래 이혼하자.E11.1080p.H264.AAC.VIU.WEB-DL-LoveBug', '1080p', 'webdl'],
  ['로또 1등도 출근합니다.E05.1080p.DSNP.WEB-DL.AAC2.0.H.264-Marco', '1080p', 'webdl'],
  ['메이드 인 코리아 시즌2.E05.1080p.DSNP.WEB-DL.DDP5.1.H.264-SCOPE', '1080p', 'webdl'],

  // Variety show titles
  ['시간추적자 설록.E12.260929.720p-NEXT', '720p', 'unknown'],
  ['한문철의 블랙박스 리뷰.E188.260929.720p-NEXT', '720p', 'unknown'],
  ['식스센스 B사이드.E03.260927.1080p.H265-F1RST', '1080p', 'unknown'],
  ['불꽃야구 시즌2.E20.260928.부산과학기술대학교 2부.WEB.1080p', '1080p', 'unknown'],
  ['냉장고를 부탁해 since 2014.E90.260927.720p-NEXT', '720p', 'unknown'],
  ['살림하는 남자들 시즌2 - 추석기획.E462.260926.720p-NEXT', '720p', 'unknown'],

  // Additional real-world titles from earlier tests
  ['존 오브 인터레스트 The Zone of Interest 2023 2160p BluRay x265 HEVC 10bit HDR AAC 5.1 German Tigole', '2160p', 'bluray'],
  ['소오강호：동방불패 Invincible Swordsman 2025 1080p Chinese BluRay HEVC x265 5.1 BONE', '1080p', 'bluray'],
  ['시티즌 비질란테 Citizen.Vigilante.2026.1080p.BDRip.AAC5.1.10bits.x265-Rapta', '1080p', 'bluray'],
  ['베스트 오브 더 베스트 Best of the Best 2026 1080p WEB-DL HEVC x265 5.1 BONE', '1080p', 'webdl'],
  ['로미오 머스트 다이 Romeo Must Die 2000 Open Matte 1080p WEB-DL HEVC x265 5.1 BONE', '1080p', 'webdl'],
];

/**
 * Category mapping test cases
 * Format: [resolution, releaseType, contentType, expectedCategory]
 */
const CATEGORY_MAPPING_TEST_CASES: Array<[string, string, string, string]> = [
  // Anime content type - always maps to 5070 regardless of resolution/release
  ['2160p', 'bluray', 'anime', '5070'],
  ['1080p', 'webdl', 'anime', '5070'],
  ['720p', 'unknown', 'anime', '5070'],
  ['sd', 'unknown', 'anime', '5070'],

  // Documentary content type - always maps to 5080
  ['1080p', 'unknown', 'documentary', '5080'],
  ['2160p', 'webdl', 'documentary', '5080'],
  ['720p', 'unknown', 'docuseries', '5080'],

  // Sports content type - always maps to 5060
  ['1080p', 'unknown', 'sports', '5060'],
  ['720p', 'webdl', 'sports', '5060'],

  // WebDL release type - maps to 5010 for regular content
  ['720p', 'webdl', 'drama', '5010'],
  ['1080p', 'webdl', 'tv', '5010'],

  // Resolution-based routing for regular TV content
  ['2160p', 'bluray', 'tv', '5045'], // UHD
  ['2160p', 'unknown', 'drama', '5045'], // UHD
  ['1080p', 'bluray', 'drama', '5040'], // HD
  ['1080p', 'hdtv', 'tv', '5040'], // HD
  ['720p', 'unknown', 'tv', '5040'], // HD
  ['720p', 'hdtv', 'drama', '5040'], // HD
  ['sd', 'unknown', 'tv', '5030'], // SD

  // Default fallback
  ['unknown', 'unknown', 'tv', '5000'],
  ['720p', 'unknown', 'generic', '5040'],
];

describe('mediaAnalyzer', () => {
  describe('analyzeMediaTitle', () => {
    describe('Korean Drama Titles (c/2/13)', () => {
      it.each(KOREAN_DRAMA_TITLES)(
        'should parse: %s',
        (title: string) => {
          const result = analyzeMediaTitle(title);

          // Verify return type structure
          expect(result).toBeDefined();
          expect(result).toHaveProperty('resolution');
          expect(result).toHaveProperty('releaseType');

          // Ensure no falsy values
          expect(result.resolution).toBeTruthy();
          expect(result.releaseType).toBeTruthy();

          // Type checking
          expect(typeof result.resolution).toBe('string');
          expect(typeof result.releaseType).toBe('string');

          // Valid resolution values
          expect(['2160p', '1080p', '720p', 'sd']).toContain(result.resolution);
        }
      );
    });

    describe('Entertainment/Variety Titles (c/4/16)', () => {
      it.each(VARIETY_SHOW_TITLES)(
        'should parse: %s',
        (title: string) => {
          const result = analyzeMediaTitle(title);

          // Verify return type structure
          expect(result).toBeDefined();
          expect(result).toHaveProperty('resolution');
          expect(result).toHaveProperty('releaseType');

          // Ensure no falsy values
          expect(result.resolution).toBeTruthy();
          expect(result.releaseType).toBeTruthy();

          // Valid resolution values
          expect(['2160p', '1080p', '720p', 'sd']).toContain(result.resolution);
        }
      );
    });

    describe('Parameterized Media Analysis', () => {
      it.each(MEDIA_ANALYSIS_TEST_CASES)(
        'should correctly analyze: %s',
        (title: string, expectedResolution: string, expectedReleaseType: string) => {
          const result = analyzeMediaTitle(title);

          expect(result.resolution).toBe(expectedResolution);
          expect(result.releaseType).toBe(expectedReleaseType);
        }
      );
    });

    describe('Edge Cases', () => {
      const edgeCases = [
        ['empty string', '', 'sd', 'unknown'],
        ['no metadata', 'Some Random Title', 'sd', 'unknown'],
        ['uppercase resolution', 'TITLE 1080P HD', '1080p', 'unknown'],
        ['multiple resolutions', '720p 1080p Title', '1080p', 'unknown'], // Highest resolution wins (1080p checked before 720p)
        ['multiple release types', 'WebDL BluRay Title', 'sd', 'webdl'], // No resolution, so sd; WebDL is first release type match
      ] as const;

      it.each(edgeCases)(
        '%s: "%s"',
        (_label: string, title: string, expectedResolution: string, expectedReleaseType: string) => {
          const result = analyzeMediaTitle(title);

          expect(result.resolution).toBe(expectedResolution);
          expect(result.releaseType).toBe(expectedReleaseType);
        }
      );
    });
  });

  describe('getCategoryCode', () => {
    describe('Parameterized Category Mapping', () => {
      it.each(CATEGORY_MAPPING_TEST_CASES)(
        'resolution=%s, releaseType=%s, contentType=%s → %s',
        (
          resolution: string,
          releaseType: string,
          contentType: string,
          expectedCategory: string
        ) => {
          const result = getCategoryCode({ resolution, releaseType, contentType });

          expect(result).toBe(expectedCategory);
          expect(typeof result).toBe('string');
          // Ensure result is never falsy
          expect(result.length).toBeGreaterThan(0);
        }
      );
    });

    describe('Special Content Types Override Resolution', () => {
      it.each([
        ['anime', '5070'],
        ['Anime', '5070'], // case-insensitive
        ['ANIME', '5070'],
        ['anime_series', '5070'], // includes check
        ['documentary', '5080'],
        ['docuseries', '5080'],
        ['sports', '5060'],
        ['sports_game', '5060'],
      ])(
        'contentType=%s → %s',
        (contentType: string, expectedCategory: string) => {
          const result = getCategoryCode({
            resolution: '720p',
            releaseType: 'unknown',
            contentType,
          });
          expect(result).toBe(expectedCategory);
        }
      );
    });

    describe('Release Type Priority Over Resolution', () => {
      it('should prioritize WebDL over resolution', () => {
        const result = getCategoryCode({
          resolution: '2160p',
          releaseType: 'webdl',
          contentType: 'drama',
        });
        expect(result).toBe('5010'); // TV/WEB-DL, not TV/UHD
      });

      it('should not prioritize other release types over resolution', () => {
        const result = getCategoryCode({
          resolution: '1080p',
          releaseType: 'bluray',
          contentType: 'tv',
        });
        expect(result).toBe('5040'); // TV/HD, not based on BluRay
      });
    });

    describe('Default Fallback', () => {
      it('should return 5000 (TV/General) when no rules match', () => {
        const result = getCategoryCode({
          resolution: 'unknown',
          releaseType: 'unknown',
          contentType: 'generic',
        });
        expect(result).toBe('5000');
      });

      it('should never return falsy category codes', () => {
        const contentTypes = ['', 'unknown', 'xyz', 'other', 'misc'];
        const resolutions = ['2160p', '1080p', '720p', 'sd'];
        const releaseTypes = ['webdl', 'bluray', 'unknown'];

        for (const contentType of contentTypes) {
          for (const resolution of resolutions) {
            for (const releaseType of releaseTypes) {
              const result = getCategoryCode({ resolution, releaseType, contentType });

              expect(result).toBeTruthy();
              expect(result.length).toBeGreaterThan(0);
            }
          }
        }
      });
    });
  });

  describe('Integration: Title → Category', () => {
    const integrationCases = [
      [
        '포핸즈.E09.1080p.NF.WEB-DL.AAC2.0.H.264-MrHulk',
        'drama',
        '5010', // 1080p + WebDL → TV/WEB-DL
      ],
      [
        '존 오브 인터레스트 The Zone of Interest 2023 2160p BluRay x265 HEVC',
        'drama',
        '5045', // 2160p → TV/UHD
      ],
      ['시간추적자 설록.E12.260929.720p-NEXT', 'variety', '5040'], // 720p → TV/HD
    ] as const;

    it.each(integrationCases)(
      'title "%s" with contentType "%s" → category %s',
      (title: string, contentType: string, expectedCategory: string) => {
        const mediaInfo = analyzeMediaTitle(title);
        const category = getCategoryCode({ ...mediaInfo, contentType });

        expect(category).toBe(expectedCategory);
      }
    );
  });
});
