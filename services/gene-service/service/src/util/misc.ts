import { Stream } from "stream";

/**
 * Removes indentation before and after new lines (and the new lines themselves) in a string.
 * Useful for formatting indented string literals.
 */
export function trimIndent(str: string, keepNewLines: boolean = false): string {
    return str.split('\n')
        .map(s => s.trim())
        .filter(s => s.length !== 0)
        .join(keepNewLines ? '\n' : ' ');
}

/**
 * Converts stream to string promise
 */
export function streamToString(stream: Stream): Promise<string> {
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}