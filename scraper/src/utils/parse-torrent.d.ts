/**
 * Type declarations for parse-torrent module
 * @see https://www.npmjs.com/package/parse-torrent
 */

declare module "parse-torrent" {
  namespace parseTorrent {
    interface Torrent {
      name: string;
      infoHash: string;
      infoHashV2?: string;
      length?: number;
      created?: number;
      createdBy?: string;
      announce?: string[];
      announceList?: string[][];
      private?: boolean;
      comment?: string;
      encoding?: string;
      files?: Array<{
        path: string[];
        length: number;
      }>;
    }

    function toMagnetURI(torrent: Torrent | Buffer): string;
  }

  function parseTorrent(
    source: Buffer | string,
    options?: any
  ): Promise<parseTorrent.Torrent>;

  export default parseTorrent;
}
