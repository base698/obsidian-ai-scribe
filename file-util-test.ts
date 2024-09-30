import { getFilename } from './file-util'; // adjust the path

describe('getFilename', () => {
    // Test 1: Valid webm file
    it('should extract the filename from a valid selection', () => {
        const selection = '[[video.webm]]';
        expect(getFilename(selection)).toBe('video.webm');
    });

    // Test 2: Valid selection with a leading exclamation mark
    it('should extract the filename when there is a leading exclamation mark', () => {
        const selection = '![[example.webm]]';
        expect(getFilename(selection)).toBe('example.webm');
    });

    // Test 3: Selection without a webm file
    it('should return an empty string when no webm file is found', () => {
        const selection = '[[audio.mp3]]';
        expect(getFilename(selection)).toBe('');
    });

    // Test 4: Selection with no file at all
    it('should return an empty string when no file is present in the selection', () => {
        const selection = 'Some random text';
        expect(getFilename(selection)).toBe('');
    });

    // Test 5: Empty selection string
    it('should return an empty string for an empty input', () => {
        const selection = '';
        expect(getFilename(selection)).toBe('');
    });

    // Test 6: Invalid format (missing brackets)
    it('should return an empty string when the selection does not match the pattern', () => {
        const selection = '[invalid.webm]';
        expect(getFilename(selection)).toBe('');
    });

    // Test 7: Multiple matches in the selection (should return the first match)
    it('should return the first webm filename when there are multiple matches', () => {
        const selection = '[[video1.webm]] some text [[video2.webm]]';
        expect(getFilename(selection)).toBe('video1.webm');
    });
});

