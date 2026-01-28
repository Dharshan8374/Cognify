
// Simple Global Cache for Decoded Audio Buffers
// This prevents re-fetching/re-decoding on navigation

export const audioCache = {
    buffers: new Map<string, AudioBuffer>(),

    async get(url: string, context: AudioContext): Promise<AudioBuffer> {
        if (this.buffers.has(url)) {
            return this.buffers.get(url)!;
        }

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);

        this.buffers.set(url, audioBuffer);
        return audioBuffer;
    },

    has(url: string): boolean {
        return this.buffers.has(url);
    },

    clear() {
        this.buffers.clear();
    }
};
