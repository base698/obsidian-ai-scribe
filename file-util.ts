export function getFilename(selection: string): string {
	const match = /!?\[\[(.*?\.webm)\]\]/.exec(selection);
	if (match) {
		return match[1];
	}
	return '';
}
